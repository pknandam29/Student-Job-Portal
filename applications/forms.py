from django import forms
from .models import Application

class ApplicationForm(forms.ModelForm):
    class Meta:
        model = Application
        fields = ['resume', 'cover_letter']
        widgets = {
            'resume': forms.FileInput(attrs={'class': 'form-control', 'accept': '.pdf,.doc,.docx'}),
            'cover_letter': forms.Textarea(attrs={'class': 'form-control', 'rows': 6, 'placeholder': 'Write your cover letter here...'}),
        }
