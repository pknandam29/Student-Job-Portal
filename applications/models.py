from django.db import models
from django.contrib.auth.models import User
from jobs.models import Job

class Application(models.Model):
    STATUS_CHOICES = [
        ('Applied', 'Applied'),
        ('Under Review', 'Under Review'),
        ('Selected', 'Selected'),
        ('Rejected', 'Rejected'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    resume = models.FileField(upload_to='resumes/', help_text="Upload your resume in PDF/DOCX format")
    cover_letter = models.TextField(help_text="Introduce yourself and explain why you are a good fit")
    applied_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Applied')

    class Meta:
        unique_together = ('student', 'job')
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.student.username} applied to {self.job.title}"
