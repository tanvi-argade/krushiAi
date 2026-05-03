import requests
import json

print('=== TEST 1: ML Mode (with soil parameters) ===')
r = requests.post('http://localhost:8000/crop/recommend', json={
    'soil_type': 'black', 'location': 'Maharashtra',
    'land_size': 2.5, 'water_availability': 'medium', 'season': 'kharif',
    'N': 90, 'P': 42, 'K': 43, 'temperature': 25,
    'humidity': 80, 'ph': 6.5, 'rainfall': 100
})
data = r.json()
print(json.dumps(data, indent=2))

print()
print('=== TEST 2: Rule-based Mode (no soil params) ===')
r2 = requests.post('http://localhost:8000/crop/recommend', json={
    'soil_type': 'alluvial', 'location': 'Punjab',
    'land_size': 5, 'water_availability': 'high', 'season': 'rabi'
})
data2 = r2.json()
print(json.dumps(data2, indent=2))
