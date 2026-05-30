from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'college_name', 'course', 'graduation_year')
    search_fields = ('user__username', 'user__email', 'college_name', 'course')
    list_filter = ('graduation_year', 'course')
