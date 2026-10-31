#!/usr/bin/env python3
"""
Compiles all .json + .png dot-matrix font pairs in Signmatrix/fonts/ into src/data/fontsBundle.js.

Usage:
  1. Auto-discover & sync all fonts in fonts/:
       npm run sync:fonts
       (or: python3 scripts/sync_fonts.py)

  2. Import a new .json + .png pair from anywhere and register a custom font ID:
       python3 scripts/sync_fonts.py --add /path/to/MyFont.json --id myfont --folder variable
"""

import argparse
import base64
import json
import os
import shutil
import struct
import zlib

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
FONTS_DIR = os.path.join(PROJECT_DIR, "fonts")
MANIFEST_FILE = os.path.join(FONTS_DIR, "font_manifest.json")
OUT_FILE = os.path.join(PROJECT_DIR, "src", "data", "fontsBundle.js")


def paeth_predictor(a, b, c):
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    elif pb <= pc:
        return b
    else:
        return c


def decode_png_white_mask(path):
    """
    Pure-Python PNG decoder (no Pillow dependency required).
    Returns (width, height, is_white_2d) where is_white_2d[y][x] is True
    iff the pixel is pure opaque white (R=255, G=255, B=255, A=255),
    matching Kotlin's PixelMask.fromImageRegion(img, x, y, w, h).
    """
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Not a valid PNG file: {path}")

    pos = 8
    width = height = bit_depth = color_type = interlace = None
    plte = []
    trns = None
    idat_chunks = []

    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        chunk_type = data[pos + 4:pos + 8]
        chunk_data = data[pos + 8:pos + 8 + length]
        pos += 12 + length

        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, comp, filt, interlace = struct.unpack(">IIBBBBB", chunk_data)
            if interlace != 0:
                raise ValueError(f"Interlaced PNG is not supported: {path}")
        elif chunk_type == b"PLTE":
            for i in range(0, len(chunk_data), 3):
                plte.append((chunk_data[i], chunk_data[i + 1], chunk_data[i + 2]))
        elif chunk_type == b"tRNS":
            trns = chunk_data
        elif chunk_type == b"IDAT":
            idat_chunks.append(chunk_data)
        elif chunk_type == b"IEND":
            break

    raw = zlib.decompress(b"".join(idat_chunks))

    channels_by_type = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}
    if color_type not in channels_by_type:
        raise ValueError(f"Unsupported PNG color_type {color_type} in {path}")
    channels = channels_by_type[color_type]

    bpp_bits = channels * bit_depth
    bpp_bytes = max(1, (bpp_bits + 7) // 8)
    stride = (width * bpp_bits + 7) // 8

    rows_bytes = []
    offset = 0
    prev_row = bytearray(stride)
    for _ in range(height):
        filter_type = raw[offset]
        offset += 1
        cur_row = bytearray(raw[offset:offset + stride])
        offset += stride

        if filter_type == 1:  # Sub
            for i in range(bpp_bytes, stride):
                cur_row[i] = (cur_row[i] + cur_row[i - bpp_bytes]) & 0xFF
        elif filter_type == 2:  # Up
            for i in range(stride):
                cur_row[i] = (cur_row[i] + prev_row[i]) & 0xFF
        elif filter_type == 3:  # Average
            for i in range(stride):
                a = cur_row[i - bpp_bytes] if i >= bpp_bytes else 0
                b = prev_row[i]
                cur_row[i] = (cur_row[i] + ((a + b) >> 1)) & 0xFF
        elif filter_type == 4:  # Paeth
            for i in range(stride):
                a = cur_row[i - bpp_bytes] if i >= bpp_bytes else 0
                b = prev_row[i]
                c = prev_row[i - bpp_bytes] if i >= bpp_bytes else 0
                cur_row[i] = (cur_row[i] + paeth_predictor(a, b, c)) & 0xFF
        elif filter_type != 0:
            raise ValueError(f"Unsupported PNG filter {filter_type} in {path}")

        rows_bytes.append(cur_row)
        prev_row = cur_row

    is_white = [[False] * width for _ in range(height)]
    for y in range(height):
        row = rows_bytes[y]
        for x in range(width):
            if bit_depth == 8:
                if color_type == 6:  # RGBA
                    r, g, b, a = row[x * 4], row[x * 4 + 1], row[x * 4 + 2], row[x * 4 + 3]
                elif color_type == 2:  # RGB
                    r, g, b = row[x * 3], row[x * 3 + 1], row[x * 3 + 2]
                    a = 255
                    if trns and len(trns) >= 6:
                        tr, tg, tb = struct.unpack(">HHH", trns[:6])
                        if r == tr and g == tg and b == tb:
                            a = 0
                elif color_type == 0:  # Grayscale
                    v = row[x]
                    r = g = b = v
                    a = 255
                    if trns and len(trns) >= 2:
                        tv = struct.unpack(">H", trns[:2])[0]
                        if v == tv:
                            a = 0
                elif color_type == 4:  # Grayscale + Alpha
                    v, a = row[x * 2], row[x * 2 + 1]
                    r = g = b = v
                elif color_type == 3:  # Palette
                    idx = row[x]
                    r, g, b = plte[idx]
                    a = trns[idx] if (trns and idx < len(trns)) else 255
            elif bit_depth < 8:
                pixels_per_byte = 8 // bit_depth
                byte_idx = x // pixels_per_byte
                shift = (pixels_per_byte - 1 - (x % pixels_per_byte)) * bit_depth
                mask = (1 << bit_depth) - 1
                val = (row[byte_idx] >> shift) & mask
                if color_type == 3:
                    r, g, b = plte[val]
                    a = trns[val] if (trns and val < len(trns)) else 255
                elif color_type == 0:
                    max_val = (1 << bit_depth) - 1
                    v = (val * 255) // max_val
                    r = g = b = v
                    a = 255
                    if trns and len(trns) >= 2:
                        tv = struct.unpack(">H", trns[:2])[0]
                        if val == tv:
                            a = 0
                else:
                    raise ValueError(f"Unsupported sub-byte color_type {color_type} in {path}")
            else:
                raise ValueError(f"Unsupported bit_depth {bit_depth} in {path}")

            if r == 255 and g == 255 and b == 255 and a == 255:
                is_white[y][x] = True

    return width, height, is_white


def pack_bits_b64url(bits):
    total_bits = len(bits)
    total_bytes = (total_bits + 7) // 8
    buf = bytearray(total_bytes)
    for i, bit in enumerate(bits):
        if bit:
            buf[i >> 3] |= (1 << (7 - (i & 7)))
    return base64.urlsafe_b64encode(bytes(buf)).decode("ascii").rstrip("=")


def import_font_pair(json_file, font_id, folder):
    json_abs = os.path.abspath(json_file)
    if not os.path.exists(json_abs):
        raise FileNotFoundError(f"JSON file not found: {json_abs}")

    with open(json_abs, "r", encoding="utf-8") as f:
        meta = json.load(f)

    base_stem = os.path.splitext(os.path.basename(json_abs))[0]
    img_name = meta.get("img") or f"{base_stem}.png"
    png_abs = os.path.join(os.path.dirname(json_abs), img_name)
    if not os.path.exists(png_abs):
        alt_png = os.path.splitext(json_abs)[0] + ".png"
        if os.path.exists(alt_png):
            png_abs = alt_png
        else:
            raise FileNotFoundError(f"Matching PNG file not found: {png_abs}")

    target_dir = os.path.join(FONTS_DIR, folder)
    os.makedirs(target_dir, exist_ok=True)

    dest_json = os.path.join(target_dir, f"{base_stem}.json")
    dest_png = os.path.join(target_dir, f"{base_stem}.png")

    if os.path.abspath(json_abs) != os.path.abspath(dest_json):
        shutil.copy2(json_abs, dest_json)
    if os.path.abspath(png_abs) != os.path.abspath(dest_png):
        shutil.copy2(png_abs, dest_png)

    rel_stem = f"{folder}/{base_stem}" if folder else base_stem
    resolved_id = (font_id or base_stem).lower()

    with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    manifest["fonts"][resolved_id] = rel_stem
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")

    print(f"Added font '{resolved_id}' -> fonts/{rel_stem}.json + .png")


def build_fonts():
    with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    fonts_map = manifest.get("fonts", {})
    ignore_set = set(p.lower() for p in manifest.get("ignore", []))
    mapped_stems = set(v.lower() for v in fonts_map.values())

    # Auto-discover any new .json + .png pairs in fonts/
    newly_discovered = []
    for root, _, files in os.walk(FONTS_DIR):
        for file in sorted(files):
            if not file.endswith(".json") or file == "font_manifest.json":
                continue
            stem_abs = os.path.join(root, file[:-5])
            if not os.path.exists(stem_abs + ".png"):
                continue
            rel_stem = os.path.relpath(stem_abs, FONTS_DIR).replace("\\", "/")
            if rel_stem.lower() in mapped_stems or rel_stem.lower() in ignore_set:
                continue

            auto_id = os.path.basename(stem_abs).lower()
            if auto_id not in fonts_map:
                fonts_map[auto_id] = rel_stem
                mapped_stems.add(rel_stem.lower())
                newly_discovered.append((auto_id, rel_stem))

    if newly_discovered:
        manifest["fonts"] = fonts_map
        with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)
            f.write("\n")
        for fid, rel in newly_discovered:
            print(f"Auto-discovered new font '{fid}' -> fonts/{rel}(.json/.png)")

    fonts_out = {}
    total_glyphs = 0

    for key, rel_stem in fonts_map.items():
        json_path = os.path.join(FONTS_DIR, rel_stem + ".json")
        png_path = os.path.join(FONTS_DIR, rel_stem + ".png")

        if not os.path.exists(json_path) or not os.path.exists(png_path):
            raise FileNotFoundError(f"Missing .json or .png for font '{key}': {json_path}")

        with open(json_path, "r", encoding="utf-8") as f:
            j = json.load(f)

        img_w, img_h, is_white = decode_png_white_mask(png_path)
        height = int(j["height"])
        advance = int(j["advance"])

        glyph_map = {}
        for g in j["glyphs"]:
            ch = g["char"][0]
            gx = int(g["x"])
            gy = int(g.get("y", 0))
            gw = int(g["w"])
            gh = int(g.get("h", height))
            gadv = int(g.get("advance", advance))

            if gx < 0 or (gx + gw) > img_w or gy < 0 or (gy + gh) > img_h:
                raise ValueError(
                    f"Glyph {ch!r} out of bounds in font '{key}' ({rel_stem}): "
                    f"({gx}, {gy}, {gw}, {gh}) exceeds image {img_w}x{img_h}"
                )

            bits = []
            for py in range(gy, gy + gh):
                for px in range(gx, gx + gw):
                    bits.append(is_white[py][px])

            b64 = pack_bits_b64url(bits)
            glyph_map[ch] = [gw, gh, gadv, b64]

        total_glyphs += len(glyph_map)
        fonts_out[key.lower()] = {
            "h": height,
            "a": advance,
            "g": glyph_map
        }

    js_content = (
        "// Auto-generated 1-bit DotMtxFont bundle from fonts/ (.json + .png pairs).\n"
        "// Run `npm run sync:fonts` to regenerate after adding or editing fonts.\n"
        "// Format per font: { h: height, a: defaultAdvance, g: { [char]: [width, height, advance, base64UrlBits] } }\n"
        f"export const FONTS_BUNDLE = {json.dumps(fonts_out, ensure_ascii=False, separators=(',', ':'))};\n"
    )

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)

    raw_size = len(js_content.encode("utf-8"))
    gz_size = len(zlib.compress(js_content.encode("utf-8"), level=9))
    print(f"Synced {len(fonts_out)} fonts ({total_glyphs} glyphs) -> src/data/fontsBundle.js")
    print(f"Bundle size: {raw_size / 1024:.1f} KB raw, {gz_size / 1024:.1f} KB gzipped.")


def main():
    parser = argparse.ArgumentParser(description="Compile .json + .png dot-matrix fonts into src/data/fontsBundle.js")
    parser.add_argument("--add", metavar="JSON_PATH", help="Path to a .json font file (with matching .png) to import")
    parser.add_argument("--id", metavar="FONT_ID", help="Font ID to register in Signmatrix (defaults to lowercase filename)")
    parser.add_argument("--folder", default="variable", help="Subfolder inside fonts/ when using --add (default: variable)")
    args = parser.parse_args()

    if args.add:
        import_font_pair(args.add, args.id, args.folder)

    build_fonts()


if __name__ == "__main__":
    main()
