export function encodeAnimatedGif(frames, width, height, options = {}) {
    if (!frames || frames.length === 0) {
        throw new Error("Cannot encode GIF with zero frames");
    }
    const transparent = Boolean(options.transparent);

    const colorToIndex = new Map();
    const paletteRgb = buildGifPalette(frames, colorToIndex, transparent);

    while (paletteRgb.length < 2) {
        paletteRgb.push(0);
    }

    let colorDepth = 1;
    while (1 << colorDepth < paletteRgb.length && colorDepth < 8) {
        colorDepth++;
    }
    const tableSize = 1 << colorDepth;
    const minCodeSize = Math.max(2, colorDepth);

    const out = new ByteWriter();

    out.writeAscii("GIF89a");

    out.writeUInt16LE(width);
    out.writeUInt16LE(height);
    const gctPacked = 0x80 | (0x07 << 4) | (colorDepth - 1);
    out.writeByte(gctPacked);
    out.writeByte(0);
    out.writeByte(0);

    for (let i = 0; i < tableSize; i++) {
        const rgb = i < paletteRgb.length ? paletteRgb[i] : 0;
        out.writeByte((rgb >>> 16) & 0xff);
        out.writeByte((rgb >>> 8) & 0xff);
        out.writeByte(rgb & 0xff);
    }

    out.writeByte(0x21);
    out.writeByte(0xff);
    out.writeByte(11);
    out.writeAscii("NETSCAPE2.0");
    out.writeByte(3);
    out.writeByte(1);
    out.writeUInt16LE(0);
    out.writeByte(0);

    const findNearestIndex = (rgb) => {
        const cached = colorToIndex.get(rgb);
        if (cached !== undefined) return cached;
        const r = (rgb >>> 16) & 0xff;
        const g = (rgb >>> 8) & 0xff;
        const b = rgb & 0xff;
        const startIdx = transparent ? 1 : 0;
        let bestIdx = startIdx;
        let bestDist = Infinity;
        for (let i = startIdx; i < paletteRgb.length; i++) {
            const prgb = paletteRgb[i];
            const dr = r - ((prgb >>> 16) & 0xff);
            const dg = g - ((prgb >>> 8) & 0xff);
            const db = b - (prgb & 0xff);
            const dist = dr * dr + dg * dg + db * db;
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
            }
        }
        colorToIndex.set(rgb, bestIdx);
        return bestIdx;
    };

    const indexedPixels = new Uint8Array(width * height);

    for (let f = 0; f < frames.length; f++) {
        const frame = frames[f];
        const image = frame.image || frame.getImage();
        const ms = frame.ms;
        const delayHundredths = Math.max(0, Math.round((ms || 0) / 10));

        out.writeByte(0x21);
        out.writeByte(0xf9);
        out.writeByte(4);
        out.writeByte(transparent ? 0x09 : 0x00);
        out.writeUInt16LE(delayHundredths);
        out.writeByte(0);
        out.writeByte(0);

        out.writeByte(0x2c);
        out.writeUInt16LE(0);
        out.writeUInt16LE(0);
        out.writeUInt16LE(width);
        out.writeUInt16LE(height);
        out.writeByte(0x00);

        const srcPixels = image.pixels;
        const len = width * height;
        for (let i = 0; i < len; i++) {
            const px = srcPixels[i];
            const a = (px >>> 24) & 0xff;
            if (transparent && a < 128) {
                indexedPixels[i] = 0;
            } else {
                const rgb = px & 0x00ffffff;
                const idx = colorToIndex.get(rgb);
                indexedPixels[i] = idx !== undefined ? idx : findNearestIndex(rgb);
            }
        }

        lzwEncodeFrame(indexedPixels, minCodeSize, out);
    }

    out.writeByte(0x3b);

    return out.toUint8Array();
}

const MAX_STACK_BITS = 12;
const HSIZE = 5003;

