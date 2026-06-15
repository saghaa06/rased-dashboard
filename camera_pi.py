import argparse
import time
import requests
import cv2

DEFAULT_URL = 'http://127.0.0.1:8000/api/capture/'


def send_frame(frame, url, token=None, gate=None, direction='in'):
    _, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
    files = {'image': ('capture.jpg', jpeg.tobytes(), 'image/jpeg')}
    data = {'direction': direction}
    if gate:
        data['gate'] = gate
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    try:
        response = requests.post(url, files=files, data=data, headers=headers, timeout=10)
        response.raise_for_status()
        print('Capture envoyée', response.json())
    except Exception as exc:
        print('Échec envoi capture:', exc)


def run_loop(device, url, interval, token, gate, direction, show):
    cap = cv2.VideoCapture(device)
    if not cap.isOpened():
        raise RuntimeError(f'Impossible d’ouvrir la caméra: {device}')
    print(f'Démarrage capture Pi sur {device} toutes les {interval}s vers {url}')
    while True:
        ret, frame = cap.read()
        if not ret:
            print('Aucune image reçue, nouvelle tentative...')
            time.sleep(interval)
            continue
        if show:
            cv2.imshow('Pi Camera Preview', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        send_frame(frame, url, token=token, gate=gate, direction=direction)
        time.sleep(interval)
    cap.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Capture automatique Raspberry Pi et envoi vers Django')
    parser.add_argument('--device', default=0, help='Périphérique vidéo (ex: /dev/video0 ou 0)')
    parser.add_argument('--url', default=DEFAULT_URL, help='Endpoint backend Django pour /api/capture/')
    parser.add_argument('--token', default=None, help='JWT Bearer token pour l’API')
    parser.add_argument('--gate', default='Portail 1', help='Nom ou numéro du portail associé')
    parser.add_argument('--direction', default='in', choices=['in', 'out'], help='Sens de passage par défaut')
    parser.add_argument('--interval', type=float, default=2.0, help='Intervalle de capture en secondes')
    parser.add_argument('--show', action='store_true', help='Afficher un aperçu local (optionnel)')
    args = parser.parse_args()

    run_loop(args.device, args.url, args.interval, args.token, args.gate, args.direction, args.show)
