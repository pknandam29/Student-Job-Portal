from django.contrib import admin
from .models import Job, SavedJob

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company_name', 'location', 'salary', 'application_deadline', 'posted_by', 'status', 'created_at')
    list_filter = ('status', 'location', 'application_deadline', 'created_at')
    search_fields = ('title', 'company_name', 'description', 'skills_required', 'posted_by__username')
    raw_id_fields = ('posted_by',)


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'saved_at')
    search_fields = ('user__username', 'job__title', 'job__company_name')
    raw_id_fields = ('user', 'job')