function lzwEncodeFrame(indexedPixels, minCodeSize, out) {
    out.writeByte(minCodeSize);

    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let nextCode = clearCode + 2;
    let codeSize = minCodeSize + 1;
    let maxCode = (1 << codeSize) - 1;

    const htab = new Int32Array(HSIZE).fill(-1);
    const codetab = new Int32Array(HSIZE);

    let bitBuf = 0;
    let bitCount = 0;
    const subBlock = new Uint8Array(255);
    let subBlockLen = 0;

    const flushSubBlock = () => {
        if (subBlockLen > 0) {
            out.writeByte(subBlockLen);
            out.writeBytes(subBlock, subBlockLen);
            subBlockLen = 0;
        }
    };

    const emitCode = (code) => {
        bitBuf |= code << bitCount;
        bitCount += codeSize;
        while (bitCount >= 8) {
            subBlock[subBlockLen++] = bitBuf & 0xff;
            if (subBlockLen === 255) {
                flushSubBlock();
            }
            bitBuf >>>= 8;
            bitCount -= 8;
        }
    };

    emitCode(clearCode);

    const len = indexedPixels.length;
    if (len === 0) {
        emitCode(eoiCode);
        if (bitCount > 0) {
            subBlock[subBlockLen++] = bitBuf & 0xff;
        }
        flushSubBlock();
        out.writeByte(0);
        return;
    }

    let ent = indexedPixels[0];

    for (let i = 1; i < len; i++) {
        const c = indexedPixels[i];
        const fcode = (c << MAX_STACK_BITS) + ent;
        let h = (c << (MAX_STACK_BITS - 8)) ^ ent;

        if (htab[h] === fcode) {
            ent = codetab[h];
            continue;
        }

        let found = false;
        if (htab[h] >= 0) {
            let disp = HSIZE - h;
            if (h === 0) disp = 1;
            while (true) {
                h -= disp;
                if (h < 0) h += HSIZE;
                if (htab[h] === fcode) {
                    ent = codetab[h];
                    found = true;
                    break;
                }
                if (htab[h] < 0) break;
            }
        }

        if (found) continue;

        emitCode(ent);
        ent = c;

        if (nextCode < 1 << MAX_STACK_BITS) {
            codetab[h] = nextCode++;
            htab[h] = fcode;
            if (nextCode > maxCode + 1 && codeSize < MAX_STACK_BITS) {
                codeSize++;
                maxCode = (1 << codeSize) - 1;
            }
        } else {
            emitCode(clearCode);
            htab.fill(-1);
            nextCode = clearCode + 2;
            codeSize = minCodeSize + 1;
            maxCode = (1 << codeSize) - 1;
        }
    }

    emitCode(ent);
    emitCode(eoiCode);

    if (bitCount > 0) {
        subBlock[subBlockLen++] = bitBuf & 0xff;
    }
    flushSubBlock();
    out.writeByte(0);
}

class ByteWriter {
    constructor(initialCapacity = 65536) {
        this.buf = new Uint8Array(initialCapacity);
        this.pos = 0;
    }

    ensure(extra) {
        if (this.pos + extra <= this.buf.length) return;
        let newCap = this.buf.length * 2;
        while (newCap < this.pos + extra) newCap *= 2;
        const next = new Uint8Array(newCap);
        next.set(this.buf);
        this.buf = next;
    }

    writeByte(b) {
        this.ensure(1);
        this.buf[this.pos++] = b & 0xff;
    }

    writeUInt16LE(v) {
        this.ensure(2);
        this.buf[this.pos++] = v & 0xff;
        this.buf[this.pos++] = (v >>> 8) & 0xff;
    }

    writeAscii(str) {
        this.ensure(str.length);
        for (let i = 0; i < str.length; i++) {
            this.buf[this.pos++] = str.charCodeAt(i) & 0xff;
        }
    }

    writeBytes(arr, count) {
        this.ensure(count);
        this.buf.set(arr.subarray(0, count), this.pos);
        this.pos += count;
    }

    toUint8Array() {
        return this.buf.slice(0, this.pos);
    }
}

