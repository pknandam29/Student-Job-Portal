from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from jobs.models import Job, SavedJob
from applications.models import Application
import datetime

class JobPortalTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create standard student user
        self.student = User.objects.create_user(username='student1', password='password123', email='student1@example.com')
        # Create standard employer/poster user
        self.employer = User.objects.create_user(username='employer1', password='password123', email='employer1@example.com')
        # Create admin user
        self.admin = User.objects.create_superuser(username='admin1', password='password123', email='admin1@example.com')

    def test_job_workflow(self):
        # 1. Login as employer
        self.client.login(username='employer1', password='password123')
        
        # 2. Post a new job (should default to Pending)
        post_url = reverse('post_job')
        job_data = {
            'title': 'Python Developer Intern',
            'company_name': 'DjangoTech Inc.',
            'location': 'Remote',
            'salary': '4500.00',
            'description': 'A fantastic role for a Python enthusiast.',
            'skills_required': 'Python, Django, SQL',
            'application_deadline': (datetime.date.today() + datetime.timedelta(days=30)).strftime('%Y-%m-%d'),
            'contact_email': 'jobs@djangotech.com'
        }
        response = self.client.post(post_url, data=job_data)
        self.assertEqual(response.status_code, 302) # Redirects to my_jobs
        
        job = Job.objects.get(title='Python Developer Intern')
        self.assertEqual(job.status, 'Pending')
        self.assertEqual(job.posted_by, self.employer)

        # 3. Edit own pending job
        edit_url = reverse('edit_job', args=[job.id])
        job_data['title'] = 'Advanced Python Developer Intern'
        response = self.client.post(edit_url, data=job_data)
        self.assertEqual(response.status_code, 302)
        job.refresh_from_db()
        self.assertEqual(job.title, 'Advanced Python Developer Intern')
        self.assertEqual(job.status, 'Pending')

        # 4. Admin logs in and approves job
        self.client.logout()
        self.client.login(username='admin1', password='password123')
        approve_url = reverse('admin_job_action', args=[job.id, 'approve'])
        response = self.client.get(approve_url)
        self.assertEqual(response.status_code, 302)
        job.refresh_from_db()
        self.assertEqual(job.status, 'Approved')

        # 5. Employer tries to edit approved job (should fail/redirect with message)
        self.client.logout()
        self.client.login(username='employer1', password='password123')
        edit_url = reverse('edit_job', args=[job.id])
        response = self.client.post(edit_url, data=job_data)
        # Should redirect back to my_jobs with an error message
        self.assertEqual(response.status_code, 302)
        job.refresh_from_db()
        # Verify it wasn't mutated or remains Approved
        self.assertEqual(job.status, 'Approved')

        # 6. Student logs in, bookmarks the job, and applies
        self.client.logout()
        self.client.login(username='student1', password='password123')
        
        # Save / Bookmark job
        save_url = reverse('save_job', args=[job.id])
        response = self.client.get(save_url)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(SavedJob.objects.filter(user=self.student, job=job).exists())

        # Apply for the job
        # Creating a dummy text file to act as the resume upload
        from django.core.files.uploadedfile import SimpleUploadedFile
        resume_file = SimpleUploadedFile("resume.pdf", b"file_content", content_type="application/pdf")
        
        apply_url = reverse('apply_job', args=[job.id])
        apply_data = {
            'resume': resume_file,
            'cover_letter': 'I am highly qualified for this position and love Django!'
        }
        response = self.client.post(apply_url, data=apply_data)
        self.assertEqual(response.status_code, 302)
        
        # Check Application creation
        app = Application.objects.get(student=self.student, job=job)
        self.assertEqual(app.status, 'Applied')
        self.assertEqual(app.cover_letter, 'I am highly qualified for this position and love Django!')

        # 7. Employer reviews applications and updates status
        self.client.logout()
        self.client.login(username='employer1', password='password123')
        
        status_update_url = reverse('update_application_status', args=[app.id])
        response = self.client.post(status_update_url, data={'status': 'Under Review'})
        self.assertEqual(response.status_code, 302)
        app.refresh_from_db()
        self.assertEqual(app.status, 'Under Review')
