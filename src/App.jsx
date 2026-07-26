import {useEffect, useState} from 'react';
import useDebounce from './hooks/useDebounce';
import LivePreview from './components/LivePreview';

import logo from './assets/Signmatrix.png';
import FrameView from "./components/FrameView.jsx";
import InputGroup from "./components/InputGroup.jsx";
import FontDropdown from "./components/FontDropdown.jsx";
import {Analytics} from "@vercel/analytics/react";
import {track} from '@vercel/analytics';

const CURRENT_UPDATE_VERSION = "v1.3";

const getInitialState = (key, defaultVal) => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.has(key)) return params.get(key);
        return defaultVal;
    }
    return defaultVal;
};

export default function App() {
    const [showUpdateLog, setShowUpdateLog] = useState(false);
    const [showCheatSheet, setShowCheatSheet] = useState(false);

    const [previewMode, setPreviewMode] = useState("all");

    const [color, setColor] = useState(() => getInitialState("color", "#FF9000"));
    const [width, setWidth] = useState(() => getInitialState("width", "200"));
    const [height, setHeight] = useState(() => getInitialState("height", "24"));
    const [speed, setSpeed] = useState(() => getInitialState("speed", "2500"));
    const [isDownloading, setIsDownloading] = useState(false);
    const [route, setRoute] = useState(() => getInitialState("route", "R5").split('|')[0]);
    const [routeFont, setRouteFont] = useState(() => getInitialState("routeFont", "22t").split('|')[0]);
    const [routeSuffix, setRouteSuffix] = useState(() => getInitialState("routeSuffix", ""));
    const [routeSuffixFont, setRouteSuffixFont] = useState(() => getInitialState("routeSuffixFont", "8d"));
    const [routeAlign, setRouteAlign] = useState(() => getInitialState("routeAlign", "LEFT"));
    const [ledShape, setLedShape] = useState(() => getInitialState("ledShape", "square"));
    const [ledSize, setLedSize] = useState(() => getInitialState("ledSize", "3"));
    const [ledGap, setLedGap] = useState(() => getInitialState("ledGap", "1"));
    const [offColor, setOffColor] = useState(() => getInitialState("offColor", "#404040"));

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
        }));
    });

    const debouncedState = useDebounce({
        frames, prFrames, color, width, height, speed, previewMode, route, routeFont, routeSuffix, routeSuffixFont, routeAlign,
        ledShape, ledSize, ledGap, offColor
    }, 300);

    useEffect(() => {
        const seenVersion = localStorage.getItem("signmatrix_update_seen");
        if (seenVersion !== CURRENT_UPDATE_VERSION) {
            setShowUpdateLog(true);
        }
    }, []);

    const handleCloseUpdateLog = () => {
        localStorage.setItem("signmatrix_update_seen", CURRENT_UPDATE_VERSION);
        setShowUpdateLog(false);
    };

    const defaultFrame = {
        line1Font: "12d", line1Spacing: "6", line2Font: "9", line2Spacing: "0",
        animation: "NONE", animSpeed: "0.25", line1Align: "CENTRE", line2Align: "CENTRE", verticalSpacing: "FLUSH"
    };

    const addFrame = () => {
        const lastFrame = frames.length > 0 ? frames[frames.length - 1] : defaultFrame;
        setFrames([...frames, { ...lastFrame, id: Date.now(), line1: "", line2: "" }]);
    };

    const addPrFrame = () => {
        const lastFrame = prFrames.length > 0 ? prFrames[prFrames.length - 1] : (frames.length > 0 ? frames[frames.length - 1] : defaultFrame);
        setPrFrames([...prFrames, { ...lastFrame, id: Date.now(), line1: "", line2: "" }]);
    };

    const removeFrame = (id) => {
        setPreviewMode("all");
        setFrames(frames.filter(f => f.id !== id));
    };

    const updateFrame = (id, field, value) => {
        setFrames(frames.map(f => f.id === id ? {...f, [field]: value} : f));
    };

    const removePrFrame = (id) => {
        setPreviewMode("all");
        setPrFrames(prFrames.filter(f => f.id !== id));
    };

    const updatePrFrame = (id, field, value) => {
        setPrFrames(prFrames.map(f => f.id === id ? {...f, [field]: value} : f));
    };

    useEffect(() => {
        const params = new URLSearchParams();

        const add = (key, value, defaultVal) => {
            if (value !== defaultVal) params.set(key, value);
        };

        const compress = (arr) => {
            if (arr.every(v => v === arr[0])) return arr[0];
            return arr.join("|");
        };

        add("route", debouncedState.route, "R5");
        add("routeFont", debouncedState.routeFont, "22t");
        add("routeSuffix", debouncedState.routeSuffix, "");
        add("routeSuffixFont", debouncedState.routeSuffixFont, "8d");
        add("routeAlign", debouncedState.routeAlign, "LEFT");

        add("color", debouncedState.color, "#FF9000");
        add("offColor", debouncedState.offColor.replace("#", ""), "404040");
        add("width", debouncedState.width, "200");
        add("height", debouncedState.height, "24");
        add("speed", debouncedState.speed, "2500");
        add("ledShape", debouncedState.ledShape, "square");
        add("ledSize", debouncedState.ledSize, "3");
        add("ledGap", debouncedState.ledGap, "1");

        add("line1", compress(debouncedState.frames.map(f => f.line1)), "HASTINGS  ST");
        add("line1Font", compress(debouncedState.frames.map(f => f.line1Font)), "12d");
        add("line1Spacing", compress(debouncedState.frames.map(f => f.line1Spacing)), "6");
        add("line2", compress(debouncedState.frames.map(f => f.line2)), "TO KOOTENAY LOOP");
        add("line2Font", compress(debouncedState.frames.map(f => f.line2Font)), "9");
        add("line2Spacing", compress(debouncedState.frames.map(f => f.line2Spacing)), "0");
        add("animation", compress(debouncedState.frames.map(f => f.animation)), "NONE");
        add("animSpeed", compress(debouncedState.frames.map(f => f.animSpeed)), "0.25");
        add("line1Align", compress(debouncedState.frames.map(f => f.line1Align)), "CENTRE");
        add("line2Align", compress(debouncedState.frames.map(f => f.line2Align)), "CENTRE");
        add("verticalSpacing", compress(debouncedState.frames.map(f => f.verticalSpacing)), "FLUSH");

        const hasPrText = debouncedState.prFrames.some(f => f.line1.trim() !== "" || f.line2.trim() !== "");
        if (hasPrText) {
            add("prLine1", compress(debouncedState.prFrames.map(f => f.line1)), "");
            add("prLine1Font", compress(debouncedState.prFrames.map(f => f.line1Font)), "12d");
            add("prLine1Spacing", compress(debouncedState.prFrames.map(f => f.line1Spacing)), "6");
            add("prLine2", compress(debouncedState.prFrames.map(f => f.line2)), "");
            add("prLine2Font", compress(debouncedState.prFrames.map(f => f.line2Font)), "9");
            add("prLine2Spacing", compress(debouncedState.prFrames.map(f => f.line2Spacing)), "0");
            add("prAnimation", compress(debouncedState.prFrames.map(f => f.animation)), "NONE");
            add("prAnimSpeed", compress(debouncedState.prFrames.map(f => f.animSpeed)), "0.25");
            add("prLine1Align", compress(debouncedState.prFrames.map(f => f.line1Align)), "CENTRE");
            add("prLine2Align", compress(debouncedState.prFrames.map(f => f.line2Align)), "CENTRE");
            add("prVerticalSpacing", compress(debouncedState.prFrames.map(f => f.verticalSpacing)), "FLUSH");
        }

        const paramString = params.toString();
        const newUrl = paramString ? `${window.location.pathname}?${paramString}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);

    }, [debouncedState]);

    const downloadSign = async () => {
        try {
            setIsDownloading(true);
            const url = buildApiUrl();
            const response = await fetch(url);
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);

            const hasActivePr = prFrames.some(f => f.line1.trim() !== "" || f.line2.trim() !== "");
            const isGif = previewMode === "all" && (frames.length > 1 || hasActivePr);

            const extension = isGif ? "gif" : "png";

            const routeName = frames[0].route ? frames[0].route.replace(/\s+/g, '-') : "custom";
            const fileName = `signmatrix-${routeName}.${extension}`;

            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(objectUrl);
            track('Downloaded Sign', {
                route: debouncedState.route,
                line1: debouncedState.frames[0]?.line1
            });
        } catch (error) {
            console.error(error);
            alert("Uh... something went wrong downloading your sign")
        } finally {
            setIsDownloading(false);
        }
    }

    const buildApiUrl = () => {
        const query = new URLSearchParams();

        let targetFrames = debouncedState.frames;
        let targetPrFrames = debouncedState.prFrames;
        let activeRoute = debouncedState.route;
        let activeRouteSuffix = debouncedState.routeSuffix;

        if (debouncedState.previewMode !== "all") {
            if (debouncedState.previewMode.startsWith("pr-")) {
                const prIndex = parseInt(debouncedState.previewMode.split("-")[1], 10);
                if (targetPrFrames[prIndex]) {
                    targetFrames = [targetPrFrames[prIndex]];
                }
                targetPrFrames = [];
                activeRoute = "";
                activeRouteSuffix = "";
            } else {
                const frameIndex = parseInt(debouncedState.previewMode, 10);
                if (targetFrames[frameIndex]) {
                    targetFrames = [targetFrames[frameIndex]];
                }
                targetPrFrames = [];
            }
        }

        if (activeRoute) query.append("route", activeRoute);
        query.append("routeFont", debouncedState.routeFont);

        query.append("line1", targetFrames.map(f => f.line1).join("|"));
        query.append("line1Font", targetFrames.map(f => f.line1Font).join("|"));
        query.append("line1Spacing", targetFrames.map(f => f.line1Spacing).join("|"));
        query.append("line2", targetFrames.map(f => f.line2).join("|"));
        query.append("line2Font", targetFrames.map(f => f.line2Font).join("|"));
        query.append("line2Spacing", targetFrames.map(f => f.line2Spacing).join("|"));
        query.append("animation", targetFrames.map(f => f.animation).join("|"));
        query.append("animSpeed", targetFrames.map(f => f.animSpeed).join("|"));
        if (debouncedState.routeAlign !== "LEFT") query.append("routeAlign", debouncedState.routeAlign);
        query.append("line1Align", targetFrames.map(f => f.line1Align).join("|"));
        query.append("line2Align", targetFrames.map(f => f.line2Align).join("|"));
        query.append("verticalSpacing", targetFrames.map(f => f.verticalSpacing).join("|"));
        query.append("ledShape", debouncedState.ledShape);
        query.append("ledSize", debouncedState.ledSize);
        query.append("ledGap", debouncedState.ledGap);
        query.append("offColor", debouncedState.offColor.replace("#", ""));

        if (targetPrFrames.length > 0) {
            query.append("prLine1", targetPrFrames.map(f => f.line1).join("|"));
            query.append("prLine1Font", targetPrFrames.map(f => f.line1Font).join("|"));
            query.append("prLine1Spacing", targetPrFrames.map(f => f.line1Spacing).join("|"));
            query.append("prLine2", targetPrFrames.map(f => f.line2).join("|"));
            query.append("prLine2Font", targetPrFrames.map(f => f.line2Font).join("|"));
            query.append("prLine2Spacing", targetPrFrames.map(f => f.line2Spacing).join("|"));
            query.append("prAnimation", targetPrFrames.map(f => f.animation).join("|"));
            query.append("prAnimSpeed", targetPrFrames.map(f => f.animSpeed).join("|"));
            query.append("prLine1Align", targetPrFrames.map(f => f.line1Align).join("|"));
            query.append("prLine2Align", targetPrFrames.map(f => f.line2Align).join("|"));
            query.append("prVerticalSpacing", targetPrFrames.map(f => f.verticalSpacing).join("|"));
        }

        query.append("color", debouncedState.color.replace("#", ""));
        query.append("width", debouncedState.width);
        query.append("height", debouncedState.height);
        query.append("speed", debouncedState.speed);
        if (activeRouteSuffix) query.append("routeSuffix", activeRouteSuffix);
        query.append("routeSuffixFont", debouncedState.routeSuffixFont);

        return `https://signmatrix.vercel.app/api/sign?${query.toString()}`;
    };
    const resetHardwareSettings = () => {
        setWidth("200");
        setHeight("24");
        setColor("#FF9000");
        setOffColor("#404040");
        setLedShape("square");
        setLedSize("3");
        setLedGap("1");
        setSpeed("2500");
    };

    return (<div className="max-w-4xl mx-auto p-6 w-full space-y-4">
        {showUpdateLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                <div className="bg-zinc-900 border border-neutral-700 rounded-lg shadow-2xl max-w-md w-full p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">New Signmatrix update</h2>
                    <p className="text-sm text-neutral-400 mb-4">Version {CURRENT_UPDATE_VERSION}</p>
                    <div className="text-neutral-300 space-y-3 mb-6">
                        <p>• You can now add PR codes, which do not have a route number and autoplay after your main frames</p>
                        <p>• Added misc. hardware options</p>
                        <p>• Added a cheatsheet next to "Global Routes" that describes kerning and spacing options </p>
                    </div>
                    <button
                        onClick={handleCloseUpdateLog}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                        epic, let's go!
                    </button>
                </div>
            </div>)}
        {showCheatSheet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-zinc-900 border border-neutral-700 rounded-lg shadow-2xl max-w-lg w-full p-6 relative">
                    <button
                        onClick={() => setShowCheatSheet(false)}
                        className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-2">Formatting</h2>
                    <p className="text-sm text-neutral-400 mb-6">Use these in your text inputs to adjust the pixel layout.</p>

                    <div className="space-y-4 text-sm text-neutral-300 mb-6">
                        <div className="bg-neutral-800 p-3 rounded border border-neutral-700">
                            <code className="text-orange-400 font-bold text-base">\1</code>
                            <p className="mt-1">Inserts 1 pixel of blank space.</p>
                        </div>

                        <div className="bg-neutral-800 p-3 rounded border border-neutral-700">
                            <code className="text-orange-400 font-bold text-base">\~</code>
                            <p className="mt-1">Pulls the next character backwards by exactly 1 pixel.</p>
                        </div>

                        <div className="bg-neutral-800 p-3 rounded border border-neutral-700">
                            <code className="text-orange-400 font-bold text-base">\\</code>
                            <p className="mt-1">Type two backslashes to render a single backslash on the sign.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCheatSheet(false)}
                        className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        )}

        <header className="flex justify-center mb-6">
            <img src={logo} alt="Signmatrix" className="h-16 object-contain"/>
        </header>

        <LivePreview apiUrl={buildApiUrl()}/>

        <div
            className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 mt-4 bg-zinc-900/50 p-3 rounded-lg border border-neutral-700/50">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {(frames.length > 1 || prFrames.some(f => f.line1.trim() !== "" || f.line2.trim() !== "")) && (
                    <>
                        <button
                            onClick={() => setPreviewMode("all")}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${previewMode === "all" ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
                        >
                            ▶ Play
                        </button>
                        {frames.map((_, idx) => (
                            <button
                                key={`frame-${idx}`}
                                onClick={() => setPreviewMode(idx.toString())}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${previewMode === idx.toString() ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
                            >
                                Frame {idx + 1}
                            </button>
                        ))}
                        {prFrames.map((frame, idx) => {
                            if (!frame.line1.trim() && !frame.line2.trim()) return null;
                            return (
                                <button
                                    key={`pr-${idx}`}
                                    onClick={() => setPreviewMode(`pr-${idx}`)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${previewMode === `pr-${idx}` ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
                                >
                                    PR {idx + 1}
                                </button>
                            );
                        })}
                    </>
                )}
            </div>

            <button
                onClick={downloadSign}
                disabled={isDownloading}
                className={`flex items-center gap-2 px-5 py-1.5 rounded-lg font-bold text-white text-sm transition-all whitespace-nowrap ${isDownloading ? 'bg-orange-600/50 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 active:scale-95'}`}
            >
                {isDownloading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                             fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                             xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Download
                    </>
                )}
            </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 p-5 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-3 border-b border-neutral-600 pb-2">
                    <h2 className="text-lg font-semibold">Global Route</h2>
                    <button
                        onClick={() => setShowCheatSheet(true)}
                        title="Formatting Help"
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-700 text-neutral-300 hover:bg-orange-600 hover:text-white text-xs font-bold transition-colors"
                    >
                        ?
                    </button>
                </div>
                <div className="grid grid-cols-5 gap-x-4">
                    <div className="col-span-3"><InputGroup label="Route Number" value={route} onChange={setRoute}/>
                    </div>
                    <div className="col-span-2">
                        <div className="flex flex-col mb-4">
                            <label className="text-sm text-neutral-400 mb-1">Route Side</label>
                            <select value={routeAlign} onChange={(e) => setRouteAlign(e.target.value)}
                                    className="w-full p-2 h-10 rounded bg-neutral-700 border border-neutral-600 text-white focus:outline-none">
                                <option value="LEFT">Left</option>
                                <option value="RIGHT">Right</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-span-2"><FontDropdown label="Main Font" value={routeFont}
                                                              onChange={setRouteFont}/></div>
                    <div className="col-span-1"><InputGroup label="Suffix" value={routeSuffix}
                                                            onChange={setRouteSuffix}/></div>
                    <div className="col-span-2"><FontDropdown label="Suffix Font" value={routeSuffixFont}
                                                              onChange={setRouteSuffixFont}/></div>
                </div>
            </div>
            <div className="bg-zinc-900 p-5 rounded-lg border border-neutral-700">
                <div className="flex justify-between items-center mb-3 border-b border-neutral-600 pb-2">
                    <h2 className="text-lg font-semibold">Hardware</h2>
                    <button
                        onClick={resetHardwareSettings}
                        title="Reset to defaults"
                        className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white transition-colors px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded"
                    >
                        Reset to defaults
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputGroup label="Width (px)" type="number" value={width} onChange={setWidth}/>
                    <InputGroup label="Height (px)" type="number" value={height} onChange={setHeight}/>

                    <div className="flex flex-col">
                        <label className="text-sm text-neutral-400 mb-1">Lit Colour</label>
                        <input
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-full h-10 p-1 bg-neutral-700 border border-neutral-600 rounded cursor-pointer"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm text-neutral-400 mb-1">Unlit Colour</label>
                        <input
                            type="color"
                            value={offColor}
                            onChange={e => setOffColor(e.target.value)}
                            className="w-full h-10 p-1 bg-neutral-700 border border-neutral-600 rounded cursor-pointer"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm text-neutral-400 mb-1">LED Shape</label>
                        <select
                            value={ledShape}
                            onChange={(e) => setLedShape(e.target.value)}
                            className="w-full p-2 h-10 rounded bg-neutral-700 border border-neutral-600 text-white focus:outline-none"
                        >
                            <option value="square">Square</option>
                            <option value="round">Round (Size ≥ 4)</option>
                        </select>
                    </div>

                    <InputGroup label="LED Size (px)" type="number" min="1" value={ledSize} onChange={setLedSize}/>
                    <InputGroup label="LED Gap (px)" type="number" min="0" value={ledGap} onChange={setLedGap}/>
                    <InputGroup label="Flash Speed (ms)" type="number" min="500" step="100" value={speed} onChange={setSpeed}/>
                </div>
            </div>
            {frames.map((frame, index) => (
                <FrameView key={frame.id} removeFrame={removeFrame} updateFrame={updateFrame} index={index}
                           frame={frame} frames={frames}/>
            ))}

            <button
                onClick={addFrame}
                className="md:col-span-2 w-full py-4 bg-zinc-900 border border-neutral-600 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
            >
                + Add Frame
            </button>

            <div className="md:col-span-2 mt-8 mb-2">
                <h2 className="text-2xl font-bold text-white pb-2">PR Messages</h2>
            </div>

            {prFrames.map((frame, index) => (
                <FrameView
                    key={frame.id}
                    removeFrame={removePrFrame}
                    updateFrame={updatePrFrame}
                    index={index}
                    frame={frame}
                    frames={prFrames}
                />
            ))}

            <button
                onClick={addPrFrame}
                className="md:col-span-2 w-full py-4 bg-zinc-900 border border-neutral-600 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors mb-8"
            >
                + Add PR Frame
            </button>
        </section>
        <p className="mb-0">made with ♥︎ by <a href="https://github.com/itzzmarkus"
                                               className="underline text-sky-400">itzzmarkus</a> | <a
            href="https://github.com/itzzmarkus/Signmatrix" className="underline text-sky-400">repo link</a></p>
        <p>Signmatrix {CURRENT_UPDATE_VERSION}</p>
        <Analytics/>
    </div>);
}