// Reduce las fotos en el móvil antes de subirlas: grande (1600 px) y miniatura (520 px).

async function loadBitmap(file: File): Promise<{ img: CanvasImageSource; w: number; h: number }> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as any);
    return { img: bmp, w: bmp.width, h: bmp.height };
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    URL.revokeObjectURL(url);
    return { img, w: img.naturalWidth, h: img.naturalHeight };
  }
}

function toJpeg(src: CanvasImageSource, w: number, h: number, max: number, q: number): Promise<{ blob: Blob; w: number; h: number }> {
  const k = Math.min(1, max / Math.max(w, h));
  const cw = Math.round(w * k), ch = Math.round(h * k);
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, cw, ch);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res({ blob: b, w: cw, h: ch }) : rej(new Error("No se pudo procesar la foto"))), "image/jpeg", q));
}

export async function compress(file: File) {
  const { img, w, h } = await loadBitmap(file);
  const full = await toJpeg(img, w, h, 1600, 0.82);
  const thumb = await toJpeg(img, w, h, 520, 0.78);
  return { full: full.blob, thumb: thumb.blob, w: full.w, h: full.h };
}
