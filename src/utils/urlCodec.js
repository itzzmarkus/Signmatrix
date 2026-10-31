import { FONTS_BUNDLE } from '../data/fontsBundle.js';
import { PRESETS } from '../data/presets.js';
import { serializeIcons, parseIcons } from './iconOverlays.js';
import { collectReferencedGraphicIds, serializeGraphicsParam, parseGraphicsParam } from './graphicCodec.js';

export const FONT_LIST = Object.keys(FONTS_BUNDLE);
const FONT_MAP = Object.fromEntries(FONT_LIST.map((f, i) => [f, i]));

export const PRESET_LIST = PRESETS.map(p => p.id);

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -./'&,";
const CHAR_MAP = Object.fromEntries(Array.from(CHARSET).map((c, i) => [c, i]));

export function toBase64Url(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export function fromBase64Url(base64Url) {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export function packText(text) {
    const s = String(text || '');
    if (s.length === 0) return [0x00, 0xFC];

    let is6Bit = true;
    for (let i = 0; i < s.length; i++) {
        if (CHAR_MAP[s[i]] === undefined) {
            is6Bit = false;
            break;
        }
    }

    if (is6Bit) {
        const vals = [];
        for (let i = 0; i < s.length; i++) {
            vals.push(CHAR_MAP[s[i]]);
        }
        vals.push(63);

        let bits = '';
        for (let i = 0; i < vals.length; i++) {
            let b = vals[i].toString(2);
            while (b.length < 6) b = '0' + b;
            bits += b;
        }
        while (bits.length % 8 !== 0) {
            bits += '0';
        }
        const bytes = [0x00];
        for (let i = 0; i < bits.length; i += 8) {
            bytes.push(parseInt(bits.slice(i, i + 8), 2));
        }
        return bytes;
    } else {
        const utf8Bytes = [];
        for (let i = 0; i < s.length; i++) {
            const code = s.charCodeAt(i);
            if (code < 128) {
                utf8Bytes.push(code);
            } else {
                utf8Bytes.push((code >> 8) & 0xFF);
                utf8Bytes.push(code & 0xFF);
            }
        }
        return [0x01, utf8Bytes.length & 0xFF, ...utf8Bytes];
    }
}

export function unpackText(bytes, offset) {
    if (offset >= bytes.length) return ['', offset];
    const mode = bytes[offset++];
    if (mode === 0x00) {
        let bits = '';
        let s = '';
        while (offset < bytes.length) {
            let b = bytes[offset++].toString(2);
            while (b.length < 8) b = '0' + b;
            bits += b;
            while (bits.length >= 6) {
                const val = parseInt(bits.slice(0, 6), 2);
                bits = bits.slice(6);
                if (val === 63) return [s, offset];
                s += CHARSET[val] || ' ';
            }
        }
        return [s, offset];
    } else if (mode === 0x01) {
        const len = bytes[offset++];
        let s = '';
        for (let i = 0; i < len; i++) {
            s += String.fromCharCode(bytes[offset++]);
        }
        return [s, offset];
    }
    return ['', offset];
}

function packFont(fontStr, fallback = '12d') {
    const f = String(fontStr || fallback);
    if (FONT_MAP[f] !== undefined) {
        return [FONT_MAP[f]];
    }
    return [0xFF, ...packText(f)];
}

function unpackFont(bytes, offset, fallback = '12d') {
    if (offset >= bytes.length) return [fallback, offset];
    const b = bytes[offset++];
    if (b === 0xFF) {
        return unpackText(bytes, offset);
    }
    return [FONT_LIST[b] || fallback, offset];
}

export function encodeSignToBinary(state, graphicsById = {}) {
    const bytes = [];
    bytes.push(0x01);

    const w = String(state.width || '200');
    const h = String(state.height || '24');
    const lz = String(state.ledSize || '10');
    const lg = String(state.ledGap || '1');
    const lgy = String(state.ledGapY !== undefined ? state.ledGapY : (state.ledGap || '2'));
    const shape = state.ledShape || 'round';
    const color = String(state.color || '#FF9000').toUpperCase().replace('#', '');
    const offColor = String(state.offColor || '#404040').toUpperCase().replace('#', '');

    const pIdx = PRESETS.findIndex(p =>
        String(p.width) === w &&
        String(p.height) === h &&
        String(p.ledSize) === lz &&
        String(p.ledGap) === lg &&
        String(p.ledGapY !== undefined ? p.ledGapY : p.ledGap) === lgy &&
        (p.ledShape || 'round') === shape &&
        String(p.color || '#FF9000').toUpperCase().replace('#', '') === color &&
        String(p.offColor || '#404040').toUpperCase().replace('#', '') === offColor &&
        (p.ledGlow || 'none') === (state.ledGlow || 'none') &&
        (p.displayType || 'led') === (state.displayType || 'led')
    );

    if (pIdx !== -1) {
        bytes.push(pIdx & 0x7F);
    } else {
        bytes.push(0x80);
        const numW = parseInt(w, 10) || 200;
        bytes.push((numW >> 8) & 0xFF);
        bytes.push(numW & 0xFF);
        bytes.push(parseInt(h, 10) || 24);
        bytes.push(parseInt(lz, 10) || 10);
        bytes.push(parseInt(lg, 10) || 1);
        bytes.push(parseInt(lgy, 10) || 2);
        bytes.push(shape === 'round' ? 0 : 1);
        const glowVal = (state.ledGlow === 'subtle' || state.ledGlow === 'low') ? 1 : (state.ledGlow === 'medium' ? 2 : ((state.ledGlow === 'bright' || state.ledGlow === 'high') ? 3 : 0));
        bytes.push(glowVal);
        const rgbColor = parseInt(color, 16) || 0xFF9000;
        bytes.push((rgbColor >> 16) & 0xFF);
        bytes.push((rgbColor >> 8) & 0xFF);
        bytes.push(rgbColor & 0xFF);
        const rgbOff = parseInt(offColor, 16) || 0x404040;
        bytes.push((rgbOff >> 16) & 0xFF);
        bytes.push((rgbOff >> 8) & 0xFF);
        bytes.push(rgbOff & 0xFF);
    }

    const numSpeed = parseInt(state.speed || '1800', 10) || 1800;
    bytes.push((numSpeed >> 8) & 0xFF);
    bytes.push(numSpeed & 0xFF);
    const autoScrollBit = state.autoScroll ? 1 : 0;
    const scrollSpeedVal = Math.min(Math.max(parseInt(state.scrollSpeed || '30', 10), 1), 255);
    const scrollPauseVal = Math.min(Math.max(Math.round(parseFloat(state.scrollPause || '1.0') * 10), 0), 255);
    bytes.push(autoScrollBit);
    bytes.push(scrollSpeedVal);
    bytes.push(scrollPauseVal);

    bytes.push(...packFont(state.routeFont, '24qa1'));
    const rAlign = state.routeAlign === 'CENTRE' ? 1 : (state.routeAlign === 'RIGHT' ? 2 : 0);
    const rInvert = state.routeInvert ? 1 : 0;
    const rbp = Math.min(Math.max(parseInt(state.routeBoxPadding ?? '3', 10), 0), 7);
    const rbg = Math.min(Math.max(parseInt(state.routeBoxGap ?? '2', 10), 0), 3);
    bytes.push((rAlign & 0x03) | (rInvert << 2) | (rbp << 3) | (rbg << 6));

    const cleanRouteColor = String(state.routeColor || '').replace(/#/g, '');
    const cleanRouteBoxColor = String(state.routeBoxColor || '').replace(/#/g, '');
    const hasRouteColor = Boolean(cleanRouteColor.replace(/\^/g, '') !== '');
    const hasRouteBoxColor = Boolean(cleanRouteBoxColor !== '');
    const hasRouteOffsets = Boolean(
        (state.routeXOffset && String(state.routeXOffset).replace(/0|\^/g, '') !== '') ||
        (state.routeYOffset && String(state.routeYOffset).replace(/0|\^/g, '') !== '')
    );
    const routeExtraFlags = (hasRouteColor ? 1 : 0) | (hasRouteBoxColor ? 2 : 0) | (hasRouteOffsets ? 4 : 0);
    bytes.push(routeExtraFlags);
    if (hasRouteColor) {
        bytes.push(...packText(cleanRouteColor));
    }
    if (hasRouteBoxColor) {
        const rgb = parseInt(cleanRouteBoxColor, 16) || 0xFF9000;
        bytes.push((rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF);
    }
    if (hasRouteOffsets) {
        bytes.push(...packText(String(state.routeXOffset || '0')));
        bytes.push(...packText(String(state.routeYOffset || '0')));
    }
    bytes.push(...packText(state.route || ''));

    const frames = Array.isArray(state.frames) && state.frames.length > 0
        ? state.frames
        : [{ line1: '', line1Font: '12d', line2: '', line2Font: '9' }];
    bytes.push(Math.min(frames.length, 255));

    const encodeFrame = (f) => {
        const a1 = f.line1Align === 'LEFT' ? 0 : (f.line1Align === 'RIGHT' ? 2 : 1);
        const a2 = f.line2Align === 'LEFT' ? 0 : (f.line2Align === 'RIGHT' ? 2 : 1);
        const vs = (f.verticalSpacing === 'EQUISPACED' || f.verticalSpacing === 'EQUAL') ? 1 : (f.verticalSpacing === 'BOTTOM' ? 2 : 0);
        bytes.push((a1 & 3) | ((a2 & 3) << 2) | ((vs & 3) << 4));

        bytes.push(...packFont(f.line1Font, '12d'));
        bytes.push(...packText(f.line1 || ''));

        bytes.push(...packFont(f.line2Font, '9'));
        bytes.push(...packText(f.line2 || ''));

        const iconsStr = serializeIcons(f.icons);
        const animMap = { FALLDOWN: 1, FALLUP: 2, SIDEWIPE: 3, SCROLL: 4 };
        const animCode = animMap[f.animation] || 0;
        const hasAnim = animCode > 0;
        const hasIcons = Boolean(iconsStr && iconsStr.length > 0);
        const hasDelay = Boolean(f.delay && f.delay !== '' && f.delay !== '1800');
        const hasSpacing = Boolean((f.line1Spacing && f.line1Spacing !== '0') || (f.line2Spacing && f.line2Spacing !== '0'));
        const hasOffsets = Boolean(
            (f.line1XOffset && String(f.line1XOffset).replace(/0|\^/g, '') !== '') ||
            (f.line1YOffset && String(f.line1YOffset).replace(/0|\^/g, '') !== '') ||
            (f.line2XOffset && String(f.line2XOffset).replace(/0|\^/g, '') !== '') ||
            (f.line2YOffset && String(f.line2YOffset).replace(/0|\^/g, '') !== '')
        );
        const cleanL1Color = String(f.line1Color || '').replace(/#/g, '');
        const cleanL2Color = String(f.line2Color || '').replace(/#/g, '');
        const hasColors = Boolean(
            cleanL1Color.replace(/\^/g, '') !== '' ||
            cleanL2Color.replace(/\^/g, '') !== ''
        );

        const extraFlags = (hasIcons ? 4 : 0) | (hasDelay ? 8 : 0) | (hasSpacing ? 16 : 0) | (hasOffsets ? 32 : 0) | (hasColors ? 64 : 0) | (hasAnim ? 128 : 0);
        bytes.push(extraFlags);
        if (hasIcons) {
            const rawIcons = iconsStr.slice(0, 255);
            bytes.push(rawIcons.length);
            for (let i = 0; i < rawIcons.length; i++) bytes.push(rawIcons.charCodeAt(i));
        }
        if (hasDelay) {
            const d = parseInt(f.delay, 10) || 1800;
            bytes.push((d >> 8) & 0xFF, d & 0xFF);
        }
        if (hasSpacing) {
            const s1 = Math.min(Math.max(parseInt(f.line1Spacing || '0', 10) || 0, -8), 7);
            const s2 = Math.min(Math.max(parseInt(f.line2Spacing || '0', 10) || 0, -8), 7);
            bytes.push((s1 & 0x0F) | ((s2 & 0x0F) << 4));
        }
        if (hasOffsets) {
            bytes.push(...packText(String(f.line1XOffset || '0')));
            bytes.push(...packText(String(f.line1YOffset || '0')));
            bytes.push(...packText(String(f.line2XOffset || '0')));
            bytes.push(...packText(String(f.line2YOffset || '0')));
        }
        if (hasColors) {
            bytes.push(...packText(cleanL1Color));
            bytes.push(...packText(cleanL2Color));
        }
        if (hasAnim) {
            const speedByte = Math.min(Math.max(Math.round((parseFloat(f.animSpeed || '0.25') || 0.25) * 100), 1), 255);
            bytes.push(animCode, speedByte);
        }
    };

    frames.forEach(encodeFrame);

    const rawPr = (state.prFrames || []).filter(f =>
        (f.line1 && f.line1.trim() !== '') ||
        (f.line2 && f.line2.trim() !== '') ||
        (Array.isArray(f.icons) && f.icons.length > 0)
    );
    bytes.push(Math.min(rawPr.length, 255));
    rawPr.forEach(encodeFrame);

    const usedGraphicIds = collectReferencedGraphicIds(state);
    if (usedGraphicIds.length > 0) {
        const usedGraphics = usedGraphicIds.map(id => graphicsById[id]).filter(Boolean);
        const cgParam = serializeGraphicsParam(usedGraphics);
        if (cgParam) {
            bytes.push(1);
            const cgRaw = cgParam.slice(0, 4096);
            const enc = new TextEncoder().encode(cgRaw);
            bytes.push((enc.length >> 8) & 0xFF);
            bytes.push(enc.length & 0xFF);
            for (let i = 0; i < enc.length; i++) bytes.push(enc[i]);
        } else {
            bytes.push(0);
        }
    } else {
        bytes.push(0);
    }

    if (state.signDisease && state.signDisease !== 'none') {
        const diseaseCodes = { mild: 1, moderate: 2, severe: 3, terminal: 4, custom: 5 };
        const code = diseaseCodes[state.signDisease] || 0;
        if (code > 0) {
            bytes.push(1);
            const seed = parseInt(state.diseaseSeed !== undefined ? state.diseaseSeed : 1337, 10) || 1337;
            const isCustom = code === 5;
            bytes.push((code & 0x07) | (isCustom ? 0x08 : 0x00));
            bytes.push((seed >> 8) & 0xFF, seed & 0xFF);
            if (isCustom) {
                const missingRows = Math.max(parseInt(state.diseaseMissingRows || '0', 10) || 0, 0);
                const missingRowHeight = Math.max(parseInt(state.diseaseMissingRowHeight || '1', 10) || 1, 1);
                const ghostRails = Math.max(parseInt(state.diseaseGhostRails || '0', 10) || 0, 0);
                const ghostRailHeight = Math.max(parseInt(state.diseaseGhostRailHeight || '1', 10) || 1, 1);
                const moduleDrop = state.diseaseModuleDropout ? 1 : 0;
                const deadRate = Math.min(Math.max(Math.round((parseFloat(state.diseaseDeadPixelRate || '0.03') * 100)), 0), 255);

                bytes.push(missingRows & 0xFF);
                bytes.push(missingRowHeight & 0xFF);
                bytes.push(ghostRails & 0xFF);
                bytes.push(ghostRailHeight & 0xFF);
                bytes.push(moduleDrop & 0xFF);
                bytes.push(deadRate & 0xFF);
            }
        } else {
            bytes.push(0);
        }
    } else {
        bytes.push(0);
    }

    const dt = state.displayType || 'led';
    if (dt === 'flipdot') {
        bytes.push(1);
        bytes.push(1);
        const cleanDc = String(state.color || '#C8E600').replace('#', '');
        const rgbVal = parseInt(cleanDc, 16) || 0xC8E600;
        bytes.push((rgbVal >> 16) & 0xFF, (rgbVal >> 8) & 0xFF, rgbVal & 0xFF);
    } else {
        bytes.push(0);
    }

    return new Uint8Array(bytes);
}

export function decodeBinaryToSign(bytes) {
    if (!bytes || bytes.length < 2) return null;
    let offset = 0;
    const ver = bytes[offset++];
    if (ver !== 0x01) return null;

    const state = {};
    const header = bytes[offset++];
    if ((header & 0x80) === 0) {
        const pIdx = header & 0x7F;
        const p = PRESETS[pIdx] || PRESETS[0];
        state.width = String(p.width);
        state.height = String(p.height);
        state.ledSize = String(p.ledSize);
        state.ledGap = String(p.ledGap);
        state.ledGapY = String(p.ledGapY !== undefined ? p.ledGapY : p.ledGap);
        state.ledShape = p.ledShape || 'round';
        state.color = p.color || '#FF9000';
        state.offColor = p.offColor || '#404040';
        state.ledGlow = p.ledGlow || 'none';
        state.speed = String(p.speed || '1800');
        state.displayType = p.displayType || 'led';
    } else {
        const w = (bytes[offset++] << 8) | bytes[offset++];
        state.width = String(w);
        state.height = String(bytes[offset++]);
        state.ledSize = String(bytes[offset++]);
        state.ledGap = String(bytes[offset++]);
        state.ledGapY = String(bytes[offset++]);
        state.ledShape = bytes[offset++] === 0 ? 'round' : 'square';
        const glowVal = bytes[offset++];
        state.ledGlow = glowVal === 1 ? 'subtle' : (glowVal === 2 ? 'medium' : (glowVal === 3 ? 'bright' : 'none'));
        const r1 = bytes[offset++].toString(16).padStart(2, '0');
        const g1 = bytes[offset++].toString(16).padStart(2, '0');
        const b1 = bytes[offset++].toString(16).padStart(2, '0');
        state.color = ('#' + r1 + g1 + b1).toUpperCase();
        const r2 = bytes[offset++].toString(16).padStart(2, '0');
        const g2 = bytes[offset++].toString(16).padStart(2, '0');
        const b2 = bytes[offset++].toString(16).padStart(2, '0');
        state.offColor = ('#' + r2 + g2 + b2).toUpperCase();
    }

    if (offset + 4 <= bytes.length) {
        const speedVal = (bytes[offset++] << 8) | bytes[offset++];
        state.speed = String(speedVal || 1800);
        state.autoScroll = bytes[offset++] === 1;
        state.scrollSpeed = String(bytes[offset++] || 30);
        const pauseDec = bytes[offset++];
        state.scrollPause = String(pauseDec ? (pauseDec / 10).toFixed(1) : '1.0');
    }

    const [rFont, nextOffFont] = unpackFont(bytes, offset, '24qa1');
    state.routeFont = rFont;
    offset = nextOffFont;
    const rFlags = bytes[offset++];
    const rAlign = rFlags & 0x03;
    state.routeAlign = rAlign === 1 ? 'CENTRE' : (rAlign === 2 ? 'RIGHT' : 'LEFT');
    state.routeInvert = ((rFlags >> 2) & 1) === 1;
    state.routeBoxPadding = String((rFlags >> 3) & 7);
    state.routeBoxGap = String((rFlags >> 6) & 3);

    const rxFlags = bytes[offset++];
    if (rxFlags & 1) {
        const [rcText, offRc] = unpackText(bytes, offset);
        state.routeColor = rcText;
        offset = offRc;
    } else {
        state.routeColor = '';
    }
    if (rxFlags & 2) {
        const r = bytes[offset++].toString(16).padStart(2, '0');
        const g = bytes[offset++].toString(16).padStart(2, '0');
        const b = bytes[offset++].toString(16).padStart(2, '0');
        state.routeBoxColor = (r + g + b).toUpperCase();
    } else {
        state.routeBoxColor = '';
    }
    if (rxFlags & 4) {
        const [rxStr, offRx] = unpackText(bytes, offset);
        const [ryStr, offRy] = unpackText(bytes, offRx);
        state.routeXOffset = rxStr || '0';
        state.routeYOffset = ryStr || '0';
        offset = offRy;
    } else {
        state.routeXOffset = '0';
        state.routeYOffset = '0';
    }

    const [rText, nextOff1] = unpackText(bytes, offset);
    state.route = rText;
    offset = nextOff1;

    const decodeFrameAt = (idxOffset) => {
        const flags = bytes[offset++];
        const a1 = flags & 3;
        const a2 = (flags >> 2) & 3;
        const vs = (flags >> 4) & 3;
        const [f1Font, offF1] = unpackFont(bytes, offset, '12d');
        offset = offF1;
        const [l1Text, offA] = unpackText(bytes, offset);
        offset = offA;
        const [f2Font, offF2] = unpackFont(bytes, offset, '9');
        offset = offF2;
        const [l2Text, offB] = unpackText(bytes, offset);
        offset = offB;

        let icons = [];
        let anim = 'NONE';
        let animSpeed = '0.25';
        let delay = '';
        let line1Spacing = '0';
        let line2Spacing = '0';
        let line1XOffset = '0';
        let line1YOffset = '0';
        let line2XOffset = '0';
        let line2YOffset = '0';
        let line1Color = '';
        let line2Color = '';

        const extraFlags = bytes[offset++];
        if (extraFlags > 0 && offset < bytes.length) {
            if (extraFlags & 4) {
                const iconsLen = bytes[offset++];
                let iconsStr = '';
                for (let k = 0; k < iconsLen && offset < bytes.length; k++) {
                    iconsStr += String.fromCharCode(bytes[offset++]);
                }
                icons = parseIcons(iconsStr);
            }
            if (extraFlags & 8) {
                const d = (bytes[offset++] << 8) | bytes[offset++];
                delay = String(d);
            }
            if (extraFlags & 16) {
                const sp = bytes[offset++];
                let s1 = sp & 0x0F;
                if (s1 > 7) s1 -= 16;
                let s2 = (sp >> 4) & 0x0F;
                if (s2 > 7) s2 -= 16;
                line1Spacing = String(s1);
                line2Spacing = String(s2);
            }
            if (extraFlags & 32) {
                const [x1, ox1] = unpackText(bytes, offset);
                const [y1, oy1] = unpackText(bytes, ox1);
                const [x2, ox2] = unpackText(bytes, oy1);
                const [y2, oy2] = unpackText(bytes, ox2);
                line1XOffset = x1 || '0';
                line1YOffset = y1 || '0';
                line2XOffset = x2 || '0';
                line2YOffset = y2 || '0';
                offset = oy2;
            }
            if (extraFlags & 64) {
                const [c1, oc1] = unpackText(bytes, offset);
                const [c2, oc2] = unpackText(bytes, oc1);
                line1Color = c1;
                line2Color = c2;
                offset = oc2;
            }
            if (extraFlags & 128) {
                const animCode = bytes[offset++];
                const speedByte = bytes[offset++];
                const animNames = ['NONE', 'FALLDOWN', 'FALLUP', 'SIDEWIPE', 'SCROLL'];
                anim = animNames[animCode] || 'NONE';
                animSpeed = String((speedByte || 25) / 100);
            }
        }

        return {
            id: Date.now() + idxOffset,
            line1: l1Text,
            line1Font: f1Font,
            line1Color,
            line1Spacing,
            line1Align: a1 === 0 ? 'LEFT' : (a1 === 2 ? 'RIGHT' : 'CENTRE'),
            line1XOffset,
            line1YOffset,
            line2: l2Text,
            line2Font: f2Font,
            line2Color,
            line2Spacing,
            line2Align: a2 === 0 ? 'LEFT' : (a2 === 2 ? 'RIGHT' : 'CENTRE'),
            line2XOffset,
            line2YOffset,
            verticalSpacing: vs === 1 ? 'EQUISPACED' : 'FLUSH',
            animation: anim,
            animSpeed,
            delay,
            icons
        };
    };

    const fCount = bytes[offset++];
    state.frames = [];
    for (let i = 0; i < fCount && offset < bytes.length; i++) {
        state.frames.push(decodeFrameAt(i));
    }

    const prCount = offset < bytes.length ? bytes[offset++] : 0;
    state.prFrames = [];
    for (let i = 0; i < prCount && offset < bytes.length; i++) {
        state.prFrames.push(decodeFrameAt(100 + i));
    }

    if (offset < bytes.length && bytes[offset++] === 1) {
        const cgLen = (bytes[offset++] << 8) | bytes[offset++];
        if (cgLen > 0 && offset + cgLen <= bytes.length) {
            const rawBytes = bytes.slice(offset, offset + cgLen);
            offset += cgLen;
            const cgStr = new TextDecoder().decode(rawBytes);
            state.customGraphics = parseGraphicsParam(cgStr);
        }
    }

    if (offset < bytes.length && bytes[offset++] === 1) {
        if (offset < bytes.length) {
            const diseaseHeader = bytes[offset++];
            const code = diseaseHeader & 0x07;
            const isCustom = ((diseaseHeader >> 3) & 1) === 1;
            const presets = ['', 'mild', 'moderate', 'severe', 'terminal', 'custom'];
            state.signDisease = presets[code] || 'none';
            if (offset + 1 < bytes.length) {
                const seedHi = bytes[offset++];
                const seedLo = bytes[offset++];
                state.diseaseSeed = String((seedHi << 8) | seedLo);
            } else {
                state.diseaseSeed = '1337';
            }
            if (isCustom && offset + 5 < bytes.length) {
                state.diseaseMissingRows = String(bytes[offset++]);
                state.diseaseMissingRowHeight = String(bytes[offset++]);
                state.diseaseGhostRails = String(bytes[offset++]);
                state.diseaseGhostRailHeight = String(bytes[offset++]);
                state.diseaseModuleDropout = bytes[offset++] === 1;
                const deadRate = bytes[offset++];
                state.diseaseDeadPixelRate = String((deadRate / 100).toFixed(3));
            }
        }
    } else if (state.signDisease === undefined) {
        state.signDisease = 'none';
        state.diseaseSeed = '1337';
    }

    if (offset < bytes.length && bytes[offset++] === 1) {
        if (offset < bytes.length) {
            const headerByte = bytes[offset++];
            const dtCode = headerByte & 0x03;
            state.displayType = dtCode >= 1 ? 'flipdot' : 'led';
            if (offset + 3 <= bytes.length) {
                const r = bytes[offset++].toString(16).padStart(2, '0');
                const g = bytes[offset++].toString(16).padStart(2, '0');
                const b = bytes[offset].toString(16).padStart(2, '0');
                state.color = ('#' + r + g + b).toUpperCase();
            }
        }
    } else if (state.displayType === undefined) {
        state.displayType = 'led';
    }

    return state;
}

export function encodeSignToHash(state, graphicsById = {}) {
    try {
        const binary = encodeSignToBinary(state, graphicsById);
        return 's=' + toBase64Url(binary);
    } catch (e) {
        console.warn('Failed to encode sign to hash:', e);
        return '';
    }
}

export function decodeSignFromHash(hashString) {
    if (!hashString || typeof hashString !== 'string') return null;
    const cleanHash = hashString.replace(/^#/, '');
    if (!cleanHash.startsWith('s=')) return null;
    try {
        const b64 = cleanHash.slice(2);
        const bytes = fromBase64Url(b64);
        return decodeBinaryToSign(bytes);
    } catch (e) {
        console.warn('Failed to decode sign from hash:', e);
        return null;
    }
}
