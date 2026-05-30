from django.urls import path
from . import views

urlpatterns = [
    path('apply/<int:job_id>/', views.apply_job, name='apply_job'),
    path('my-applications/', views.my_applications, name='my_applications'),
    path('job-applications/<int:job_id>/', views.job_applications, name='job_applications'),
    path('application/<int:app_id>/status/', views.update_application_status, name='update_application_status'),
]
