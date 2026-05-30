from django.db import models
from django.contrib.auth.models import User

class Job(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    salary = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monthly salary in USD/INR or appropriate currency")
    description = models.TextField()
    skills_required = models.CharField(max_length=500, help_text="Comma-separated list of skills")
    application_deadline = models.DateField()
    contact_email = models.EmailField()
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"{self.title} at {self.company_name}"


class SavedJob(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saves')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'job')

    def __str__(self):
        return f"{self.user.username} saved {self.job.title}"
