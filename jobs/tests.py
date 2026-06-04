from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from jobs.models import Job
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
            'salary': '12-15 LPA',
            'description': 'A fantastic role for a Python enthusiast.',
            'skills_required': 'Python, Django, SQL',
            'application_deadline': (datetime.date.today() + datetime.timedelta(days=30)).strftime('%Y-%m-%d'),
            'contact_email': 'jobs@djangotech.com'
        }
        response = self.client.post(post_url, data=job_data)
        self.assertEqual(response.status_code, 302) # Redirects to dashboard
        
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
        # Should redirect back to dashboard with an error message
        self.assertEqual(response.status_code, 302)
        job.refresh_from_db()
        # Verify it wasn't mutated or remains Approved
        self.assertEqual(job.status, 'Approved')

        # 6. Student logs in, bookmarks the job, and applies
        self.client.logout()
        self.client.login(username='student1', password='password123')
        


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

        # 7. Admin reviews applications and updates status
        self.client.logout()
        self.client.login(username='admin1', password='password123')
        
        status_update_url = reverse('update_application_status', args=[app.id])
        response = self.client.post(status_update_url, data={'status': 'Under Review'})
        self.assertEqual(response.status_code, 302)
        app.refresh_from_db()
        self.assertEqual(app.status, 'Under Review')

    def test_about_access(self):
        # 1. Anonymous user can access About
        self.client.logout()
        about_url = reverse('about')
        
        response = self.client.get(about_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "About Us")
        
        # 2. Student user can access About
        self.client.login(username='student1', password='password123')
        response = self.client.get(about_url)
        self.assertEqual(response.status_code, 200)
        
        # 3. Admin user is redirected to admin dashboard
        self.client.logout()
        self.client.login(username='admin1', password='password123')
        
        response = self.client.get(about_url)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith(reverse('admin_dashboard')))

    def test_job_external_application_url(self):
        # 1. Create a job with an application_url
        self.client.login(username='employer1', password='password123')
        post_url = reverse('post_job')
        job_data = {
            'title': 'React Developer Intern',
            'company_name': 'ViteTech Inc.',
            'location': 'New York, NY',
            'salary': '8-10 LPA',
            'description': 'React developer role.',
            'skills_required': 'React, JavaScript',
            'application_deadline': (datetime.date.today() + datetime.timedelta(days=30)).strftime('%Y-%m-%d'),
            'contact_email': 'recruiting@vitetech.com',
            'application_url': 'https://vitetech.com/apply'
        }
        response = self.client.post(post_url, data=job_data)
        self.assertEqual(response.status_code, 302)
        job = Job.objects.get(title='React Developer Intern')
        self.assertEqual(job.application_url, 'https://vitetech.com/apply')

        # 2. Approve the job
        self.client.logout()
        self.client.login(username='admin1', password='password123')
        approve_url = reverse('admin_job_action', args=[job.id, 'approve'])
        self.client.get(approve_url)

        # 3. View job details as admin - should see Application URL in moderation table
        admin_jobs_url = reverse('admin_jobs', args=['Approved'])
        response = self.client.get(admin_jobs_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'https://vitetech.com/apply')

        # 4. View job details as student - should see external apply link and NO internal form URL
        self.client.logout()
        self.client.login(username='student1', password='password123')
        detail_url = reverse('job_detail', args=[job.id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'https://vitetech.com/apply')
        self.assertContains(response, 'Apply on External Site')
        self.assertNotContains(response, reverse('apply_job', args=[job.id]))

        # 5. Accessing internal apply view directly should redirect to external site
        apply_url = reverse('apply_job', args=[job.id])
        response = self.client.get(apply_url)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, 'https://vitetech.com/apply')

    def test_ats_checker_flow(self):
        # 1. Anonymous user is redirected to login page
        self.client.logout()
        ats_url = reverse('ats_checker')
        response = self.client.get(ats_url)
        self.assertEqual(response.status_code, 302)
        
        # 2. Student user can access the ATS Checker page
        self.client.login(username='student1', password='password123')
        response = self.client.get(ats_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "ATS Checker")
        
        # 3. Student can upload a dummy PDF resume to get evaluated
        from django.core.files.uploadedfile import SimpleUploadedFile
        resume_file = SimpleUploadedFile("my_resume.pdf", b"pdf_binary_content", content_type="application/pdf")
        response = self.client.post(ats_url, {'resume': resume_file})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Scan Failed")
        self.assertContains(response, "Gemini API Key is not configured")
        
        # 4. Uploading invalid file format shows validation error on the page
        invalid_format_file = SimpleUploadedFile("my_resume.txt", b"some text content", content_type="text/plain")
        response = self.client.post(ats_url, {'resume': invalid_format_file})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Scan Failed")
        self.assertContains(response, "Invalid file format. Please upload a PDF or Image resume.")
        
        # 5. Uploading file exceeding 5MB shows size limit error on the page
        large_file_content = b"x" * (5 * 1024 * 1024 + 100) # Slightly larger than 5MB
        large_file = SimpleUploadedFile("huge_resume.pdf", large_file_content, content_type="application/pdf")
        response = self.client.post(ats_url, {'resume': large_file})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Scan Failed")
        self.assertContains(response, "File size exceeds the limit of 5MB.")
