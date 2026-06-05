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
            'category': 'IT',
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
            'category': 'IT',
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

        # 4. View job details as student - should see external apply link in Quick Summary
        self.client.logout()
        self.client.login(username='student1', password='password123')
        detail_url = reverse('job_detail', args=[job.id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'https://vitetech.com/apply')

        # 5. Accessing internal apply view directly should redirect to external site
        apply_url = reverse('apply_job', args=[job.id])
        response = self.client.get(apply_url)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, 'https://vitetech.com/apply')

    def test_in_app_notification_system_flow(self):
        from .models import Notification, Job
        
        # Ensure student1 is logged in
        self.client.login(username='student1', password='password123')
        
        # 1. Initially student has 0 notifications
        notifications_count = Notification.objects.filter(user=self.student).count()
        self.assertEqual(notifications_count, 0)

        # 2. Create a pending job
        job = Job.objects.create(
            title="Notification Intern",
            company_name="Notifier Co.",
            location="Remote",
            salary="50000",
            description="Testing alerts",
            skills_required="Python",
            application_deadline=datetime.date.today() + datetime.timedelta(days=30),
            posted_by=self.admin,
            status='Pending'
        )
        
        # Check that 0 notifications are created while job is pending
        self.assertEqual(Notification.objects.filter(user=self.student).count(), 0)

        # 3. Admin approves the job
        job.status = 'Approved'
        job.save()

        # Check that an in-app notification is successfully created for the student
        self.assertEqual(Notification.objects.filter(user=self.student).count(), 1)
        notification = Notification.objects.filter(user=self.student).first()
        self.assertEqual(notification.title, "New Job Posted")
        self.assertIn("Notification Intern", notification.message)
        self.assertFalse(notification.is_read)

        # 4. View notifications list page
        response = self.client.get(reverse('view_notifications'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Notifier Co.")
        self.assertContains(response, "Notification Intern")

        # 5. Mark notification as read
        mark_url = reverse('mark_notification_read', args=[notification.id])
        response = self.client.get(mark_url)
        self.assertEqual(response.status_code, 302)
        
        # Verify status updated
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

        # 6. Mark all as read
        # Let's create another unread notification first
        Notification.objects.create(
            user=self.student,
            title="Alert 2",
            message="Test 2",
            is_read=False
        )
        
        response = self.client.get(reverse('mark_all_notifications_read'))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Notification.objects.filter(user=self.student, is_read=False).count(), 0)

    def test_job_category_filtering_and_autofill(self):
        # 1. Direct database creation
        it_job = Job.objects.create(
            title="Software Developer",
            company_name="TechCorp",
            location="Remote",
            salary="100000",
            description="Coding in Python",
            skills_required="Python",
            application_deadline=datetime.date.today() + datetime.timedelta(days=10),
            posted_by=self.admin,
            status='Approved',
            category='IT'
        )
        non_it_job = Job.objects.create(
            title="HR Manager",
            company_name="PeopleCo",
            location="Chicago, IL",
            salary="80000",
            description="Recruiting talents",
            skills_required="Recruitment",
            application_deadline=datetime.date.today() + datetime.timedelta(days=10),
            posted_by=self.admin,
            status='Approved',
            category='Non-IT'
        )

        # 2. Test filtering on job_list view
        self.client.login(username='student1', password='password123')
        list_url = reverse('job_list')

        # Filter: IT
        response_it = self.client.get(list_url, {'category': 'IT'})
        self.assertEqual(response_it.status_code, 200)
        self.assertContains(response_it, "Software Developer")
        self.assertNotContains(response_it, "HR Manager")

        # Filter: Non-IT
        response_non_it = self.client.get(list_url, {'category': 'Non-IT'})
        self.assertEqual(response_non_it.status_code, 200)
        self.assertContains(response_non_it, "HR Manager")
        self.assertNotContains(response_non_it, "Software Developer")

        # 3. Test simulated autofill extraction
        autofill_url = reverse('autofill_job')
        from django.core.files.uploadedfile import SimpleUploadedFile

        # Case A: design/figma file -> Non-IT
        design_file = SimpleUploadedFile("my_ux_design.png", b"fake_png_content", content_type="image/png")
        response = self.client.post(autofill_url, {'image': design_file})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('category'), 'Non-IT')
        self.assertEqual(data.get('company_name'), 'Figma')

        # Case B: python file -> IT
        python_file = SimpleUploadedFile("python_job.png", b"fake_png_content", content_type="image/png")
        response = self.client.post(autofill_url, {'image': python_file})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('category'), 'IT')
        self.assertEqual(data.get('company_name'), 'DjangoTech Inc.')




