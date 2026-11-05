import { Camera, CameraDirection } from '@capacitor/camera';

/**
 * Opens the phone camera (or the webcam in the browser) and returns the photo
 * as a small JPEG data URL (max 300px, ~20-40 KB).
 *
 * The data URL is stored directly in the user's Firestore document
 * (`photoUrl`), which avoids needing Firebase Storage (paid plan on new projects).
 */
export async function takeProfilePhoto(): Promise<string> {
  const photo = await Camera.takePhoto({
    quality: 80,
    targetWidth: 600,
    targetHeight: 600,
    cameraDirection: CameraDirection.Front,
  });
  // webPath works everywhere; thumbnail (base64) is a fallback.
  const src = photo.webPath ?? (photo.thumbnail ? 'data:image/jpeg;base64,' + photo.thumbnail : '');
  if (!src) throw new Error('No photo returned by the camera.');
  return resizeImage(src, 300);
}

/** Shrinks an image with a canvas so it stays small enough for Firestore (1 MB per document). */
function resizeImage(src: string, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => reject(new Error('Could not read the photo.'));
    img.src = src;
  });
}
