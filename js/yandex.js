// Яндекс Игры: SDK есть только в сборке для Яндекса (yandex/build.mjs подключает /sdk.js). На сайте и в Android — ничего не делает.
// Реклама за награду и покупки чеков идут через Яндекс (работают и для игроков из России).
// Товары в консоли Яндекс Игр: cheki_100, cheki_350, cheki_1000 (как в Google Play).
(() => {
  if (typeof YaGames === 'undefined' || typeof __TEST !== 'undefined') return;
  let ysdk = null, pay = null;
  const ready = YaGames.init().then(async y => {
    ysdk = y;
    try { y.features.LoadingAPI && y.features.LoadingAPI.ready(); } catch (e) {}   // игра загрузилась — Яндекс убирает свою заставку
    try { pay = await y.getPayments({ signed: false });
      // покупки, которые не успели начислиться (закрыли вкладку и т. п.) — начислить и закрыть
      for (const p of await pay.getPurchases()) { const pk = PACKS.find(x => x.id === p.productID); if (pk) { addCheki(pk.n, 'покупка'); await pay.consumePurchase(p.purchaseToken); } }
    } catch (e) { pay = null; }
  }).catch(() => {});

  ADS.ready = () => !!ysdk;
  ADS.rewarded = () => new Promise(res => {
    let got = false;
    ysdk.adv.showRewardedVideo({ callbacks: {
      onOpen: () => { AUDIO.pause && AUDIO.pause(); },
      onRewarded: () => { got = true; },
      onClose: () => { AUDIO.resume && AUDIO.resume(); res(got); },
      onError: () => { AUDIO.resume && AUDIO.resume(); res(false); },
    } });
  });
  IAP.ready = () => !!pay;
  IAP.prices = async () => { try { await ready; return Object.fromEntries((await pay.getCatalog()).map(p => [p.id, p.price])); } catch (e) { return null; } };
  IAP.buy = async id => {
    try { const p = await pay.purchase({ id }); await pay.consumePurchase(p.purchaseToken); return true; }
    catch (e) { return false; }
  };
  // на Яндексе подсказка «работают в приложении из Google Play» не нужна
  const ss = shopScreen; shopScreen = (...a) => { ss(...a); document.querySelectorAll('.shop .note').forEach(n => { if (/Google Play/.test(n.textContent)) n.remove(); });
    document.querySelectorAll('.shop .sub').forEach(n => { n.textContent = n.textContent.replace('Оплата через Google Play в валюте твоей страны.', 'Оплата через Яндекс.'); }); };
  window.ASF_YA = true;
})();
