import os
import sys

# Add the project root directory to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "student_job_portal.settings")

application = get_wsgi_application()

app = application
