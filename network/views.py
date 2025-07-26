from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post
from django.db.models import F
import json
from .forms import ProfileForm
from django.core.paginator import Paginator


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
            elif profile_name == "following":
                # Ensure user is logged in to see following feed
                if not request.user.is_authenticated:
                    return JsonResponse({"error": "User not authenticated"}, status=403)
                following_users = request.user.following.all()
                all_posts = Post.objects.filter(user__in=following_users).order_by("-timestamp")
            else:
                all_posts = Post.objects.filter(user__username=profile_name).order_by("-timestamp")
            
            # Now we pass request.user to serialize to check for likes correctly
            posts_data = [post.serialize(request.user) for post in all_posts]
            
            return JsonResponse(posts_data, safe=False)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
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
                'profileuser': data
            })
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)

@login_required
def edit_profile(request):
    if request.method == 'PUT':
        data = json.loads(request.body)
        user_to_modify = User.objects.get(username=data['following'])
        
        # Simplified follow/unfollow logic
        if data['follow']:
            request.user.following.add(user_to_modify)
        else:
            request.user.following.remove(user_to_modify)
            
        return JsonResponse({"message": "Profile follow/unfollow updated successfully."}, status=200)
    else:
        return JsonResponse({"error": "PUT request required."}, status=400)
    
# view to handle liking/unliking posts
@login_required
def edit_post(request, post_id):
    if request.method == "PUT":
        try:
            post = Post.objects.get(pk=post_id)
            user = request.user
            
            # Toggle like status
            if user in post.likes.all():
                post.likes.remove(user)
                liked = False
            else:
                post.likes.add(user)
                liked = True

            return JsonResponse({
                "message": "Post updated successfully.",
                "liked": liked,
                "likes_count": post.likes.count()
            }, status=200)

        except Post.DoesNotExist:
            return JsonResponse({"error": "Post not found."}, status=404)
    else:
        return JsonResponse({"error": "PUT request required."}, status=405)