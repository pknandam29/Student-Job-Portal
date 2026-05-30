from django.contrib import admin
from .models import Application

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('student', 'job', 'applied_at', 'status')
    list_filter = ('status', 'applied_at')
    search_fields = ('student__username', 'job__title', 'job__company_name')
    raw_id_fields = ('student', 'job')
