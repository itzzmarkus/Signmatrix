import {track} from '@vercel/analytics'
import {SignCompiler} from '../engine/SignCompiler.js'
import {encodeAnimatedGif} from '../engine/gifEncoder.js'
import {toIconSpecs} from './iconOverlays.js'
import {decodeSignFromHash} from './urlCodec.js'
import {downloadSignSvg} from './svgExporter.js'
import {downloadSignVideo} from './videoExporter.js'

export const URL_KEY_MAP = {
    r: "route",
    rf: "routeFont",
    rc: "routeColor",
    ra: "routeAlign",
    ri: "routeInvert",
    rbp: "routeBoxPadding",
    rbg: "routeBoxGap",
    rbc: "routeBoxColor",
    rx: "routeXOffset",
    ry: "routeYOffset",

    w: "width",
    h: "height",
    c: "color",
    oc: "offColor",
    s: "speed",
    ls: "ledShape",
    lz: "ledSize",
    lg: "ledGap",
    lgy: "ledGapY",
    gl: "ledGlow",
    sd: "signDisease",
    sds: "diseaseSeed",
    sdr: "diseaseMissingRows",
    sdrh: "diseaseMissingRowHeight",
    sdp: "diseaseDeadPixelRate",
    sdg: "diseaseGhostRails",
    sdgh: "diseaseGhostRailHeight",
    sdm: "diseaseModuleDropout",
    dt: "displayType",
    dc: "discColor",
    bl: "backlightMode",
    as: "autoScroll",
    ss: "scrollSpeed",
    sp: "scrollPause",

    l1: "line1",
    f1: "line1Font",
    c1: "line1Color",
    s1: "line1Spacing",
    a1: "line1Align",
    x1: "line1XOffset",
    y1: "line1YOffset",

    l2: "line2",
    f2: "line2Font",
    c2: "line2Color",
    s2: "line2Spacing",
    a2: "line2Align",
    x2: "line2XOffset",
    y2: "line2YOffset",

    an: "animation",
    ans: "animSpeed",
    d: "delay",
    vs: "verticalSpacing",
    fc: "frameCount",

    prl1: "prLine1",
    prf1: "prLine1Font",
    prc1: "prLine1Color",
    prs1: "prLine1Spacing",
    pra1: "prLine1Align",
    prx1: "prLine1XOffset",
    pry1: "prLine1YOffset",

    prl2: "prLine2",
    prf2: "prLine2Font",
    prc2: "prLine2Color",
    prs2: "prLine2Spacing",
    pra2: "prLine2Align",
    prx2: "prLine2XOffset",
    pry2: "prLine2YOffset",

    pran: "prAnimation",
    prans: "prAnimSpeed",
    prd: "prDelay",
    prvs: "prVerticalSpacing",
    prfc: "prFrameCount",
    ic: "icons",
    pric: "prIcons",
    cg: "customGraphics"
};

export const REVERSE_URL_KEY_MAP = Object.fromEntries(
    Object.entries(URL_KEY_MAP).map(([short, long]) => [long, short])
);

let _cachedHashState = undefined;

export const getInitialHashState = () => {
    if (_cachedHashState !== undefined) return _cachedHashState;
    if (typeof window !== 'undefined' && window.location.hash) {
        _cachedHashState = decodeSignFromHash(window.location.hash);
    } else {
        _cachedHashState = null;
    }
    return _cachedHashState;
};

export const getInitialState = (key, defaultVal) => {
    if (typeof window !== 'undefined') {
        const hashState = getInitialHashState();
        const shortKey = REVERSE_URL_KEY_MAP[key] || key;
        const longKey = URL_KEY_MAP[key] || key;

        if (hashState) {
            const prop = hashState[longKey] !== undefined ? hashState[longKey] : hashState[shortKey];
            if (prop !== undefined && prop !== null) {
                if (typeof prop === 'boolean') {
                    return prop ? "true" : "false";
                }
                const strVal = String(prop);
                if (strVal !== "undefined" && strVal !== "null") {
                    return strVal;
                }
            }
        }

        const params = new URLSearchParams(window.location.search);
        let val = null;
        if (params.has(shortKey)) {
            val = params.get(shortKey);
        } else if (params.has(longKey)) {
            val = params.get(longKey);
        }

        if (val !== null && val !== "undefined" && val !== "null") {
            const isColorKey = key === "color" || key === "c" || key === "offColor" || key === "oc" || key === "routeBoxColor" || key === "rbc";
            if (isColorKey && !val.startsWith("#") && val.length === 6) {
                return `#${val}`;
            }
            return val;
        }

        return defaultVal;
    }
    return defaultVal;
};

