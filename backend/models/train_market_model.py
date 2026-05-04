import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
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

# 1. DATA CLEANING
df = df.rename(columns={
    'Commodity': 'crop',
    'STATE': 'state', 
    'Modal_Price': 'modal_price',
    'Price Date': 'date'
})

state_map = {
    "chattisgarh": "chhattisgarh", "tamilnadu": "tamil nadu",
    "jammu & kashmir": "jammu and kashmir", "gao": "goa", "uttrakhand": "uttarakhand"
}
df['state'] = df['state'].str.lower().str.strip().replace(state_map)
df['crop'] = df['crop'].str.lower().str.strip()

df['date'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
df = df.dropna(subset=['date', 'modal_price'])
df = df[df['modal_price'] > 0]

# Aggregate to daily state-level data
df = df.groupby(['date', 'crop', 'state'])['modal_price'].mean().reset_index()
df = df.sort_values(['crop', 'state', 'date'])

# 2. ADD LAG FEATURES
df['price_lag_1'] = df.groupby(['crop', 'state'])['modal_price'].shift(1)
df['price_lag_7'] = df.groupby(['crop', 'state'])['modal_price'].shift(7)
df['price_lag_30'] = df.groupby(['crop', 'state'])['modal_price'].shift(30)
df['rolling_mean_7'] = df.groupby(['crop', 'state'])['modal_price'].transform(lambda x: x.rolling(7).mean().shift(1))

# 3. SEASONALITY (Cyclical Encoding)
df['day_of_year'] = df['date'].dt.dayofyear
df['sin_day'] = np.sin(2 * np.pi * df['day_of_year'] / 365.25)
df['cos_day'] = np.cos(2 * np.pi * df['day_of_year'] / 365.25)
df['year'] = df['date'].dt.year

df = df.dropna(subset=['price_lag_1', 'price_lag_7', 'price_lag_30', 'rolling_mean_7'])

# 4. ENCODING
le_crop = LabelEncoder()
le_state = LabelEncoder()
df['crop_encoded'] = le_crop.fit_transform(df['crop'])
df['state_encoded'] = le_state.fit_transform(df['state'])

# 5. TIME-SERIES SPLIT
df = df.sort_values('date')
split_idx = int(len(df) * 0.8)
train_df = df.iloc[:split_idx]
test_df = df.iloc[split_idx:]

feature_columns = ['crop_encoded', 'state_encoded', 'year', 'sin_day', 'cos_day', 
                   'price_lag_1', 'price_lag_7', 'price_lag_30', 'rolling_mean_7']

X_train, y_train = train_df[feature_columns], train_df['modal_price']
X_test, y_test = test_df[feature_columns], test_df['modal_price']

print(f"Training model on {len(X_train)} samples...")
model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42)
model.fit(X_train, y_train)

# Evaluation
y_pred = model.predict(X_test)
mae = float(mean_absolute_error(y_test, y_pred))
r2 = float(r2_score(y_test, y_pred))

# Save artifacts
latest_data = df.sort_values('date').groupby(['crop', 'state']).tail(30)
latest_prices = {f"{c}_{s}": g.to_dict('records') for (c, s), g in latest_data.groupby(['crop', 'state'])}

os.makedirs(model_dir, exist_ok=True)
with open(os.path.join(model_dir, 'market_model.pkl'), 'wb') as f: pickle.dump(model, f)
with open(os.path.join(model_dir, 'market_le_crop.pkl'), 'wb') as f: pickle.dump(le_crop, f)
with open(os.path.join(model_dir, 'market_le_state.pkl'), 'wb') as f: pickle.dump(le_state, f)
with open(os.path.join(model_dir, 'market_latest_prices.pkl'), 'wb') as f: pickle.dump(latest_prices, f)

metadata = {
    'crops': sorted(le_crop.classes_.tolist()),
    'states': sorted(le_state.classes_.tolist()),
    'feature_columns': feature_columns,
    'r2_score': r2,
    'mae': mae,
    'total_records': int(len(df)),
    'date_range': {'min': str(df['date'].min().date()), 'max': str(df['date'].max().date())}
}
with open(os.path.join(model_dir, 'market_metadata.json'), 'w') as f: json.dump(metadata, f, indent=2)

print(f"Model saved. R2: {r2:.4f}, MAE: {mae:.2f}")
