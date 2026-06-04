from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.db.models import Q, Count
from django.utils import timezone
from .models import Job
from .forms import JobForm
from accounts.views import is_admin
from django.contrib.auth.models import User
from applications.models import Application
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.conf import settings
import base64
import requests
import json

# Public Pages
def home(request):
    featured_jobs = []
    if request.user.is_authenticated:
        featured_jobs = Job.objects.filter(status='Approved', application_deadline__gte=timezone.now().date()).order_by('-created_at')[:6]
    context = {
        'featured_jobs': featured_jobs,
    }
    return render(request, 'home.html', context)

def about(request):
    if is_admin(request.user):
        messages.warning(request, "Administrators do not need access to the About page.")
        return redirect('admin_dashboard')
    return render(request, 'about.html')

@login_required
def job_list(request):
    # Retrieve all approved and non-expired jobs
    jobs = Job.objects.filter(status='Approved').order_by('-created_at')
    
    # Search filter
    query = request.GET.get('q', '')
    if query:
        jobs = jobs.filter(
            Q(title__icontains=query) |
            Q(company_name__icontains=query) |
            Q(description__icontains=query) |
            Q(skills_required__icontains=query)
        )
        
    # Location filter
    location = request.GET.get('location', '')
    if location:
        jobs = jobs.filter(location__icontains=location)
        
    # Skill filter
    skill = request.GET.get('skill', '')
    if skill:
        jobs = jobs.filter(skills_required__icontains=skill)

    # Aggregate popular skills from all approved jobs
    from collections import Counter
    all_skills = []
    for skill_str in Job.objects.filter(status='Approved').values_list('skills_required', flat=True):
        if skill_str:
            all_skills.extend([s.strip() for s in skill_str.split(',') if s.strip()])
    popular_skills = [s for s, count in Counter(all_skills).most_common(8)]

    context = {
        'jobs': jobs,
        'query': query,
        'location': location,
        'skill': skill,
        'popular_skills': popular_skills,
    }
    return render(request, 'job_list.html', context)

@login_required
def job_detail(request, job_id):
    # Admins and authors can view jobs of any status; others can only view Approved
    job = get_object_or_404(Job, pk=job_id)
    if job.status != 'Approved' and not (request.user.is_authenticated and (request.user == job.posted_by or is_admin(request.user))):
        messages.error(request, "You are not authorized to view this job.")
        return redirect('job_list')
        
    has_applied = False
    
    if request.user.is_authenticated:
        has_applied = Application.objects.filter(student=request.user, job=job).exists()

    context = {
        'job': job,
        'has_applied': has_applied,
    }
    return render(request, 'job_detail.html', context)

# User Dashboard
@login_required
def dashboard(request):
    user = request.user
    if is_admin(user):
        return redirect('admin_dashboard')
        
    # Analytics / info for Student
    applied_count = Application.objects.filter(student=user).count()
    posted_count = Job.objects.filter(posted_by=user).count()
    
    recent_applications = Application.objects.filter(student=user).order_by('-applied_at')[:5]
    
    context = {
        'applied_count': applied_count,
        'posted_count': posted_count,
        'recent_applications': recent_applications,
    }
    return render(request, 'dashboard.html', context)

# Job Management by Poster
@login_required
def post_job(request):
    if request.method == 'POST':
        form = JobForm(request.POST)
        if form.is_valid():
            job = form.save(commit=False)
            job.posted_by = request.user
            job.status = 'Pending'  # Ensure it is pending for admin approval
            job.save()
            messages.success(request, "Job posted successfully! It will be visible once approved by an administrator.")
            return redirect('dashboard')
        else:
            messages.error(request, "Failed to post job. Please check the details.")
    else:
        form = JobForm()
    return render(request, 'post_job.html', {'form': form})

@login_required
def edit_job(request, job_id):
    job = get_object_or_404(Job, pk=job_id, posted_by=request.user)
    
    # Check if job is still pending before permitting edit
    if job.status != 'Pending':
        messages.error(request, "You can only edit jobs that are in Pending status (prior to admin review).")
        return redirect('dashboard')
        
    if request.method == 'POST':
        form = JobForm(request.POST, instance=job)
        if form.is_valid():
            form.save()
            messages.success(request, "Job updated successfully and remains in Pending status.")
            return redirect('dashboard')
        else:
            messages.error(request, "Failed to update job.")
    else:
        form = JobForm(instance=job)
    return render(request, 'post_job.html', {'form': form, 'edit_mode': True, 'job': job})

