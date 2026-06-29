# Mineral Portal

Interactive map portal for mineral and landslide susceptibility data, built with React, Vite, and Mapbox GL.

## Project structure

- `_Mineralportal/` — React frontend (Vite + Mapbox GL)
- `generate_landslide_overlays.py` — Python script to generate landslide overlay rasters
- `view_rasters.py` — Utility to inspect raster files
- `requirements.txt` — Python dependencies

## Setup

### Frontend

```bash
cd _Mineralportal
cp .env.example .env
# Edit .env and set VITE_MAPBOX_ACCESS_TOKEN to your Mapbox public token
npm install
npm run dev
```

### Python tools

```bash
pip install -r requirements.txt
```

## Data files

Large GeoTIFF raster files (`.tif`) are excluded from this repository due to size. Place them in the project root locally as needed for overlay generation and viewing.
