# Иконка 32×32 пиксель-арт, увеличенная без размытия: python tools/make_icons.py
# Ночное небо, луна, силуэт Казани с окнами и башней со звездой, большая красная «А».
import struct, zlib, os

N = 32
img = [[None] * N for _ in range(N)]
def px(x, y, c):
    if 0 <= x < N and 0 <= y < N: img[y][x] = c
def rect(x, y, w, h, c):
    for j in range(h):
        for i in range(w): px(x + i, y + j, c)
def mix(a, b, k): return tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))

# небо
for y in range(N):
    rect(0, y, N, 1, mix((14, 12, 34), (70, 34, 70), y / N))
for x, y in [(3, 3), (9, 6), (25, 2), (29, 9), (5, 11), (20, 4)]: px(x, y, (220, 220, 240))
rect(24, 4, 4, 4, (240, 230, 190)); px(24, 4, (70, 34, 70)); px(23, 5, (240, 230, 190))   # луна
# город
heights = [9, 12, 8, 11, 7, 10, 13, 9, 8, 11]
for i, h in enumerate(heights):
    x0 = i * 3 + (1 if i > 4 else 0)
    rect(x0, N - h, 3, h, (16, 14, 24))
    for wy in range(N - h + 1, N - 1, 2):
        if (x0 * 7 + wy * 3) % 5 < 2: px(x0 + 1, wy, (232, 192, 80))
rect(14, 13, 4, 19, (22, 18, 30)); rect(15, 9, 2, 4, (22, 18, 30)); px(15, 8, (220, 40, 40)); px(16, 8, (220, 40, 40)); px(15, 7, (255, 80, 60))   # башня со звездой
# асфальт
rect(0, 29, N, 3, (40, 36, 34)); rect(2, 30, 3, 1, (200, 190, 160)); rect(9, 30, 3, 1, (200, 190, 160)); rect(20, 30, 3, 1, (200, 190, 160)); rect(27, 30, 3, 1, (200, 190, 160))
# большая «А»
A = ['....####....',
     '...######...',
     '..###..###..',
     '..##....##..',
     '.###....###.',
     '.##......##.',
     '.##########.',
     '############',
     '###......###',
     '###......###',
     '###......###',
     '###......###']
ox, oy = 10, 12
red, hi, dk = (214, 52, 40), (255, 120, 90), (10, 6, 6)
for j, row in enumerate(A):
    for i, ch in enumerate(row):
        if ch == '#':
            # чёрная обводка вокруг
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                X, Y = ox + i + dx, oy + j + dy
                if not (0 <= j + dy < len(A) and 0 <= i + dx < len(row) and A[j + dy][i + dx] == '#'): px(X, Y, dk)
for j, row in enumerate(A):
    for i, ch in enumerate(row):
        if ch == '#': px(ox + i, oy + j, hi if (i + j) < 6 or i == 0 else red)

def save(path, size):
    k = size // N
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            c = img[min(N - 1, y // k)][min(N - 1, x // k)] or (14, 12, 34)
            row += bytes(c)
        rows.append(bytes(row))
    raw = zlib.compress(b''.join(rows), 9)
    ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + ch(b'IDAT', raw) + ch(b'IEND', b''))

out = os.path.join(os.path.dirname(__file__), '..', 'icons')
os.makedirs(out, exist_ok=True)
for n in (180, 192, 512):
    save(os.path.join(out, f'icon-{n}.png'), (n // N) * N if n % N == 0 else n)
print('ok')
