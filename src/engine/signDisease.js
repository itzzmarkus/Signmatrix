import { PixelCanvas } from "./PixelCanvas.js";

export function hashCoord(seed, x, y) {
    let h = (seed ^ (x * 374761393) ^ (y * 668265263)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296.0;
}

export const DISEASE_PRESETS = {
    none: {
        id: "none",
        label: "None",
        deadPixelRate: 0.0,
        missingRows: 0,
        missingRowHeight: 1,
        ghostRails: 0,
        ghostRailHeight: 1,
        moduleDropout: false,
        stickyGhostOpacity: 0.0
    },
    mild: {
        id: "mild",
        label: "Mild",
        deadPixelRate: 0.006,
        missingRows: 0,
        missingRowHeight: 1,
        ghostRails: 0,
        ghostRailHeight: 1,
        moduleDropout: false,
        stickyGhostOpacity: 0.0
    },
    moderate: {
        id: "moderate",
        label: "Moderate",
        deadPixelRate: 0.022,
        missingRows: 1,
        missingRowHeight: 2,
        ghostRails: 0,
        ghostRailHeight: 1,
        moduleDropout: false,
        stickyGhostOpacity: 0.0
    },
    severe: {
        id: "severe",
        label: "Severe",
        deadPixelRate: 0.048,
        missingRows: 2,
        missingRowHeight: 2,
        ghostRails: 1,
        ghostRailHeight: 2,
        moduleDropout: false,
        stickyGhostOpacity: 0.15
    },
    terminal: {
        id: "terminal",
        label: "Terminal",
        deadPixelRate: 0.085,
        missingRows: 2,
        missingRowHeight: 2,
        ghostRails: 1,
        ghostRailHeight: 2,
        moduleDropout: true,
        stickyGhostOpacity: 0.25
    }
};

export function resolveDiseaseParams(config = {}) {
    const presetId = String(config.preset || config.id || "none").toLowerCase();
    const base = DISEASE_PRESETS[presetId] || DISEASE_PRESETS.none;

    const seed = parseInt(config.seed !== undefined ? config.seed : 1337, 10) || 1337;

    if (presetId === "none") {
        return { ...base, seed, preset: "none" };
    }

    if (presetId !== "custom") {
        return {
            ...base,
            preset: presetId,
            seed
        };
    }

    return {
        preset: "custom",
        id: "custom",
        label: "Custom",
        seed,
        deadPixelRate: Math.max(0, Math.min(0.50, parseFloat(config.deadPixelRate !== undefined ? config.deadPixelRate : 0.03) || 0)),
        missingRows: Math.max(0, parseInt(config.missingRows !== undefined ? config.missingRows : 1, 10) || 0),
        missingRowHeight: Math.max(1, parseInt(config.missingRowHeight !== undefined ? config.missingRowHeight : 1, 10) || 1),
        ghostRails: Math.max(0, parseInt(config.ghostRails !== undefined ? config.ghostRails : 0, 10) || 0),
        ghostRailHeight: Math.max(1, parseInt(config.ghostRailHeight !== undefined ? config.ghostRailHeight : 1, 10) || 1),
        moduleDropout: Boolean(config.moduleDropout),
        stickyGhostOpacity: Math.max(0, Math.min(0.5, parseFloat(config.stickyGhostOpacity !== undefined ? config.stickyGhostOpacity : 0.0) || 0))
    };
}

export function computeDeadRows(seed, height, count, rowHeight = 1) {
    if (count <= 0 || height <= 0) return [];
    const h = Math.max(1, parseInt(rowHeight, 10) || 1);
    const deadSet = new Set();
    const maxBase = Math.max(0, height - h);
    for (let i = 0; i < count; i++) {
        const base = maxBase > 0 ? Math.floor(hashCoord(seed, 42 + i * 17, 101) * (maxBase + 1)) : 0;
        for (let dy = 0; dy < h; dy++) {
            if (base + dy < height) {
                deadSet.add(base + dy);
            }
        }
    }
    return Array.from(deadSet);
}

export function computeGhostRails(seed, height, count, deadRows = [], railHeight = 1) {
    if (count <= 0 || height <= 0) return [];
    const h = Math.max(1, parseInt(railHeight, 10) || 1);
    const railSet = new Set();
    const deadSet = new Set(deadRows);
    const maxBase = Math.max(0, height - h);
    for (let i = 0; i < count; i++) {
        const base = maxBase > 0 ? Math.floor(hashCoord(seed, 123 + i * 31, 202) * (maxBase + 1)) : 0;
        for (let dy = 0; dy < h; dy++) {
            const r = base + dy;
            if (r < height && !deadSet.has(r)) {
                railSet.add(r);
            }
        }
    }
    return Array.from(railSet);
}

export function computeDeadModuleRange(seed, width) {
    if (width < 80) return null;
    const moduleWidth = 40;
    const numModules = Math.floor(width / moduleWidth);
    if (numModules < 2) return null;
    const modIdx = 1 + Math.floor(hashCoord(seed, 777, 303) * (numModules - 1));
    const startX = modIdx * moduleWidth;
    const endX = Math.min(width, startX + moduleWidth);
    return { startX, endX };
}

export function applySignDisease(matrixCanvas, config = {}, signColorArgb = 0xFFFF9000, previousMatrixCanvas = null) {
    const params = resolveDiseaseParams(config);
    if (params.preset === "none") {
        return matrixCanvas;
    }

    const w = matrixCanvas.width;
    const h = matrixCanvas.height;
    const out = new PixelCanvas(w, h);
    out.blitCanvas(matrixCanvas, 0, 0);
    const pixels = out.pixels;

    const seed = params.seed;
    const deadRows = computeDeadRows(seed, h, params.missingRows, params.missingRowHeight);
    const ghostRails = computeGhostRails(seed, h, params.ghostRails, deadRows, params.ghostRailHeight);
    const deadModule = params.moduleDropout ? computeDeadModuleRange(seed, w) : null;

    if (previousMatrixCanvas && params.stickyGhostOpacity > 0) {
        const prevPixels = previousMatrixCanvas.pixels;
        const prevW = previousMatrixCanvas.width;
        const prevH = previousMatrixCanvas.height;
        const ghostAlpha = Math.round(params.stickyGhostOpacity * 255);

        for (let y = 0; y < h && y < prevH; y++) {
            const rowOffset = y * w;
            const prevRowOffset = y * prevW;
            for (let x = 0; x < w && x < prevW; x++) {
                const currentPx = pixels[rowOffset + x];
                if (((currentPx >>> 24) & 0xff) === 0) {
                    const prevPx = prevPixels[prevRowOffset + x];
                    if (((prevPx >>> 24) & 0xff) !== 0) {
                        const r = (prevPx >>> 16) & 0xff;
                        const g = (prevPx >>> 8) & 0xff;
                        const b = prevPx & 0xff;
                        pixels[rowOffset + x] = (ghostAlpha << 24) | (r << 16) | (g << 8) | b;
                    }
                }
            }
        }
    }

    for (const railRow of ghostRails) {
        const rowOffset = railRow * w;
        for (let x = 0; x < w; x++) {
            pixels[rowOffset + x] = signColorArgb;
        }
    }

    for (const deadRow of deadRows) {
        const rowOffset = deadRow * w;
        for (let x = 0; x < w; x++) {
            pixels[rowOffset + x] = 0;
        }
    }

    if (deadModule) {
        for (let y = 0; y < h; y++) {
            const rowOffset = y * w;
            for (let x = deadModule.startX; x < deadModule.endX; x++) {
                pixels[rowOffset + x] = 0;
            }
        }
    }

    const deadRate = params.deadPixelRate;
    if (deadRate > 0) {
        for (let y = 0; y < h; y++) {
            const rowOffset = y * w;
            for (let x = 0; x < w; x++) {
                const idx = rowOffset + x;
                const px = pixels[idx];
                if (((px >>> 24) & 0xff) !== 0) {
                    if (hashCoord(seed, x, y) < deadRate) {
                        pixels[idx] = 0;
                    }
                }
            }
        }
    }

    return out;
}
