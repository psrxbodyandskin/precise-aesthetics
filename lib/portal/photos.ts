// P6 — Photo preprocessing.
//
// Strips ALL metadata (EXIF, IPTC, XMP) by re-encoding the image to a
// fresh JPEG via canvas. HEIC/HEIF files are converted to JPEG first
// via heic2any (lazy-imported so the dependency only ships when a
// practitioner actually picks an HEIC file).
//
// Runs entirely in the browser before upload — patient location/time/
// device metadata never reaches our network.
//
// Output: a fresh File with .jpg extension and image/jpeg MIME, ready
// for FormData append.

const TARGET_QUALITY = 0.92;
const MAX_DIMENSION = 4096; // cap longest edge to keep file size sane

export interface ProcessedPhoto {
  file: File;
  preview: string; // object URL — caller should revokeObjectURL on cleanup
  width: number;
  height: number;
}

export async function processPhotoForUpload(
  input: File,
): Promise<ProcessedPhoto> {
  let workingFile = input;

  // HEIC/HEIF → JPEG via heic2any
  if (isHeic(input)) {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({
      blob: input,
      toType: "image/jpeg",
      quality: TARGET_QUALITY,
    });
    const blob = Array.isArray(converted) ? converted[0]! : converted;
    workingFile = new File([blob], replaceExtension(input.name, "jpg"), {
      type: "image/jpeg",
    });
  }

  // Re-encode through canvas to strip metadata
  const dataUrl = await readAsDataUrl(workingFile);
  const img = await loadImage(dataUrl);
  const { width: targetWidth, height: targetHeight } = scaleToMax(
    img.naturalWidth,
    img.naturalHeight,
    MAX_DIMENSION,
  );

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D canvas context");
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", TARGET_QUALITY),
  );
  if (!blob) {
    throw new Error("Could not encode image");
  }

  const cleanedFile = new File([blob], replaceExtension(workingFile.name, "jpg"), {
    type: "image/jpeg",
  });
  const preview = URL.createObjectURL(blob);
  return {
    file: cleanedFile,
    preview,
    width: targetWidth,
    height: targetHeight,
  };
}

function isHeic(f: File): boolean {
  const t = f.type.toLowerCase();
  if (t === "image/heic" || t === "image/heif") return true;
  const n = f.name.toLowerCase();
  return n.endsWith(".heic") || n.endsWith(".heif");
}

function replaceExtension(filename: string, ext: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return `${filename}.${ext}`;
  return `${filename.slice(0, dot)}.${ext}`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

function scaleToMax(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const ratio = max / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}