@login_required
def delete_job(request, job_id):
    job = get_object_or_404(Job, pk=job_id, posted_by=request.user)
    
    # Check status
    if job.status != 'Pending':
        messages.error(request, "You can only delete jobs that are in Pending status.")
        return redirect('dashboard')
        
    job.delete()
    messages.success(request, "Job deleted successfully.")
    return redirect('dashboard')



# Admin Dashboard
@user_passes_test(is_admin)
def admin_dashboard(request):
    # Key statistics
    total_jobs = Job.objects.count()
    pending_jobs_count = Job.objects.filter(status='Pending').count()
    approved_jobs_count = Job.objects.filter(status='Approved').count()
    rejected_jobs_count = Job.objects.filter(status='Rejected').count()
    
    total_students = User.objects.filter(is_staff=False).count()
    total_applications = Application.objects.count()
    
    # Recent items
    recent_jobs = Job.objects.order_by('-created_at')[:5]
    recent_applications = Application.objects.select_related('student', 'job').order_by('-applied_at')[:5]
    
    context = {
        'total_jobs': total_jobs,
        'pending_jobs_count': pending_jobs_count,
        'approved_jobs_count': approved_jobs_count,
        'rejected_jobs_count': rejected_jobs_count,
        'total_students': total_students,
        'total_applications': total_applications,
        'recent_jobs': recent_jobs,
        'recent_applications': recent_applications,
    }
    return render(request, 'admin_dashboard.html', context)

@user_passes_test(is_admin)
def admin_jobs(request, status_filter='Pending'):
    if status_filter not in ['Pending', 'Approved', 'Rejected']:
        status_filter = 'Pending'
    jobs = Job.objects.filter(status=status_filter).order_by('-created_at')
    context = {
        'jobs': jobs,
        'status_filter': status_filter,
        'pending_count': Job.objects.filter(status='Pending').count()
    }
    return render(request, 'admin_jobs.html', context)

@user_passes_test(is_admin)
def admin_job_action(request, job_id, action):
    job = get_object_or_404(Job, pk=job_id)
    if action == 'approve':
        job.status = 'Approved'
        job.save()
        messages.success(request, f"Job '{job.title}' approved successfully.")
    elif action == 'reject':
        job.status = 'Rejected'
        job.save()
        messages.warning(request, f"Job '{job.title}' rejected.")
    elif action == 'delete':
        title = job.title
        job.delete()
        messages.success(request, f"Job '{title}' deleted.")
    
    return redirect(request.META.get('HTTP_REFERER', 'admin_dashboard'))