function buildGifPalette(frames, colorToIndex, transparent = false) {
    const exactPalette = [];
    if (transparent) {
        exactPalette.push(0);
        colorToIndex.set("__transparent__", 0);
    }
    let exceeded256 = false;
    const sampleStep = frames.length > 16 && !frames[0].image ? Math.max(1, Math.floor(frames.length / 12)) : 1;

    for (let f = 0; f < frames.length && !exceeded256; f += sampleStep) {
        const frame = frames[f];
        const img = frame.image || frame.getImage();
        const pixels = img.pixels;
        const len = pixels.length;
        for (let i = 0; i < len; i++) {
            const px = pixels[i];
            const a = (px >>> 24) & 0xff;
            if (transparent && a < 128) continue;
            const rgb = px & 0x00ffffff;
            if (!colorToIndex.has(rgb)) {
                if (exactPalette.length < 256) {
                    colorToIndex.set(rgb, exactPalette.length);
                    exactPalette.push(rgb);
                } else {
                    exceeded256 = true;
                    break;
                }
            }
        }
    }

    if (!exceeded256) {
        return exactPalette;
    }

    colorToIndex.clear();
    const buckets = new Map();
    const frameStep = Math.max(1, Math.floor(frames.length / 12));

    for (let f = 0; f < frames.length; f += frameStep) {
        const frame = frames[f];
        const img = frame.image || frame.getImage();
        const pixels = img.pixels;
        const len = pixels.length;
        for (let i = 0; i < len; i++) {
            const px = pixels[i];
            const a = (px >>> 24) & 0xff;
            if (transparent && a < 128) continue;
            const rgb = px & 0x00ffffff;
            const r = (rgb >>> 16) & 0xff;
            const g = (rgb >>> 8) & 0xff;
            const b = rgb & 0xff;
            const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);

            let bkt = buckets.get(key);
            if (!bkt) {
                bkt = { count: 0, sumR: 0, sumG: 0, sumB: 0, primaryRgb: rgb };
                buckets.set(key, bkt);
            }
            bkt.count++;
            bkt.sumR += r;
            bkt.sumG += g;
            bkt.sumB += b;
        }
    }

    const bucketList = Array.from(buckets.values());
    for (let i = 0; i < bucketList.length; i++) {
        const bkt = bucketList[i];
        if (bkt.count > 1) {
            const avgR = Math.round(bkt.sumR / bkt.count);
            const avgG = Math.round(bkt.sumG / bkt.count);
            const avgB = Math.round(bkt.sumB / bkt.count);
            bkt.repRgb = bkt.count > 500 ? bkt.primaryRgb : (avgR << 16) | (avgG << 8) | avgB;
        } else {
            bkt.repRgb = bkt.primaryRgb;
        }
    }

    bucketList.sort((a, b) => b.count - a.count);

    const palette = [];
    const seen = new Set();
    if (transparent) {
        palette.push(0);
        seen.add("__transparent__");
    }

    const maxEntries = transparent ? 255 : 256;
    if (bucketList.length <= maxEntries) {
        for (let i = 0; i < bucketList.length; i++) {
            const rgb = bucketList[i].repRgb;
            if (!seen.has(rgb)) {
                seen.add(rgb);
                colorToIndex.set(rgb, palette.length);
                palette.push(rgb);
            }
        }
        return palette;
    }

    const lockCount = Math.min(32, bucketList.length);
    for (let i = 0; i < lockCount; i++) {
        const rgb = bucketList[i].repRgb;
        if (!seen.has(rgb)) {
            seen.add(rgb);
            colorToIndex.set(rgb, palette.length);
            palette.push(rgb);
        }
    }

    const remaining = bucketList.slice(lockCount);
    const needed = 256 - palette.length;
    const stride = remaining.length / needed;

    for (let i = 0; i < needed && palette.length < 256; i++) {
        const idx = Math.min(remaining.length - 1, Math.floor(i * stride));
        const rgb = remaining[idx].repRgb;
        if (!seen.has(rgb)) {
            seen.add(rgb);
            colorToIndex.set(rgb, palette.length);
            palette.push(rgb);
        }
    }

    return palette;
}
