import { Color, clamp } from "./PixelCanvas.js";
import { PixelMask } from "./PixelMask.js";
import { getFont } from "./DotMtxFont.js";
import {
    TextAlignment,
    VerticalAlignment,
    LineSpacing,
    GlyphRun,
    GraphicNode,
    SpacerNode,
    GlyphLayout,
    LayoutLines,
    OverlayIcon
} from "./Layout.js";
import { AnimationType, Destination, DestinationFrame } from "./Destination.js";
import { DestSign } from "./DestSign.js";

export class SignCompiler {
    static MAX_WIDTH = 512;
    static MAX_HEIGHT = 128;
    static MAX_GRAPHIC_W = 128;
    static MAX_GRAPHIC_H = 64;
    static MAX_GRAPHICS = 32;

    static compile(spec = {}) {
        const width = clamp(parseInt(spec.width ?? 200, 10) || 200, 1, SignCompiler.MAX_WIDTH);
        const height = clamp(parseInt(spec.height ?? 24, 10) || 24, 1, SignCompiler.MAX_HEIGHT);
        const ledSize = clamp(parseInt(spec.ledSize ?? 3, 10) || 3, 1, 24);
        const ledGap = clamp(
            spec.ledGap !== undefined && spec.ledGap !== null ? parseInt(spec.ledGap, 10) : 1,
            0,
            16
        );
        const ledGapY = clamp(
            spec.ledGapY !== undefined && spec.ledGapY !== null ? parseInt(spec.ledGapY, 10) : ledGap,
            0,
            16
        );
        const isCircles =
            String(spec.ledShape || "square").toUpperCase() === "ROUND" && ledSize >= 4;

        const signColor = SignCompiler.parseHexColor(spec.color, DestSign.ORANGE);
        const unlitColor = SignCompiler.parseHexColor(spec.offColor, new Color(64, 64, 64, 255));

        const rawScrollSpeed =
            spec.scrollSpeed !== undefined && spec.scrollSpeed !== null
                ? parseFloat(spec.scrollSpeed)
                : 30;
        const scrollSpeed = clamp(Number.isFinite(rawScrollSpeed) ? rawScrollSpeed : 30, 1, 300);

        const rawScrollPause =
            spec.scrollPause !== undefined && spec.scrollPause !== null
                ? parseFloat(spec.scrollPause)
                : 1.0;
        const scrollPause = clamp(Number.isFinite(rawScrollPause) ? rawScrollPause : 1.0, -10, 60);

        const defaultSpeed =
            spec.speed !== undefined && spec.speed !== null ? parseInt(spec.speed, 10) || 1800 : 1800;
        const autoScroll = spec.autoScroll !== undefined ? Boolean(spec.autoScroll) : true;

        const graphicMasks = SignCompiler.decodeGraphics(spec.graphics || {});

        const routeSpec = spec.route || null;
        let routeLines;
        if (routeSpec && Array.isArray(routeSpec.segments) && routeSpec.segments.length > 0) {
            const routeNodes = SignCompiler.compileSegments(
                routeSpec.segments,
                "16d",
                signColor,
                0,
                graphicMasks
            );
            if (routeNodes.length > 0) {
                const rX = clamp(
                    parseInt(routeSpec.xOffset ?? 0, 10) || 0,
                    -SignCompiler.MAX_WIDTH,
                    SignCompiler.MAX_WIDTH
                );
                const rY = clamp(
                    parseInt(routeSpec.yOffset ?? 0, 10) || 0,
                    -SignCompiler.MAX_HEIGHT,
                    SignCompiler.MAX_HEIGHT
                );
                routeLines = new LayoutLines(
                    [
                        new GlyphLayout(
                            routeNodes,
                            VerticalAlignment.BOTTOM,
                            TextAlignment.CENTRE,
                            rX,
                            rY
                        )
                    ],
                    LineSpacing.FLUSH_TO_EDGES
                );
            } else {
                routeLines = new LayoutLines([]);
            }
        } else {
            routeLines = new LayoutLines([]);
        }

        const routeAlign =
            String(routeSpec?.align || "LEFT").toUpperCase() === "RIGHT"
                ? TextAlignment.RIGHT
                : TextAlignment.LEFT;
        const routeInvert = Boolean(routeSpec?.invert);
        const routeBoxPadding = clamp(
            routeSpec?.boxPadding !== undefined && routeSpec?.boxPadding !== null
                ? parseInt(routeSpec.boxPadding, 10)
                : 3,
            0,
            16
        );
        const routeBoxGap = clamp(
            routeSpec?.boxGap !== undefined && routeSpec?.boxGap !== null
                ? parseInt(routeSpec.boxGap, 10)
                : 2,
            0,
            16
        );
        const routeBoxColor =
            routeSpec?.boxColor && String(routeSpec.boxColor).trim() !== ""
                ? SignCompiler.parseHexColorOrNull(routeSpec.boxColor)
                : null;

        const effectiveFrames =
            Array.isArray(spec.frames) && spec.frames.length > 0
                ? spec.frames
                : [
                      {
                          lines: [
                              {
                                  segments: [{ type: "text", text: "NOT IN SERVICE", font: "15d" }]
                              }
                          ]
                      }
                  ];

        const destination = SignCompiler.compileDestination({
            frameSpecs: effectiveFrames,
            defaultFrameDelayMs: defaultSpeed,
            graphicMasks,
            signColor,
            routeLines,
            routeAlign,
            routeInvert,
            routeBoxPadding,
            routeBoxGap,
            routeBoxColor
        });

        let diseaseConfig = "none";
        if (spec.signDisease && spec.signDisease !== "none") {
            if (typeof spec.signDisease === "object") {
                diseaseConfig = spec.signDisease;
            } else if (spec.signDisease === "custom") {
                diseaseConfig = {
                    preset: "custom",
                    seed: spec.diseaseSeed,
                    deadPixelRate: spec.diseaseDeadPixelRate,
                    missingRows: spec.diseaseMissingRows,
                    missingRowHeight: spec.diseaseMissingRowHeight,
                    ghostRails: spec.diseaseGhostRails,
                    ghostRailHeight: spec.diseaseGhostRailHeight,
                    moduleDropout: spec.diseaseModuleDropout,
                    stickyGhostOpacity: spec.diseaseStickyGhostOpacity
                };
            } else {
                diseaseConfig = {
                    preset: spec.signDisease,
                    seed: spec.diseaseSeed
                };
            }
        }

        const displayType = spec.displayType ? String(spec.displayType).toLowerCase() : "led";
        const signColorHex = spec.color
            ? (String(spec.color).startsWith("#") ? String(spec.color) : `#${spec.color}`)
            : "#FF9000";
        const discColor = spec.discColor ? String(spec.discColor) : signColorHex;

        const sign = new DestSign({
            width,
            height,
            ledSize,
            ledSpacing: ledGap,
            ledSpacingY: ledGapY,
            circles: isCircles,
            ledColor: signColor,
            offColor: unlitColor,
            defaultAnimation: AnimationType.Falldown(0.25),
            autoScroll,
            scrollSpeed,
            scrollPause,
            ledGlow: spec.ledGlow || "none",
            signDisease: diseaseConfig,
            diseaseSeed: spec.diseaseSeed !== undefined ? spec.diseaseSeed : 1337,
            displayType,
            discColor
        });
        sign.destination = destination;

        const prFrameSpecs = Array.isArray(spec.prFrames) ? spec.prFrames : [];
        const activePrFrames = prFrameSpecs.filter((frame) =>
            (Array.isArray(frame.icons) && frame.icons.length > 0) ||
            (frame.lines || []).some((line) =>
                (line.segments || []).some((seg) => !SignCompiler.isSegmentBlank(seg))
            )
        );
        if (activePrFrames.length > 0) {
            sign.pr = SignCompiler.compileDestination({
                frameSpecs: prFrameSpecs,
                defaultFrameDelayMs: defaultSpeed,
                graphicMasks,
                signColor,
                routeLines: new LayoutLines([]),
                routeAlign: TextAlignment.LEFT,
                routeInvert: false,
                routeBoxPadding: 3,
                routeBoxGap: 2,
                routeBoxColor: null
            });
        }

        return sign;
    }