export const API_BASE_URL = "http://localhost:8080";

export const parseCaretSegments = (
    rawString = "",
    fontString = "",
    colorString = "",
    spacing = 0,
    defaultFontFallback = "16d",
    xOffsetString = "",
    yOffsetString = ""
) => {
    if (!rawString) return [];

    const textSegments = String(rawString).split("^");
    const fontSegments = String(fontString || "").split("^");
    const colorSegments = String(colorString || "").split("^");
    const xSegments = String(xOffsetString || "").split("^");
    const ySegments = String(yOffsetString || "").split("^");
    const numericSpacing = parseInt(spacing, 10) || 0;

    return textSegments.map((textSeg, index) => {
        const rawFont = fontSegments[index] !== undefined
            ? fontSegments[index]
            : (fontSegments[fontSegments.length - 1] || defaultFontFallback);
        const font = (rawFont || defaultFontFallback).trim() || defaultFontFallback;

        const rawColor = colorSegments[index] !== undefined
            ? colorSegments[index]
            : (colorSegments[colorSegments.length - 1] || "");
        const cleanColor = String(rawColor || "").replace("#", "").trim();
        const color = cleanColor.length === 6 ? cleanColor : null;

        const rawX = xSegments[index] !== undefined
            ? xSegments[index]
            : (xSegments[xSegments.length - 1] || "0");
        const rawY = ySegments[index] !== undefined
            ? ySegments[index]
            : (ySegments[ySegments.length - 1] || "0");
        const xOffset = parseInt(rawX, 10) || 0;
        const yOffset = parseInt(rawY, 10) || 0;

        if (font.startsWith("@")) {
            return {
                type: "graphic",
                graphicId: font.slice(1),
                color,
                spacing: numericSpacing,
                xOffset,
                yOffset
            };
        }

        return {
            type: "text",
            text: textSeg,
            font,
            color,
            spacing: numericSpacing,
            xOffset,
            yOffset
        };
    });
};

const buildFrameSpecs = (framesList = [], defaultSpeed = 1800) => {
    return framesList.map((f) => {
        const l1Text = f.line1 !== undefined ? String(f.line1) : "";
        const l2Text = f.line2 !== undefined ? String(f.line2) : "";
        const isStacked = l2Text.length > 0;
        const l1Spacing = parseInt(f.line1Spacing, 10) || 0;
        const l2Spacing = parseInt(f.line2Spacing, 10) || 0;

        const lines = [
            {
                segments: parseCaretSegments(
                    l1Text,
                    f.line1Font || "",
                    f.line1Color || "",
                    l1Spacing,
                    isStacked ? "8d" : "15d",
                    f.line1XOffset || "0",
                    f.line1YOffset || "0"
                ),
                align: f.line1Align || "CENTRE",
                spacing: l1Spacing
            }
        ];

        if (isStacked) {
            lines.push({
                segments: parseCaretSegments(
                    l2Text,
                    f.line2Font || "",
                    f.line2Color || "",
                    l2Spacing,
                    "16d",
                    f.line2XOffset || "0",
                    f.line2YOffset || "0"
                ),
                align: f.line2Align || "CENTRE",
                spacing: l2Spacing
            });
        }

        const parsedDelay = f.delay !== undefined && f.delay !== "" ? parseInt(f.delay, 10) : null;

        return {
            lines,
            icons: toIconSpecs(f.icons),
            verticalSpacing: f.verticalSpacing || "FLUSH",
            animation: f.animation || "NONE",
            animSpeed: parseFloat(f.animSpeed) || 0.25,
            delay: Number.isFinite(parsedDelay) ? parsedDelay : defaultSpeed
        };
    });
};

