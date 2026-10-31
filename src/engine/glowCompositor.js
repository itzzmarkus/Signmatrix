import { clamp } from "./PixelCanvas.js";

export const LED_GLOW_PRESETS = {
    none: null,
    subtle: {
        innerRadiusFactor: 0.65,
        innerStrength: 0.45,
        outerRadiusFactor: 1.6,
        outerStrength: 0.25,
        coreBoost: 0.16
    },
    medium: {
        innerRadiusFactor: 0.85,
        innerStrength: 0.70,
        outerRadiusFactor: 2.3,
        outerStrength: 0.42,
        coreBoost: 0.28
    },
    bright: {
        innerRadiusFactor: 1.05,
        innerStrength: 0.95,
        outerRadiusFactor: 3.1,
        outerStrength: 0.60,
        coreBoost: 0.40
    }
};

export function computeHotCoreArgb(srcArgb, boost) {
    if (boost <= 0) return srcArgb;
    const r = (srcArgb >>> 16) & 0xff;
    const g = (srcArgb >>> 8) & 0xff;
    const b = srcArgb & 0xff;

    const maxCh = Math.max(r, g, b, 1);
    const targetR = clamp(Math.round(r + (255 - r) * 0.9), 0, 255);
    const targetG = clamp(Math.round(g + (maxCh - g) * 0.75 + (255 - maxCh) * 0.5), 0, 255);
    const targetB = clamp(Math.round(b + (maxCh - b) * 0.45 + (255 - maxCh) * 0.35), 0, 255);

    const outR = clamp(Math.round(r + (targetR - r) * boost), 0, 255);
    const outG = clamp(Math.round(g + (targetG - g) * boost), 0, 255);
    const outB = clamp(Math.round(b + (targetB - b) * boost), 0, 255);

    return (0xff << 24) | (outR << 16) | (outG << 8) | outB;
}

function boxBlurPass(srcR, srcG, srcB, dstR, dstG, dstB, tmpR, tmpG, tmpB, width, height, radius) {
    const r = Math.max(1, radius | 0);
    const diameter = r * 2 + 1;

    for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;

        for (let k = -r; k <= r; k++) {
            const cx = k < 0 ? 0 : k >= width ? width - 1 : k;
            const idx = rowOffset + cx;
            sumR += srcR[idx];
            sumG += srcG[idx];
            sumB += srcB[idx];
        }

        for (let x = 0; x < width; x++) {
            const outIdx = rowOffset + x;
            tmpR[outIdx] = (sumR / diameter) | 0;
            tmpG[outIdx] = (sumG / diameter) | 0;
            tmpB[outIdx] = (sumB / diameter) | 0;

            const leftX = x - r < 0 ? 0 : x - r;
            const rightX = x + r + 1 >= width ? width - 1 : x + r + 1;
            const leftIdx = rowOffset + leftX;
            const rightIdx = rowOffset + rightX;

            sumR += srcR[rightIdx] - srcR[leftIdx];
            sumG += srcG[rightIdx] - srcG[leftIdx];
            sumB += srcB[rightIdx] - srcB[leftIdx];
        }
    }

    for (let x = 0; x < width; x++) {
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;

        for (let k = -r; k <= r; k++) {
            const cy = k < 0 ? 0 : k >= height ? height - 1 : k;
            const idx = cy * width + x;
            sumR += tmpR[idx];
            sumG += tmpG[idx];
            sumB += tmpB[idx];
        }

        for (let y = 0; y < height; y++) {
            const outIdx = y * width + x;
            dstR[outIdx] = (sumR / diameter) | 0;
            dstG[outIdx] = (sumG / diameter) | 0;
            dstB[outIdx] = (sumB / diameter) | 0;

            const topY = y - r < 0 ? 0 : y - r;
            const botY = y + r + 1 >= height ? height - 1 : y + r + 1;
            const topIdx = topY * width + x;
            const botIdx = botY * width + x;

            sumR += tmpR[botIdx] - tmpR[topIdx];
            sumG += tmpG[botIdx] - tmpG[topIdx];
            sumB += tmpB[botIdx] - tmpB[topIdx];
        }
    }
}

function gaussianBlurPlanar(srcR, srcG, srcB, dstR, dstG, dstB, tmpR, tmpG, tmpB, width, height, radius) {
    boxBlurPass(srcR, srcG, srcB, dstR, dstG, dstB, tmpR, tmpG, tmpB, width, height, radius);
    boxBlurPass(dstR, dstG, dstB, dstR, dstG, dstB, tmpR, tmpG, tmpB, width, height, Math.max(1, (radius * 0.75) | 0));
}

let scratchSize = 0;
let litR = null, litG = null, litB = null;
let innerR = null, innerG = null, innerB = null;
let outerR = null, outerG = null, outerB = null;
let tmpR = null, tmpG = null, tmpB = null;

function ensureScratchBuffers(pixelCount) {
    if (scratchSize >= pixelCount) return;
    scratchSize = pixelCount;
    litR = new Uint16Array(pixelCount);
    litG = new Uint16Array(pixelCount);
    litB = new Uint16Array(pixelCount);
    innerR = new Uint16Array(pixelCount);
    innerG = new Uint16Array(pixelCount);
    innerB = new Uint16Array(pixelCount);
    outerR = new Uint16Array(pixelCount);
    outerG = new Uint16Array(pixelCount);
    outerB = new Uint16Array(pixelCount);
    tmpR = new Uint16Array(pixelCount);
    tmpG = new Uint16Array(pixelCount);
    tmpB = new Uint16Array(pixelCount);
}

