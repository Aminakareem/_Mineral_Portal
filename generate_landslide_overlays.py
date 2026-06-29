"""
Generate transparent landslide overlays for the Mineral Portal map.
Uses vivid discrete class colors that contrast with the dark map background.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import rasterio
from PIL import Image
from rasterio.enums import Resampling

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "_Mineralportal" / "public" / "landslide"
PREVIEW_DIR = ROOT / "previews"

# RGBA 0–1 — each class is visually distinct from the dark map (#04070f)
CLASS_COLORS = {
    1: (0.133, 0.827, 0.933, 0.88),   # bright cyan — very low
    2: (0.518, 0.800, 0.086, 0.90),   # vivid lime — low
    3: (0.984, 0.749, 0.141, 0.92),   # gold — moderate
    4: (0.976, 0.451, 0.086, 0.94),   # deep orange — high
    5: (0.937, 0.267, 0.267, 0.96),   # hot coral-red — very high
}

RASTERS = [
    ("GB sus.tif", "gb-sus.png"),
    ("AJK_Sus_rec_fiv.tif", "ajk-sus.png"),
    ("LS_Susc_Bal_fiv.tif", "balochistan-sus.png"),
    ("kp_LS_susceptibiility/kp_LS_susceptibiility.tif", "kp-sus.png"),
]


def build_mask(data: np.ndarray, nodata) -> np.ndarray:
    mask = np.zeros(data.shape, dtype=bool)
    if nodata is not None and not (isinstance(nodata, float) and np.isnan(nodata)):
        mask |= data == nodata
    mask |= data <= 0
    mask |= data > 5
    mask |= ~np.isfinite(data)
    return mask


def render_class_overlay(data: np.ndarray, invalid: np.ndarray) -> np.ndarray:
    classes = np.clip(np.rint(data), 1, 5).astype(np.uint8)
    rgba = np.zeros((*data.shape, 4), dtype=np.float32)

    for level, color in CLASS_COLORS.items():
        mask = (classes == level) & ~invalid
        rgba[mask] = color

    rgba[invalid] = (0, 0, 0, 0)
    return rgba


def render_overlay(tif_path: Path, out_path: Path, max_dim: int = 2800) -> None:
    with rasterio.open(tif_path) as src:
        scale = max(src.width / max_dim, src.height / max_dim, 1)
        out_h = max(1, int(src.height / scale))
        out_w = max(1, int(src.width / scale))
        data = src.read(
            1,
            out_shape=(out_h, out_w),
            resampling=Resampling.mode,
        ).astype(np.float64)
        invalid = build_mask(data, src.nodata)

    rgba = render_class_overlay(data, invalid)
    img = Image.fromarray((rgba * 255).astype(np.uint8), mode="RGBA")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, optimize=True)
    print(f"  saved {out_path.name} ({out_w}x{out_h}, class colors)")


def main() -> None:
    print("Generating high-contrast landslide overlays...\n")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    for rel_path, filename in RASTERS:
        tif = ROOT / rel_path
        if not tif.exists():
            print(f"  skip missing: {rel_path}")
            continue
        print(tif.name)
        render_overlay(tif, OUT_DIR / filename)
        render_overlay(tif, PREVIEW_DIR / filename.replace(".png", "_preview.png"))

    print("\nDone.")


if __name__ == "__main__":
    main()
