import requests
import json

test_cases = [
  {'soil_type': 'black', 'location': 'Maharashtra', 
   'land_size': 2.5, 'water_availability': 'medium', 'season': 'kharif'},
  {'soil_type': 'alluvial', 'location': 'Punjab', 
   'land_size': 5, 'water_availability': 'high', 'season': 'rabi'},
  {'soil_type': 'red', 'location': 'Karnataka', 
   'land_size': 1, 'water_availability': 'low', 'season': 'kharif'}
]

for i, tc in enumerate(test_cases, 1):
    try:
        r = requests.post('http://localhost:8000/crop/recommend', json=tc)
        r.raise_for_status()
        data = r.json()
        print(f'Test {i}: {tc["location"]} | {tc["soil_type"]} soil')
        for rec in data['recommendations']:
            print(f'  Rank {rec["rank"]}: {rec["crop"]} — profit ₹{rec["total_profit_for_land"]:,}')
        print()
    except Exception as e:
        print(f"Test {i} failed: {e}")
