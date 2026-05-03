import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import pickle
import json
import os

# Ensure models directory exists
os.makedirs('backend/models', exist_ok=True)

df = pd.read_csv('backend/data/crop_recommendation.csv')

X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y = df['label']

le = LabelEncoder()
y_encoded = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model accuracy: {accuracy:.4f}")

# Save model and label encoder
with open('backend/models/crop_model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('backend/models/crop_label_encoder.pkl', 'wb') as f:
    pickle.dump(le, f)

# Save class names for reference
classes = le.classes_.tolist()
with open('backend/models/crop_classes.json', 'w') as f:
    json.dump(classes, f)

print(f"Model saved. Classes: {classes}")
