import json
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from accounts.models import User

from .auth_basic import basic_auth_required, get_basic_user, superuser_required
from .compile_latex import compile_to_pdf
from .templates_registry import list_templates, resolve_template_project_dir

PROJECTS_BASE = Path(settings.BASE_DIR) / 'projects'


def _load_request_json(request):
    """Decodifica il body come UTF-8 tollerante (nessun crash su byte sporci), poi json.loads."""
    raw = request.body or b'{}'
    text = raw.decode('utf-8', errors='replace')
    return json.loads(text)


@csrf_exempt
@require_http_methods(['GET'])
def health(request):
    from django.utils import timezone

    return JsonResponse(
        {'status': 'ok', 'timestamp': timezone.now().isoformat()},
    )


@csrf_exempt
@require_http_methods(['POST'])
def register(request):
    try:
        body = _load_request_json(request)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON non valido'}, status=400)

    username = body.get('username')
    password = body.get('password')
    if not username or not isinstance(username, str) or not password or not isinstance(password, str):
        return JsonResponse({'error': 'username e password sono obbligatori'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Username già in uso'}, status=409)

    User.objects.create_user(
        username=username,
        password=password,
        role=User.Role.USER,
        status=User.Status.PENDING,
    )
    return JsonResponse(
        {
            'message': 'Richiesta inviata. L’account sarà attivo dopo l’approvazione dell’amministratore.',
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(['POST'])
def auth_check(request):
    user, error_response = get_basic_user(request)
    if error_response is not None:
        return error_response
    return JsonResponse(
        {
            'ok': True,
            'username': user.username,
            'role': user.role,
        },
    )


@csrf_exempt
@require_http_methods(['GET'])
def template_list(request):
    templates = list_templates(PROJECTS_BASE)
    return JsonResponse({'templates': templates})


@csrf_exempt
@require_http_methods(['POST'])
@basic_auth_required
def compile_template_by_slug(request, slug):
    try:
        body = _load_request_json(request)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON non valido'}, status=400)

    params = body.get('params') or {}
    if not isinstance(params, dict):
        params = {}

    project_dir, err_msg = resolve_template_project_dir(PROJECTS_BASE, slug)
    if project_dir is None:
        return JsonResponse({'error': err_msg or 'template non trovato'}, status=404)

    try:
        pdf_path = compile_to_pdf(project_dir, params)
    except FileNotFoundError as e:
        return JsonResponse({'error': str(e)}, status=500)
    except RuntimeError as e:
        return JsonResponse({'error': str(e)}, status=500)
    except Exception as e:
        return JsonResponse({'error': str(e) or 'Compilazione fallita'}, status=500)

    if not pdf_path.is_file():
        return JsonResponse({'error': 'PDF non generato'}, status=500)

    return FileResponse(
        pdf_path.open('rb'),
        content_type='application/pdf',
        as_attachment=True,
        filename='main.pdf',
    )


@csrf_exempt
@require_http_methods(['GET'])
@basic_auth_required
@superuser_required
def admin_pending_users(request):
    users = User.objects.filter(status=User.Status.PENDING).order_by('created_at')
    return JsonResponse(
        {
            'users': [
                {
                    'id': u.id,
                    'username': u.username,
                    'createdAt': u.created_at.isoformat(),
                }
                for u in users
            ],
        },
    )


@csrf_exempt
@require_http_methods(['GET'])
@basic_auth_required
@superuser_required
def admin_users(request):
    users = User.objects.exclude(status=User.Status.PENDING).order_by('created_at')
    return JsonResponse(
        {
            'users': [
                {
                    'id': u.id,
                    'username': u.username,
                    'role': u.role,
                    'status': u.status,
                    'createdAt': u.created_at.isoformat(),
                }
                for u in users
            ],
        },
    )


@csrf_exempt
@require_http_methods(['POST'])
@basic_auth_required
@superuser_required
def admin_approve_user(request, id):
    uid = int(id)
    updated = User.objects.filter(id=uid).update(status=User.Status.APPROVED)
    if not updated:
        return JsonResponse({'error': 'Utente non trovato'}, status=404)
    return JsonResponse({'message': 'Utente approvato'})


@csrf_exempt
@require_http_methods(['POST'])
@basic_auth_required
@superuser_required
def admin_reject_user(request, id):
    uid = int(id)
    updated = User.objects.filter(id=uid).update(status=User.Status.REJECTED)
    if not updated:
        return JsonResponse({'error': 'Utente non trovato'}, status=404)
    return JsonResponse({'message': 'Richiesta rifiutata'})


@csrf_exempt
@require_http_methods(['DELETE'])
@basic_auth_required
@superuser_required
def admin_delete_user(request, id):
    uid = int(id)
    try:
        user = User.objects.get(id=uid)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utente non trovato'}, status=404)
    if user.role == User.Role.SUPERUSER:
        return JsonResponse({'error': 'Non è possibile eliminare un superutente'}, status=400)
    user.delete()
    return JsonResponse({'message': 'Utente eliminato'})
