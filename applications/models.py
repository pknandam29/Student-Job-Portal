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


from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings

@receiver(post_save, sender=Application)
def application_status_changed(sender, instance, created, **kwargs):
    try:
        if created:
            subject = f"Application Submitted: {instance.job.title} at {instance.job.company_name}"
            message = f"Hi {instance.student.first_name or instance.student.username},\n\n" \
                      f"Thank you for submitting your application for '{instance.job.title}' at {instance.job.company_name}.\n\n" \
                      f"You can track the progress of your application on your dashboard: http://127.0.0.1:8000/my-applications/\n\n" \
                      f"Best regards,\nStudent Job Portal Team"
        else:
            subject = f"Application Update: {instance.job.title} at {instance.job.company_name}"
            message = f"Hi {instance.student.first_name or instance.student.username},\n\n" \
                      f"The status of your application for the position of '{instance.job.title}' " \
                      f"at {instance.job.company_name} has been updated to: '{instance.status}'.\n\n" \
                      f"Log in to view details: http://127.0.0.1:8000/my-applications/\n\n" \
                      f"Best regards,\nStudent Job Portal Team"
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [instance.student.email],
            fail_silently=True,
        )
    except Exception:
        pass