export const buildSignSpec = (debouncedState, graphicsById = {}, options = {}) => {
    let targetFrames = debouncedState.frames || [];
    let targetPrFrames = debouncedState.prFrames || [];
    let activeRoute = debouncedState.route || "";

    const filterByPreview =
        !options.ignorePreviewMode &&
        debouncedState.previewMode &&
        debouncedState.previewMode !== "all";

    if (filterByPreview) {
        if (String(debouncedState.previewMode).startsWith("pr-")) {
            const prIndex = parseInt(String(debouncedState.previewMode).split("-")[1], 10);
            if (targetPrFrames[prIndex]) {
                targetFrames = [targetPrFrames[prIndex]];
            }
            targetPrFrames = [];
            activeRoute = "";
        } else {
            const frameIndex = parseInt(debouncedState.previewMode, 10);
            if (targetFrames[frameIndex]) {
                targetFrames = [targetFrames[frameIndex]];
            }
            targetPrFrames = [];
        }
    }

    const defaultSpeed = parseInt(debouncedState.speed, 10) || 1800;
    const routeSegments = activeRoute
        ? parseCaretSegments(
            activeRoute,
            debouncedState.routeFont || "16d",
            debouncedState.routeColor || "",
            0,
            "16d",
            debouncedState.routeXOffset || "0",
            debouncedState.routeYOffset || "0"
        )
        : [];

    const parsedPadding = parseInt(debouncedState.routeBoxPadding, 10);
    const parsedGap = parseInt(debouncedState.routeBoxGap, 10);
    const cleanBoxColor = String(debouncedState.routeBoxColor || "").replace("#", "").trim();

    const route = {
        segments: routeSegments,
        align: debouncedState.routeAlign || "LEFT",
        invert: Boolean(debouncedState.routeInvert),
        boxPadding: Number.isFinite(parsedPadding) ? parsedPadding : 3,
        boxGap: Number.isFinite(parsedGap) ? parsedGap : 2,
        boxColor: debouncedState.routeInvert && cleanBoxColor.length === 6 ? cleanBoxColor : null
    };

    const frames = buildFrameSpecs(targetFrames, defaultSpeed);
    const hasActivePr = targetPrFrames.some(
        (f) => (f.line1 && f.line1.trim() !== "") || (f.line2 && f.line2.trim() !== "") || (Array.isArray(f.icons) && f.icons.length > 0)
    );
    const prFrames = hasActivePr ? buildFrameSpecs(targetPrFrames, defaultSpeed) : [];
    const graphics = {};
    const addGraphic = (graphicId) => {
        if (!graphicId || !graphicsById[graphicId]) return;
        const asset = graphicsById[graphicId];
        graphics[graphicId] = {
            width: asset.width,
            height: asset.height,
            data: asset.data || null,
            rows: asset.rows || null
        };
    };
    const collectFromSegments = (segs) => {
        for (const seg of segs) {
            if (seg.type === "graphic") addGraphic(seg.graphicId);
        }
    };
    const collectFromIcons = (icons) => {
        for (const ic of icons || []) {
            if (String(ic.font || "").startsWith("@")) addGraphic(ic.font.slice(1));
        }
    };
    collectFromSegments(routeSegments);
    for (const f of frames) {
        for (const l of f.lines) collectFromSegments(l.segments);
        collectFromIcons(f.icons);
    }
    for (const f of prFrames) {
        for (const l of f.lines) collectFromSegments(l.segments);
        collectFromIcons(f.icons);
    }

    const parsedPause = parseFloat(debouncedState.scrollPause);

    return {
        width: parseInt(debouncedState.width, 10) || 200,
        height: parseInt(debouncedState.height, 10) || 24,
        color: String(debouncedState.color || "#FF9000").replace("#", ""),
        offColor: String(debouncedState.offColor || "#404040").replace("#", ""),
        ledShape: debouncedState.ledShape || "round",
        ledSize: parseInt(debouncedState.ledSize, 10) || 10,
        ledGap: parseInt(debouncedState.ledGap, 10) ?? 1,
        ledGapY: parseInt(debouncedState.ledGapY ?? debouncedState.ledGap, 10) ?? 2,
        ledGlow: debouncedState.ledGlow || "none",
        signDisease: debouncedState.signDisease || "none",
        diseaseSeed: debouncedState.diseaseSeed !== undefined ? parseInt(debouncedState.diseaseSeed, 10) : 1337,
        diseaseMissingRows: debouncedState.diseaseMissingRows,
        diseaseMissingRowHeight: debouncedState.diseaseMissingRowHeight,
        diseaseDeadPixelRate: debouncedState.diseaseDeadPixelRate,
        diseaseGhostRails: debouncedState.diseaseGhostRails,
        diseaseGhostRailHeight: debouncedState.diseaseGhostRailHeight,
        diseaseModuleDropout: debouncedState.diseaseModuleDropout,
        displayType: debouncedState.displayType || "led",
        discColor: debouncedState.color
            ? (debouncedState.color.startsWith("#") ? debouncedState.color : `#${debouncedState.color}`)
            : (debouncedState.discColor || "#FF6600"),
        speed: defaultSpeed,
        autoScroll: Boolean(debouncedState.autoScroll),
        scrollSpeed: parseFloat(debouncedState.scrollSpeed) || 30,
        scrollPause: Number.isFinite(parsedPause) ? parsedPause : 1.0,
        route,
        frames,
        prFrames,
        graphics
    };
};

