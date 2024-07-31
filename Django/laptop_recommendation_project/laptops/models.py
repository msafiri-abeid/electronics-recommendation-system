from django.db import models

class Laptop(models.Model):
    manufacturer = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    screen_size = models.CharField(max_length=10)
    # Add other fields as per your dataset
    price_euros = models.FloatField()

    def __str__(self):
        return f"{self.manufacturer} {self.model_name}"
