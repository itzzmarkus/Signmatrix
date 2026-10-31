import { FONTS_BUNDLE } from "../data/fontsBundle.js";
import { PixelMask } from "./PixelMask.js";

export class Glyph {
    constructor(character, x, y, w, h, advance) {
        this.character = character;
        this.x = x | 0;
        this.y = y | 0;
        this.w = w | 0;
        this.h = h | 0;
        this.advance = advance | 0;
    }
}

export class DotMtxFont {
    constructor(fontKey, rawEntry) {
        this.key = fontKey;
        this.height = rawEntry.h | 0;
        this.advance = rawEntry.a | 0;
        this.glyphs = new Map();
        this.glyphMasks = new Map();
        this._rawGlyphs = rawEntry.g;

        for (const ch of Object.keys(rawEntry.g)) {
            const tuple = rawEntry.g[ch];
            this.glyphs.set(ch, new Glyph(ch, 0, 0, tuple[0], tuple[1], tuple[2]));
        }
    }

    getGlyphMask(glyph) {
        const ch = glyph.character;
        const code = ch.charCodeAt(0);
        if (code >= 0xe000 && code <= 0xe00f) {
            return PixelMask.CUSTOM_COLUMNS[code - 0xe000];
        }
        let mask = this.glyphMasks.get(ch);
        if (!mask) {
            const tuple = this._rawGlyphs[ch];
            if (!tuple) {
                throw new Error(`Glyph '${ch}' is not in font '${this.key}'`);
            }
            mask = PixelMask.fromPackedBase64Url(tuple[0], tuple[1], tuple[3]) || PixelMask.EMPTY;
            this.glyphMasks.set(ch, mask);
        }
        return mask;
    }
}

const fontCache = new Map();

export function getFont(fontName, defaultFontFallback = "16d") {
    const clean = String(fontName || "").trim();
    const lower = clean.toLowerCase();

    if (fontCache.has(lower)) {
        return fontCache.get(lower);
    }

    if (FONTS_BUNDLE[lower]) {
        const instance = new DotMtxFont(lower, FONTS_BUNDLE[lower]);
        fontCache.set(lower, instance);
        return instance;
    }

    const fallbackLower = String(defaultFontFallback || "16d").toLowerCase();
    if (fontCache.has(fallbackLower)) {
        return fontCache.get(fallbackLower);
    }
    if (FONTS_BUNDLE[fallbackLower]) {
        const instance = new DotMtxFont(fallbackLower, FONTS_BUNDLE[fallbackLower]);
        fontCache.set(fallbackLower, instance);
        return instance;
    }

    const firstKey = Object.keys(FONTS_BUNDLE)[0];
    if (!fontCache.has(firstKey)) {
        fontCache.set(firstKey, new DotMtxFont(firstKey, FONTS_BUNDLE[firstKey]));
    }
    return fontCache.get(firstKey);
}
