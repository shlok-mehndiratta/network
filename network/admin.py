from django.contrib import admin

from network.models import User, Post

# Register your models here.
admin.site.site_header = "Network Admin"
admin.site.register(User)
admin.site.register(Post)