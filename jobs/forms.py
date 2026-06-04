from django import forms
from .models import Job

class JobForm(forms.ModelForm):
    class Meta:
        model = Job
        fields = [
            'title', 'company_name', 'location', 'salary', 
            'description', 'skills_required', 'application_deadline', 
            'contact_email', 'application_url'
        ]
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Software Engineer...'}),
            'company_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Google, Stripe...'}),
            'location': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Remote / New York, NY...'}),
            'salary': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 5, 'placeholder': 'Job description and requirements...'}),
            'skills_required': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Python, Django, SQL (comma-separated)'}),
            'application_deadline': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'contact_email': forms.EmailField().widget, # forms.EmailInput
            'application_url': forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'https://company.com/careers/apply'}),
        }
        labels = {
            'salary': 'Annual Salary (LPA)',
        }
        help_texts = {
            'salary': '',
        }
    
    # Correcting contact_email widget
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['contact_email'].widget = forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'recruiter@company.com'})
