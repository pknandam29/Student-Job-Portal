from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from .models import Application
from .forms import ApplicationForm
from jobs.models import Job
from accounts.views import is_admin

@login_required
def apply_job(request, job_id):
    job = get_object_or_404(Job, pk=job_id, status='Approved')
    
    # Check if student is attempting to apply to their own job
    if job.posted_by == request.user:
        messages.error(request, "You cannot apply to a job you posted yourself.")
        return redirect('job_detail', job_id=job.id)
        
    # Check if job requires external application
    if job.application_url:
        messages.info(request, "Redirecting to external application page.")
        return redirect(job.application_url)
        
    # Check if already applied
    if Application.objects.filter(student=request.user, job=job).exists():
        messages.warning(request, "You have already applied for this job.")
        return redirect('my_applications')
        
    if request.method == 'POST':
        form = ApplicationForm(request.POST, request.FILES)
        if form.is_valid():
            application = form.save(commit=False)
            application.student = request.user
            application.job = job
            application.status = 'Applied'
            application.save()
            messages.success(request, f"Successfully applied for the position of {job.title} at {job.company_name}!")
            return redirect('my_applications')
        else:
            messages.error(request, "Failed to submit application. Please check the fields and try again.")
    else:
        form = ApplicationForm()
        
    return render(request, 'apply_job.html', {'form': form, 'job': job})

@login_required
def my_applications(request):
    applications = Application.objects.filter(student=request.user).select_related('job').order_by('-applied_at')
    return render(request, 'my_applications.html', {'applications': applications})

@login_required
def job_applications(request, job_id):
    job = get_object_or_404(Job, pk=job_id)
    
    # Only admins can view applications
    if not is_admin(request.user):
        messages.error(request, "You are not authorized to view applications for this job.")
        return redirect('dashboard')
        
    apps = Application.objects.filter(job=job).select_related('student__profile').order_by('-applied_at')
    context = {
        'job': job,
        'applications': apps,
        'status_choices': Application.STATUS_CHOICES
    }
    return render(request, 'admin_applications.html', context)

@login_required
def update_application_status(request, app_id):
    application = get_object_or_404(Application, pk=app_id)
    job = application.job
    
    # Only admins can update status
    if not is_admin(request.user):
        messages.error(request, "You are not authorized to perform this action.")
        return redirect('dashboard')
        
    if request.method == 'POST':
        new_status = request.POST.get('status')
        if new_status in dict(Application.STATUS_CHOICES):
            application.status = new_status
            application.save()
            messages.success(request, f"Application status for {application.student.username} updated to '{new_status}'.")
        else:
            messages.error(request, "Invalid status choice.")
            
    return redirect('job_applications', job_id=job.id)
