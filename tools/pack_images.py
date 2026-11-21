# Перенос картинок из «Загрузок» (Google Flow) в img/ с понятными именами и сжатием под телефон.
# python -I tools/pack_images.py
import os, glob
from PIL import Image

SRC = os.path.join(os.path.expanduser('~'), 'Downloads')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img')
os.makedirs(OUT, exist_ok=True)
MAP = {  # начало имени файла из Flow → имя в игре
    'Police_chasing': 'chase', 'Recruits_at_train': 'vokzal', 'Teens_confronting': 'pustyr',
    'Подростки_во_дворе': 'dvor', 'Teens_playing_hockey': 'korobka', 'Soviet_kitchen': 'kuhnya',
    'Ворота_колонии': 'zona', 'Kazan_night_winter': 'kazan',
    # интерьеры заведений (горизонтальные)
    'Ретро_танцзал': 'pl_dk', 'Pixel_art_basement_video': 'pl_video', 'Hospital_emergency': 'pl_hosp',
    'Pixel_art_police_station': 'pl_police', 'Car_repair_shop': 'pl_sto', 'Pixel_art_1980s_bank': 'pl_bank',
    'Soviet_barbershop': 'pl_barber', 'Soviet_beer_bar': 'pl_bar', 'Pixel_art_restaurant': 'pl_resto', 'Market_stalls': 'pl_rynok',
    # портреты для окна диалога (квадратные, маленькие)
    'Young_man_portrait': 'p_bacha', 'Pixel_art_police_captain': 'p_garipov', 'Young_man_smirking': 'p_starsh',
    'Teenager_with_bruised': 'p_chuzhoy', 'Man_holding_prayer': 'p_sedoy', 'Woman_wearing_glasses': 'p_zavuch',
    'Pixel_art_portrait_of_boy': 'p_zima', 'Girl_standing': 'p_natasha', 'Teenager_smiling': 'p_ildar', 'Woman_in_pixel': 'p_mama',
    # фоны сцен: Bus stop / Snowy lot / Kazan courtyard скачаны под своими именами, остальные — asf_<имя>.jpg
    'Bus_stop_in_Kazan': 'bg_ostanovka', 'Snowy_vacant_lot': 'bg_pustyr', 'Kazan_courtyard': 'bg_dvor',
}
for f in glob.glob(os.path.join(SRC, '*.jpg')):
    base = os.path.basename(f)
    name = base[4:-4] if base.startswith('asf_') else next((v for k, v in MAP.items() if base.startswith(k)), None)
    if not name: continue
    im = Image.open(f).convert('RGB')
    w = 256 if name.startswith('p_') else 720 if im.width > im.height else 540  # портреты маленькие, горизонтальные фоны шире
    im = im.resize((w, round(w * im.height / im.width)), Image.NEAREST)        # пиксель-арт: без размытия
    dst = os.path.join(OUT, name + '.jpg')
    im.save(dst, 'JPEG', quality=84, optimize=True, progressive=True)
    print(name, im.size, os.path.getsize(dst) // 1024, 'КБ')
