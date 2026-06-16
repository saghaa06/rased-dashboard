from django.http import HttpResponse

def placeholder_view(request):
    return HttpResponse("Placeholder", status=200)