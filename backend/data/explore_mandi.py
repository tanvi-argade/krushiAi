import pandas as pd
import json
import os

# Use absolute path to be safe or relative to script
base_path = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_path, 'mandi_prices.csv')

df = pd.read_csv(csv_path)

# Print exact column names
print("Columns:", df.columns.tolist())
print("Shape:", df.shape)
print("Dtypes:", df.dtypes)
print("Sample:", df.head(3).to_string())

# Find the commodity/crop column name
# Find the price column name (modal/min/max)
# Find the date column name
# Find the state column name

# Print unique values for each key column
for col in df.columns:
    unique_count = df[col].nunique()
    print(f"\n{col}: {unique_count} unique values")
    if unique_count < 50:
        print(df[col].unique().tolist())
    else:
        print(df[col].unique()[:20].tolist(), "...")
