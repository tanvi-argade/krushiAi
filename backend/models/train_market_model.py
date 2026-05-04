import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
import json
import os

# Set paths
base_path = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(os.path.dirname(base_path), 'data', 'mandi_prices.csv')
model_dir = base_path

print(f"Loading data from {data_path}...")
df = pd.read_csv(data_path)

# Rename columns based on exploration
df = df.rename(columns={
    'Commodity': 'crop',
    'STATE': 'state', 
    'Modal_Price': 'modal_price',
    'Price Date': 'date'
})

# Parse date column
# CSV format seems to be d/m/Y (e.g., 6/6/2023)
df['date'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
df = df.dropna(subset=['date', 'modal_price'])

# Extract time features
df['month'] = df['date'].dt.month
df['year'] = df['date'].dt.year
df['day_of_year'] = df['date'].dt.dayofyear
df['quarter'] = df['date'].dt.quarter

# Clean price column
df['modal_price'] = pd.to_numeric(df['modal_price'], errors='coerce')
df = df.dropna(subset=['modal_price'])
df = df[df['modal_price'] > 0]

# Encode categorical columns
le_crop = LabelEncoder()
le_state = LabelEncoder()

# Standardize text
df['crop'] = df['crop'].str.lower().str.strip()
df['state'] = df['state'].str.lower().str.strip()

df['crop_encoded'] = le_crop.fit_transform(df['crop'])
df['state_encoded'] = le_state.fit_transform(df['state'])

# Features and target
feature_cols = ['crop_encoded', 'state_encoded', 'month', 
                'year', 'day_of_year', 'quarter']
X = df[feature_cols]
y = df['modal_price']

print(f"Dataset size: {len(df)} records")
print(f"Training model...")

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)

# Train Gradient Boosting
model = GradientBoostingRegressor(
    n_estimators=200,
    learning_rate=0.1,
    max_depth=5,
    random_state=42
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"MAE: INR {mae:.2f}/quintal")
print(f"R2 Score: {r2:.4f}")

# Save everything
os.makedirs(model_dir, exist_ok=True)

with open(os.path.join(model_dir, 'market_model.pkl'), 'wb') as f:
    pickle.dump(model, f)
with open(os.path.join(model_dir, 'market_le_crop.pkl'), 'wb') as f:
    pickle.dump(le_crop, f)
with open(os.path.join(model_dir, 'market_le_state.pkl'), 'wb') as f:
    pickle.dump(le_state, f)

# Save metadata
metadata = {
    'crops': sorted(le_crop.classes_.tolist()),
    'states': sorted(le_state.classes_.tolist()),
    'feature_cols': feature_cols,
    'mae': round(float(mae), 2),
    'r2': round(float(r2), 4),
    'total_records': int(len(df)),
    'date_range': {
        'min': str(df['date'].min().date()),
        'max': str(df['date'].max().date())
    }
}
with open(os.path.join(model_dir, 'market_metadata.json'), 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"\nModel saved successfully in {model_dir}")
print(f"Crops available: {len(le_crop.classes_)}")
print(f"States available: {len(le_state.classes_)}")
# print(json.dumps(metadata, indent=2))
