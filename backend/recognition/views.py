import io
import time
import numpy as np
import cv2
from datetime import date, datetime, timedelta
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import AdminSetting, Camera, RecognizedPlate, UserProfile
from .inference import detect_plate, read_plate


def serialize_record(record):
    return {
        'id': record.id,
        'plate_text': record.plate_text,
        'confidence': record.confidence,
        'created_at': record.created_at,
        'exit_time': record.exit_time,
        'duration_minutes': record.duration_minutes,
        'image_url': record.image.url if record.image else None,
        'box': {
            'x': record.box_x,
            'y': record.box_y,
            'w': record.box_w,
            'h': record.box_h,
        } if record.box_x is not None else None,
        'gate': record.gate,
        'direction': record.direction,
        'entry_method': record.entry_method,
        'vehicle_type': record.vehicle_type,
        'wilaya': record.wilaya,
        'annee': record.annee,
        'numero_enregistrement': record.numero_enregistrement,
        'entered_by': record.entered_by.username if record.entered_by else None,
    }


def get_user_profile_object(user):
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'is_admin': user.is_superuser,
            'is_agent': not user.is_superuser,
        }
    )
    return profile


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stats(request):
    today = date.today()
    total = RecognizedPlate.objects.count()
    today_count = RecognizedPlate.objects.filter(created_at__date=today).count()
    last_7_days = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = RecognizedPlate.objects.filter(created_at__date=day).count()
        last_7_days.append({'date': day.strftime('%Y-%m-%d'), 'count': count})

    gate_counts = list(
        RecognizedPlate.objects.values('gate')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    vehicle_types = {
        'Tourisme': RecognizedPlate.objects.filter(vehicle_type=1).count(),
        'Camion': RecognizedPlate.objects.filter(vehicle_type=2).count(),
        'Camionnette': RecognizedPlate.objects.filter(vehicle_type=3).count(),
        'Autocar': RecognizedPlate.objects.filter(vehicle_type=4).count(),
        'Autre': RecognizedPlate.objects.filter(vehicle_type__isnull=True).count(),
    }

    return Response({
        'total_vehicles': total,
        'today_count': today_count,
        'last_7_days': last_7_days,
        'gate_counts': gate_counts,
        'vehicle_types': vehicle_types,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_stats(request):
    profile = get_user_profile_object(request.user)
    if not profile.is_admin:
        return Response({'error': 'Non autorisé'}, status=403)

    by_gate = list(
        RecognizedPlate.objects.values('gate')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    by_agent = list(
        RecognizedPlate.objects.exclude(entered_by__isnull=True)
        .values('entered_by__username')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    return Response({
        'by_gate': by_gate,
        'by_agent': by_agent,
        'last_24h': RecognizedPlate.objects.filter(created_at__gte=timezone.now() - timedelta(hours=24)).count(),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request):
    file = request.FILES.get('image')
    if not file:
        return Response({'error': 'Aucune image fournie'}, status=400)

    # DEBUG video upload: log file metadata and decode status
    try:
        print("[upload_image] file.name=", getattr(file, "name", None), "size=", getattr(file, "size", None), "type=", getattr(file, "content_type", None))
    except Exception:
        pass


    img_bytes = file.read()
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img_cv = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img_cv is None:
        return Response({'error': 'Image invalide'}, status=400)

    box = detect_plate(img_cv)
    if box is None:
        return Response({'error': 'Aucune plaque détectée'}, status=400)

    x, y, w, h = box
    plate_crop = img_cv[y:y + h, x:x + w]
    plate_text, confidence = read_plate(plate_crop)
    file_name = default_storage.save(f'uploads/{file.name}', ContentFile(img_bytes))
    record = RecognizedPlate.objects.create(
        image=file_name,
        plate_text=plate_text,
        confidence=confidence,
        box_x=int(x),
        box_y=int(y),
        box_w=int(w),
        box_h=int(h),
        gate=request.data.get('gate'),
        direction=request.data.get('direction', 'in'),
        entry_method='auto',
    )

    return Response({
        'id': record.id,
        'plate': record.plate_text,
        'confidence': record.confidence,
        'image_url': default_storage.url(file_name),
        'box': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
        'gate': record.gate,
        'direction': record.direction,
        'entry_method': record.entry_method,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def capture_image(request):
    file = request.FILES.get('image')
    if not file:
        return Response({'error': 'Aucune image fournie'}, status=400)
    return upload_image(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def capture_local_image(request):
    device_index = request.data.get('device_index', 0)
    gate = request.data.get('gate')
    direction = request.data.get('direction', 'in')
    timeout_seconds = int(request.data.get('timeout', 10))

    try:
        device_index = int(device_index)
    except (TypeError, ValueError):
        device_index = 0

    capture = cv2.VideoCapture(device_index)
    if not capture.isOpened():
        return Response({'error': 'Impossible d’ouvrir la caméra locale.'}, status=500)

    start_time = time.time()
    frame = None

    # Stabilisation: on accumule plusieurs detections et on médiane les boîtes
    boxes = []  # (x,y,w,h)
    boxes_max = 25

    # on laisse plus de temps pour des vidéos où la détection arrive plus tard
    timeout_seconds = max(timeout_seconds, 15)

    while time.time() - start_time < timeout_seconds and len(boxes) < boxes_max:

        ret, frame_candidate = capture.read()
        if not ret:
            time.sleep(0.5)
            continue

        box_candidate = detect_plate(frame_candidate)
        if box_candidate is not None:
            boxes.append(box_candidate)
            frame = frame_candidate
        time.sleep(0.2)


    capture.release()

    if frame is None or box is None:
        return Response({'error': 'Aucune plaque détectée par la caméra locale.'}, status=404)

    x, y, w, h = box
    plate_crop = frame[y:y + h, x:x + w]
    plate_text, confidence = read_plate(plate_crop)
    success, buffer = cv2.imencode('.jpg', frame)
    if not success:
        return Response({'error': 'Erreur lors de l’encodage de l’image.'}, status=500)

    file_name = default_storage.save(f'uploads/capture_{int(time.time())}.jpg', ContentFile(buffer.tobytes()))
    record = RecognizedPlate.objects.create(
        image=file_name,
        plate_text=plate_text,
        confidence=confidence,
        box_x=int(x),
        box_y=int(y),
        box_w=int(w),
        box_h=int(h),
        gate=gate,
        direction=direction,
        entry_method='auto',
    )

    return Response({
        'id': record.id,
        'plate': record.plate_text,
        'confidence': record.confidence,
        'image_url': default_storage.url(file_name),
        'box': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
        'gate': record.gate,
        'direction': record.direction,
        'entry_method': record.entry_method,
        'source': 'local_camera',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_history(request):
    profile = get_user_profile_object(request.user)
    records = RecognizedPlate.objects.all()
    if not profile.is_admin:
        cutoff = timezone.now() - timedelta(hours=24)
        records = records.filter(created_at__gte=cutoff)
        if profile.assigned_gate:
            records = records.filter(Q(gate__icontains=profile.assigned_gate) | Q(gate__exact=profile.assigned_gate))

    gate_filter = request.query_params.get('gate')
    if gate_filter:
        records = records.filter(gate__icontains=gate_filter)

    data = [serialize_record(r) for r in records.order_by('-created_at')]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_annotated_image(request, record_id):
    try:
        record = RecognizedPlate.objects.get(id=record_id)
        if not record.image:
            return HttpResponse(status=404)
        img_path = record.image.path
        img = cv2.imread(img_path)
        if img is None:
            return HttpResponse(status=404)
        if record.box_x is not None:
            x, y, w, h = record.box_x, record.box_y, record.box_w, record.box_h
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 3)
        _, buffer = cv2.imencode('.jpg', img)
        return HttpResponse(buffer.tobytes(), content_type='image/jpeg')
    except RecognizedPlate.DoesNotExist:
        return HttpResponse(status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def classify_vehicle(request):
    vehicle_type = 1
    if request.FILES.get('image'):
        vehicle_type = 1
    return Response({'vehicle_type': vehicle_type})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def history_by_gate(request, gate_number):
    profile = get_user_profile_object(request.user)
    if not profile.is_admin:
        return Response({'error': 'Non autorisé'}, status=403)
    records = RecognizedPlate.objects.filter(gate__icontains=str(gate_number)).order_by('-created_at')
    return Response([serialize_record(r) for r in records])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manual_entry(request):
    profile = get_user_profile_object(request.user)
    if not profile.is_agent and not profile.is_admin:
        return Response({'error': 'Non autorisé'}, status=403)

    plate_text = request.data.get('plate')
    gate = request.data.get('gate')
    direction = request.data.get('direction', 'in')
    if not plate_text:
        return Response({'error': 'Plaque requise'}, status=400)

    record = RecognizedPlate.objects.create(
        plate_text=plate_text,
        gate=gate,
        direction=direction,
        entry_method='manual',
        confidence=1.0,
        entered_by=request.user,
    )
    return Response({'message': 'Entrée manuelle enregistrée', 'id': record.id})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def camera_settings(request):
    if request.method == 'GET':
        cameras = Camera.objects.all()
        return Response([
            {
                'id': c.id,
                'name': c.name,
                'url': c.url,
                'gate_number': c.gate_number,
                'is_active': c.is_active,
            }
            for c in cameras
        ])

    profile = get_user_profile_object(request.user)
    if not profile.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    data = request.data
    camera = Camera.objects.create(
        name=data.get('name', 'Caméra sans nom'),
        url=data.get('url', ''),
        gate_number=data.get('gate_number', 1),
        is_active=data.get('is_active', True),
    )
    return Response({'id': camera.id})


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def camera_detail(request, camera_id):
    try:
        camera = Camera.objects.get(id=camera_id)
    except Camera.DoesNotExist:
        return Response({'error': 'Caméra introuvable'}, status=404)

    if request.method == 'GET':
        return Response({
            'id': camera.id,
            'name': camera.name,
            'url': camera.url,
            'gate_number': camera.gate_number,
            'is_active': camera.is_active,
        })

    profile = get_user_profile_object(request.user)
    if not profile.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    if request.method == 'PATCH':
        data = request.data
        camera.name = data.get('name', camera.name)
        camera.url = data.get('url', camera.url)
        camera.gate_number = data.get('gate_number', camera.gate_number)
        camera.is_active = data.get('is_active', camera.is_active)
        camera.save()
        return Response({'message': 'Caméra mise à jour'})

    camera.delete()
    return Response({'message': 'Caméra supprimée'})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_settings(request):
    settings = AdminSetting.get_solo()
    if request.method == 'GET':
        return Response({
            'confidence_threshold': settings.confidence_threshold,
            'history_retention_days': settings.history_retention_days,
            'capture_interval_seconds': settings.capture_interval_seconds,
        })

    profile = get_user_profile_object(request.user)
    if not profile.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    data = request.data
    settings.confidence_threshold = float(data.get('confidence_threshold', settings.confidence_threshold))
    settings.history_retention_days = int(data.get('history_retention_days', settings.history_retention_days))
    settings.capture_interval_seconds = int(data.get('capture_interval_seconds', settings.capture_interval_seconds))
    settings.save()
    return Response({'message': 'Paramètres mis à jour'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    profile = get_user_profile_object(request.user)
    return Response({
        'username': request.user.username,
        'is_admin': profile.is_admin,
        'is_agent': profile.is_agent,
        'assigned_gate': profile.assigned_gate,
        'role': profile.role,
    })
