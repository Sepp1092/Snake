"""Reproducible pixel-art PWA icons; Python standard library only."""
import struct
import zlib
from pathlib import Path

def chunk(kind, content):
    return struct.pack('>I', len(content)) + kind + content + struct.pack('>I', zlib.crc32(kind + content))

for size in (192, 512):
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            u, v = x * 16 // size, y * 16 // size
            snake = (4 <= u <= 11 and v in (4, 5)) or (u in (10, 11) and 5 <= v <= 8) or (5 <= u <= 11 and v in (7, 8)) or (u in (4, 5) and 8 <= v <= 11) or (4 <= u <= 9 and v in (10, 11))
            food = u == 11 and v == 11
            rows.extend((41, 62, 40) if snake or food else (170, 189, 131))
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>2I5B', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')
    Path(f'public/icon-{size}.png').write_bytes(data)
