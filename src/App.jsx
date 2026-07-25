import {useEffect, useState} from 'react';
import useDebounce from './hooks/useDebounce';
import LivePreview from './components/LivePreview';

import logo from './assets/Signmatrix.png';
import FrameView from "./components/FrameView.jsx";
import InputGroup from "./components/InputGroup.jsx";
import FontDropdown from "./components/FontDropdown.jsx";
import {Analytics} from "@vercel/analytics/react";

const CURRENT_UPDATE_VERSION = "v1.2";

const getInitialState = (key, defaultVal) => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params.get(key) || defaultVal;
    }
    return defaultVal;
};

export default function App() {
    const [showUpdateLog, setShowUpdateLog] = useState(false);

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

    const [frames, setFrames] = useState(() => {
        const initLine1 = getInitialState("line1", "HASTINGS  ST").split("|");
        const initLine1Font = getInitialState("line1Font", "12d").split("|");
        const initLine1Spacing = getInitialState("line1Spacing", "6").split("|");
        const initLine2 = getInitialState("line2", "TO KOOTENAY LOOP").split("|");
        const initLine2Font = getInitialState("line2Font", "9d").split("|");
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

    const debouncedState = useDebounce({
        frames, color, width, height, speed, previewMode, route, routeFont, routeSuffix, routeSuffixFont
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

    const addFrame = () => {
        const lastFrame = frames[frames.length - 1];
        setFrames([...frames, {
            id: Date.now(),
            line1: "",
            line1Font: lastFrame.line1Font,
            line1Spacing: lastFrame.line1Spacing,
            line2: "",
            line2Font: lastFrame.line2Font,
            line2Spacing: lastFrame.line2Spacing,
            animation: lastFrame.animation,
            animSpeed: lastFrame.animSpeed,
            line1Align: lastFrame.line1Align,
            line2Align: lastFrame.line2Align,
            verticalSpacing: lastFrame.verticalSpacing,
        }]);
    };

    const removeFrame = (id) => {
        setPreviewMode("all");
        setFrames(frames.filter(f => f.id !== id));
    };

    const updateFrame = (id, field, value) => {
        setFrames(frames.map(f => f.id === id ? {...f, [field]: value} : f));
    };

    useEffect(() => {
        const params = new URLSearchParams();

        if (debouncedState.route) params.append("route", debouncedState.route);
        params.append("routeFont", debouncedState.routeFont);
        params.set("line1", debouncedState.frames.map(f => f.line1).join("|"));
        params.set("line1Font", debouncedState.frames.map(f => f.line1Font).join("|"));
        params.set("line1Spacing", debouncedState.frames.map(f => f.line1Spacing).join("|"));
        params.set("line2", debouncedState.frames.map(f => f.line2).join("|"));
        params.set("line2Font", debouncedState.frames.map(f => f.line2Font).join("|"));
        params.set("line2Spacing", debouncedState.frames.map(f => f.line2Spacing).join("|"));
        params.set("animation", debouncedState.frames.map(f => f.animation).join("|"));
        params.set("animSpeed", debouncedState.frames.map(f => f.animSpeed).join("|"));
        if (debouncedState.routeAlign !== "LEFT") params.set("routeAlign", debouncedState.routeAlign); // Or query.append for buildApiUrl
        params.set("line1Align", debouncedState.frames.map(f => f.line1Align).join("|"));
        params.set("line2Align", debouncedState.frames.map(f => f.line2Align).join("|"));
        params.set("verticalSpacing", debouncedState.frames.map(f => f.verticalSpacing).join("|"));

        if (debouncedState.color !== "#FF9000") params.set("color", debouncedState.color);
        if (debouncedState.width !== "200") params.set("width", debouncedState.width);
        if (debouncedState.height !== "24") params.set("height", debouncedState.height);
        if (debouncedState.speed !== "2500") params.set("speed", debouncedState.speed);
        if (debouncedState.routeSuffix) params.append("routeSuffix", debouncedState.routeSuffix);
        params.append("routeSuffixFont", debouncedState.routeSuffixFont);

        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }, [debouncedState]);

    const downloadSign = async () => {
        try {
            setIsDownloading(true);
            const url = buildApiUrl();
            const response = await fetch(url);
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);

            const isGif = previewMode === "all" && frames.length > 1;
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
        if (debouncedState.previewMode !== "all") {
            const frameIndex = parseInt(debouncedState.previewMode, 10);
            if (targetFrames[frameIndex]) {
                targetFrames = [targetFrames[frameIndex]];
            }
        }

        if (debouncedState.route) query.append("route", debouncedState.route);
        query.append("routeFont", debouncedState.routeFont);
        query.append("line1", targetFrames.map(f => f.line1).join("|"));
        query.append("line1Font", targetFrames.map(f => f.line1Font).join("|"));
        query.append("line1Spacing", targetFrames.map(f => f.line1Spacing).join("|"));
        query.append("line2", targetFrames.map(f => f.line2).join("|"));
        query.append("line2Font", targetFrames.map(f => f.line2Font).join("|"));
        query.append("line2Spacing", targetFrames.map(f => f.line2Spacing).join("|"));
        query.append("animation", debouncedState.frames.map(f => f.animation).join("|"));
        query.append("animSpeed", debouncedState.frames.map(f => f.animSpeed).join("|"));
        if (debouncedState.routeAlign !== "LEFT") query.append("routeAlign", debouncedState.routeAlign);
        query.append("line1Align", debouncedState.frames.map(f => f.line1Align).join("|"));
        query.append("line2Align", debouncedState.frames.map(f => f.line2Align).join("|"));
        query.append("verticalSpacing", debouncedState.frames.map(f => f.verticalSpacing).join("|"));

        query.append("color", debouncedState.color.replace("#", ""));
        query.append("width", debouncedState.width);
        query.append("height", debouncedState.height);
        query.append("speed", debouncedState.speed);
        if (debouncedState.routeSuffix) query.append("routeSuffix", debouncedState.routeSuffix);
        query.append("routeSuffixFont", debouncedState.routeSuffixFont);

        return `http://localhost:8080/api/sign?${query.toString()}`;
    };

    return (<div className="max-w-4xl mx-auto p-6 w-full space-y-4">
        {showUpdateLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                <div className="bg-zinc-900 border border-neutral-700 rounded-lg shadow-2xl max-w-md w-full p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">New Signmatrix update</h2>
                    <p className="text-sm text-neutral-400 mb-4">Version {CURRENT_UPDATE_VERSION}</p>
                    <div className="text-neutral-300 space-y-3 mb-6">
                        <p>• You can now add animations to your signs!</p>
                        <p>• Added a bunch of features that were present in the API but not on the frontend</p>
                        <p>• Improved space efficency</p>
                        <p>• Readded info text (something screwed up in git)</p>
                    </div>
                    <button
                        onClick={handleCloseUpdateLog}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                        epic, let's go!
                    </button>
                </div>
            </div>)}

        <header className="flex justify-center mb-6">
            <img src={logo} alt="Signmatrix" className="h-16 object-contain"/>
        </header>

        <LivePreview apiUrl={buildApiUrl()}/>

        <div
            className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 mt-4 bg-zinc-900/50 p-3 rounded-lg border border-neutral-700/50">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {frames.length > 1 && (
                    <>
                        <button
                            onClick={() => setPreviewMode("all")}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${previewMode === "all" ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
                        >
                            ▶ Play
                        </button>
                        {frames.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setPreviewMode(idx.toString())}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${previewMode === idx.toString() ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
                            >
                                Frame {idx + 1}
                            </button>
                        ))}
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
                <h2 className="text-lg font-semibold mb-3 border-b border-neutral-600 pb-2">Global Route</h2>
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
                <h2 className="text-lg font-semibold mb-3 border-b border-neutral-600 pb-2">Global Settings</h2>
                <div className="grid grid-cols-2 gap-x-4">
                    <InputGroup label="Width (px)" type="number" value={width} onChange={setWidth}/>
                    <InputGroup label="Height (px)" type="number" value={height} onChange={setHeight}/>
                    <div className="flex flex-col flex-1 mb-4">
                        <label className="text-sm text-neutral-400 mb-1">LED Colour</label>
                        <input
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-full h-9 p-1 bg-neutral-700 border border-neutral-600 rounded cursor-pointer"
                        />
                    </div>
                    <InputGroup label="Flash Speed (ms)" type="number" min="500" step="100" value={speed}
                                onChange={setSpeed}/>
                </div>
            </div>
            {frames.map((frame, index) => (
                <FrameView key={frame.id} removeFrame={removeFrame} updateFrame={updateFrame} index={index}
                           frame={frame} frames={frames}/>
            ))}

            <button
                onClick={addFrame}
                className="md:col-span-2 w-full py-4 bg-zinc-900 border-1 border-neutral-600 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
            >
                + Add Frame
            </button>
        </section>
        <p className="mb-0">made with ♥︎ by <a href="https://github.com/itzzmarkus" className="underline text-sky-400">itzzmarkus</a> | <a href="https://github.com/itzzmarkus/Signmatrix" className="underline text-sky-400">repo link</a></p>
        <Analytics/>
    </div>);
}