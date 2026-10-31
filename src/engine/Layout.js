import { Glyph } from "./DotMtxFont.js";

export const TextAlignment = Object.freeze({
    CENTRE: "CENTRE",
    LEFT: "LEFT",
    RIGHT: "RIGHT"
});

export const VerticalAlignment = Object.freeze({
    CENTRE: "CENTRE",
    TOP: "TOP",
    BOTTOM: "BOTTOM"
});

export const LineSpacing = Object.freeze({
    FLUSH_TO_EDGES: "FLUSH_TO_EDGES",
    EQUISPACED: "EQUISPACED"
});

export function roundToInt(val) {
    return Math.floor(Math.fround(val) + 0.5) | 0;
}

export function intDiv(a, b) {
    return Math.trunc((a | 0) / (b | 0)) | 0;
}

export class GlyphPosition {
    constructor(glyph, x, y) {
        this.glyph = glyph;
        this.x = x | 0;
        this.y = y | 0;
    }
}

export class GlyphRun {
    constructor(font, text, color, letterSpacing = 0, xOffset = 0, yOffset = 0) {
        this.font = font;
        this.text = String(text || "");
        this.color = color;
        this.letterSpacing = letterSpacing | 0;
        this.xOffset = xOffset | 0;
        this.yOffset = yOffset | 0;

        this.missingChars = new Set();
        this.glyphPositions = [];
        this.height = font.height | 0;

        const height = this.height;
        let currentX = 0;
        let lastAdv = 0;
        let hairSpacesAtEnd = 0;
        let customY = 0;
        let previousWasText = false;

        for (let i = 0; i < this.text.length; i++) {
            const c = this.text[i];
            const code = this.text.charCodeAt(i);
            const glyph = font.glyphs.get(c);

            if (c === "\u200A") {
                // Hair space -- advances by one pixel only
                currentX++;
                lastAdv = 1;
                if (customY === 0) hairSpacesAtEnd++;
                customY = 0;
                previousWasText = false;
            } else {
                hairSpacesAtEnd = 0;
                if (c === "\u0015") {
                    // Negative-ack -- advances by negative one pixel only
                    currentX--;
                    lastAdv--;
                    previousWasText = false;
                } else if (code >= 0xe000 && code <= 0xe00f) {
                    // First 16 Unicode Private Use Area characters: 4-bit column pattern going down
                    if (this.letterSpacing !== 0 && previousWasText) {
                        currentX += this.letterSpacing;
                    }
                    customY += 4;
                    lastAdv = 0;
                    previousWasText = true;
                    this.glyphPositions.push(
                        new GlyphPosition(new Glyph(c, 0, 0, 1, 0, 0), currentX, customY - 4)
                    );
                } else if (!glyph) {
                    if (this.letterSpacing !== 0 && previousWasText && c !== " ") {
                        currentX += this.letterSpacing;
                    }
                    previousWasText = c !== " ";
                    this.missingChars.add(c);
                } else {
                    if (this.letterSpacing !== 0 && previousWasText && c !== " ") {
                        currentX += this.letterSpacing;
                    }
                    previousWasText = c !== " ";
                    this.glyphPositions.push(new GlyphPosition(glyph, currentX, height - glyph.h));
                    lastAdv = glyph.advance;
                    currentX += glyph.w + glyph.advance;
                }
            }
        }

        let minPos = Infinity;
        let maxPos = -Infinity;
        for (let i = 0; i < this.glyphPositions.length; i++) {
            const gp = this.glyphPositions[i];
            if (gp.x < minPos) minPos = gp.x;
            const right = gp.x + gp.glyph.w;
            if (right > maxPos) maxPos = right;
        }

        const minX = Math.min(0, this.glyphPositions.length > 0 ? minPos : 0);
        const maxX = Math.max(0, this.glyphPositions.length > 0 ? maxPos : 0) + hairSpacesAtEnd;
        this.width = Math.max(0, maxX - minX);
        this.lastAdvance = lastAdv;
        this._minPosX = this.glyphPositions.length > 0 ? minPos : 0;
    }

    renderToCanvas(canvas, destX, destY, cutout = false) {
        if (this.glyphPositions.length === 0 || this.width <= 0 || this.height <= 0) return;
        const xShift = Math.max(0, -this._minPosX);
        for (let i = 0; i < this.glyphPositions.length; i++) {
            const glyphPos = this.glyphPositions[i];
            const mask = this.font.getGlyphMask(glyphPos.glyph);
            canvas.blitMask(mask, destX + glyphPos.x + xShift, destY + glyphPos.y, this.color, cutout);
        }
    }
}

export class GraphicNode {
    constructor(mask, color, lastAdvance = 1, xOffset = 0, yOffset = 0) {
        this.mask = mask;
        this.color = color;
        this.lastAdvance = lastAdvance | 0;
        this.xOffset = xOffset | 0;
        this.yOffset = yOffset | 0;
    }

    get width() {
        return this.mask ? this.mask.width : 0;
    }

    get height() {
        return this.mask ? this.mask.height : 0;
    }

    renderToCanvas(canvas, destX, destY, cutout = false) {
        if (!this.mask) return;
        canvas.blitMask(this.mask, destX, destY, this.color, cutout);
    }
}

export class SpacerNode {
    constructor(width, height = 0) {
        this.width = width | 0;
        this.height = height | 0;
        this.lastAdvance = 0;
        this.color = null;
        this.xOffset = 0;
        this.yOffset = 0;
    }

    renderToCanvas() {
    }
}

export class OverlayIcon {
    constructor(node, anchor = TextAlignment.LEFT, xOffset = 0, yOffset = 0) {
        this.node = node;
        this.anchor = anchor;
        this.xOffset = xOffset | 0;
        this.yOffset = yOffset | 0;
    }

