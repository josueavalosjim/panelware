"""The player clip, from the frames scripts/shoot.mjs --clip writes.

    python3 scripts/build-gif.py <frames dir> <out.gif> <fps>

1280x720, one palette per frame, and no dithering: the frames are flat UI
colours, and dither turns a flat fill into noise that also compresses worse.
Needs Pillow.
"""
import glob
import sys

from PIL import Image

src, out, fps = sys.argv[1], sys.argv[2], int(sys.argv[3])
files = sorted(glob.glob(f'{src}/*.png'))
frames = [
    Image.open(f).convert('RGB').resize((1280, 720), Image.LANCZOS)
    .quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    for f in files
]
frames[0].save(out, save_all=True, append_images=frames[1:],
               duration=round(1000 / fps), loop=0, optimize=True)
