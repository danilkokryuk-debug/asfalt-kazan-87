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
}
for f in glob.glob(os.path.join(SRC, '*.jpg')):
    base = os.path.basename(f)
    name = next((v for k, v in MAP.items() if base.startswith(k)), None)
    if not name: continue
    im = Image.open(f).convert('RGB')
    w = 720 if im.width > im.height else 540                                   # горизонтальные интерьеры шире
    im = im.resize((w, round(w * im.height / im.width)), Image.NEAREST)        # пиксель-арт: без размытия
    dst = os.path.join(OUT, name + '.jpg')
    im.save(dst, 'JPEG', quality=84, optimize=True, progressive=True)
    print(name, im.size, os.path.getsize(dst) // 1024, 'КБ')
