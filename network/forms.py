from django import forms
from .models import User

class ProfileForm(forms.ModelForm):
    # Add a custom 'name' field that isn't directly on the model
    name = forms.CharField(max_length=100, required=True, help_text="Your full name.")

    class Meta:
        model = User
        # Reorder this list to put 'profile_picture' first
        fields = ['profile_picture', 'name', 'username', 'bio']
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 3}),
        }


    def __init__(self, *args, **kwargs):
        # Prefill the 'name' field by combining first_name and last_name
        super().__init__(*args, **kwargs)
        if self.instance:
            self.fields['name'].initial = f"{self.instance.first_name} {self.instance.last_name}".strip()
        
        # Apply Bootstrap styling to all fields
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'

    def save(self, commit=True):
        # Override the save method to handle the custom 'name' field
        user = super().save(commit=False)
        
        # Split the 'name' from the form back into first_name and last_name
        name_parts = self.cleaned_data.get('name').split(' ', 1)
        user.first_name = name_parts[0]
        user.last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        if commit:
            user.save()
        return user