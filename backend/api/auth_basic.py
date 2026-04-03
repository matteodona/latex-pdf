import base64
import functools

from django.http import JsonResponse

from accounts.models import User


def _www_authenticate_response(status, data):
    resp = JsonResponse(data, status=status)
    resp['WWW-Authenticate'] = 'Basic realm="latexPdf"'
    return resp


def get_basic_user(request):
    header = request.headers.get('Authorization', '')
    if not header.startswith('Basic '):
        return None, _www_authenticate_response(401, {'error': 'Autenticazione richiesta'})
    try:
        decoded = base64.b64decode(header[6:]).decode('utf-8')
    except (ValueError, UnicodeDecodeError):
        return None, JsonResponse({'error': 'Header Authorization non valido'}, status=400)

    if ':' not in decoded:
        return None, JsonResponse({'error': 'Credenziali non valide'}, status=400)

    username, _, password = decoded.partition(':')
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return None, _www_authenticate_response(401, {'error': 'Credenziali non valide'})

    if not user.check_password(password):
        return None, _www_authenticate_response(401, {'error': 'Credenziali non valide'})

    if user.role != User.Role.SUPERUSER and user.status != User.Status.APPROVED:
        return None, JsonResponse(
            {
                'error': 'Account in attesa di approvazione da parte dell’amministratore.',
            },
            status=403,
        )

    return user, None


def basic_auth_required(view_func):
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user, error_response = get_basic_user(request)
        if error_response is not None:
            return error_response
        request.basic_auth_user = user
        return view_func(request, *args, **kwargs)

    return wrapper


def superuser_required(view_func):
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = getattr(request, 'basic_auth_user', None)
        if user is None:
            return JsonResponse({'error': 'Autenticazione richiesta'}, status=401)
        if user.role != User.Role.SUPERUSER:
            return JsonResponse({'error': 'Accesso riservato al superutente'}, status=403)
        return view_func(request, *args, **kwargs)

    return wrapper
