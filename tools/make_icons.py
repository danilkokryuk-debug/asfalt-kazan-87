# Генерирует иконки PNG без сторонних библиотек: python tools/make_icons.py
# Рисунок: тёмный фон, красная полоса «асфальта» и жёлтая звезда района.
import struct, zlib, os, math

def png(path, n):
    bg, red, gold, line = (27, 24, 20), (200, 64, 47), (216, 164, 65), (58, 51, 42)
    rows = []
    for y in range(n):
        row = bytearray([0])
        for x in range(n):
            u, v = x / n, y / n
            c = bg
            if 0.58 < v < 0.78: c = red
            if 0.66 < v < 0.70 and int(u * 8) % 2 == 0: c = (232, 220, 192)   # разметка
            # звезда
            cx, cy, r = 0.5, 0.34, 0.2
            a, d = math.atan2(v - cy, u - cx), math.hypot(u - cx, v - cy)
            k = (a + math.pi / 2) % (2 * math.pi / 5) / (2 * math.pi / 5)
            if d < r * (0.45 + 0.55 * abs(1 - 2 * k)): c = gold
            if u < 0.04 or u > 0.96 or v < 0.04 or v > 0.96: c = line
            row += bytes(c)
        rows.append(bytes(row))
    raw = zlib.compress(b''.join(rows), 9)
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 2, 0, 0, 0)) + chunk(b'IDAT', raw) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

out = os.path.join(os.path.dirname(__file__), '..', 'icons')
os.makedirs(out, exist_ok=True)
for n in (180, 192, 512):
    png(os.path.join(out, f'icon-{n}.png'), n)
print('ok')
