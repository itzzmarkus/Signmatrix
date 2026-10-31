import { clamp } from "./PixelCanvas.js";

export const FLIPDOT_PIGMENTS = [
    { id: "chartreuse", name: "Chartreuse Green", color: "#C8E600" },
    { id: "yellow", name: "Transit Yellow", color: "#FFD700" },
    { id: "white", name: "Vintage White", color: "#E0E4E4" }
];

const NUM_ROTATION_STEPS = 65;
const stampCache = new Map();

function parseHexToRgb(hexStr, fallback = { r: 200, g: 230, b: 0 }) {
    if (!hexStr) return fallback;
    const clean = String(hexStr).replace("#", "").trim();
    if (clean.length !== 6) return fallback;
    const num = parseInt(clean, 16);
    if (Number.isNaN(num)) return fallback;
    return {
        r: (num >> 16) & 0xff,
        g: (num >> 8) & 0xff,
        b: num & 0xff
    };
}

function packArgb(a, r, g, b) {
    return ((clamp(a, 0, 255) << 24) |
            (clamp(r, 0, 255) << 16) |
            (clamp(g, 0, 255) << 8) |
             clamp(b, 0, 255)) | 0;
}

export function getFlipdotStamp(ledSize, discColorHex, _displayType = "flipdot", angleRad = 0.0, transparent = false) {
    const size = Math.max(3, ledSize | 0);
    const clampedAngle = clamp(angleRad, 0.0, Math.PI);
    const step = Math.round((clampedAngle / Math.PI) * (NUM_ROTATION_STEPS - 1));
    const cacheKey = `${size}:${discColorHex}:${step}:${transparent ? 1 : 0}`;

    if (stampCache.has(cacheKey)) {
        return stampCache.get(cacheKey);
    }

    const stamp = new Int32Array(size * size);
    const radius = size / 2.0;
    const center = radius - 0.5;

    const discRadius = Math.max(1.2, radius - 0.5);
    const discThickness = Math.max(1.0, Math.min(size * 0.12, 1.8));

    const baseRgb = parseHexToRgb(discColorHex, { r: 200, g: 230, b: 0 });

    const stepAngle = (step / (NUM_ROTATION_STEPS - 1)) * Math.PI;
    const cosAngle = Math.cos(stepAngle);
    const absCos = Math.abs(cosAngle);
    const isColorSide = cosAngle >= 0.0;
    const isEdgeOn = absCos < 0.12;

    const faceplateArgb = transparent ? 0 : packArgb(255, 11, 11, 14);
    const cupCavityArgb = packArgb(255, 3, 3, 4);

    for (let py = 0; py < size; py++) {
        const dy = py - center;
        const rowOffset = py * size;

        for (let px = 0; px < size; px++) {
            const dx = px - center;
            const r = Math.sqrt(dx * dx + dy * dy);

            if (r > discRadius + 0.5) {
                stamp[rowOffset + px] = faceplateArgb;
                continue;
            }

            const outerAlpha = r <= discRadius - 0.5 ? 1.0 : clamp(discRadius + 0.5 - r, 0.0, 1.0);

            if (isEdgeOn) {
                if (Math.abs(dy) <= discThickness * 0.65 && Math.abs(dx) <= discRadius) {
                    const edgeVal = dy < 0 ? 52 : 36;
                    const c = packArgb(255, edgeVal, edgeVal, edgeVal + 3);
                    stamp[rowOffset + px] = outerAlpha < 1.0 && !transparent
                        ? packArgb(255, Math.round(edgeVal * outerAlpha + 11 * (1 - outerAlpha)),
                                        Math.round(edgeVal * outerAlpha + 11 * (1 - outerAlpha)),
                                        Math.round((edgeVal + 3) * outerAlpha + 14 * (1 - outerAlpha)))
                        : c;
                } else {
                    stamp[rowOffset + px] = outerAlpha < 1.0 && !transparent
                        ? packArgb(255, Math.round(3 * outerAlpha + 11 * (1 - outerAlpha)),
                                        Math.round(3 * outerAlpha + 11 * (1 - outerAlpha)),
                                        Math.round(4 * outerAlpha + 14 * (1 - outerAlpha)))
                        : cupCavityArgb;
                }
                continue;
            }

            const effectiveCos = Math.max(0.08, absCos);
            const ellR = Math.sqrt((dx * dx) + (dy * dy) / (effectiveCos * effectiveCos));

            if (ellR > discRadius + 0.5) {
                stamp[rowOffset + px] = outerAlpha < 1.0 && !transparent
                    ? packArgb(255, Math.round(3 * outerAlpha + 11 * (1 - outerAlpha)),
                                    Math.round(3 * outerAlpha + 11 * (1 - outerAlpha)),
                                    Math.round(4 * outerAlpha + 14 * (1 - outerAlpha)))
                    : cupCavityArgb;
                continue;
            }

            const discEdgeAlpha = ellR <= discRadius - 0.5 ? 1.0 : clamp(discRadius + 0.5 - ellR, 0.0, 1.0);

            let r_px, g_px, b_px;

            if (isColorSide) {
                const normDy = dy / discRadius;
                const vertFactor = 1.0 - normDy * 0.04;

                r_px = clamp(Math.round(baseRgb.r * vertFactor), 0, 255);
                g_px = clamp(Math.round(baseRgb.g * vertFactor), 0, 255);
                b_px = clamp(Math.round(baseRgb.b * vertFactor), 0, 255);

                if (Math.abs(dy) <= 0.45 && size >= 8) {
                    r_px = Math.round(r_px * 0.94);
                    g_px = Math.round(g_px * 0.94);
                    b_px = Math.round(b_px * 0.94);
                }
            } else {
                const normDy = dy / discRadius;
                const vertFactor = 1.0 - normDy * 0.08;
                const baseV = 28;

                const v = clamp(Math.round(baseV * vertFactor), 20, 36);
                r_px = v;
                g_px = v;
                b_px = v + 2;

                if (Math.abs(dy) <= 0.45 && size >= 8) {
                    r_px = Math.round(r_px * 0.92);
                    g_px = Math.round(g_px * 0.92);
                    b_px = Math.round(b_px * 0.92);
                }
            }

            if (discEdgeAlpha < 1.0) {
                r_px = Math.round(r_px * discEdgeAlpha + 3 * (1.0 - discEdgeAlpha));
                g_px = Math.round(g_px * discEdgeAlpha + 3 * (1.0 - discEdgeAlpha));
                b_px = Math.round(b_px * discEdgeAlpha + 4 * (1.0 - discEdgeAlpha));
            }

            if (outerAlpha < 1.0 && !transparent) {
                r_px = Math.round(r_px * outerAlpha + 11 * (1.0 - outerAlpha));
                g_px = Math.round(g_px * outerAlpha + 11 * (1.0 - outerAlpha));
                b_px = Math.round(b_px * outerAlpha + 14 * (1.0 - outerAlpha));
            }

            stamp[rowOffset + px] = packArgb(255, r_px, g_px, b_px);
        }
    }

    stampCache.set(cacheKey, stamp);
    return stamp;
}
