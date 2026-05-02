from transformers import AutoFeatureExtractor, AutoModelForImageClassification
import os

def download():
    model_name = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
    save_path = "./models/pest_model"
    
    print(f"Downloading model: {model_name}...")
    extractor = AutoFeatureExtractor.from_pretrained(model_name)
    model = AutoModelForImageClassification.from_pretrained(model_name)
    
    if not os.path.exists(save_path):
        os.makedirs(save_path)
        
    extractor.save_pretrained(save_path)
    model.save_pretrained(save_path)
    print("Model downloaded and saved successfully to ./models/pest_model")

if __name__ == "__main__":
    download()
