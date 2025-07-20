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
            user = User.objects.create_user(username, email, password)
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
    

def posts(request):
    if request.method == "GET":
        posts = Post.objects.all().order_by("-timestamp")
        posts_data = []
        for post in posts:
            posts_data.append({
                "id": post.id,
                "user": post.user.username,
                "content": post.content,
                "timestamp": post.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "likes_count": post.likes.count(),
                "liked_by_user": post.likes.filter(id=request.user.id).exists() if request.user.is_authenticated else False
            })
        return JsonResponse(posts_data, safe=False)
    else:
        return JsonResponse({"error": "GET request required."}, status=400)
    

def profile(request):
    if request.method == 'POST':
        form = ProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            # Redirect or render success
    else:
        form = ProfileForm(instance=request.user)
    return render(request, 'network/profile.html', {'form': form})