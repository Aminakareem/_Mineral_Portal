"""
Inspect and preview GeoTIFF landslide susceptibility rasters.

Usage:
  python view_rasters.py              # list and inspect all .tif files
  python view_rasters.py "GB sus.tif"  # inspect one file
  python view_rasters.py --preview    # also save PNG previews
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling


ROOT = Path(__file__).resolve().parent


def find_tif_files(target: Path | None) -> list[Path]:
    if target is not None:
        path = Path(target)
        if not path.is_absolute():
            path = ROOT / path
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        return [path]

    return sorted(ROOT.rglob("*.tif"))


def human_size(num_bytes: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    size = float(num_bytes)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{num_bytes} B"


def print_raster_info(path: Path) -> None:
    print("=" * 72)
    print(f"File: {path.relative_to(ROOT)}")
    print(f"Size: {human_size(path.stat().st_size)}")

    ovr = path.with_suffix(path.suffix + ".ovr")
    if ovr.exists():
        print(f"Overview (.ovr): {human_size(ovr.stat().st_size)} (binary pyramid file, not text)")

    with rasterio.open(path) as src:
        print(f"Driver: {src.driver}")
        print(f"Size (cols x rows): {src.width} x {src.height}")
        print(f"Bands: {src.count}")
        print(f"Data type: {src.dtypes[0]}")
        print(f"NoData: {src.nodata}")
        print(f"CRS: {src.crs}")
        print(f"Bounds: {src.bounds}")
        print(f"Resolution: {src.res}")

        for band in range(1, src.count + 1):
            data = src.read(band, masked=True)
            valid = data.compressed() if np.ma.isMaskedArray(data) else data.ravel()
            if valid.size == 0:
                print(f"Band {band} stats: no valid pixels")
                continue
            print(
                f"Band {band} stats: "
                f"min={float(np.min(valid)):.4f}, "
                f"max={float(np.max(valid)):.4f}, "
                f"mean={float(np.mean(valid)):.4f}"
            )


def save_preview(path: Path, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{path.stem}_preview.png"

    with rasterio.open(path) as src:
        max_dim = 2000
        scale = max(src.width / max_dim, src.height / max_dim, 1)
        out_height = max(1, int(src.height / scale))
        out_width = max(1, int(src.width / scale))
        data = src.read(
            1,
            out_shape=(out_height, out_width),
            resampling=Resampling.average,
            masked=True,
        )

    import matplotlib.pyplot as plt

    plt.figure(figsize=(10, 8))
    plt.imshow(data, cmap="YlOrRd")
    plt.colorbar(label="Susceptibility value")
    plt.title(path.name)
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close()
    return out_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect GeoTIFF raster files.")
    parser.add_argument(
        "file",
        nargs="?",
        help="Optional .tif file name or path. If omitted, all .tif files are processed.",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Save PNG preview images to the previews/ folder.",
    )
    parser.add_argument(
        "--ui",
        action="store_true",
        help="Open results.html in your web browser (run --preview first if previews are missing).",
    )
    args = parser.parse_args()

    try:
        tif_files = find_tif_files(args.file)
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 1

    if not tif_files:
        print("No .tif files found in this folder.", file=sys.stderr)
        return 1

    print(f"Found {len(tif_files)} GeoTIFF file(s) in: {ROOT}\n")
    print("Note: .tif and .ovr files are binary image data and cannot be opened as text.")
    print("Use this script in the terminal to inspect them properly.\n")

    preview_dir = ROOT / "previews"
    for path in tif_files:
        print_raster_info(path)
        if args.preview:
            preview_path = save_preview(path, preview_dir)
            print(f"Preview saved: {preview_path.relative_to(ROOT)}")

    print("=" * 72)
    print("Done.")

    if args.ui:
        import webbrowser
        html_path = ROOT / "results.html"
        if not html_path.exists():
            print(f"UI file not found: {html_path}", file=sys.stderr)
            return 1
        webbrowser.open(html_path.as_uri())
        print(f"Opened UI in browser: {html_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
