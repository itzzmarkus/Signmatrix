import { MAX_GRAPHIC_H, MAX_GRAPHIC_W } from "./graphicCodec.js";

export function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not decode image file"));
        };
        img.src = url;
    });
}

export function convertImageToMatrix(
    img,
    {
        targetHeight = 16,
        threshold = 128,
        invert = false,
        trimEmptyColumns = true
    } = {}
) {
    if (!img || !img.naturalWidth || !img.naturalHeight) {
        return { width: 16, height: 16, rows: Array(16).fill("0".repeat(16)) };
    }

    const height = Math.max(1, Math.min(MAX_GRAPHIC_H, parseInt(targetHeight, 10) || 16));
    const aspect = img.naturalWidth / img.naturalHeight;
    const rawWidth = Math.round(height * aspect);
    const width = Math.max(1, Math.min(MAX_GRAPHIC_W, rawWidth));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const { data } = ctx.getImageData(0, 0, width, height);
    const matrix = [];

    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a < 64) {
                row.push(invert ? "1" : "0");
            } else {
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                const pass = lum >= threshold;
                const lit = invert ? !pass : pass;
                row.push(lit ? "1" : "0");
            }
        }
        matrix.push(row);
    }

    if (!trimEmptyColumns || width <= 1) {
        return {
            width,
            height,
            rows: matrix.map((r) => r.join(""))
        };
    }

    let minCol = width;
    let maxCol = -1;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (matrix[y][x] === "1") {
                if (x < minCol) minCol = x;
                if (x > maxCol) maxCol = x;
                break;
            }
        }
    }

    if (maxCol < minCol) {
        return {
            width,
            height,
            rows: matrix.map((r) => r.join(""))
        };
    }

    const trimmedWidth = maxCol - minCol + 1;
    const trimmedRows = matrix.map((r) => r.slice(minCol, maxCol + 1).join(""));

    return {
        width: trimmedWidth,
        height,
        rows: trimmedRows
    };
}
