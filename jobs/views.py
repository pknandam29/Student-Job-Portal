from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.db.models import Q, Count
from django.utils import timezone
from .models import Job, SavedJob
from .forms import JobForm
from accounts.views import is_admin
from django.contrib.auth.models import User
from applications.models import Application

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
    return render(request, 'about.html')

def contact(request):
    if request.method == 'POST':
        messages.success(request, "Thank you for reaching out! We will contact you soon.")
        return redirect('contact')
    return render(request, 'contact.html')

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

    context = {
        'jobs': jobs,
        'query': query,
        'location': location,
        'skill': skill,
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
    is_saved = False
    
    if request.user.is_authenticated:
        has_applied = Application.objects.filter(student=request.user, job=job).exists()
        is_saved = SavedJob.objects.filter(user=request.user, job=job).exists()

    context = {
        'job': job,
        'has_applied': has_applied,
        'is_saved': is_saved,
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
    saved_count = SavedJob.objects.filter(user=user).count()
    posted_count = Job.objects.filter(posted_by=user).count()
    
    recent_applications = Application.objects.filter(student=user).order_by('-applied_at')[:5]
    recent_saves = SavedJob.objects.filter(user=user).order_by('-saved_at')[:5]
    
    context = {
        'applied_count': applied_count,
        'saved_count': saved_count,
        'posted_count': posted_count,
        'recent_applications': recent_applications,
        'recent_saves': recent_saves,
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
            return redirect('my_jobs')
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
        return redirect('my_jobs')
        
    if request.method == 'POST':
        form = JobForm(request.POST, instance=job)
        if form.is_valid():
            form.save()
            messages.success(request, "Job updated successfully and remains in Pending status.")
            return redirect('my_jobs')
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
        return redirect('my_jobs')
        
    job.delete()
    messages.success(request, "Job deleted successfully.")
    return redirect('my_jobs')

@login_required
def my_jobs(request):
    # Jobs posted by the user, annotated with application count
    posted_jobs = Job.objects.filter(posted_by=request.user).annotate(app_count=Count('applications')).order_by('-created_at')
    return render(request, 'my_jobs.html', {'posted_jobs': posted_jobs})

# Saved Jobs
@login_required
def save_job(request, job_id):
    job = get_object_or_404(Job, pk=job_id, status='Approved')
    saved_job, created = SavedJob.objects.get_or_create(user=request.user, job=job)
    if created:
        messages.success(request, f"Saved '{job.title}' to your bookmarks.")
    else:
        # Toggle: unsave
        saved_job.delete()
        messages.success(request, f"Removed '{job.title}' from your bookmarks.")
    return redirect(request.META.get('HTTP_REFERER', 'job_list'))

@login_required
def saved_jobs(request):
    saves = SavedJob.objects.filter(user=request.user).select_related('job').order_by('-saved_at')
    return render(request, 'saved_jobs.html', {'saves': saves})

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
