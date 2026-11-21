# Промо-ролик для Play Маркета (≈21 с, 1280×720): кадры игры с медленным наездом под озвучку, кусок
# московского ролика, финальный титр. Звук: озвучка (store/promo/voice.wav) + гул ветра + удар на названии.
# python tools/promo.py  →  store/promo/asfalt_promo.mp4
import subprocess, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1280, 720, 25
OUT = 'store/promo'; TMP = OUT + '/_tmp'; os.makedirs(TMP, exist_ok=True)
VO_DELAY = 0.4

def wide(name, crop=None):
    """картинка → 16:9, в 2 раза больше кадра (для наезда)"""
    im = Image.open(f'img/{name}.jpg').convert('RGB')
    if crop: im = im.crop(crop)
    w, h = im.size; tw = min(w, int(h * 16 / 9)); th = int(tw * 9 / 16)
    x0, y0 = (w - tw) // 2, (h - th) // 2
    im = im.crop((x0, y0, x0 + tw, y0 + th)).resize((W * 2, H * 2), Image.LANCZOS)
    p = f'{TMP}/{name}.png'; im.save(p); return p

def title_card():
    img = Image.open('store/feature_graphic.png').convert('RGB')     # 1024×500 → в кадр 16:9
    bg = img.resize((W, int(W * 500 / 1024)), Image.LANCZOS)
    c = Image.new('RGB', (W, H), (8, 6, 6)); c.paste(bg, (0, (H - bg.height) // 2))
    d = ImageDraw.Draw(c); f = ImageFont.truetype('C:/Windows/Fonts/consolab.ttf', 30)
    s = 'Бесплатно в Google Play'; d.text(((W - d.textlength(s, font=f)) / 2, H - 70), s, font=f, fill=(230, 220, 200))
    c = c.resize((W * 2, H * 2), Image.LANCZOS); p = f'{TMP}/title.png'; c.save(p); return p

# (картинка, начало, длительность, направление наезда)
SHOTS = [
    (wide('kazan', (0, 0, 540, 560)), 0.0, 3.6, 'in'),     # «Казань. Восемьдесят седьмой.»
    (wide('dvor', (0, 380, 540, 968)), 3.6, 2.6, 'out'),    # «Каждый двор — чей-то асфальт.»
    (wide('t_r_strelka'), 6.2, 1.0, 'in'),                  # «Улица,
    (wide('t_r_uchastok'), 7.2, 1.0, 'in'),                 #  милиция
    (wide('t_r_kabinet'), 8.2, 2.8, 'out'),                 #  или власть — выбор за тобой.»
    (wide('t_9_brigada'), 11.0, 1.2, 'in'),                 # «Девяностые
    (wide('t_m_belyi1993'), 12.2, 1.3, 'in'),               #  сломают всё.»
]
VIDEO = ('scratch', 13.5, 2.5)                              # «А потом — Москва.» — подъём камеры над городом
TITLE = (title_card(), 16.0, 5.2)
TOTAL = 21.2

segs = []
def still(src, dur, mode, i):
    n = int(dur * FPS); z = "min(1.0+0.12*on/%d,1.12)" % n if mode == 'in' else "max(1.12-0.12*on/%d,1.0)" % n
    out = f'{TMP}/s{i}.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', str(dur), '-i', src, '-vf',
        f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS},format=yuv420p",
        '-frames:v', str(n), '-c:v', 'libx264', '-crf', '18', '-preset', 'fast', out], check=True)
    return out

for i, (src, t0, dur, mode) in enumerate(SHOTS): segs.append(still(src, dur, mode, i))
raw = os.path.join(os.environ['TEMP'], 'claude', 'f2e3bf736bc77434', 'b92ef85d-5f3c-475b-80b7-67bf7a6ef880', 'scratchpad', 'msk_raw.mp4')
vseg = f'{TMP}/v.mp4'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '4.6', '-t', str(VIDEO[2]), '-i', raw, '-an', '-vf', f'scale={W}:{H},fps={FPS},format=yuv420p',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'fast', vseg], check=True)
segs.append(vseg)
segs.append(still(TITLE[0], TITLE[2], 'out', 99))

lst = f'{TMP}/list.txt'; open(lst, 'w', encoding='utf-8').write(''.join(f"file '{os.path.basename(s)}'\n" for s in segs))   # пути — относительно списка (без кириллицы)
silent = f'{TMP}/silent.mp4'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', silent], check=True)

# звук: озвучка + ветер + удар на названии; затемнение в начале и в конце
fx = (f"[1:a]adelay={int(VO_DELAY*1000)}|{int(VO_DELAY*1000)},volume=1.6[vo];"
      f"anoisesrc=c=brown:a=0.5:d={TOTAL}:r=48000,lowpass=f=380,volume=0.10,afade=t=in:d=1.5,afade=t=out:st={TOTAL-2}:d=2[wind];"
      f"sine=f=48:d=2.5:r=48000,volume=0.9,afade=t=out:st=0.05:d=2.4,adelay=16000|16000[boom];"
      f"[vo][wind][boom]amix=inputs=3:normalize=0,alimiter=limit=0.95[a]")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', silent, '-i', f'{OUT}/voice.wav', '-filter_complex', fx,
    '-map', '0:v', '-map', '[a]', '-vf', f'fade=t=in:d=0.6,fade=t=out:st={TOTAL-0.8}:d=0.8',
    '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
    '-t', str(TOTAL), '-movflags', '+faststart', f'{OUT}/asfalt_promo.mp4'], check=True)
print('ok', f'{OUT}/asfalt_promo.mp4')
