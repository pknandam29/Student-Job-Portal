from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.contrib.auth.models import User
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm

def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            messages.success(request, f"Account created successfully for {user.username}! You can now login.")
            return redirect('login')
        else:
            messages.error(request, "Registration failed. Please correct the errors below.")
    else:
        form = UserRegisterForm()
    return render(request, 'register.html', {'form': form})

def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f"Welcome back, {username}!")
                return redirect('dashboard')
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid username or password.")
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

def logout_view(request):
    logout(request)
    messages.info(request, "You have successfully logged out.")
    return redirect('home')

@login_required
def edit_profile(request):
    user_is_admin = is_admin(request.user)
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user.profile, is_admin=user_is_admin)
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, "Your profile has been updated!")
            return redirect('dashboard')
        else:
            messages.error(request, "Failed to update profile. Please check the form data.")
    else:
        u_form = UserUpdateForm(instance=request.user)
        p_form = ProfileUpdateForm(instance=request.user.profile, is_admin=user_is_admin)
    
    return render(request, 'profile.html', {
        'u_form': u_form,
        'p_form': p_form
    })

# Admin helper check
def is_admin(user):
    return user.is_authenticated and (user.is_staff or user.is_superuser)

@user_passes_test(is_admin)
def user_management(request):
    users = User.objects.all().select_related('profile').order_by('-date_joined')
    return render(request, 'admin_users.html', {'users': users})

@user_passes_test(is_admin)
def toggle_user_status(request, user_id):
    user = User.objects.get(id=user_id)
    if user.id == request.user.id:
        messages.error(request, "You cannot deactivate or activate your own account.")
    else:
        user.is_active = not user.is_active
        user.save()
        status_str = "activated" if user.is_active else "deactivated"
        messages.success(request, f"User {user.username} has been {status_str}.")
    return redirect('user_management')

@user_passes_test(is_admin)
def delete_user(request, user_id):
    user = User.objects.get(id=user_id)
    if user.id == request.user.id:
        messages.error(request, "You cannot delete your own account.")
    else:
        username = user.username
        user.delete()
        messages.success(request, f"User {username} has been deleted.")
    return redirect('user_management')
