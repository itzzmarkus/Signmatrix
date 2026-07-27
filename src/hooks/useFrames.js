import {useState} from 'react';
import {getInitialState} from '../utils/signUtils';

const defaultFrame = {
    line1Font: "12d",
    line1Spacing: "6",
    line2Font: "9",
    line2Spacing: "0",
    animation: "NONE",
    animSpeed: "0.25",
    line1Align: "CENTRE",
    line2Align: "CENTRE",
    verticalSpacing: "FLUSH",
    delay: ""
};


function useFrames(setPreviewMode) {
    const [frames, setFrames] = useState(() => {
        const initLine1 = getInitialState("line1", "HASTINGS  ST").split("|");
        const initLine1Font = getInitialState("line1Font", "12d").split("|");
        const initLine1Spacing = getInitialState("line1Spacing", "6").split("|");
        const initLine2 = getInitialState("line2", "TO KOOTENAY LOOP").split("|");
        const initLine2Font = getInitialState("line2Font", "9").split("|");
        const initLine2Spacing = getInitialState("line2Spacing", "0").split("|");
        const initAnim = getInitialState("animation", "NONE").split("|");
        const initAnimSpeed = getInitialState("animSpeed", "0.25").split("|");
        const initL1Align = getInitialState("line1Align", "CENTRE").split("|");
        const initL2Align = getInitialState("line2Align", "CENTRE").split("|");
        const initVSpacing = getInitialState("verticalSpacing", "FLUSH").split("|");
        const initDelay = getInitialState("delay", "").split("|");

        const maxFrames = Math.max(initLine1.length, initLine2.length);
        const getVal = (arr, i) => arr[i] !== undefined ? arr[i] : (arr[arr.length - 1] || "");

        return Array.from({length: maxFrames}).map((_, i) => ({
            id: Date.now() + i,
            line1: getVal(initLine1, i),
            line1Font: getVal(initLine1Font, i),
            line1Spacing: getVal(initLine1Spacing, i),
            line2: getVal(initLine2, i),
            line2Font: getVal(initLine2Font, i),
            line2Spacing: getVal(initLine2Spacing, i),
            animation: getVal(initAnim, i),
            animSpeed: getVal(initAnimSpeed, i),
            line1Align: getVal(initL1Align, i),
            line2Align: getVal(initL2Align, i),
            verticalSpacing: getVal(initVSpacing, i),
            delay: getVal(initDelay, i),
        }));
    });

    const [prFrames, setPrFrames] = useState(() => {
        const initLine1 = getInitialState("prLine1", "").split("|");
        const initLine1Font = getInitialState("prLine1Font", "12d").split("|");
        const initLine1Spacing = getInitialState("prLine1Spacing", "6").split("|");
        const initLine2 = getInitialState("prLine2", "").split("|");
        const initLine2Font = getInitialState("prLine2Font", "9").split("|");
        const initLine2Spacing = getInitialState("prLine2Spacing", "0").split("|");
        const initAnim = getInitialState("prAnimation", "NONE").split("|");
        const initAnimSpeed = getInitialState("prAnimSpeed", "0.25").split("|");
        const initL1Align = getInitialState("prLine1Align", "CENTRE").split("|");
        const initL2Align = getInitialState("prLine2Align", "CENTRE").split("|");
        const initVSpacing = getInitialState("prVerticalSpacing", "FLUSH").split("|");
        const initDelay = getInitialState("prDelay", "").split("|");

        const maxFrames = Math.max(initLine1.length, initLine2.length);
        const getVal = (arr, i) => arr[i] !== undefined ? arr[i] : (arr[arr.length - 1] || "");

        return Array.from({length: maxFrames}).map((_, i) => ({
            id: Date.now() + i,
            line1: getVal(initLine1, i),
            line1Font: getVal(initLine1Font, i),
            line1Spacing: getVal(initLine1Spacing, i),
            line2: getVal(initLine2, i),
            line2Font: getVal(initLine2Font, i),
            line2Spacing: getVal(initLine2Spacing, i),
            animation: getVal(initAnim, i),
            animSpeed: getVal(initAnimSpeed, i),
            line1Align: getVal(initL1Align, i),
            line2Align: getVal(initL2Align, i),
            verticalSpacing: getVal(initVSpacing, i),
            delay: getVal(initDelay, i),
        }));
    });

    const addFrame = () => {
        setFrames(prev => {
            const lastFrame = prev.length > 0 ? prev[prev.length - 1] : defaultFrame;
            return [...prev, {...lastFrame, id: Date.now(), line1: "", line2: ""}];
        });
    };

    const addPrFrame = () => {
        setPrFrames(prev => {
            const lastFrame = prev.length > 0 ? prev[prev.length - 1] : (frames.length > 0 ? frames[frames.length - 1] : defaultFrame);
            return [...prev, {...lastFrame, id: Date.now(), line1: "", line2: ""}];
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

    return {
        frames,
        setFrames,
        prFrames,
        setPrFrames,
        addFrame,
        removeFrame,
        updateFrame,
        addPrFrame,
        removePrFrame,
        updatePrFrame
    };
}

export default useFrames;