    static isSegmentBlank(seg) {
        if (!seg) return true;
        const type = seg.type || "text";
        if (type === "graphic") {
            return !seg.graphicId || String(seg.graphicId).trim() === "";
        }
        if (type === "spacer") {
            return (seg.widthPx || 0) <= 0;
        }
        return !seg.text || String(seg.text).trim() === "";
    }

    static isLineEmpty(line) {
        if (!line || !Array.isArray(line.segments) || line.segments.length === 0) return true;
        return line.segments.every((seg) => {
            if (!seg) return true;
            const type = seg.type || "text";
            if (type === "graphic") return !seg.graphicId || String(seg.graphicId).trim() === "";
            if (type === "spacer") return (seg.widthPx || 0) <= 0;
            return !seg.text || String(seg.text).length === 0;
        });
    }

    static compileDestination({
        frameSpecs,
        defaultFrameDelayMs,
        graphicMasks,
        signColor,
        routeLines,
        routeAlign,
        routeInvert,
        routeBoxPadding,
        routeBoxGap,
        routeBoxColor
    }) {
        const destFrames = [];
        const screenTimes = [];

        for (let fIdx = 0; fIdx < frameSpecs.length; fIdx++) {
            const frameSpec = frameSpecs[fIdx] || {};
            const lines = Array.isArray(frameSpec.lines) ? frameSpec.lines : [];
            const l1Spec = lines[0] || { segments: [], align: "CENTRE", spacing: 0 };
            const additionalLines = lines.slice(1).filter((l) => !SignCompiler.isLineEmpty(l));
            const isStacked = additionalLines.length > 0;

            const defaultL1Font = isStacked ? "8d" : "15d";
            const defaultL2Font = "16d";

            const l1Nodes = SignCompiler.compileSegments(
                l1Spec.segments || [],
                defaultL1Font,
                signColor,
                l1Spec.spacing || 0,
                graphicMasks
            );
            const l1Align = SignCompiler.parseTextAlignment(l1Spec.align);
            const l1X = clamp(
                parseInt(l1Spec.xOffset ?? 0, 10) || 0,
                -SignCompiler.MAX_WIDTH,
                SignCompiler.MAX_WIDTH
            );
            const l1Y = clamp(
                parseInt(l1Spec.yOffset ?? 0, 10) || 0,
                -SignCompiler.MAX_HEIGHT,
                SignCompiler.MAX_HEIGHT
            );

            const destLayouts = [];
            if (!isStacked) {
                destLayouts.push(
                    new GlyphLayout(l1Nodes, VerticalAlignment.CENTRE, l1Align, l1X, l1Y)
                );
            } else {
                destLayouts.push(
                    new GlyphLayout(l1Nodes, VerticalAlignment.TOP, l1Align, l1X, l1Y)
                );
                for (let idx = 0; idx < additionalLines.length; idx++) {
                    const lineSpec = additionalLines[idx];
                    const nodes = SignCompiler.compileSegments(
                        lineSpec.segments || [],
                        defaultL2Font,
                        signColor,
                        lineSpec.spacing || 0,
                        graphicMasks
                    );
                    const align = SignCompiler.parseTextAlignment(lineSpec.align);
                    const vAlign =
                        idx === additionalLines.length - 1
                            ? VerticalAlignment.BOTTOM
                            : VerticalAlignment.CENTRE;
                    const lX = clamp(
                        parseInt(lineSpec.xOffset ?? 0, 10) || 0,
                        -SignCompiler.MAX_WIDTH,
                        SignCompiler.MAX_WIDTH
                    );
                    const lY = clamp(
                        parseInt(lineSpec.yOffset ?? 0, 10) || 0,
                        -SignCompiler.MAX_HEIGHT,
                        SignCompiler.MAX_HEIGHT
                    );
                    destLayouts.push(new GlyphLayout(nodes, vAlign, align, lX, lY));
                }
            }

            const vSpacing =
                String(frameSpec.verticalSpacing || "FLUSH").toUpperCase() === "EQUISPACED"
                    ? LineSpacing.EQUISPACED
                    : LineSpacing.FLUSH_TO_EDGES;

            const animSpeed =
                frameSpec.animSpeed !== undefined && frameSpec.animSpeed !== null
                    ? parseFloat(frameSpec.animSpeed)
                    : 0.25;
            const animName = String(frameSpec.animation || "NONE").toUpperCase();
            let animationType;
            if (animName === "FALLDOWN") {
                animationType = AnimationType.Falldown(animSpeed);
            } else if (animName === "FALLUP") {
                animationType = AnimationType.Fallup(animSpeed);
            } else if (animName === "SIDEWIPE") {
                animationType = AnimationType.Sidewipe(animSpeed);
            } else if (animName === "SCROLL") {
                animationType = AnimationType.HorizontalScroll(animSpeed);
            } else {
                animationType = AnimationType.NoAnimation;
            }

            const overlays = SignCompiler.compileOverlays(frameSpec.icons, signColor, graphicMasks);

            destFrames.push(
                new DestinationFrame(
                    [new LayoutLines(destLayouts, vSpacing)],
                    isStacked ? TextAlignment.CENTRE : l1Align,
                    2,
                    animationType,
                    undefined,
                    overlays
                )
            );

            const delayMs =
                frameSpec.delay !== undefined && frameSpec.delay !== null
                    ? parseInt(frameSpec.delay, 10)
                    : defaultFrameDelayMs;
            screenTimes.push(Math.fround(delayMs / 1000.0));
        }

        return new Destination({
            route: routeLines,
            frames: destFrames,
            screenTimes,
            routeAlignment: routeAlign,
            routeInvert,
            routeBoxPadding,
            routeBoxGap,
            routeBoxColor,
            defaultSignColor: signColor
        });
    }

