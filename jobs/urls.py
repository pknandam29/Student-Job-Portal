from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('jobs/', views.job_list, name='job_list'),
    path('jobs/<int:job_id>/', views.job_detail, name='job_detail'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('jobs/post/', views.post_job, name='post_job'),
    path('jobs/<int:job_id>/edit/', views.edit_job, name='edit_job'),
    path('jobs/<int:job_id>/delete/', views.delete_job, name='delete_job'),
    path('jobs/my/', views.my_jobs, name='my_jobs'),
    path('jobs/autofill/', views.autofill_job, name='autofill_job'),
    
    # Admin URLs
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/jobs/<str:status_filter>/', views.admin_jobs, name='admin_jobs'),
    path('admin/jobs/<int:job_id>/action/<str:action>/', views.admin_job_action, name='admin_job_action'),
]