export const encodeSignSpecToBase64Url = (spec) => {
    const json = JSON.stringify(spec);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const pixelCanvasToPngBlob = (pixelCanvas) => {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = pixelCanvas.width;
            canvas.height = pixelCanvas.height;
            const ctx = canvas.getContext("2d");
            const imageData = new ImageData(
                pixelCanvas.toRgbaBytes(),
                pixelCanvas.width,
                pixelCanvas.height
            );
            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((pngBlob) => {
                if (pngBlob) {
                    resolve(pngBlob);
                } else {
                    reject(new Error("Canvas conversion to PNG blob returned null"));
                }
            }, "image/png");
        } catch (err) {
            reject(err);
        }
    });
};

export const blobToDataUrl = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const renderSignBlob = async (signState, graphicsById = {}, options = {}) => {
    const transparent = Boolean(options.transparent);
    const spec = buildSignSpec(signState, graphicsById, options);
    const sign = SignCompiler.compile(spec);
    const isGif = sign.isAnimated();

    if (isGif) {
        const matrixFrames = sign.generateAnimatedMatrixFrames();
        const isFlipdot = sign.displayType === "flipdot";

        let lazyFrames;
        if (isFlipdot && matrixFrames.length > 1) {
            const w = sign.width;
            const h = sign.height;
            const totalDots = w * h;
            lazyFrames = [];

            const msPerColumn = w >= 140 ? 6.0 : (w <= 84 ? 8.0 : 7.5);
            const sweepDuration = Math.round(w * msPerColumn);
            const baseDotDuration = 70;
            const totalAnimDuration = sweepDuration + 50 + baseDotDuration + 24;

            const stepMs = 30;
            const numSteps = Math.ceil(totalAnimDuration / stepMs);

            for (let i = 0; i < matrixFrames.length; i++) {
                const cur = matrixFrames[i];
                const next = matrixFrames[(i + 1) % matrixFrames.length];

                let isDiff = false;
                if (cur.matrix.width === next.matrix.width && cur.matrix.height === next.matrix.height) {
                    const p1 = cur.matrix.pixels;
                    const p2 = next.matrix.pixels;
                    for (let j = 0; j < p1.length; j++) {
                        if (p1[j] !== p2[j]) {
                            isDiff = true;
                            break;
                        }
                    }
                } else {
                    isDiff = true;
                }

                if (!isDiff || (cur.ms && cur.ms < 200)) {
                    lazyFrames.push({
                        ms: cur.ms,
                        getImage: () => sign.generateImageForMatrix(cur.matrix, { transparent })
                    });
                    continue;
                }

                const holdMs = Math.max(600, cur.ms || 1800);
                lazyFrames.push({
                    ms: holdMs,
                    getImage: () => sign.generateImageForMatrix(cur.matrix, { transparent })
                });

                const curPix = cur.matrix.pixels;
                const nextPix = next.matrix.pixels;

                const dotStartTimes = new Float32Array(totalDots);
                const dotFlipDurations = new Float32Array(totalDots);
                const dotNeedsFlip = new Uint8Array(totalDots);

                for (let x = 0; x < w; x++) {
                    const colBaseTime = (x / w) * sweepDuration;
                    for (let y = 0; y < h; y++) {
                        const idx = y * w + x;
                        const wasOn = (curPix[idx] >>> 24) !== 0;
                        const willBeOn = (nextPix[idx] >>> 24) !== 0;

                        if (wasOn !== willBeOn) {
                            dotNeedsFlip[idx] = 1;
                            const jitter = ((x * 13 + y * 29) % 7) * 2.2;
                            const rowStagger = (y / h) * 20.0;
                            dotStartTimes[idx] = colBaseTime + rowStagger + jitter;
                            dotFlipDurations[idx] = baseDotDuration + ((x * 7 + y * 17) % 5) * 2.0;
                        }
                    }
                }

                for (let s = 1; s <= numSteps; s++) {
                    const elapsed = s * stepMs;
                    const angles = new Float32Array(totalDots);

                    for (let idx = 0; idx < totalDots; idx++) {
                        const willBeOn = (nextPix[idx] >>> 24) !== 0;
                        if (dotNeedsFlip[idx] === 0) {
                            angles[idx] = willBeOn ? 0.0 : Math.PI;
                            continue;
                        }

                        const tStart = dotStartTimes[idx];
                        const tDur = dotFlipDurations[idx];
                        const tRel = elapsed - tStart;

                        if (tRel <= 0.0) {
                            angles[idx] = willBeOn ? Math.PI : 0.0;
                        } else if (tRel >= tDur) {
                            const bounceElapsed = tRel - tDur;
                            let bounce = 0.0;
                            if (bounceElapsed < 22) {
                                bounce = 0.12 * Math.exp(-bounceElapsed / 5.5) * Math.sin(bounceElapsed * 0.5);
                            }
                            angles[idx] = willBeOn ? Math.max(0.0, bounce) : Math.min(Math.PI, Math.PI - bounce);
                        } else {
                            const u = tRel / tDur;
                            const ease = u * u * (3.0 - 2.0 * u);
                            angles[idx] = willBeOn ? Math.PI * (1.0 - ease) : Math.PI * ease;
                        }
                    }

                    lazyFrames.push({
                        ms: stepMs,
                        getImage: () => sign.generateImageForMatrix(next.matrix, { dotAngles: angles, transparent })
                    });
                }
            }
        } else {
            lazyFrames = matrixFrames.map((f) => ({
                ms: f.ms,
                getImage: () => sign.generateImageForMatrix(f.matrix, { transparent })
            }));
        }

        const gifBytes = encodeAnimatedGif(lazyFrames, sign.outputWidth, sign.outputHeight, { transparent });
        return {
            blob: new Blob([gifBytes], { type: "image/gif" }),
            isGif: true,
            sign
        };
    }

    const firstFrame = sign.generateImageForState(0, { transparent });
    const pngBlob = await pixelCanvasToPngBlob(firstFrame);
    return {
        blob: pngBlob,
        isGif: false,
        sign
    };
};

