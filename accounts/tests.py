from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse

class ProfileTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create standard student user
        self.student = User.objects.create_user(username='student1', password='password123', email='student1@example.com')
        # Create admin user
        self.admin = User.objects.create_superuser(username='admin1', password='password123', email='admin1@example.com')

    def test_student_profile_edit_contains_academic_fields(self):
        # Login as student
        self.client.login(username='student1', password='password123')
        
        # Access edit profile page
        url = reverse('edit_profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Verify academic info sections & fields are present
        self.assertContains(response, "Academic & Contact Info")
        self.assertContains(response, "college_name")
        self.assertContains(response, "course")
        self.assertContains(response, "graduation_year")
        
        # Submit update form with academic fields
        data = {
            'first_name': 'Student',
            'last_name': 'One',
            'email': 'student1@example.com',
            'phone': '1234567890',
            'college_name': 'Tech University',
            'course': 'Computer Science',
            'graduation_year': 2026,
        }
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, 302) # Redirect to dashboard
        
        # Verify values are updated in db
        self.student.profile.refresh_from_db()
        self.assertEqual(self.student.profile.college_name, 'Tech University')
        self.assertEqual(self.student.profile.course, 'Computer Science')
        self.assertEqual(self.student.profile.graduation_year, 2026)

    def test_admin_profile_edit_excludes_academic_fields(self):
        # Login as admin
        self.client.login(username='admin1', password='password123')
        
        # Access edit profile page
        url = reverse('edit_profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Verify academic fields are NOT present
        self.assertNotContains(response, "Academic & Contact Info")
        self.assertContains(response, "Contact & Profile Info")
        self.assertNotContains(response, "college_name")
        self.assertNotContains(response, "course")
        self.assertNotContains(response, "graduation_year")
        
        # Verify College display on sidebar is also hidden
        self.assertNotContains(response, "College:")
        
        # Submit update form including academic data - they should be ignored
        data = {
            'first_name': 'Admin',
            'last_name': 'One',
            'email': 'admin1@example.com',
            'phone': '9876543210',
            'college_name': 'Evil College', # should be ignored
            'course': 'Destruction', # should be ignored
            'graduation_year': 2000, # should be ignored
        }
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, 302) # Redirect to dashboard (which redirects to admin_dashboard)
        
        # Verify values in db
        self.admin.profile.refresh_from_db()
        self.assertEqual(self.admin.profile.phone, '9876543210')
        self.assertNotEqual(self.admin.profile.college_name, 'Evil College')
        self.assertIsNone(self.admin.profile.college_name)
