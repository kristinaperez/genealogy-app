import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";

interface Props {
  imageSrc: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

// Вырезает нужную область из изображения через canvas
async function cropImage(imageSrc: string, croppedArea: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width  = croppedArea.width;
  canvas.height = croppedArea.height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    croppedArea.x, croppedArea.y,
    croppedArea.width, croppedArea.height,
    0, 0,
    croppedArea.width, croppedArea.height
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => blob ? resolve(blob) : reject("Canvas is empty"), "image/jpeg", 0.92)
  );
}

export default function PhotoCropModal({ imageSrc, onSave, onCancel }: Props) {
  const [crop,       setCrop]       = useState({ x: 0, y: 0 });
  const [zoom,       setZoom]       = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving,     setSaving]     = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  async function handleSave() {
    if (!croppedArea) return;
    setSaving(true);
    try {
      const blob = await cropImage(imageSrc, croppedArea);
      onSave(blob);
    } catch (e) {
      alert("Ошибка обрезки фото");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Выберите область фото</h2>

        <div className="crop-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <div className="crop-zoom">
          <span className="crop-zoom-label">Масштаб</span>
          <input
            type="range"
            min={1} max={3} step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="crop-zoom-slider"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Отмена</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Сохранение…" : "Применить"}
          </button>
        </div>
      </div>
    </div>
  );
}







