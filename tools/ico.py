# Собирает build/windows/icon.ico из кадров tools/icon.cjs.
import os
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fr = os.path.join(root, 'build', '.icon-frames')
sizes = [16, 24, 32, 48, 64, 128, 256]
imgs = [Image.open(os.path.join(fr, f'{s}.png')).convert('RGBA') for s in sizes]
imgs[-1].save(os.path.join(root, 'build', 'windows', 'icon.ico'), sizes=[(s, s) for s in sizes], append_images=imgs[:-1])
for s in sizes:
    os.remove(os.path.join(fr, f'{s}.png'))
os.rmdir(fr)
