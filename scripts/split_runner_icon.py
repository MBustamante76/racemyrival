"""Split public/runner_icon.png into a tintable white silhouette pin."""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "runner_icon.png"
OUT = ROOT / "public" / "runner-pin.png"


def main() -> None:
  im = Image.open(SRC).convert("RGBA")
  arr = np.asarray(im).copy()
  rgb = arr[:, :, :3].astype(np.int16)
  white = (rgb[:, :, 0] > 240) & (rgb[:, :, 1] > 240) & (rgb[:, :, 2] > 240)

  w, h = im.size
  mid = w // 2
  region = ~white[:, 0:mid]
  ys, xs = np.where(region)
  pad = 8
  left = max(0, int(xs.min()) - pad)
  right = min(mid - 1, int(xs.max()) + pad)
  top = max(0, int(ys.min()) - pad)
  bottom = min(h - 1, int(ys.max()) + pad)

  crop = arr[top : bottom + 1, left : right + 1].copy()
  crop_rgb = crop[:, :, :3].astype(np.int16)
  crop_white = (
    (crop_rgb[:, :, 0] > 240) & (crop_rgb[:, :, 1] > 240) & (crop_rgb[:, :, 2] > 240)
  )

  out = np.zeros((crop.shape[0], crop.shape[1], 4), dtype=np.uint8)
  out[~crop_white, 0] = 255
  out[~crop_white, 1] = 255
  out[~crop_white, 2] = 255
  out[~crop_white, 3] = 255

  Image.fromarray(out).save(OUT)
  print(f"wrote {OUT.relative_to(ROOT)} ({out.shape[1]}x{out.shape[0]})")


if __name__ == "__main__":
  main()