    static compileSegments(
        segments,
        defaultFontFallback,
        defaultColor,
        defaultSpacing,
        graphicMasks
    ) {
        if (!Array.isArray(segments) || segments.length === 0) return [];
        const out = [];

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            if (!seg) continue;
            const type = seg.type || "text";

            if (type === "text") {
                const text = seg.text !== undefined && seg.text !== null ? String(seg.text) : "";
                if (text.length === 0) continue;
                const rawFont = String(seg.font || "").trim();
                const fontName = rawFont.length > 0 ? rawFont : defaultFontFallback;
                const segmentColor = SignCompiler.parseHexColorOrNull(seg.color) || defaultColor;
                const spacing =
                    seg.spacing !== undefined && seg.spacing !== null
                        ? parseInt(seg.spacing, 10) || 0
                        : defaultSpacing | 0;
                const segX = clamp(
                    parseInt(seg.xOffset ?? 0, 10) || 0,
                    -SignCompiler.MAX_WIDTH,
                    SignCompiler.MAX_WIDTH
                );
                const segY = clamp(
                    parseInt(seg.yOffset ?? 0, 10) || 0,
                    -SignCompiler.MAX_HEIGHT,
                    SignCompiler.MAX_HEIGHT
                );

                if (fontName.startsWith("@")) {
                    const graphicId = fontName.slice(1);
                    const mask = graphicMasks.get(graphicId);
                    if (!mask) continue;
                    out.push(new GraphicNode(mask, segmentColor, spacing, segX, segY));
                } else {
                    const parsedText = SignCompiler.parseDestSignEscapes(text);
                    const resolvedFont = getFont(fontName, defaultFontFallback);
                    out.push(
                        new GlyphRun(resolvedFont, parsedText, segmentColor, spacing, segX, segY)
                    );
                }
            } else if (type === "graphic") {
                const cleanId = String(seg.graphicId || "").replace(/^@/, "");
                const mask = graphicMasks.get(cleanId);
                if (!mask) continue;
                const segmentColor = SignCompiler.parseHexColorOrNull(seg.color) || defaultColor;
                const spacing =
                    seg.spacing !== undefined && seg.spacing !== null
                        ? parseInt(seg.spacing, 10)
                        : 1;
                const segX = clamp(
                    parseInt(seg.xOffset ?? 0, 10) || 0,
                    -SignCompiler.MAX_WIDTH,
                    SignCompiler.MAX_WIDTH
                );
                const segY = clamp(
                    parseInt(seg.yOffset ?? 0, 10) || 0,
                    -SignCompiler.MAX_HEIGHT,
                    SignCompiler.MAX_HEIGHT
                );
                out.push(new GraphicNode(mask, segmentColor, spacing, segX, segY));
            } else if (type === "spacer") {
                const widthPx = parseInt(seg.widthPx ?? 0, 10) || 0;
                if (widthPx > 0) {
                    out.push(new SpacerNode(widthPx));
                }
            }
        }

