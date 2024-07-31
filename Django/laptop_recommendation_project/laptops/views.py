from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import pandas as pd
import joblib
import json
import os
import logging

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

# Define the path to your CSV file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
csv_path = os.path.join(BASE_DIR, 'data', 'laptops.csv')

# Load the dataset
df = pd.read_csv(csv_path, encoding='latin1')

# Strip whitespace from columns
df.columns = df.columns.str.strip()

# Check if 'Formatted Name' exists, if not create it
if 'Formatted Name' not in df.columns:
    df['Formatted Name'] = df.apply(lambda x: f"{x['Manufacturer']} {x['Model Name']} {x['Category']} {x['CPU']}", axis=1)

# Log DataFrame columns for debugging
logger.debug(f'DataFrame columns: {df.columns.tolist()}')

# Load your trained model and label encoders here
knn_model = joblib.load(os.path.join(BASE_DIR, 'data', 'knn_model.pkl'))
label_encoders = joblib.load(os.path.join(BASE_DIR, 'data', 'label_encoders.pkl'))

# Manually defined exchange rate: 1 Euro = 2874.92 Tanzanian Shilling
exchange_rate = 2874.92

@csrf_exempt
def recommend_laptop(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            manufacturer = data.get('manufacturer')
            model_name = data.get('model_name')
            category = data.get('category')

            # Transform user input using label encoders
            user_input_transformed = [
                label_encoders['Manufacturer'].transform([manufacturer])[0],
                label_encoders['Model Name'].transform([model_name])[0],
                label_encoders['Category'].transform([category])[0]
            ]

            logger.debug(f'Transformed user input: {user_input_transformed}')

            # Perform recommendation logic
            distances, indices = knn_model.kneighbors([user_input_transformed])
            recommended_laptops = df.iloc[indices[0]]

            response_data = []

            # Limit recommendations to a maximum of 3
            max_recommendations = min(3, len(recommended_laptops))
            unique_recommendations = recommended_laptops.drop_duplicates(subset=['Formatted Name'])[:max_recommendations]

            for _, laptop in unique_recommendations.iterrows():
                # Convert price to Tsh and round it
                price_euros = float(laptop['Price (Euros)'].replace(',', '.'))  # Convert to float if necessary
                price_tzs = round(price_euros * exchange_rate)

                response_data.append({
                    'name': laptop['Formatted Name'],
                    'screen_size': f"{laptop['Screen Size']} inches",
                    'screen': laptop['Screen'],
                    'ram': laptop['RAM'],
                    'storage': laptop['Storage'],
                    'gpu': laptop['GPU'],
                    'price_tzs': price_tzs,
                })

            return JsonResponse({'recommendations': response_data})
        except Exception as e:
            logger.error(f'Error occurred: {str(e)}', exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'POST method required'}, status=405)


@csrf_exempt
def get_options(request):
    if request.method == 'GET':
        manufacturers = df['Manufacturer'].unique().tolist()
        
        # Create a dictionary of model names keyed by manufacturer
        model_names_by_manufacturer = {}
        for manufacturer in manufacturers:
            models = df[df['Manufacturer'] == manufacturer]['Model Name'].unique().tolist()
            model_names_by_manufacturer[manufacturer] = models
        
        return JsonResponse({
            'manufacturers': manufacturers,
            'model_names': model_names_by_manufacturer,
        })
    return JsonResponse({'error': 'GET method required'}, status=405)

