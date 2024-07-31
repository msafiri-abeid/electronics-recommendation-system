from django.urls import path
from . import views

urlpatterns = [
    path('recommend/', views.recommend_laptop, name='recommend_laptop'),
    path('options/', views.get_options, name='get_options'),
]
