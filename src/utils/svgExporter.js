import { SignCompiler } from "../engine/SignCompiler.js";
import { applySignDisease } from "../engine/signDisease.js";
import { LED_GLOW_PRESETS, computeHotCoreArgb } from "../engine/glowCompositor.js";
import { buildSignSpec } from "./signUtils.js";

function toHexColor(rgbInt) {
    const rgb = rgbInt & 0x00ffffff;
    return "#" + ((1 << 24) + rgb).toString(16).slice(1).toUpperCase();
}

function fmt(val) {
    return Number(val.toFixed(2)).toString();
}

export function generateSignSvg(signState, graphicsById = {}, options = {}) {
    const transparent = Boolean(options.transparent);
    const withUnlit = !transparent && options.withUnlit !== false;

    const spec = buildSignSpec(signState, graphicsById, options);
    const sign = SignCompiler.compile(spec);

    const outW = sign.outputWidth;
    const outH = sign.outputHeight;
    const w = sign.width;
    const h = sign.height;
    const ledSize = sign.ledSize;
    const borderSize = sign.borderSize;
    const stepX = ledSize + sign.ledSpacing;
    const stepY = ledSize + sign.ledSpacingY;

    const displayType = sign.displayType || "led";
    const isFlipdot = displayType === "flipdot";
    const useCircles = (sign.circles && ledSize >= 4) || isFlipdot;
    const radius = ledSize / 2;

    const ledGlow = options.ledGlow !== undefined ? options.ledGlow : sign.ledGlow;
    const glowPreset = !isFlipdot && ledGlow && LED_GLOW_PRESETS[ledGlow];
    const coreBoost = glowPreset && typeof glowPreset.coreBoost === "number" ? glowPreset.coreBoost : 0;

    const stateIdx = typeof options.stateIndex === "number" ? options.stateIndex : 0;
    const effectiveMatrix = typeof sign.getEffectiveMatrixForState === "function"
        ? sign.getEffectiveMatrixForState(stateIdx, options)
        : (() => {
            const raw = sign.generateMatrixForState(stateIdx);
            const diseaseConfig = options.signDisease !== undefined ? options.signDisease : sign.signDisease;
            return diseaseConfig && diseaseConfig.preset !== "none"
                ? applySignDisease(raw, diseaseConfig, sign.ledColor.rgb | 0, options.previousMatrix)
                : raw;
        })();
    const mtxPixels = effectiveMatrix.pixels;
    const mtxW = effectiveMatrix.width;

    const borderColor = toHexColor(sign.borderColor.rgb);
    const offColor = sign.offColor ? toHexColor(sign.offColor.rgb) : "#18181b";
    const unlitFlipdotColor = "#121214";
    const unlitFlipdotStroke = "#1c1c20";

    const dotsByColor = new Map();
    const unlitDots = [];

    for (let my = 0; my < h; my++) {
        const baseY = borderSize + my * stepY;
        const rowOffset = my * mtxW;

        for (let mx = 0; mx < w; mx++) {
            const baseX = borderSize + mx * stepX;
            const srcPx = mtxPixels[rowOffset + mx];
            const alpha = (srcPx >>> 24) & 0xff;

            if (alpha !== 0) {
                const boostedPx = coreBoost > 0 ? computeHotCoreArgb(srcPx, coreBoost) : srcPx;
                const hex = toHexColor(boostedPx);
                if (!dotsByColor.has(hex)) {
                    dotsByColor.set(hex, []);
                }
                dotsByColor.get(hex).push({ baseX, baseY });
            } else if (withUnlit) {
                unlitDots.push({ baseX, baseY });
            }
        }
    }

    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${outW} ${outH}" width="${outW}" height="${outH}">`
    );

    if (glowPreset) {
        const innerRadius = Math.max(1, Math.round(ledSize * glowPreset.innerRadiusFactor));
        const outerRadius = Math.max(2, Math.round(ledSize * glowPreset.outerRadiusFactor));
        const innerDev = Number((innerRadius * 0.45).toFixed(2));
        const outerDev = Number((outerRadius * 0.45).toFixed(2));
        const innerSlope = Number(glowPreset.innerStrength.toFixed(2));
        const outerSlope = Number(glowPreset.outerStrength.toFixed(2));

        lines.push(`  <defs>`);
        lines.push(
            `    <filter id="led-glow" x="0" y="0" width="${outW}" height="${outH}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">`
        );
        lines.push(`      <feGaussianBlur in="SourceGraphic" stdDeviation="${outerDev}" result="blurOuter" />`);
        lines.push(`      <feComponentTransfer in="blurOuter" result="scaledOuter">`);
        lines.push(`        <feFuncA type="linear" slope="${outerSlope}" />`);
        lines.push(`      </feComponentTransfer>`);
        lines.push(`      <feGaussianBlur in="SourceGraphic" stdDeviation="${innerDev}" result="blurInner" />`);
        lines.push(`      <feComponentTransfer in="blurInner" result="scaledInner">`);
        lines.push(`        <feFuncA type="linear" slope="${innerSlope}" />`);
        lines.push(`      </feComponentTransfer>`);
        lines.push(`      <feComposite in="scaledOuter" in2="scaledInner" operator="arithmetic" k2="1" k3="1" result="bloom" />`);
        lines.push(`      <feBlend mode="screen" in="SourceGraphic" in2="bloom" />`);
        lines.push(`    </filter>`);
        lines.push(`  </defs>`);
    }

    if (!transparent) {
        lines.push(`  <rect width="100%" height="100%" fill="#000000" rx="2" />`);

        if (borderSize > 0 && borderColor !== "#000000") {
            lines.push(
                `  <rect x="${borderSize / 2}" y="${borderSize / 2}" width="${outW - borderSize}" height="${outH - borderSize}" fill="none" stroke="${borderColor}" stroke-width="${borderSize}" rx="2" />`
            );
        }

        if (withUnlit && unlitDots.length > 0) {
            if (isFlipdot) {
                lines.push(`  <g id="unlit-discs" fill="${unlitFlipdotColor}" stroke="${unlitFlipdotStroke}" stroke-width="0.5">`);
                for (let i = 0; i < unlitDots.length; i++) {
                    const dot = unlitDots[i];
                    lines.push(`    <circle cx="${fmt(dot.baseX + radius)}" cy="${fmt(dot.baseY + radius)}" r="${fmt(radius - 0.25)}" />`);
                }
                lines.push(`  </g>`);
            } else if (useCircles) {
                lines.push(`  <g id="unlit-leds" fill="${offColor}">`);
                for (let i = 0; i < unlitDots.length; i++) {
                    const dot = unlitDots[i];
                    lines.push(`    <circle cx="${fmt(dot.baseX + radius)}" cy="${fmt(dot.baseY + radius)}" r="${fmt(radius)}" />`);
                }
                lines.push(`  </g>`);
            } else {
                lines.push(`  <g id="unlit-leds" fill="${offColor}">`);
                for (let i = 0; i < unlitDots.length; i++) {
                    const dot = unlitDots[i];
                    lines.push(`    <rect x="${dot.baseX}" y="${dot.baseY}" width="${ledSize}" height="${ledSize}" rx="0.5" />`);
                }
                lines.push(`  </g>`);
            }
        }
    }

    const filterAttr = glowPreset ? ' filter="url(#led-glow)"' : "";
    for (const [hex, dots] of dotsByColor.entries()) {
        lines.push(`  <g id="lit-${hex.slice(1)}" fill="${hex}"${filterAttr}>`);
        if (useCircles) {
            for (let i = 0; i < dots.length; i++) {
                const dot = dots[i];
                lines.push(`    <circle cx="${fmt(dot.baseX + radius)}" cy="${fmt(dot.baseY + radius)}" r="${fmt(radius)}" />`);
            }
        } else {
            for (let i = 0; i < dots.length; i++) {
                const dot = dots[i];
                lines.push(`    <rect x="${dot.baseX}" y="${dot.baseY}" width="${ledSize}" height="${ledSize}" rx="0.5" />`);
            }
        }
        lines.push(`  </g>`);
    }

    lines.push(`</svg>`);
    return lines.join("\n");
}

export async function downloadSignSvg(signState, setIsDownloading, graphicsById = {}, options = {}) {
    try {
        if (typeof setIsDownloading === "function") setIsDownloading(true);

        const transparent = Boolean(options.transparent);
        const svgString = generateSignSvg(signState, graphicsById, options);
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const objectUrl = window.URL.createObjectURL(blob);

        const routeName = signState.route ? signState.route.replace(/\s+/g, "-") : "custom";
        const suffix = transparent ? "-transparent" : "";
        const fileName = `signmatrix-${routeName}${suffix}.svg`;

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
        console.error("Error generating SVG export:", error);
        alert("An error occurred while generating your SVG vector export.");
    } finally {
        if (typeof setIsDownloading === "function") setIsDownloading(false);
    }
}
