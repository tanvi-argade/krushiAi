```markdown
# KrushiAI — AI-Powered Farm Advisory Platform

An intelligent agricultural advisory system that helps Indian farmers make
data-driven decisions about crop selection, pest detection, irrigation
scheduling, and market pricing.

Built with React, FastAPI, PyTorch, and scikit-learn. Runs fully offline
after initial setup.

---

## Modules

| Module | Description | Tech |
|---|---|---|
| Pest Detection | Upload crop leaf image → detects disease + treatment | MobileNetV2, PlantVillage dataset |
| Crop Advisor | Soil + climate inputs → top 3 crop recommendations | Random Forest, 2200-row dataset |
| Irrigation Advisor | Location + crop → daily water schedule | FAO-56 formula, Open-Meteo API |
| Market Predictor | Crop + region → best price and sell date | Coming in Week 2 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python, FastAPI |
| Pest Detection Model | HuggingFace Transformers, MobileNetV2 |
| Crop Recommendation | scikit-learn Random Forest (97% accuracy) |
| Weather Data | Open-Meteo API (free, no key needed) |
| Database | SQLite |

---

## Project Structure

```
krushiAi/
├── backend/
│   ├── main.py                        # FastAPI entry point
│   ├── routes/
│   │   ├── pest.py                    # Pest detection endpoint
│   │   ├── crop.py                    # Crop recommendation endpoint
│   │   ├── market.py                  # Market price endpoint
│   │   └── irrigation.py              # Irrigation schedule endpoint
│   ├── models/
│   │   ├── download_model.py          # Downloads pest detection model
│   │   ├── train_crop_model.py        # Trains crop recommendation model
│   │   ├── crop_model.pkl             # Trained Random Forest model
│   │   └── crop_label_encoder.pkl     # Label encoder for crop model
│   ├── data/
│   │   ├── crop_recommendation.csv    # Training dataset (2200 rows, 22 crops)
│   │   ├── crop_soil_map.json         # Indian crop metadata (33 crops)
│   │   └── treatments.json            # Plant disease treatment map
│   ├── db/
│   │   └── database.py                # SQLite setup and query history
│   └── requirements.txt
└── frontend/
    └── src/
        └── App.js                     # React UI (all pages)
```

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone the repository

```bash
git clone https://github.com/tanvi-argade/krushiAi.git
cd krushiAi
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

### 3. Download pest detection model (one time, ~100MB)

```bash
python models/download_model.py
```

### 4. Train crop recommendation model (one time, takes ~10 seconds)

```bash
python models/train_crop_model.py
```

Expected output: `Model accuracy: 0.97xx`

### 5. Start backend

```bash
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 6. Frontend setup

```bash
cd ../frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /pest/detect | Upload leaf image, get disease + treatment |
| GET | /pest/history | Last 10 pest detection queries |
| POST | /crop/recommend | Get top 3 crop recommendations |
| GET | /crop/soils | List all supported soil types |
| GET | /crop/states | List all supported Indian states |
| POST | /market/predict | Get crop price prediction |
| POST | /irrigation/schedule | Get irrigation schedule |

---

## How Pest Detection Works

1. Farmer uploads a crop leaf image
2. Image is validated (must not be solid color or non-plant)
3. MobileNetV2 model runs inference locally (no internet needed)
4. If confidence < 40%, returns "uncertain" instead of guessing
5. Disease label is matched to treatments.json for advice
6. Result is saved to SQLite history

## How Crop Advisor Works

1. Farmer enters soil type, location, land size, season
2. If soil test report is available (N, P, K, pH, rainfall):
   - Random Forest ML model predicts best crops (97% accuracy)
   - Shows "AI Recommended" badge
3. If no soil test data:
   - Rule-based filtering on crop_soil_map.json
   - Shows "Rule Based" badge
4. Top 3 crops returned with profit estimate for their land size

---

## Data Sources

| Data | Source |
|---|---|
| Pest detection model | HuggingFace — linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification |
| Crop recommendation dataset | Kaggle — atharvaingle/crop-recommendation-dataset |
| Indian crop metadata | ICAR guidelines + Agmarknet averages |
| Weather data | Open-Meteo (open-meteo.com) |

---

## Known Limitations

- Pest detection model trained on PlantVillage (lab conditions).
  Accuracy may be lower on field photos with background noise.
- Crop dataset covers 22 crops. Regional variety names (Basmati, Sona Masoori)
  not differentiated.
- Market price prediction uses historical averages, not live mandi prices.

---

## Author

Tanvi Argade
```