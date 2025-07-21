from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post
import json
from .forms import ProfileForm


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        fullname = request.POST["fullname"]
        if not fullname:
            return render(request, "network/register.html", {
                "message": "Full name is required."
            })
        first_name, last_name = fullname.split(" ", 1) if " " in fullname else (fullname, "")
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password, first_name=first_name, last_name=last_name)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


@login_required
def new_post(request):
    if request.method == "POST":
        user = request.user
        content = request.POST["new-post-content"]
        if content:
            post = Post(user=user, content=content) 
            post.save()
            return JsonResponse({"success": True}, status=201)
        else:
            return JsonResponse({"error": "Content cannot be empty."}, status=400)
    else:
        return JsonResponse({"error": "Only POST method is allowed."}, status=405)
    

def posts(request, profile_name):
    if request.method == "GET":
        try:
            if profile_name == "all":
                all_posts = Post.objects.all().order_by("-timestamp")
            else:
                all_posts = Post.objects.filter(user__username=profile_name).order_by("-timestamp")
                if not all_posts:
                    return JsonResponse({"error": "No posts found for this user."}, status=404) 

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

        posts_data = []
        for post in all_posts:
            posts_data.append({
                "id": post.id,
                "name": post.user.first_name + " " + post.user.last_name,
                "username": post.user.username,
                "content": post.content,
                "timestamp": post.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "likes_count": post.likes.count(),
                "liked_by_user": post.likes.filter(id=request.user.id).exists() if request.user.is_authenticated else False
            })
        return JsonResponse(posts_data, safe=False)
    else:
        return JsonResponse({"error": "GET request required."}, status=400)
    

def profile(request, username):
    if request.method == 'POST':
        form = ProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            # Redirect or render success
    else:
        try:
            data = User.objects.get(username=username)
            return render(request, 'network/profile.html', {
                'form': ProfileForm(instance=data),
                'user': data
            })
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)

@login_required
def edit_profile(request):
    if request.method == 'PUT':
        data = json.loads(request.body)
        user = request.user
        
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
        
        if 'bio' in data:
            user.bio = data['bio']

        if 'follow' in data:
            if data['follow']:
                user.following.add(User.objects.get(username=data['following']))
            else:
                user.following.remove(User.objects.get(username=data['following']))

            # update followers count for the other user
            data['following'] = User.objects.get(username=data['following'])
            followers_count = data['following'].followers_count + 1 if data['follow'] else data['following'].followers_count - 1
            data['following'].followers_count = followers_count
            data['following'].save()
    
        
        user.save()
    
        return JsonResponse({"message": "Profile updated successfully."}, status=200)
   