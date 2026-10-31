export class Color {
    constructor(r, g, b, a = 255) {
        this.r = r & 0xff;
        this.g = g & 0xff;
        this.b = b & 0xff;
        this.a = a & 0xff;
        this.rgb = ((this.a << 24) | (this.r << 16) | (this.g << 8) | this.b) | 0;
    }

    static WHITE = new Color(255, 255, 255, 255);
    static BLACK = new Color(0, 0, 0, 255);
}

export class PixelCanvas {
    constructor(width, height) {
        this.width = Math.max(0, width | 0);
        this.height = Math.max(0, height | 0);
        this.pixels = new Int32Array(this.width * this.height);

        this.clipX = 0;
        this.clipY = 0;
        this.clipMaxX = this.width;
        this.clipMaxY = this.height;
    }

    setClip(x, y, w, h) {
        this.clipX = clamp(x | 0, 0, this.width);
        this.clipY = clamp(y | 0, 0, this.height);
        this.clipMaxX = clamp((x + w) | 0, 0, this.width);
        this.clipMaxY = clamp((y + h) | 0, 0, this.height);
    }

    withClip(x, y, w, h, block) {
        const prevX = this.clipX;
        const prevY = this.clipY;
        const prevMaxX = this.clipMaxX;
        const prevMaxY = this.clipMaxY;
        this.clipX = clamp(Math.max(this.clipX, x | 0), 0, this.width);
        this.clipY = clamp(Math.max(this.clipY, y | 0), 0, this.height);
        this.clipMaxX = clamp(Math.min(this.clipMaxX, (x + w) | 0), 0, this.width);
        this.clipMaxY = clamp(Math.min(this.clipMaxY, (y + h) | 0), 0, this.height);
        try {
            block();
        } finally {
            this.clipX = prevX;
            this.clipY = prevY;
            this.clipMaxX = prevMaxX;
            this.clipMaxY = prevMaxY;
        }
    }

    resetClip() {
        this.clipX = 0;
        this.clipY = 0;
        this.clipMaxX = this.width;
        this.clipMaxY = this.height;
    }

    clear() {
        this.pixels.fill(0);
    }

    getPixel(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
        return this.pixels[y * this.width + x];
    }

    clearRect(x, y, w, h) {
        const startX = Math.max(x | 0, this.clipX);
        const startY = Math.max(y | 0, this.clipY);
        const endX = Math.min((x + w) | 0, this.clipMaxX);
        const endY = Math.min((y + h) | 0, this.clipMaxY);
        if (startX >= endX || startY >= endY) return;
        for (let py = startY; py < endY; py++) {
            const rowOffset = py * this.width;
            for (let px = startX; px < endX; px++) {
                this.pixels[rowOffset + px] = 0;
            }
        }
    }

    fillRect(x, y, w, h, color) {
        const startX = Math.max(x | 0, this.clipX);
        const startY = Math.max(y | 0, this.clipY);
        const endX = Math.min((x + w) | 0, this.clipMaxX);
        const endY = Math.min((y + h) | 0, this.clipMaxY);
        if (startX >= endX || startY >= endY) return;
        const argb = color.rgb | 0;
        for (let py = startY; py < endY; py++) {
            const rowOffset = py * this.width;
            for (let px = startX; px < endX; px++) {
                this.pixels[rowOffset + px] = argb;
            }
        }
    }

    blitMask(mask, destX, destY, color, cutout = false) {
        if (!mask || mask.width <= 0 || mask.height <= 0) return;
        const dx = destX | 0;
        const dy = destY | 0;
        const startX = Math.max(dx, this.clipX);
        const startY = Math.max(dy, this.clipY);
        const endX = Math.min(dx + mask.width, this.clipMaxX);
        const endY = Math.min(dy + mask.height, this.clipMaxY);
        if (startX >= endX || startY >= endY) return;

        const writeValue = cutout ? 0 : ((color.rgb & 0x00ffffff) | (0xff << 24)) | 0;
        const maskBits = mask.bits;
        const maskW = mask.width;
        const canvasW = this.width;
        const pixels = this.pixels;

        for (let py = startY; py < endY; py++) {
            const my = py - dy;
            const maskRowOffset = my * maskW;
            const rowOffset = py * canvasW;
            for (let px = startX; px < endX; px++) {
                const mx = px - dx;
                if (maskBits[maskRowOffset + mx] !== 0) {
                    pixels[rowOffset + px] = writeValue;
                }
            }
        }
    }

    blitCanvas(src, destX, destY, cutout = false) {
        if (!src || src.width <= 0 || src.height <= 0) return;
        const dx = destX | 0;
        const dy = destY | 0;
        const startX = Math.max(dx, this.clipX);
        const startY = Math.max(dy, this.clipY);
        const endX = Math.min(dx + src.width, this.clipMaxX);
        const endY = Math.min(dy + src.height, this.clipMaxY);
        if (startX >= endX || startY >= endY) return;

        const srcPixels = src.pixels;
        const srcW = src.width;
        const dstPixels = this.pixels;
        const dstW = this.width;

        for (let py = startY; py < endY; py++) {
            const sy = py - dy;
            const srcRowOffset = sy * srcW;
            const dstRowOffset = py * dstW;
            for (let px = startX; px < endX; px++) {
                const sx = px - dx;
                const srcPx = srcPixels[srcRowOffset + sx];
                const alpha = (srcPx >>> 24) & 0xff;
                if (alpha !== 0) {
                    dstPixels[dstRowOffset + px] = cutout ? 0 : srcPx;
                }
            }
        }
    }

    getSubCanvas(rx, ry, rw, rh) {
        const sub = new PixelCanvas(rw, rh);
        for (let y = 0; y < rh; y++) {
            const sy = ry + y;
            if (sy < 0 || sy >= this.height) continue;
            const srcRow = sy * this.width;
            const dstRow = y * rw;
            for (let x = 0; x < rw; x++) {
                const sx = rx + x;
                if (sx < 0 || sx >= this.width) continue;
                sub.pixels[dstRow + x] = this.pixels[srcRow + sx];
            }
        }
        return sub;
    }

    toRgbaBytes() {
        const len = this.pixels.length;
        const rgba = new Uint8ClampedArray(len * 4);
        const src = this.pixels;
        for (let i = 0; i < len; i++) {
            const argb = src[i];
            const offset = i << 2;
            rgba[offset] = (argb >>> 16) & 0xff;
            rgba[offset + 1] = (argb >>> 8) & 0xff;
            rgba[offset + 2] = argb & 0xff;
            rgba[offset + 3] = (argb >>> 24) & 0xff;
        }
        return rgba;
    }
}

export function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
}
