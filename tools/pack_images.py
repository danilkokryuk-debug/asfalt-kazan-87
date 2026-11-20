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
}
for f in glob.glob(os.path.join(SRC, '*.jpg')):
    base = os.path.basename(f)
    name = next((v for k, v in MAP.items() if base.startswith(k)), None)
    if not name: continue
    im = Image.open(f).convert('RGB')
    im = im.resize((540, round(540 * im.height / im.width)), Image.NEAREST)   # пиксель-арт: без размытия
    dst = os.path.join(OUT, name + '.jpg')
    im.save(dst, 'JPEG', quality=84, optimize=True, progressive=True)
    print(name, im.size, os.path.getsize(dst) // 1024, 'КБ')
