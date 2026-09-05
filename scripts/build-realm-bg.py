"""Rebuild realm assets: purple soft-blur city + true transparent heroes."""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageOps
from rembg import remove

ROOT = Path(__file__).resolve().parents[1]
REALM = ROOT / "public" / "realm"


def purple_blur_background(src: Path, dst: Path) -> None:
    img = Image.open(src).convert("RGB")
    img.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
    # Mild blur — city stays readable
    img = img.filter(ImageFilter.GaussianBlur(radius=3.5))
    base = img.convert("RGBA")
    cool = Image.new("RGBA", base.size, (60, 20, 100, 45))
    base = Image.alpha_composite(base, cool)
    vignette = Image.new("L", base.size, 0)
    vdraw = ImageDraw.Draw(vignette)
    w, h = base.size
    vdraw.ellipse([-w * 0.15, -h * 0.2, w * 1.15, h * 1.2], fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(radius=140))
    dark = Image.new("RGBA", base.size, (10, 4, 20, 110))
    mask = ImageOps.invert(vignette)
    base = Image.composite(dark, base, mask)
    spark = ImageDraw.Draw(base)
    for sx, sy in [
        (0.15, 0.18),
        (0.4, 0.12),
        (0.7, 0.2),
        (0.88, 0.15),
        (0.25, 0.55),
        (0.6, 0.48),
        (0.82, 0.7),
    ]:
        x, y = int(sx * w), int(sy * h)
        spark.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(230, 200, 255, 160))
    out = ImageEnhance.Color(base.convert("RGB")).enhance(1.08)
    out = ImageEnhance.Contrast(out).enhance(1.05)
    out = ImageEnhance.Brightness(out).enhance(0.95)
    out.save(dst, "JPEG", quality=90, optimize=True)
    print(f"wrote {dst}")


def force_transparent_bg(img: Image.Image, threshold: int = 28) -> Image.Image:
    """Ensure near-black leftover background becomes alpha."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a < 8:
                continue
            if r <= threshold and g <= threshold and b <= threshold:
                pixels[x, y] = (0, 0, 0, 0)
            elif r < 45 and g < 45 and b < 55 and a < 220:
                # soften residual fringe
                pixels[x, y] = (r, g, b, max(0, a - 80))
    return img


def cutout_character(src: Path, dst: Path, max_h: int = 920) -> None:
    raw = Image.open(src).convert("RGBA")
    cut = remove(raw)
    cut = force_transparent_bg(cut)
    bbox = cut.getbbox()
    if bbox:
        # Crop watermark area slightly if at bottom-right dense text
        cut = cut.crop(bbox)
    if cut.height > max_h:
        ratio = max_h / cut.height
        cut = cut.resize(
            (max(1, int(cut.width * ratio)), max_h),
            Image.Resampling.LANCZOS,
        )
    # Soft purple outer glow plate (behind character)
    alpha = cut.split()[-1]
    glow_mask = alpha.filter(ImageFilter.GaussianBlur(radius=10))
    glow = Image.new("RGBA", cut.size, (150, 80, 230, 0))
    glow.putalpha(glow_mask.point(lambda v: min(160, int(v * 0.55)) if v > 5 else 0))
    canvas = Image.new("RGBA", cut.size, (0, 0, 0, 0))
    canvas = Image.alpha_composite(canvas, glow)
    canvas = Image.alpha_composite(canvas, cut)
    # Crispness
    rgb = canvas.convert("RGB")
    rgb = ImageEnhance.Contrast(rgb).enhance(1.14)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.2)
    out = rgb.convert("RGBA")
    out.putalpha(canvas.split()[-1])
    out = force_transparent_bg(out, threshold=22)
    out.save(dst, "PNG", optimize=True)
    print(f"wrote {dst} size={out.size} mode={out.mode}")


def main() -> None:
    # City: mild blur + light purple wash (keeps scene readable)
    purple_blur_background(REALM / "bg-city.jpg", REALM / "bg-city-purple.jpg")
    # Heroes: use originals as-is (no rembg) — backgrounds already suitable
    for name in ("bear", "lion", "wolf"):
        src = REALM / f"char-{name}.jpg"
        dst = REALM / f"hero-{name}.jpg"
        if src.exists():
            dst.write_bytes(src.read_bytes())
            print(f"copied {src.name} -> {dst.name}")


if __name__ == "__main__":
    main()
