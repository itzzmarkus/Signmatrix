import os
from PIL import Image

def generate_icons():
    source_path = "public/favicon.png"
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source file {source_path} not found")

    src = Image.open(source_path).convert("RGBA")
    bg_color = (0, 0, 0, 255)

    # 1. pwa-192x192.png
    size_192 = 192
    img_192 = Image.new("RGBA", (size_192, size_192), bg_color)
    content_192 = src.resize((size_192, size_192), Image.Resampling.LANCZOS)
    img_192.paste(content_192, (0, 0), content_192)
    img_192.save("public/pwa-192x192.png", "PNG")
    print("Generated public/pwa-192x192.png")

    # 2. pwa-512x512.png
    size_512 = 512
    img_512 = Image.new("RGBA", (size_512, size_512), bg_color)
    content_512 = src.resize((size_512, size_512), Image.Resampling.LANCZOS)
    img_512.paste(content_512, (0, 0), content_512)
    img_512.save("public/pwa-512x512.png", "PNG")
    print("Generated public/pwa-512x512.png")

    # 3. pwa-maskable-512x512.png (80% safe-zone to avoid clipping in circular adaptive icons)
    maskable_size = 512
    img_maskable = Image.new("RGBA", (maskable_size, maskable_size), bg_color)
    safe_inner = int(maskable_size * 0.8) # 409px
    content_maskable = src.resize((safe_inner, safe_inner), Image.Resampling.LANCZOS)
    offset = (maskable_size - safe_inner) // 2
    img_maskable.paste(content_maskable, (offset, offset), content_maskable)
    img_maskable.save("public/pwa-maskable-512x512.png", "PNG")
    print("Generated public/pwa-maskable-512x512.png")

    # 4. apple-touch-icon.png (180x180)
    size_180 = 180
    img_180 = Image.new("RGBA", (size_180, size_180), bg_color)
    content_180 = src.resize((size_180, size_180), Image.Resampling.LANCZOS)
    img_180.paste(content_180, (0, 0), content_180)
    img_180.save("public/apple-touch-icon.png", "PNG")
    print("Generated public/apple-touch-icon.png")

if __name__ == "__main__":
    generate_icons()