        return out;
    }

    static MAX_OVERLAYS = 16;

    static compileOverlays(iconSpecs, defaultColor, graphicMasks) {
        if (!Array.isArray(iconSpecs) || iconSpecs.length === 0) return [];
        const out = [];
        for (const spec of iconSpecs.slice(0, SignCompiler.MAX_OVERLAYS)) {
            if (!spec) continue;
            const font = String(spec.font || "").trim();
            if (!font) continue;
            const color = SignCompiler.parseHexColorOrNull(spec.color) || defaultColor;
            let node = null;
            if (font.startsWith("@")) {
                const mask = graphicMasks.get(font.slice(1));
                if (mask) node = new GraphicNode(mask, color, 0);
            } else {
                const ch = String(spec.char || "");
                if (ch.length > 0) {
                    const run = new GlyphRun(getFont(font, "16d"), ch, color, 0);
                    if (run.width > 0) node = run;
                }
            }
            if (!node) continue;
            const anchor = SignCompiler.parseTextAlignment(spec.anchor || "LEFT");
            const x = clamp(parseInt(spec.x ?? 0, 10) || 0, -SignCompiler.MAX_WIDTH, SignCompiler.MAX_WIDTH);
            const y = clamp(parseInt(spec.y ?? 0, 10) || 0, -SignCompiler.MAX_HEIGHT, SignCompiler.MAX_HEIGHT);
            out.push(new OverlayIcon(node, anchor, x, y));
        }
        return out;
    }

    static decodeGraphics(assets) {
        const result = new Map();
        if (!assets || typeof assets !== "object") return result;

        const entries = Object.entries(assets).slice(0, SignCompiler.MAX_GRAPHICS);
        for (const [rawId, spec] of entries) {
            if (!spec) continue;
            const id = rawId.replace(/^@/, "");
            const w = parseInt(spec.width, 10) || 0;
            const h = parseInt(spec.height, 10) || 0;
            if (
                w < 1 ||
                w > SignCompiler.MAX_GRAPHIC_W ||
                h < 1 ||
                h > SignCompiler.MAX_GRAPHIC_H
            ) {
                continue;
            }
            let mask = null;
            if (spec.data && String(spec.data).trim() !== "") {
                mask = PixelMask.fromPackedBase64Url(w, h, String(spec.data));
            } else if (Array.isArray(spec.rows) && spec.rows.length > 0) {
                mask = PixelMask.fromRows(spec.rows, w, h);
            }
            if (mask) {
                result.set(id, mask);
            }
        }
        return result;
    }

    static parseDestSignEscapes(str) {
        let out = "";
        let inEscape = false;
        let inGlyph = false;
        for (let i = 0; i < str.length; i++) {
            const c = str[i];
            if (inGlyph) {
                const hex = parseInt(c, 16);
                if (!Number.isNaN(hex)) {
                    out += String.fromCharCode(0xe000 + hex);
                }
                inEscape = false;
                inGlyph = false;
            } else if (inEscape) {
                if (c === "s") out += " ";
                else if (c === "\\") out += "\\";
                else if (c === "1") out += "\u200A";
                else if (c === "~") out += "\u0015";
                else if (c === "!") out += "!";
                else if (c === "g") inGlyph = true;
                inEscape = false;
            } else {
                if (c === "\\") inEscape = true;
                else out += c;
            }
        }
        if (inEscape) out += "\\";
        return out;
    }

    static parseTextAlignment(alignStr) {
        const up = String(alignStr || "CENTRE").toUpperCase();
        if (up === "LEFT") return TextAlignment.LEFT;
        if (up === "RIGHT") return TextAlignment.RIGHT;
        return TextAlignment.CENTRE;
    }

    static parseHexColorOrNull(hexColor) {
        if (!hexColor) return null;
        const clean = String(hexColor).trim().replace(/^#/, "");
        if (clean.length !== 6) return null;
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
        return new Color(r, g, b, 255);
    }

    static parseHexColor(hexColor, defaultColor) {
        return SignCompiler.parseHexColorOrNull(hexColor) || defaultColor;
    }
}