export const copySign = async (signState, setIsCopying, onCopied, graphicsById = {}, options = {}) => {
    try {
        setIsCopying(true);
        const transparent = Boolean(options.transparent);
        const copyOptions = {
            transparent,
            ignorePreviewMode: options.ignorePreviewMode !== undefined ? options.ignorePreviewMode : true,
            ...options
        };

        if (!navigator?.clipboard?.write) {
            alert("Clipboard API is not supported in this browser. Please use the Download button instead.");
            return;
        }

        const spec = buildSignSpec(signState, graphicsById, copyOptions);
        const sign = SignCompiler.compile(spec);
        const isGif = sign.isAnimated();

        if (isGif) {
            return;
        }

        const firstFrame = sign.generateImageForState(0, { transparent });
        const pngBlob = await pixelCanvasToPngBlob(firstFrame);
        try {
            const item = new ClipboardItem({ "image/png": pngBlob });
            await navigator.clipboard.write([item]);
        } catch {
            const item = new ClipboardItem({ "image/png": Promise.resolve(pngBlob) });
            await navigator.clipboard.write([item]);
        }
        if (onCopied) onCopied("image");

        try {
            track('Copied Sign', {
                route: signState.route,
                type: 'png',
                transparent
            });
        } catch {}
    } catch (error) {
        console.error("Failed to copy sign:", error);
        alert("Uh... something went wrong copying your sign to clipboard: " + (error.message || "Unknown error"));
    } finally {
        setIsCopying(false);
    }
};

export const downloadSign = async (signState, setIsDownloading, _frames, _prFrames, _previewMode, graphicsById = {}, options = {}) => {
    if (options.format === "svg") {
        return downloadSignSvg(signState, setIsDownloading, graphicsById, options);
    }
    if (options.format === "video") {
        return downloadSignVideo(signState, setIsDownloading, graphicsById, options);
    }
    try {
        setIsDownloading(true);
        const transparent = Boolean(options.transparent);
        const downloadOptions = {
            transparent,
            ignorePreviewMode: options.ignorePreviewMode !== undefined ? options.ignorePreviewMode : true,
            ...options
        };
        const { blob, isGif } = await renderSignBlob(signState, graphicsById, downloadOptions);
        const objectUrl = window.URL.createObjectURL(blob);

        const extension = isGif ? "gif" : "png";
        const routeName = signState.route ? signState.route.replace(/\s+/g, '-') : "custom";
        const suffix = transparent ? "-transparent" : "";
        const fileName = `signmatrix-${routeName}${suffix}.${extension}`;

        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
        track('Downloaded Sign', {
            route: signState.route,
            line1: signState.frames?.[0]?.line1,
            transparent
        });
    } catch (error) {
        console.error(error);
        alert("Uh... something went wrong downloading your sign");
    } finally {
        setIsDownloading(false);
    }
};

export const isSignAnimated = (signState, graphicsById = {}, options = {}) => {
    try {
        const spec = buildSignSpec(signState, graphicsById, options);
        const sign = SignCompiler.compile(spec);
        return sign.isAnimated();
    } catch {
        return (signState.frames && signState.frames.length > 1) || Boolean(signState.autoScroll);
    }
};

export { downloadSignSvg, downloadSignVideo };
