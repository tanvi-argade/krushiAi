import json
import os
from transformers import AutoModelForImageClassification

def get_labels():
    model_path = "./backend/models/pest_model"
    model = AutoModelForImageClassification.from_pretrained(model_path)
    print(json.dumps(model.config.id2label, indent=2))

if __name__ == "__main__":
    get_labels()
