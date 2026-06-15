import torch
import cv2
import numpy as np
from ultralytics import YOLO

# ------------------------------------------------------------
# 1. CHARGEMENT DES MODÈLES
# ------------------------------------------------------------
# YOLOv12 via ultralytics (remplace "best.pt" par le nom exact de ton fichier)
yolo_model = YOLO("recognition/models_weights/best.pt")

# Définition de l'architecture FixedCRNN (identique à ton notebook)
class FixedCRNN(torch.nn.Module):
    def __init__(self, vocab_size: int, hidden_size: int = 256):
        super().__init__()
        self.cnn = torch.nn.Sequential(
            torch.nn.Conv2d(1, 64, 3, 1, 1), torch.nn.BatchNorm2d(64), torch.nn.ReLU(),
            torch.nn.Conv2d(64, 64, 3, 1, 1), torch.nn.BatchNorm2d(64), torch.nn.ReLU(),
            torch.nn.MaxPool2d((2, 2)),
            torch.nn.Conv2d(64, 128, 3, 1, 1), torch.nn.BatchNorm2d(128), torch.nn.ReLU(),
            torch.nn.Conv2d(128, 128, 3, 1, 1), torch.nn.BatchNorm2d(128), torch.nn.ReLU(),
            torch.nn.MaxPool2d((2, 2)),
            torch.nn.Conv2d(128, 256, 3, 1, 1), torch.nn.BatchNorm2d(256), torch.nn.ReLU(),
            torch.nn.Conv2d(256, 256, 3, 1, 1), torch.nn.BatchNorm2d(256), torch.nn.ReLU(),
            torch.nn.MaxPool2d((2, 2)),
            torch.nn.Conv2d(256, 512, 3, 1, 1), torch.nn.BatchNorm2d(512), torch.nn.ReLU(),
            torch.nn.Conv2d(512, 512, 3, 1, 1), torch.nn.BatchNorm2d(512), torch.nn.ReLU(),
            torch.nn.MaxPool2d((2, 1)),
            torch.nn.Conv2d(512, 512, 3, 1, 1), torch.nn.BatchNorm2d(512), torch.nn.ReLU(),
            torch.nn.AdaptiveAvgPool2d((1, None)),
        )
        self.rnn_input = torch.nn.Linear(512, hidden_size)
        self.dropout = torch.nn.Dropout(0.2)
        self.rnn = torch.nn.LSTM(hidden_size, hidden_size // 2,
                                 bidirectional=True, batch_first=True,
                                 dropout=0.2, num_layers=2)
        self.fc = torch.nn.Linear(hidden_size, vocab_size)

    def forward(self, x):
        x = self.cnn(x)
        x = x.squeeze(2).permute(0, 2, 1)
        x = self.dropout(self.rnn_input(x))
        x, _ = self.rnn(x)
        x = self.dropout(x)
        return self.fc(x)

# ------------------------------------------------------------
# 2. VOCABULAIRE (36 caractères + blank)
# ------------------------------------------------------------
vocab_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
blank_idx = 0
vocab_size = len(vocab_chars) + 1   # = 37

# ------------------------------------------------------------
# 3. CHARGEMENT DU CRNN
# ------------------------------------------------------------
def load_crnn(weights_path):
    model = FixedCRNN(vocab_size=vocab_size)
    state_dict = torch.load(weights_path, map_location='cpu')
    model.load_state_dict(state_dict)
    model.eval()
    return model

# Remplace "crnn_best(2).pth" par le nom exact de ton fichier .pth
crnn_model = load_crnn("recognition/models_weights/crnn_best(2).pth")

# ------------------------------------------------------------
# 4. DÉTECTION DE LA PLAQUE AVEC YOLOv12
# ------------------------------------------------------------
def detect_plate(image_np):
    """
    image_np : numpy array BGR (OpenCV)
    Retourne (x, y, w, h) de la première plaque détectée,
    ou None si rien trouvé.
    """
    # Conversion BGR -> RGB (YOLO attend RGB)
    img_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
    results = yolo_model.predict(img_rgb, conf=0.25, iou=0.45, verbose=False)
    if len(results) == 0 or results[0].boxes is None:
        return None
    boxes = results[0].boxes.xywh.cpu().numpy()  # [x_center, y_center, width, height]
    confs = results[0].boxes.conf.cpu().numpy()
    if len(confs) == 0:
        return None
    best_idx = np.argmax(confs)
    x_center, y_center, w, h = boxes[best_idx]
    x = int(x_center - w/2)
    y = int(y_center - h/2)
    w = int(w)
    h = int(h)
    return (x, y, w, h)

# ------------------------------------------------------------
# 5. RECONNAISSANCE DE LA PLAQUE (CRNN + CTC)
# ------------------------------------------------------------
def preprocess_for_crnn(plate_crop):
    """
    plate_crop : numpy array BGR
    Retourne un tenseur (1, 1, H, W) normalisé entre 0 et 1.
    La hauteur est fixée à 64 pixels (à adapter si ton modèle attend autre chose).
    """
    gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
    target_h = 64   # hauteur utilisée pendant l'entraînement (vérifie ton notebook)
    h, w = gray.shape
    ratio = target_h / h
    new_w = int(w * ratio)
    resized = cv2.resize(gray, (new_w, target_h), interpolation=cv2.INTER_CUBIC)
    tensor = torch.from_numpy(resized).float() / 255.0
    tensor = tensor.unsqueeze(0).unsqueeze(0)  # (1,1,H,W)
    return tensor

def decode_ctc(output, blank_idx=0):
    """
    output : tenseur (1, T, vocab_size) (logits)
    Retourne la chaîne décodée (greedy decoder) en ignorant le blank.
    """
    probs = torch.softmax(output, dim=2)          # (1, T, vocab_size)
    preds = torch.argmax(probs, dim=2)            # (1, T)
    preds = preds.squeeze(0).tolist()             # liste d'indices
    prev = None
    decoded_indices = []
    for idx in preds:
        if idx != prev and idx != blank_idx:
            decoded_indices.append(idx)
        prev = idx
    # Convertir les indices (1..36) en caractères via vocab_chars (décalage -1)
    decoded_chars = [vocab_chars[i-1] for i in decoded_indices if 1 <= i <= len(vocab_chars)]
    return ''.join(decoded_chars)

def read_plate(plate_crop):
    tensor = preprocess_for_crnn(plate_crop)      # (1,1,64,W')
    with torch.no_grad():
        logits = crnn_model(tensor)               # (1, W', vocab_size)
    text = decode_ctc(logits, blank_idx=blank_idx)
    # Confiance : moyenne des probabilités maximales à chaque pas de temps
    probs = torch.softmax(logits, dim=2)
    max_probs = probs.max(dim=2)[0]               # (1, W')
    confidence = max_probs.mean().item()
    return text, confidence