    get width() {
        return this.node ? this.node.width | 0 : 0;
    }

    get height() {
        return this.node ? this.node.height | 0 : 0;
    }

    resolvePosition(areaLeft, areaWidth, signHeight) {
        const w = this.width;
        const h = this.height;
        let baseX;
        if (this.anchor === TextAlignment.CENTRE) {
            baseX = areaLeft + intDiv(areaWidth - w, 2);
        } else if (this.anchor === TextAlignment.RIGHT) {
            baseX = areaLeft + areaWidth - w;
        } else {
            baseX = areaLeft;
        }
        return {
            x: baseX + this.xOffset,
            y: intDiv(signHeight - h, 2) + this.yOffset
        };
    }

    renderOverlay(canvas, areaLeft, areaWidth, signHeight) {
        if (!this.node || this.width <= 0 || this.height <= 0) return;
        const { x, y } = this.resolvePosition(areaLeft, areaWidth, signHeight);
        this.node.renderToCanvas(canvas, x, y, false);
    }
}

export class GlyphLayout {
    constructor(
        runs,
        glyphAlign = VerticalAlignment.BOTTOM,
        horizontalAlign = TextAlignment.CENTRE,
        xOffset = 0,
        yOffset = 0
    ) {
        this.runs = runs || [];
        if (Array.isArray(glyphAlign)) {
            this.glyphAlign = glyphAlign;
        } else {
            this.glyphAlign = this.runs.length === 0 ? [] : this.runs.map(() => glyphAlign);
        }
        this.horizontalAlign = horizontalAlign;
        this.xOffset = xOffset | 0;
        this.yOffset = yOffset | 0;

        if (this.runs.length === 0) {
            this.width = 0;
            this.height = 0;
        } else {
            let sum = 0;
            let maxH = 0;
            for (let i = 0; i < this.runs.length; i++) {
                const r = this.runs[i];
                sum += r.width + r.lastAdvance;
                if (r.height > maxH) maxH = r.height;
            }
            sum -= this.runs[this.runs.length - 1].lastAdvance;
            this.width = Math.max(0, sum);
            this.height = maxH;
        }
    }

    renderToCanvas(canvas, destX, destY, cutout = false) {
        if (this.width <= 0 || this.height <= 0) return;
        let x = 0;
        for (let i = 0; i < this.runs.length; i++) {
            const run = this.runs[i];
            const alignIdx = Math.min(i, this.glyphAlign.length - 1);
            const vAlign = alignIdx >= 0 ? this.glyphAlign[alignIdx] : VerticalAlignment.CENTRE;
            let y;
            if (vAlign === VerticalAlignment.CENTRE) {
                y = intDiv(this.height - run.height, 2);
            } else if (vAlign === VerticalAlignment.TOP) {
                y = 0;
            } else {
                y = this.height - run.height;
            }
            run.renderToCanvas(canvas, destX + x + run.xOffset, destY + y + run.yOffset, cutout);
            x += run.width + run.lastAdvance;
        }
    }
}

export class LayoutLines {
    constructor(lines, lineSpacing = LineSpacing.FLUSH_TO_EDGES) {
        this.lines = lines || [];
        this.lineSpacing = lineSpacing;

        let maxW = 0;
        let sumH = 0;
        for (let i = 0; i < this.lines.length; i++) {
            const l = this.lines[i];
            if (l.width > maxW) maxW = l.width;
            sumH += l.height;
        }
        this.totalWidth = maxW;
        this.totalHeight = sumH;
    }

    determineLayoutX(imageWidth, layout) {
        if (layout.horizontalAlign === TextAlignment.CENTRE) {
            return intDiv(imageWidth - layout.width, 2);
        } else if (layout.horizontalAlign === TextAlignment.LEFT) {
            return 0;
        } else {
            return imageWidth - layout.width;
        }
    }

    renderToCanvas(canvas, destX, destY, areaWidth, areaHeight, cutout = false) {
        if (areaWidth <= 0 || areaHeight <= 0 || this.lines.length === 0) return;
        if (this.lines.length === 1) {
            const layout = this.lines[0];
            const x = destX + this.determineLayoutX(areaWidth, layout) + layout.xOffset;
            const y = destY + roundToInt(Math.fround((areaHeight - layout.height) / 2.0)) + layout.yOffset;
            layout.renderToCanvas(canvas, x, y, cutout);
        } else if (this.lineSpacing === LineSpacing.FLUSH_TO_EDGES) {
            const totalH = Math.max(1, this.totalHeight);
            const denom = Math.max(1, this.lines.length - 1);
            const spacing = Math.fround((areaHeight - totalH) / denom);
            let acc = Math.fround(0);
            for (let i = 0; i < this.lines.length; i++) {
                const layout = this.lines[i];
                const y = roundToInt(acc);
                layout.renderToCanvas(
                    canvas,
                    destX + this.determineLayoutX(areaWidth, layout) + layout.xOffset,
                    destY + y + layout.yOffset,
                    cutout
                );
                acc = Math.fround(acc + layout.height + spacing);
            }
        } else {
            const totalH = Math.max(1, this.totalHeight);
            const denom = Math.max(1, this.lines.length + 1);
            const spacing = Math.fround((areaHeight - totalH) / denom);
            let acc = spacing;
            for (let i = 0; i < this.lines.length; i++) {
                const layout = this.lines[i];
                const y = roundToInt(acc);
                layout.renderToCanvas(
                    canvas,
                    destX + this.determineLayoutX(areaWidth, layout) + layout.xOffset,
                    destY + y + layout.yOffset,
                    cutout
                );
                acc = Math.fround(acc + layout.height + spacing);
            }
        }
    }
}
