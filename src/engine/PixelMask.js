export class PixelMask {
    constructor(width, height, bits) {
        if (width < 0 || height < 0) {
            throw new Error(`Mask dimensions must be non-negative: ${width}x${height}`);
        }
        if (bits.length !== width * height) {
            throw new Error(`Bit array size (${bits.length}) must equal width * height (${width * height})`);
        }
        this.width = width | 0;
        this.height = height | 0;
        this.bits = bits instanceof Uint8Array ? bits : Uint8Array.from(bits, (b) => (b ? 1 : 0));
    }

    isLit(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.bits[y * this.width + x] !== 0;
    }

    static EMPTY = new PixelMask(0, 0, new Uint8Array(0));

    static CUSTOM_COLUMNS = Array.from({ length: 16 }, (_, pattern) => {
        const bits = new Uint8Array(4);
        for (let y = 0; y < 4; y++) {
            bits[y] = (pattern >>> y) & 1;
        }
        return new PixelMask(1, 4, bits);
    });

    static fromRows(rows, widthOverride = null, heightOverride = null) {
        if (!Array.isArray(rows)) return PixelMask.EMPTY;
        const h = heightOverride !== null && heightOverride !== undefined ? heightOverride : rows.length;
        const w =
            widthOverride !== null && widthOverride !== undefined
                ? widthOverride
                : rows.reduce((max, r) => Math.max(max, (r || "").length), 0);
        if (w <= 0 || h <= 0) return PixelMask.EMPTY;

        const bits = new Uint8Array(w * h);
        const maxY = Math.min(h, rows.length);
        for (let y = 0; y < maxY; y++) {
            const row = String(rows[y] || "");
            const maxX = Math.min(w, row.length);
            for (let x = 0; x < maxX; x++) {
                const ch = row[x];
                bits[y * w + x] = ch === "1" || ch === "#" || ch === "X" || ch === "x" ? 1 : 0;
            }
        }
        return new PixelMask(w, h, bits);
    }

    static fromPackedBase64Url(width, height, base64Url) {
        if (width === 0 || height === 0) return PixelMask.EMPTY;
        if (width < 0 || height < 0 || typeof base64Url !== "string") return null;

        const totalBits = width * height;
        const expectedBytes = (totalBits + 7) >>> 3;

        try {
            const clean = base64Url.trim().replace(/-/g, "+").replace(/_/g, "/");
            const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
            const binary = decodeBase64Binary(padded);
            if (binary.length < expectedBytes) return null;

            const bits = new Uint8Array(totalBits);
            for (let bitIndex = 0; bitIndex < totalBits; bitIndex++) {
                const byteIndex = bitIndex >>> 3;
                const bitOffset = 7 - (bitIndex & 7);
                bits[bitIndex] = (binary.charCodeAt(byteIndex) >>> bitOffset) & 1;
            }
            return new PixelMask(width, height, bits);
        } catch {
            return null;
        }
    }
}

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_LOOKUP = new Int16Array(128).fill(-1);
for (let i = 0; i < B64_CHARS.length; i++) {
    B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i;
}

function decodeBase64Binary(paddedBase64) {
    if (typeof atob === "function") {
        return atob(paddedBase64);
    }
    let out = "";
    const len = paddedBase64.length;
    for (let i = 0; i < len; i += 4) {
        const c0 = B64_LOOKUP[paddedBase64.charCodeAt(i)];
        const c1 = B64_LOOKUP[paddedBase64.charCodeAt(i + 1)];
        const c2 = paddedBase64[i + 2] === "=" ? -1 : B64_LOOKUP[paddedBase64.charCodeAt(i + 2)];
        const c3 = paddedBase64[i + 3] === "=" ? -1 : B64_LOOKUP[paddedBase64.charCodeAt(i + 3)];
        if (c0 < 0 || c1 < 0) throw new Error("Invalid base64");
        const triple = (c0 << 18) | (c1 << 12) | ((c2 & 63) << 6) | (c3 & 63);
        out += String.fromCharCode((triple >>> 16) & 0xff);
        if (c2 >= 0) out += String.fromCharCode((triple >>> 8) & 0xff);
        if (c3 >= 0) out += String.fromCharCode(triple & 0xff);
    }
    return out;
}
