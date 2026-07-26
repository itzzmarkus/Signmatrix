import {useEffect, useState} from 'react';
import useDebounce from './hooks/useDebounce';
import LivePreview from './components/LivePreview';

import logo from './assets/Signmatrix.png';
import FrameView from "./components/FrameView.jsx";
import Footer from "./components/Footer.jsx";
import CheatSheetModal from "./components/CheatSheetModal.jsx";
import UpdateModal from "./components/UpdateModal.jsx";
import HardwarePanel from "./components/HardwarePanel.jsx";
import PreviewControls from "./components/PreviewControls.jsx";
import GlobalRoutePanel from "./components/GlobalRoutePanel.jsx";
import useFrames from "./hooks/useFrames.js";
import {buildApiUrl, downloadSign, getInitialState} from './utils/signUtils';
import useUrlSync from "./hooks/useUrlSync.js";
import {PRESETS} from "./data/presets.js";
import PresetsPanel from "./components/PresetsPanel.jsx";

const CURRENT_UPDATE_VERSION = "v1.4";


export default function App() {
    const [showUpdateLog, setShowUpdateLog] = useState(false);
    const [showCheatSheet, setShowCheatSheet] = useState(false);
    const [previewMode, setPreviewMode] = useState("all");

    const {
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
    } = useFrames(setPreviewMode);

    const applyPreset = (presetId) => {
        const preset = PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        setRoute(preset.route);
        setRouteFont(preset.routeFont);
        setRouteSuffix(preset.routeSuffix);
        setRouteSuffixFont(preset.routeSuffixFont);
        setRouteAlign(preset.routeAlign);
        setWidth(preset.width);
        setHeight(preset.height);
        setColor(preset.color);
        setOffColor(preset.offColor);
        setLedShape(preset.ledShape);
        setLedSize(preset.ledSize);
        setLedGap(preset.ledGap);
        setSpeed(preset.speed);

        setFrames(preset.frames.map((f, i) => ({...f, id: Date.now() + i})));
        setPrFrames(preset.prFrames.map((f, i) => ({...f, id: Date.now() + 100 + i})));
        setPreviewMode("all");
    };

    const [color, setColor] = useState(() => getInitialState("color", "#FF9000"));
    const [width, setWidth] = useState(() => getInitialState("width", "200"));
    const [height, setHeight] = useState(() => getInitialState("height", "24"));
    const [speed, setSpeed] = useState(() => getInitialState("speed", "2500"));
    const [isDownloading, setIsDownloading] = useState(false);
    const [route, setRoute] = useState(() => getInitialState("route", "R5").split('|')[0]);
    const [routeFont, setRouteFont] = useState(() => getInitialState("routeFont", "22t").split('|')[0]);
    const [routeSuffix, setRouteSuffix] = useState(() => getInitialState("routeSuffix", ""));
    const [routeSuffixFont, setRouteSuffixFont] = useState(() => getInitialState("routeSuffixFont", "16d"));
    const [routeAlign, setRouteAlign] = useState(() => getInitialState("routeAlign", "LEFT"));
    const [ledShape, setLedShape] = useState(() => getInitialState("ledShape", "square"));
    const [ledSize, setLedSize] = useState(() => getInitialState("ledSize", "3"));
    const [ledGap, setLedGap] = useState(() => getInitialState("ledGap", "1"));
    const [offColor, setOffColor] = useState(() => getInitialState("offColor", "#404040"));

    const debouncedState = useDebounce({
        frames,
        prFrames,
        color,
        width,
        height,
        speed,
        previewMode,
        route,
        routeFont,
        routeSuffix,
        routeSuffixFont,
        routeAlign,
        ledShape,
        ledSize,
        ledGap,
        offColor
    }, 300);

    useUrlSync(debouncedState);

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

    const handleDownload = () => {
        downloadSign(debouncedState, setIsDownloading, frames, prFrames, previewMode);
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
        <UpdateModal version={CURRENT_UPDATE_VERSION} onClose={handleCloseUpdateLog} isOpen={showUpdateLog}/>
        <CheatSheetModal isOpen={showCheatSheet} onClose={() => setShowCheatSheet(false)}/>

        <header className="flex justify-center mb-6">
            <img src={logo} alt="Signmatrix" className="h-16 object-contain"/>
        </header>

        <LivePreview apiUrl={buildApiUrl(debouncedState)}/>

        <PreviewControls previewMode={previewMode} setPreviewMode={setPreviewMode} frames={frames} prFrames={prFrames}
                         downloadSign={handleDownload} isDownloading={isDownloading}/>

        <div className="w-full">
            <PresetsPanel onApplyPreset={applyPreset} />
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlobalRoutePanel route={route} setRoute={setRoute} routeAlign={routeAlign} setRouteAlign={setRouteAlign}
                              routeFont={routeFont} setRouteFont={setRouteFont} routeSuffix={routeSuffix}
                              setRouteSuffix={setRouteSuffix} routeSuffixFont={routeSuffixFont}
                              setRouteSuffixFont={setRouteSuffixFont} setShowCheatSheet={setShowCheatSheet}/>

            <HardwarePanel speed={speed} color={color} height={height} width={width} ledGap={ledGap} ledShape={ledShape}
                           ledSize={ledSize} setColor={setColor} offColor={offColor} setHeight={setHeight}
                           setLedGap={setLedGap} setSpeed={setSpeed} setLedSize={setLedSize} setLedShape={setLedShape}
                           setOffColor={setOffColor} setWidth={setWidth} onReset={resetHardwareSettings}/>
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
        <Footer version={CURRENT_UPDATE_VERSION}/>
    </div>);
}