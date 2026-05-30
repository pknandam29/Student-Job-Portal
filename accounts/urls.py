from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.edit_profile, name='edit_profile'),
    path('admin/users/', views.user_management, name='user_management'),
    path('admin/users/toggle/<int:user_id>/', views.toggle_user_status, name='toggle_user_status'),
    path('admin/users/delete/<int:user_id>/', views.delete_user, name='delete_user'),
]
