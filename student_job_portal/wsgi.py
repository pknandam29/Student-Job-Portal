import os
import sys

# Add the project root directory to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from django.core.wsgi import get_wsgi_application
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "student_job_portal.settings")
    application = get_wsgi_application()
except Exception as e:
    import traceback
    tb_str = traceback.format_exc()
    
    def application(environ, start_response):
        status = '500 Internal Server Error'
        response_headers = [('Content-type', 'text/plain; charset=utf-8')]
        start_response(status, response_headers)
        return [f"Django startup failed!\n\nTraceback:\n{tb_str}".encode('utf-8')]

app = application