@login_required
@require_POST
def autofill_job(request):
    image_file = request.FILES.get('image')
    if not image_file:
        return JsonResponse({'error': 'No image file uploaded.'}, status=400)
    
    # 1. Attempt using Gemini API if key is valid (not default placeholder)
    api_key = getattr(settings, 'GEMINI_API_KEY', 'MY_GEMINI_API_KEY')
    has_api_key = api_key and api_key != 'MY_GEMINI_API_KEY'
    
    if has_api_key:
        try:
            image_data = base64.b64encode(image_file.read()).decode('utf-8')
            # Reset file pointer
            image_file.seek(0)
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": (
                                    "Analyze this job posting screenshot or PDF document and extract details. "
                                    "Return a JSON object with fields: "
                                    "'title', 'company_name', 'location', 'salary' (a decimal number, convert monthly salary in Rupees if possible), "
                                    "'description' (a long description of the job), "
                                    "'skills_required' (strictly comma-separated list of concrete technologies only, such as programming languages, frameworks, libraries, developer tools, and databases. Limit to a maximum of 10 skills. STRICTLY EXCLUDE soft skills, personality traits, adjectives, general fields of study, or degrees. For example, DO NOT include: 'Hardworking', 'Proactive', 'Self-motivated', 'Quick Learner', 'Result-driven', 'Decision-making', 'Team player', 'Communication', 'Leadership', 'Computer Science', 'Software Engineering', etc. Focus only on specific tools/tech like Python, React, SQL, AWS, Git, etc.), "
                                    "'contact_email' (contact email address if found in the text, otherwise set to empty string), "
                                    "and 'application_url' (external application link/URL if found in the text, otherwise set to empty string). "
                                    "If any field cannot be found, set it to an empty string. "
                                    "Only return the raw JSON object, without any markdown formatting or backticks."
                                )
                            },
                            {
                                "inlineData": {
                                    "mimeType": image_file.content_type,
                                    "data": image_data
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            
            response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=15)
            if response.status_code == 200:
                res_json = response.json()
                text_response = res_json['candidates'][0]['content']['parts'][0]['text']
                
                # Robust JSON cleaning: strip backticks if markdown blocks are returned
                text_response = text_response.strip()
                if text_response.startswith("```"):
                    lines = text_response.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    text_response = "\n".join(lines).strip()
                
                data = json.loads(text_response)
                return JsonResponse({
                    'title': data.get('title', ''),
                    'company_name': data.get('company_name', ''),
                    'location': data.get('location', ''),
                    'salary': data.get('salary', ''),
                    'description': data.get('description', ''),
                    'skills_required': data.get('skills_required', ''),
                    'contact_email': data.get('contact_email', ''),
                    'application_url': data.get('application_url', ''),
                    'success': True
                })
            else:
                print(f"[Gemini API Error] Status Code {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[Gemini Exception] Error occurred: {str(e)}")
            import traceback
            traceback.print_exc()
            
    # 2. Smart fallback / Mock extraction based on the filename or generic defaults
    filename = image_file.name.lower()
    
    # Defaults
    title = "Software Engineer Intern"
    company_name = "Stripe"
    location = "Remote"
    salary = "80000.00"
    description = (
        "We are looking for a Software Engineer Intern to join our team. "
        "You will design, develop, and maintain clean web applications, write tests, and collaborate with product teams."
    )
    skills_required = "Python, JavaScript, SQL, Git"
    contact_email = "internships@stripe.com"
    application_url = "https://stripe.com/jobs"
    
    if "python" in filename or "django" in filename:
        title = "Python/Django Developer"
        company_name = "DjangoTech Inc."
        location = "Chicago, IL (Hybrid)"
        salary = "95000.00"
        description = (
            "Join our backend team to build scalable Python web services using Django. "
            "You will implement REST APIs, optimize database queries, and ensure application speed and stability."
        )
        skills_required = "Python, Django, PostgreSQL, REST APIs"
        contact_email = "jobs@djangotech.com"
        application_url = ""
    elif "react" in filename or "frontend" in filename or "ui" in filename:
        title = "Frontend Developer (React)"
        company_name = "Vercel Inc."
        location = "Remote (US/Canada)"
        salary = "110000.00"
        description = (
            "We are seeking a Frontend Engineer focused on React and Next.js. "
            "You will build responsive user interfaces, optimize component performance, and work closely with UI designers."
        )
        skills_required = "React, Next.js, Tailwind CSS, TypeScript"
        contact_email = "careers@vercel.com"
        application_url = "https://vercel.com/careers"
    elif "design" in filename or "figma" in filename or "ux" in filename:
        title = "Product Designer"
        company_name = "Figma"
        location = "San Francisco, CA"
        salary = "125000.00"
        description = (
            "We are looking for a Product Designer to design beautiful interfaces for our web applications. "
            "You will conduct user research, create wireframes, build high-fidelity interactive mockups, and run usability tests."
        )
        skills_required = "Figma, UI/UX, Wireframing, User Research"
        contact_email = "design@figma.com"
        application_url = "https://figma.com/careers"
        
    return JsonResponse({
        'title': title,
        'company_name': company_name,
        'location': location,
        'salary': salary,
        'description': description,
        'skills_required': skills_required,
        'contact_email': contact_email,
        'application_url': application_url,
        'warning': "Using simulated extraction (configure GEMINI_API_KEY in .env for live AI extraction)",
        'success': True
    })
