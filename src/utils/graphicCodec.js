export const MAX_GRAPHIC_W = 128;
export const MAX_GRAPHIC_H = 32;
export const MAX_GRAPHICS_PER_SIGN = 16;

const VALID_ID_REGEX = /^[a-z0-9]{1,12}$/i;

export function newGraphicId() {
    let id = "";
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

export function normalizeRows(rows, width, height) {
    const w = Math.max(1, Math.min(MAX_GRAPHIC_W, Number(width) || 1));
    const h = Math.max(1, Math.min(MAX_GRAPHIC_H, Number(height) || 1));
    const normalized = [];
    for (let y = 0; y < h; y++) {
        const srcRow = (rows && rows[y]) ? String(rows[y]) : "";
        let rowStr = "";
        for (let x = 0; x < w; x++) {
            rowStr += srcRow[x] === "1" ? "1" : "0";
        }
        normalized.push(rowStr);
    }
    return normalized;
}

export function resizeRowsBottomLeft(rows, oldW, oldH, newW, newH) {
    const targetW = Math.max(1, Math.min(MAX_GRAPHIC_W, Number(newW) || 1));
    const targetH = Math.max(1, Math.min(MAX_GRAPHIC_H, Number(newH) || 1));
    const result = [];
    const rowOffset = targetH - oldH;
    for (let y = 0; y < targetH; y++) {
        const srcY = y - rowOffset;
        const srcRow = srcY >= 0 && srcY < oldH && rows[srcY] ? String(rows[srcY]) : "";
        let line = "";
        for (let x = 0; x < targetW; x++) {
            line += x < oldW && srcRow[x] === "1" ? "1" : "0";
        }
        result.push(line);
    }
    return result;
}

export function rowsToBase64(rows, widthOverride, heightOverride) {
    if (!Array.isArray(rows) || rows.length === 0) return "";
    const height = heightOverride || rows.length;
    const width = widthOverride || (rows[0] ? rows[0].length : 0);
    if (width <= 0 || height <= 0) return "";

    const totalBits = width * height;
    const byteCount = (totalBits + 7) >> 3;
    const bytes = new Uint8Array(byteCount);

    for (let y = 0; y < height; y++) {
        const row = rows[y] || "";
        for (let x = 0; x < width; x++) {
            if (row[x] === "1") {
                const bitIndex = y * width + x;
                bytes[bitIndex >> 3] |= 1 << (7 - (bitIndex & 7));
            }
        }
    }

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export function base64ToRows(b64, width, height) {
    const w = Number(width);
    const h = Number(height);
    if (!b64 || !Number.isFinite(w) || !Number.isFinite(h) || w < 1 || w > MAX_GRAPHIC_W || h < 1 || h > MAX_GRAPHIC_H) {
        return null;
    }

    try {
        let stdB64 = String(b64).trim().replace(/-/g, "+").replace(/_/g, "/");
        while (stdB64.length % 4 !== 0) {
            stdB64 += "=";
        }
        const binary = atob(stdB64);
        const totalBits = w * h;
        const expectedBytes = (totalBits + 7) >> 3;
        if (binary.length < expectedBytes) return null;

        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const rows = [];
        for (let y = 0; y < h; y++) {
            let row = "";
            for (let x = 0; x < w; x++) {
                const bitIndex = y * w + x;
                const byteVal = bytes[bitIndex >> 3];
                const bitOffset = 7 - (bitIndex & 7);
                const isLit = ((byteVal >> bitOffset) & 1) === 1;
                row += isLit ? "1" : "0";
            }
            rows.push(row);
        }
        return rows;
    } catch {
        return null;
    }
}

export function serializeGraphicsParam(graphicsList = []) {
    if (!Array.isArray(graphicsList) || graphicsList.length === 0) return "";
    return graphicsList
        .slice(0, MAX_GRAPHICS_PER_SIGN)
        .map((g) => {
            if (!g || !g.id || !g.width || !g.height || !Array.isArray(g.rows)) return null;
            const cleanId = String(g.id).replace(/^@/, "");
            if (!VALID_ID_REGEX.test(cleanId)) return null;
            const b64 = g.data || rowsToBase64(g.rows, g.width, g.height);
            if (!b64) return null;
            return `${cleanId}.${g.width}x${g.height}.${b64}`;
        })
        .filter(Boolean)
        .join(",");
}

export function parseGraphicsParam(paramStr) {
    if (!paramStr || typeof paramStr !== "string") return [];
    const results = [];
    const entries = paramStr.split(",").slice(0, MAX_GRAPHICS_PER_SIGN);
    for (const raw of entries) {
        const parts = raw.trim().split(".");
        if (parts.length !== 3) continue;
        const id = parts[0].replace(/^@/, "").toLowerCase();
        if (!VALID_ID_REGEX.test(id)) continue;
        const dims = parts[1].toLowerCase().split("x");
        if (dims.length !== 2) continue;
        const width = parseInt(dims[0], 10);
        const height = parseInt(dims[1], 10);
        if (!Number.isFinite(width) || !Number.isFinite(height)) continue;
        if (width < 1 || width > MAX_GRAPHIC_W || height < 1 || height > MAX_GRAPHIC_H) continue;
        const b64 = parts[2];
        const rows = base64ToRows(b64, width, height);
        if (!rows) continue;

        results.push({
            id,
            name: `Icon ${id.slice(0, 4).toUpperCase()}`,
            width,
            height,
            rows,
            data: b64
        });
    }
    return results;
}

export function collectReferencedGraphicIds(state) {
    if (!state) return [];
    const ids = new Set();

    const scanFontString = (fontStr) => {
        if (!fontStr) return;
        for (const token of String(fontStr).split("^")) {
            const trimmed = token.trim();
            if (trimmed.startsWith("@") && trimmed.length > 1) {
                ids.add(trimmed.slice(1));
            }
        }
    };

    const scanIcons = (icons) => {
        if (!Array.isArray(icons)) return;
        for (const ic of icons) scanFontString(ic?.font);
    };

    scanFontString(state.routeFont);
    for (const f of state.frames || []) {
        scanFontString(f.line1Font);
        scanFontString(f.line2Font);
        scanIcons(f.icons);
    }
    for (const f of state.prFrames || []) {
        scanFontString(f.line1Font);
        scanFontString(f.line2Font);
        scanIcons(f.icons);
    }

    return Array.from(ids).slice(0, MAX_GRAPHICS_PER_SIGN);
}