const coreMaskCache = new Map();

function getCoreMask(ledSize, useCircles) {
    if (ledSize < 3) return null;
    const key = `${ledSize}:${useCircles ? 1 : 0}`;
    if (coreMaskCache.has(key)) return coreMaskCache.get(key);

    const mask = new Uint8Array(ledSize * ledSize);
    if (useCircles && ledSize >= 4) {
        const radius = ledSize / 2.0;
        const center = radius - 0.5;
        const coreR = radius * 0.58;
        const coreRSq = coreR * coreR;
        for (let py = 0; py < ledSize; py++) {
            const dy = py - center;
            for (let px = 0; px < ledSize; px++) {
                const dx = px - center;
                if (dx * dx + dy * dy <= coreRSq) {
                    mask[py * ledSize + px] = 1;
                }
            }
        }
    } else {
        for (let py = 1; py < ledSize - 1; py++) {
            for (let px = 1; px < ledSize - 1; px++) {
                mask[py * ledSize + px] = 1;
            }
        }
    }
    coreMaskCache.set(key, mask);
    return mask;
}

export function applyOpticalLedGlow({
    outPixels,
    outW,
    outH,
    matrixCanvas,
    ledSize,
    ledSpacing,
    ledSpacingY = undefined,
    borderSize,
    useCircles,
    circleMask,
    ledGlow,
    transparent = false
}) {
    const preset = LED_GLOW_PRESETS[ledGlow];
    if (!preset) return;

    const totalPixels = outW * outH;
    ensureScratchBuffers(totalPixels);

    litR.fill(0, 0, totalPixels);
    litG.fill(0, 0, totalPixels);
    litB.fill(0, 0, totalPixels);

    const stepX = ledSize + ledSpacing;
    const stepY = ledSize + (ledSpacingY !== undefined && ledSpacingY !== null ? ledSpacingY : ledSpacing);
    const mtxPixels = matrixCanvas.pixels;
    const mtxW = matrixCanvas.width;
    const w = matrixCanvas.width;
    const h = matrixCanvas.height;
    const coreMask = getCoreMask(ledSize, useCircles);
    const coreBoost = preset.coreBoost;

    let anyLit = false;

    for (let my = 0; my < h; my++) {
        const baseY = borderSize + my * stepY;
        const mtxRow = my * mtxW;
        for (let mx = 0; mx < w; mx++) {
            const srcPx = mtxPixels[mtxRow + mx];
            const alpha = (srcPx >>> 24) & 0xff;
            if (alpha === 0) continue;

            anyLit = true;
            const baseX = borderSize + mx * stepX;
            const r = (srcPx >>> 16) & 0xff;
            const g = (srcPx >>> 8) & 0xff;
            const b = srcPx & 0xff;
            const coreArgb = coreMask ? computeHotCoreArgb(srcPx, coreBoost) : srcPx;

            for (let py = 0; py < ledSize; py++) {
                const rowOffset = (baseY + py) * outW + baseX;
                const maskRow = py * ledSize;
                for (let px = 0; px < ledSize; px++) {
                    if (useCircles && circleMask[maskRow + px] !== 0) continue;
                    const idx = rowOffset + px;
                    litR[idx] = r;
                    litG[idx] = g;
                    litB[idx] = b;

                    if (coreMask && coreMask[maskRow + px] !== 0) {
                        outPixels[idx] = coreArgb;
                    }
                }
            }
        }
    }

    if (!anyLit) return;

    const innerRadius = Math.max(1, Math.round(ledSize * preset.innerRadiusFactor));
    const outerRadius = Math.max(2, Math.round(ledSize * preset.outerRadiusFactor));

    gaussianBlurPlanar(litR, litG, litB, innerR, innerG, innerB, tmpR, tmpG, tmpB, outW, outH, innerRadius);
    gaussianBlurPlanar(litR, litG, litB, outerR, outerG, outerB, tmpR, tmpG, tmpB, outW, outH, outerRadius);

    const innerScale = Math.round(preset.innerStrength * 256);
    const outerScale = Math.round(preset.outerStrength * 256);

    for (let i = 0; i < totalPixels; i++) {
        let glowR = (innerR[i] * innerScale + outerR[i] * outerScale) >> 8;
        let glowG = (innerG[i] * innerScale + outerG[i] * outerScale) >> 8;
        let glowB = (innerB[i] * innerScale + outerB[i] * outerScale) >> 8;

        if ((glowR | glowG | glowB) === 0) continue;

        if (glowR > 255) glowR = 255;
        if (glowG > 255) glowG = 255;
        if (glowB > 255) glowB = 255;

        const basePx = outPixels[i];
        const baseR = (basePx >>> 16) & 0xff;
        const baseG = (basePx >>> 8) & 0xff;
        const baseB = basePx & 0xff;

        const finalR = 255 - (((255 - baseR) * (255 - glowR)) >> 8);
        const finalG = 255 - (((255 - baseG) * (255 - glowG)) >> 8);
        const finalB = 255 - (((255 - baseB) * (255 - glowB)) >> 8);

        if (transparent) {
            const baseA = (basePx >>> 24) & 0xff;
            const glowA = Math.min(255, Math.max(glowR, Math.max(glowG, glowB)));
            const finalA = Math.max(baseA, glowA);
            outPixels[i] = (finalA << 24) | (finalR << 16) | (finalG << 8) | finalB;
        } else {
            outPixels[i] = (0xff << 24) | (finalR << 16) | (finalG << 8) | finalB;
        }
    }
}
