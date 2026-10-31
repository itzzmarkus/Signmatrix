import { TRANSIT_LOGOS } from "../data/transitLogos.js";

export const ICON_ANCHORS = ["LEFT", "CENTRE", "RIGHT"];
export const BUILTIN_ICON_FONTS = new Set(["logo", "logo16", "smartgraphics"]);
export const MAX_ICONS_PER_FRAME = 16;

const ANCHOR_TO_CODE = { LEFT: "L", CENTRE: "C", RIGHT: "R" };
const CODE_TO_ANCHOR = { L: "LEFT", C: "CENTRE", R: "RIGHT" };

let iconCounter = 0;

export function newIconInstanceId() {
    iconCounter += 1;
    return `ic${Date.now().toString(36)}${iconCounter}`;
}

export function isIconFont(font) {
    const f = String(font || "").trim();
    return f.startsWith("@") || BUILTIN_ICON_FONTS.has(f);
}

export function createIcon({ font, char = "A", color = "", anchor = "LEFT", x = 0, y = 0 }) {
    return {
        id: newIconInstanceId(),
        font: String(font || ""),
        char: String(char || "A"),
        color: String(color || "").replace("#", ""),
        anchor: ICON_ANCHORS.includes(anchor) ? anchor : "LEFT",
        x: parseInt(x, 10) || 0,
        y: parseInt(y, 10) || 0
    };
}

export function serializeIcons(icons) {
    if (!Array.isArray(icons) || icons.length === 0) return "";
    return icons
        .slice(0, MAX_ICONS_PER_FRAME)
        .filter((ic) => ic && ic.font)
        .map((ic) => {
            const code = String(ic.char || "A").codePointAt(0).toString(16);
            const color = String(ic.color || "").replace("#", "");
            const anchor = ANCHOR_TO_CODE[ic.anchor] || "L";
            return [ic.font, code, color, anchor, parseInt(ic.x, 10) || 0, parseInt(ic.y, 10) || 0].join("~");
        })
        .join("^");
}

export function parseIcons(str) {
    if (!str || typeof str !== "string") return [];
    const out = [];
    for (const raw of str.split("^").slice(0, MAX_ICONS_PER_FRAME)) {
        const parts = raw.split("~");
        if (parts.length < 6) continue;
        const [font, code, color, anchorCode, x, y] = parts;
        if (!font) continue;
        const codePoint = parseInt(code, 16);
        if (!Number.isFinite(codePoint)) continue;
        out.push(
            createIcon({
                font,
                char: String.fromCodePoint(codePoint),
                color: /^[0-9a-f]{6}$/i.test(color) ? color : "",
                anchor: CODE_TO_ANCHOR[anchorCode] || "LEFT",
                x,
                y
            })
        );
    }
    return out;
}

export function toIconSpecs(icons) {
    if (!Array.isArray(icons)) return [];
    return icons
        .filter((ic) => ic && ic.font)
        .map((ic) => ({
            font: ic.font,
            char: ic.char,
            color: ic.color || null,
            anchor: ic.anchor || "LEFT",
            x: parseInt(ic.x, 10) || 0,
            y: parseInt(ic.y, 10) || 0
        }));
}

export function cloneIcons(icons) {
    if (!Array.isArray(icons)) return [];
    return icons.map((ic) => ({ ...ic, id: newIconInstanceId() }));
}

export function resolveIconAsset(fontValue, charValue, graphicsById = {}) {
    const font = String(fontValue || "").trim();
    if (font.startsWith("@")) {
        const id = font.slice(1).toLowerCase();
        const graphic = graphicsById[id];
        return graphic
            ? { kind: "custom", id, graphic, name: graphic.name, width: graphic.width, height: graphic.height, rows: graphic.rows }
            : { kind: "missing", id, name: `@${id}` };
    }
    const ch = String(charValue || "");
    const logo = TRANSIT_LOGOS.find((l) => l.font === font && l.char === ch);
    if (logo) {
        const label = logo.name || `${logo.fontLabel || logo.font} (${logo.char})`;
        return { kind: "builtin", name: label, width: logo.width, height: logo.height, rows: logo.rows, logo };
    }
    return { kind: "missing", id: `${font}:${ch}`, name: `${font} ${ch}` };
}
