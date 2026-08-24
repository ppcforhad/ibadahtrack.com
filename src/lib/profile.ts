/** Local profile (name + avatar photo) — append-only key it_profile_v1.
 *  Photo is a downscaled base64 JPEG dataURL (<200KB). localStorage only, no server upload. */

export const PROFILE_KEY = "it_profile_v1";
const MAX_DIM = 256;
const MAX_BYTES = 200 * 1024;

export interface Profile {
  name?: string;
  /** JPEG dataURL from the canvas pipeline */
  photo?: string;
  email?: string;
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? { ...(JSON.parse(raw) as Profile) } : {};
  } catch {
    return {};
  }
}

export function saveProfile(p: Profile): void {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* storage full / private mode — ignore silently */
  }
}

/** File → FileReader → canvas downscale to ≤256×256 JPEG dataURL.
 *  Steps quality down until the dataURL fits MAX_BYTES. Resolves "" on failure. */
export function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve("");
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || MAX_DIM) * scale));
        const h = Math.max(1, Math.round((img.height || MAX_DIM) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve("");
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.9;
        let url = canvas.toDataURL("image/jpeg", quality);
        while (url.length > MAX_BYTES && quality > 0.4) {
          quality -= 0.15;
          url = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(url);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
