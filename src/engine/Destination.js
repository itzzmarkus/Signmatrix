import { Color, PixelCanvas } from "./PixelCanvas.js";
import { TextAlignment, intDiv } from "./Layout.js";

export const AnimationType = Object.freeze({
    Inherit: { type: "INHERIT", delay: 0 },
    NoAnimation: { type: "NONE", delay: 0 },
    Falldown: (delay) => ({ type: "FALLDOWN", delay: Math.fround(delay) }),
    Fallup: (delay) => ({ type: "FALLUP", delay: Math.fround(delay) }),
    Sidewipe: (delay) => ({ type: "SIDEWIPE", delay: Math.fround(delay) }),
    HorizontalScroll: (delay) => ({ type: "SCROLL", delay: Math.fround(delay) })
});

export const FrameHScroll = Object.freeze({
    NoScroll: { type: "NO_SCROLL" },
    Scroll: (pixelsPerSecond = 30, spacingPercentage = 1) => ({
        type: "SCROLL",
        pixelsPerSecond: Math.fround(pixelsPerSecond),
        spacingPercentage: Math.fround(spacingPercentage)
    })
});

const DEFAULT_ORANGE = new Color(255, 144, 0, 255);

export class DestinationFrame {
    constructor(
        layoutLines,
        alignment = TextAlignment.CENTRE,
        spacingBetweenLayouts = 2,
        animation = AnimationType.Inherit,
        hscroll = FrameHScroll.NoScroll,
        overlays = []
    ) {
        this.layoutLines = layoutLines || [];
        this.alignment = alignment;
        this.spacingBetweenLayouts = spacingBetweenLayouts | 0;
        this.animation = animation || AnimationType.Inherit;
        this.hscroll = hscroll || FrameHScroll.NoScroll;
        this.overlays = Array.isArray(overlays) ? overlays : [];

        let sumW = 0;
        for (let i = 0; i < this.layoutLines.length; i++) {
            sumW += this.layoutLines[i].totalWidth;
        }
        const gaps = Math.max(0, this.layoutLines.length - 1) * this.spacingBetweenLayouts;
        this.totalWidth = Math.max(1, sumW + gaps);
    }

    renderOverlays(canvas, areaLeft, areaWidth, height) {
        for (let i = 0; i < this.overlays.length; i++) {
            this.overlays[i].renderOverlay(canvas, areaLeft, areaWidth, height);
        }
    }

    renderToCanvas(canvas, destX, destY, height) {
        let x = 0;
        for (let i = 0; i < this.layoutLines.length; i++) {
            const ll = this.layoutLines[i];
            if (ll.totalWidth > 0) {
                ll.renderToCanvas(canvas, destX + x, destY, ll.totalWidth, height, false);
            }
            x += ll.totalWidth + this.spacingBetweenLayouts;
        }
    }
}

export class Destination {
    constructor({
        route,
        frames = [],
        screenTimes = [],
        routeAlignment = TextAlignment.LEFT,
        routeInvert = false,
        routeBoxPadding = 3,
        routeBoxGap = 2,
        routeBoxColor = null,
        defaultSignColor = DEFAULT_ORANGE
    }) {
        this.route = route;
        this.frames = frames;
        this.screenTimes = screenTimes;
        this.routeAlignment = routeAlignment;
        this.routeInvert = Boolean(routeInvert);
        this.routeBoxPadding = routeBoxPadding | 0;
        this.routeBoxGap = routeBoxGap | 0;
        this.routeBoxColor = routeBoxColor || null;
        this.defaultSignColor = defaultSignColor || DEFAULT_ORANGE;
    }

    get effectiveRouteWidth() {
        const hasRoute = this.route && this.route.lines.length > 0 && this.route.totalWidth > 0;
        if (!hasRoute) return 0;
        const baseWidth = this.routeInvert
            ? this.route.totalWidth + this.routeBoxPadding * 2
            : this.route.totalWidth;
        return baseWidth + this.routeBoxGap;
    }

    generateMatrixCanvas(
        width,
        height,
        frame,
        drawRoute = true,
        horizontalOffset = null,
        secondaryFrame = null,
        secondaryOffset = null
    ) {
        if (this.routeAlignment === TextAlignment.CENTRE) {
            throw new Error("Route alignment cannot be centre");
        }
        const canvas = new PixelCanvas(width, height);
        const hasRoute = this.route && this.route.lines.length > 0 && this.route.totalWidth > 0;
        const totalRouteWidth = this.effectiveRouteWidth;
        const boxWidth = this.routeInvert && hasRoute ? this.route.totalWidth + this.routeBoxPadding * 2 : 0;

        if (hasRoute && drawRoute) {
            if (this.routeInvert) {
                const firstRunColor =
                    this.route.lines[0] &&
                    this.route.lines[0].runs &&
                    this.route.lines[0].runs[0]
                        ? this.route.lines[0].runs[0].color
                        : null;
                const boxColor = this.routeBoxColor || firstRunColor || this.defaultSignColor;
                const boxX = this.routeAlignment === TextAlignment.RIGHT ? width - boxWidth : 0;
                canvas.withClip(boxX, 0, boxWidth, height, () => {
                    canvas.fillRect(boxX, 0, boxWidth, height, boxColor);
                    this.route.renderToCanvas(
                        canvas,
                        boxX + this.routeBoxPadding,
                        0,
                        this.route.totalWidth,
                        height,
                        true
                    );
                });
            } else {
                const routeX = this.routeAlignment === TextAlignment.RIGHT ? width - this.route.totalWidth : 0;
                this.route.renderToCanvas(canvas, routeX, 0, this.route.totalWidth, height, false);
            }
        }

        const destWidth = hasRoute ? width - totalRouteWidth : width;
        const destinationStart = this.routeAlignment === TextAlignment.RIGHT ? 0 : totalRouteWidth;

        let localOffset;
        if (horizontalOffset !== null && horizontalOffset !== undefined) {
            localOffset = horizontalOffset | 0;
        } else if (frame.alignment === TextAlignment.CENTRE) {
            localOffset = intDiv(destWidth - frame.totalWidth, 2);
        } else if (frame.alignment === TextAlignment.LEFT) {
            localOffset = 0;
        } else {
            localOffset = destWidth - frame.totalWidth;
        }
        const frameOffsetX = destinationStart + localOffset;

        canvas.withClip(destinationStart, 0, destWidth, height, () => {
            frame.renderToCanvas(canvas, frameOffsetX, 0, height);
            if (secondaryFrame !== null && secondaryFrame !== undefined && secondaryOffset !== null && secondaryOffset !== undefined) {
                const secOffsetX = destinationStart + (secondaryOffset | 0);
                secondaryFrame.renderToCanvas(canvas, secOffsetX, 0, height);
            }
        });

        frame.renderOverlays?.(canvas, destinationStart, destWidth, height);

        return canvas;
    }
}
