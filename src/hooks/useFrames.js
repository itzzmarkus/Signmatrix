import {useState} from 'react';
import {getInitialState, getInitialHashState} from '../utils/signUtils';
import {parseIcons, cloneIcons} from '../utils/iconOverlays.js';

const defaultFrame = {
    line1Font: "12d",
    line1Color: "",
    line1Spacing: "0",
    line1XOffset: "0",
    line1YOffset: "0",
    line2Font: "9",
    line2Color: "",
    line2Spacing: "0",
    line2XOffset: "0",
    line2YOffset: "0",
    animation: "NONE",
    animSpeed: "0.25",
    line1Align: "CENTRE",
    line2Align: "CENTRE",
    verticalSpacing: "FLUSH",
    delay: "",
    icons: []
};


function useFrames(setPreviewMode) {
    const [frames, setFrames] = useState(() => {
        const hashState = getInitialHashState();
        if (hashState?.frames && hashState.frames.length > 0) {
            return hashState.frames;
        }

        const initLine1 = getInitialState("line1", "H A S T I N G S  S T").split("|");
        const initLine1Font = getInitialState("line1Font", "12d").split("|");
        const initLine1Spacing = getInitialState("line1Spacing", "0").split("|");
        const initLine1XOffset = getInitialState("line1XOffset", "0").split("|");
        const initLine1YOffset = getInitialState("line1YOffset", "0").split("|");
        const initLine2 = getInitialState("line2", "TO KOOTENAY LOOP").split("|");
        const initLine2Font = getInitialState("line2Font", "9").split("|");
        const initLine2Spacing = getInitialState("line2Spacing", "0").split("|");
        const initLine2XOffset = getInitialState("line2XOffset", "0").split("|");
        const initLine2YOffset = getInitialState("line2YOffset", "0").split("|");

        const initLine1Color = getInitialState("line1Color", "").split("|");
        const initLine2Color = getInitialState("line2Color", "").split("|")

        const initAnim = getInitialState("animation", "NONE").split("|");
        const initAnimSpeed = getInitialState("animSpeed", "0.25").split("|");
        const initL1Align = getInitialState("line1Align", "CENTRE").split("|");
        const initL2Align = getInitialState("line2Align", "CENTRE").split("|");
        const initVSpacing = getInitialState("verticalSpacing", "FLUSH").split("|");
        const initDelay = getInitialState("delay", "").split("|");
        const initIcons = getInitialState("icons", "").split("|");

        const frameCount = parseInt(getInitialState("fc", "1"), 10) || 1;
        const maxFrames = Math.max(frameCount, initLine1.length, initLine2.length);
        const getVal = (arr, i) => arr[i] !== undefined ? arr[i] : (arr[arr.length - 1] || "");

        return Array.from({length: maxFrames}).map((_, i) => ({
            id: Date.now() + i,
            line1: getVal(initLine1, i),
            line1Font: getVal(initLine1Font, i),
            line1Color: getVal(initLine1Color, i),
            line1Spacing: getVal(initLine1Spacing, i),
            line1XOffset: getVal(initLine1XOffset, i) || "0",
            line1YOffset: getVal(initLine1YOffset, i) || "0",
            line2: getVal(initLine2, i),
            line2Font: getVal(initLine2Font, i),
            line2Color: getVal(initLine2Color, i),
            line2Spacing: getVal(initLine2Spacing, i),
            line2XOffset: getVal(initLine2XOffset, i) || "0",
            line2YOffset: getVal(initLine2YOffset, i) || "0",
            animation: getVal(initAnim, i),
            animSpeed: getVal(initAnimSpeed, i),
            line1Align: getVal(initL1Align, i),
            line2Align: getVal(initL2Align, i),
            verticalSpacing: getVal(initVSpacing, i),
            delay: getVal(initDelay, i),
            icons: parseIcons(getVal(initIcons, i)),
        }));
    });

    const [prFrames, setPrFrames] = useState(() => {
        const hashState = getInitialHashState();
        if (hashState?.prFrames) {
            return hashState.prFrames;
        }

        const initLine1 = getInitialState("prLine1", "").split("|");
        const initLine1Font = getInitialState("prLine1Font", "12d").split("|");
        const initLine1Color = getInitialState("prLine1Color", "").split("|");
        const initLine1Spacing = getInitialState("prLine1Spacing", "0").split("|");
        const initLine1XOffset = getInitialState("prLine1XOffset", "0").split("|");
        const initLine1YOffset = getInitialState("prLine1YOffset", "0").split("|");
        const initLine2 = getInitialState("prLine2", "").split("|");
        const initLine2Font = getInitialState("prLine2Font", "9").split("|");
        const initLine2Color = getInitialState("prLine2Color", "").split("|");
        const initLine2Spacing = getInitialState("prLine2Spacing", "0").split("|");
        const initLine2XOffset = getInitialState("prLine2XOffset", "0").split("|");
        const initLine2YOffset = getInitialState("prLine2YOffset", "0").split("|");
        const initAnim = getInitialState("prAnimation", "NONE").split("|");
        const initAnimSpeed = getInitialState("prAnimSpeed", "0.18").split("|");
        const initL1Align = getInitialState("prLine1Align", "CENTRE").split("|");
        const initL2Align = getInitialState("prLine2Align", "CENTRE").split("|");
        const initVSpacing = getInitialState("prVerticalSpacing", "FLUSH").split("|");
        const initDelay = getInitialState("prDelay", "").split("|");
        const initIcons = getInitialState("prIcons", "").split("|");

        const prFrameCount = parseInt(getInitialState("prfc", "1"), 10) || 1;
        const maxFrames = Math.max(prFrameCount, initLine1.length, initLine2.length);
        const getVal = (arr, i) => arr[i] !== undefined ? arr[i] : (arr[arr.length - 1] || "");

        return Array.from({length: maxFrames}).map((_, i) => ({
            id: Date.now() + i,
            line1: getVal(initLine1, i),
            line1Font: getVal(initLine1Font, i),
            line1Color: getVal(initLine1Color, i),
            line1Spacing: getVal(initLine1Spacing, i),
            line1XOffset: getVal(initLine1XOffset, i) || "0",
            line1YOffset: getVal(initLine1YOffset, i) || "0",
            line2: getVal(initLine2, i),
            line2Font: getVal(initLine2Font, i),
            line2Color: getVal(initLine2Color, i),
            line2Spacing: getVal(initLine2Spacing, i),
            line2XOffset: getVal(initLine2XOffset, i) || "0",
            line2YOffset: getVal(initLine2YOffset, i) || "0",
            animation: getVal(initAnim, i),
            animSpeed: getVal(initAnimSpeed, i),
            line1Align: getVal(initL1Align, i),
            line2Align: getVal(initL2Align, i),
            verticalSpacing: getVal(initVSpacing, i),
            delay: getVal(initDelay, i),
            icons: parseIcons(getVal(initIcons, i)),
        }));
    });

    const addFrame = () => {
        setFrames(prev => {
            const lastFrame = prev.length > 0 ? prev[prev.length - 1] : defaultFrame;
            return [...prev, {...lastFrame, id: Date.now(), line1: "", line2: "", icons: cloneIcons(lastFrame.icons)}];
        });
    };

    const addPrFrame = () => {
        setPrFrames(prev => {
            const lastFrame = prev.length > 0 ? prev[prev.length - 1] : (frames.length > 0 ? frames[frames.length - 1] : defaultFrame);
            return [...prev, {...lastFrame, id: Date.now(), line1: "", line2: "", icons: cloneIcons(lastFrame.icons)}];
        });
    };

    const removeFrame = (id) => {
        setPreviewMode("all");
        setFrames(prev => prev.filter(f => f.id !== id));
    };

    const updateFrame = (id, field, value) => {
        setFrames(prev => prev.map(f => f.id === id ? {...f, [field]: value} : f));
    };

    const removePrFrame = (id) => {
        setPreviewMode("all");
        setPrFrames(prev => prev.filter(f => f.id !== id));
    };

    const updatePrFrame = (id, field, value) => {
        setPrFrames(prev => prev.map(f => f.id === id ? {...f, [field]: value} : f));
    };

    const reorderFrames = (startIndex, endIndex) => {
        if (startIndex === endIndex) return;
        setFrames(prev => {
            const next = [...prev];
            const [moved] = next.splice(startIndex, 1);
            next.splice(endIndex, 0, moved);
            return next;
        });
    };

    const reorderPrFrames = (startIndex, endIndex) => {
        if (startIndex === endIndex) return;
        setPrFrames(prev => {
            const next = [...prev];
            const [moved] = next.splice(startIndex, 1);
            next.splice(endIndex, 0, moved);
            return next;
        });
    };

    const duplicateFrame = (id) => {
        setFrames(prev => {
            const index = prev.findIndex(f => f.id === id);
            if (index === -1) return prev;
            const source = prev[index];
            const clone = { ...source, id: Date.now(), icons: cloneIcons(source.icons) };
            const next = [...prev];
            next.splice(index + 1, 0, clone);
            return next;
        });
    };

    const duplicatePrFrame = (id) => {
        setPrFrames(prev => {
            const index = prev.findIndex(f => f.id === id);
            if (index === -1) return prev;
            const source = prev[index];
            const clone = { ...source, id: Date.now(), icons: cloneIcons(source.icons) };
            const next = [...prev];
            next.splice(index + 1, 0, clone);
            return next;
        });
    };

    return {
        frames,
        setFrames,
        prFrames,
        setPrFrames,
        addFrame,
        removeFrame,
        updateFrame,
        duplicateFrame,
        reorderFrames,
        addPrFrame,
        removePrFrame,
        updatePrFrame,
        duplicatePrFrame,
        reorderPrFrames
    };
}

export default useFrames;