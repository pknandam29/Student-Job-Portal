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
    salary = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monthly salary in Rupees (₹)")
    description = models.TextField()
    skills_required = models.CharField(max_length=500, help_text="Comma-separated list of skills")
    application_deadline = models.DateField()
    contact_email = models.EmailField(blank=True, null=True)
    application_url = models.URLField(max_length=500, blank=True, null=True, help_text="Link to the external job application page")
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_status = self.status

    def save(self, *args, **kwargs):
        is_approved_now = (self.status == 'Approved' and self.__original_status != 'Approved')
        super().save(*args, **kwargs)
        self.__original_status = self.status
        
        if is_approved_now:
            from django.core.mail import send_mail
            from django.conf import settings
            from django.contrib.auth.models import User
            try:
                students = User.objects.filter(is_staff=False, is_active=True).exclude(email='')
                recipient_list = [student.email for student in students]
                if recipient_list:
                    subject = f"New Job Alert: {self.title} at {self.company_name}"
                    message = f"Hi,\n\n" \
                              f"A new job has been approved on the portal:\n\n" \
                              f"Job Title: {self.title}\n" \
                              f"Company: {self.company_name}\n" \
                              f"Location: {self.location}\n" \
                              f"Salary: ₹{self.salary}\n\n" \
                              f"Log in to view details and apply: http://127.0.0.1:8000/jobs/{self.id}/\n\n" \
                              f"Best regards,\nStudent Job Portal Team"
                    
                    for email in recipient_list:
                        send_mail(
                            subject,
                            message,
                            settings.DEFAULT_FROM_EMAIL,
                            [email],
                            fail_silently=True,
                        )
            except Exception:
                pass

    @property
    def skills_list(self):
        if not self.skills_required:
            return []
        return [skill.strip() for skill in self.skills_required.split(',') if skill.strip()]

    def __str__(self):
        return f"{self.title} at {self.company_name}"


