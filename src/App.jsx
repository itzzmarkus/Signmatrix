import {useState, useCallback, useMemo} from 'react';
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
import {copySign, downloadSign, getInitialState, getInitialHashState, isSignAnimated} from './utils/signUtils';
import useUrlSync from "./hooks/useUrlSync.js";
import useUndo from "./hooks/useUndo.js";
import {PRESETS} from "./data/presets.js";
import PresetsPanel from "./components/PresetsPanel.jsx";
import SuggestionBox from "./components/SuggestionBox.jsx";
import useUserPresets from "./hooks/useUserPresets.js";
import SavePresetModal from "./components/SavePresetModal.jsx";
import ManagePresetsModal from "./components/ManagePresetsModal.jsx";
import useCustomGraphics from "./hooks/useCustomGraphics.js";
import CustomGraphicsContext from "./context/CustomGraphicsContext.js";
import GraphicStudioModal from "./components/GraphicStudioModal.jsx";
import Icon from "./components/Icon.jsx";
import {parseGraphicsParam} from "./utils/graphicCodec.js";
import {cloneIcons} from "./utils/iconOverlays.js";

const CURRENT_UPDATE_VERSION = "v2.0 beta";


export default function App() {
    const [showUpdateLog, setShowUpdateLog] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            return localStorage.getItem("signmatrix_update_seen") !== CURRENT_UPDATE_VERSION;
        } catch {
            return false;
        }
    });
    const [showCheatSheet, setShowCheatSheet] = useState(false);
    const [showSavePresetModal, setShowSavePresetModal] = useState(false);
    const [showManagePresetsModal, setShowManagePresetsModal] = useState(false);
    const [previewMode, setPreviewMode] = useState("all");

    const {
        graphics,
        savedGraphics,
        sessionGraphics,
        graphicsById,
        saveGraphic,
        deleteGraphic,
        duplicateGraphic,
        mergeGraphics
    } = useCustomGraphics(() => {
        const hashState = getInitialHashState();
        if (hashState?.customGraphics && hashState.customGraphics.length > 0) {
            return hashState.customGraphics;
        }
        return parseGraphicsParam(getInitialState("customGraphics", ""));
    });

    const [studioModal, setStudioModal] = useState({
        isOpen: false,
        initialGraphic: null,
        onSaved: null
    });

    const openStudio = useCallback((graphic = null, onSaved = null) => {
        setStudioModal({
            isOpen: true,
            initialGraphic: graphic,
            onSaved
        });
    }, []);

    const {
        userPresets,
        savePreset,
        deletePreset,
        exportPresets,
        importPresets
    } = useUserPresets();

    const {
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
    } = useFrames(setPreviewMode);

    const applyPreset = (presetId) => {
        const preset = userPresets.find(p => p.id === presetId) || PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        if (preset.graphics) {
            mergeGraphics(preset.graphics, true);
        }

        setRoute(preset.route !== undefined ? preset.route : "");
        setRouteFont(preset.routeFont || "24qa1");
        setRouteAlign(preset.routeAlign || "LEFT");
        setRouteColor(preset.routeColor || "");
        setRouteInvert(preset.routeInvert !== undefined ? preset.routeInvert : false);
        setRouteBoxPadding(preset.routeBoxPadding !== undefined ? String(preset.routeBoxPadding) : "3");
        setRouteBoxGap(preset.routeBoxGap !== undefined ? String(preset.routeBoxGap) : "2");
        setRouteBoxColor(preset.routeBoxColor || "");
        setRouteXOffset(preset.routeXOffset !== undefined ? String(preset.routeXOffset) : "0");
        setRouteYOffset(preset.routeYOffset !== undefined ? String(preset.routeYOffset) : "0");

        setWidth(String(preset.width || "200"));
        setHeight(String(preset.height || "24"));
        setColor(preset.color || "#FF9000");
        setOffColor(preset.offColor || "#404040");
        setLedShape(preset.ledShape || "round");
        setLedSize(String(preset.ledSize || "10"));
        setLedGap(String(preset.ledGap || "1"));
        setLedGapY(String(preset.ledGapY !== undefined ? preset.ledGapY : (preset.ledGap || "2")));
        setLedGlow(preset.ledGlow || "none");
        setDisplayType(preset.displayType || "led");
        setSignDisease(preset.signDisease || "none");
        setDiseaseSeed(String(preset.diseaseSeed !== undefined ? preset.diseaseSeed : "1337"));
        setDiseaseMissingRows(String(preset.diseaseMissingRows || "0"));
        setDiseaseMissingRowHeight(String(preset.diseaseMissingRowHeight || "1"));
        setDiseaseDeadPixelRate(String(preset.diseaseDeadPixelRate || "0.02"));
        setDiseaseGhostRails(String(preset.diseaseGhostRails || "0"));
        setDiseaseGhostRailHeight(String(preset.diseaseGhostRailHeight || "1"));
        setDiseaseModuleDropout(Boolean(preset.diseaseModuleDropout));
        setSpeed(String(preset.speed || "1800"));
        setAutoScroll(preset.autoScroll !== undefined ? preset.autoScroll : true);
        setScrollSpeed(String(preset.scrollSpeed || "30"));
        setScrollPause(String(preset.scrollPause !== undefined ? preset.scrollPause : "1.0"));

        setFrames((preset.frames || []).map((f, i) => ({
            id: Date.now() + i,
            line1: f.line1 !== undefined ? f.line1 : "",
            line1Font: f.line1Font || "16d",
            line1Color: f.line1Color || "",
            line1Spacing: f.line1Spacing || "0",
            line1Align: f.line1Align || "CENTRE",
            line1XOffset: f.line1XOffset !== undefined ? String(f.line1XOffset) : "0",
            line1YOffset: f.line1YOffset !== undefined ? String(f.line1YOffset) : "0",
            line2: f.line2 !== undefined ? f.line2 : "",
            line2Font: f.line2Font || "7",
            line2Color: f.line2Color || "",
            line2Spacing: f.line2Spacing || "0",
            line2Align: f.line2Align || "CENTRE",
            line2XOffset: f.line2XOffset !== undefined ? String(f.line2XOffset) : "0",
            line2YOffset: f.line2YOffset !== undefined ? String(f.line2YOffset) : "0",
            animation: f.animation || "NONE",
            animSpeed: f.animSpeed || "0.25",
            verticalSpacing: f.verticalSpacing || "FLUSH",
            delay: f.delay || "",
            icons: cloneIcons(f.icons)
        })));
        setPrFrames((preset.prFrames || []).map((f, i) => ({
            id: Date.now() + 100 + i,
            line1: f.line1 !== undefined ? f.line1 : "",
            line1Font: f.line1Font || "16d",
            line1Color: f.line1Color || "",
            line1Spacing: f.line1Spacing || "0",
            line1Align: f.line1Align || "CENTRE",
            line1XOffset: f.line1XOffset !== undefined ? String(f.line1XOffset) : "0",
            line1YOffset: f.line1YOffset !== undefined ? String(f.line1YOffset) : "0",
            line2: f.line2 !== undefined ? f.line2 : "",
            line2Font: f.line2Font || "7",
            line2Color: f.line2Color || "",
            line2Spacing: f.line2Spacing || "0",
            line2Align: f.line2Align || "CENTRE",
            line2XOffset: f.line2XOffset !== undefined ? String(f.line2XOffset) : "0",
            line2YOffset: f.line2YOffset !== undefined ? String(f.line2YOffset) : "0",
            animation: f.animation || "NONE",
            animSpeed: f.animSpeed || "0.25",
            verticalSpacing: f.verticalSpacing || "FLUSH",
            delay: f.delay || "",
            icons: cloneIcons(f.icons)
        })));
        setPreviewMode("all");
    };

    const [color, setColor] = useState(() => getInitialState("color", "#FF9000"));
    const [width, setWidth] = useState(() => getInitialState("width", "200"));
    const [height, setHeight] = useState(() => getInitialState("height", "24"));
    const [speed, setSpeed] = useState(() => getInitialState("speed", "1800"));
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(null);
    const [isCopying, setIsCopying] = useState(false);
    const [copiedStatus, setCopiedStatus] = useState(null);
    const [route, setRoute] = useState(() => getInitialState("route", "R5").split('|')[0]);
    const [routeFont, setRouteFont] = useState(() => getInitialState("routeFont", "24qa1").split('|')[0]);
    const [routeColor, setRouteColor] = useState(getInitialState("routeColor", ""));
    const [routeAlign, setRouteAlign] = useState(() => getInitialState("routeAlign", "LEFT"));
    const [routeInvert, setRouteInvert] = useState(() => getInitialState("routeInvert", "false") === "true");
    const [routeBoxPadding, setRouteBoxPadding] = useState(() => getInitialState("routeBoxPadding", "3"));
    const [routeBoxGap, setRouteBoxGap] = useState(() => getInitialState("routeBoxGap", "2"));
    const [routeBoxColor, setRouteBoxColor] = useState(() => getInitialState("routeBoxColor", ""));
    const [routeXOffset, setRouteXOffset] = useState(() => getInitialState("routeXOffset", "0"));
    const [routeYOffset, setRouteYOffset] = useState(() => getInitialState("routeYOffset", "0"));
    const [ledShape, setLedShape] = useState(() => getInitialState("ledShape", "round"));
    const [ledSize, setLedSize] = useState(() => getInitialState("ledSize", "10"));
    const [ledGap, setLedGap] = useState(() => getInitialState("ledGap", "1"));
    const [ledGapY, setLedGapY] = useState(() => getInitialState("ledGapY", getInitialState("ledGap", "2")));
    const [ledGlow, setLedGlow] = useState(() => getInitialState("ledGlow", "none"));
    const [signDisease, setSignDisease] = useState(() => getInitialState("signDisease", "none"));
    const [diseaseSeed, setDiseaseSeed] = useState(() => getInitialState("diseaseSeed", "1337"));
    const [diseaseMissingRows, setDiseaseMissingRows] = useState(() => getInitialState("diseaseMissingRows", "0"));
    const [diseaseMissingRowHeight, setDiseaseMissingRowHeight] = useState(() => getInitialState("diseaseMissingRowHeight", "1"));
    const [diseaseDeadPixelRate, setDiseaseDeadPixelRate] = useState(() => getInitialState("diseaseDeadPixelRate", "0.02"));
    const [diseaseGhostRails, setDiseaseGhostRails] = useState(() => getInitialState("diseaseGhostRails", "0"));
    const [diseaseGhostRailHeight, setDiseaseGhostRailHeight] = useState(() => getInitialState("diseaseGhostRailHeight", "1"));
    const [diseaseModuleDropout, setDiseaseModuleDropout] = useState(() => getInitialState("diseaseModuleDropout", "false") === "true");
    const [offColor, setOffColor] = useState(() => getInitialState("offColor", "#404040"));
    const [autoScroll, setAutoScroll] = useState(() => getInitialState("autoScroll", "true") !== "false");
    const [scrollSpeed, setScrollSpeed] = useState(() => getInitialState("scrollSpeed", "30"));
    const [scrollPause, setScrollPause] = useState(() => getInitialState("scrollPause", "1.0"));
    const [displayType, setDisplayType] = useState(() => getInitialState("displayType", "led"));

    const [draggedFrameIndex, setDraggedFrameIndex] = useState(null);
    const [dragOverFrameIndex, setDragOverFrameIndex] = useState(null);
    const [draggedPrIndex, setDraggedPrIndex] = useState(null);
    const [dragOverPrIndex, setDragOverPrIndex] = useState(null);

    const currentSignState = useMemo(() => ({
        frames,
        prFrames,
        color,
        width,
        height,
        speed,
        previewMode,
        route,
        routeFont,
        routeColor,
        routeAlign,
        routeInvert,
        routeBoxPadding,
        routeBoxGap,
        routeBoxColor,
        routeXOffset,
        routeYOffset,
        ledShape,
        ledSize,
        ledGap,
        ledGapY,
        ledGlow,
        signDisease,
        diseaseSeed,
        diseaseMissingRows,
        diseaseMissingRowHeight,
        diseaseDeadPixelRate,
        diseaseGhostRails,
        diseaseGhostRailHeight,
        diseaseModuleDropout,
        offColor,
        autoScroll,
        scrollSpeed,
        scrollPause,
        displayType
    }), [
        frames,
        prFrames,
        color,
        width,
        height,
        speed,
        previewMode,
        route,
        routeFont,
        routeColor,
        routeAlign,
        routeInvert,
        routeBoxPadding,
        routeBoxGap,
        routeBoxColor,
        routeXOffset,
        routeYOffset,
        ledShape,
        ledSize,
        ledGap,
        ledGapY,
        ledGlow,
        signDisease,
        diseaseSeed,
        diseaseMissingRows,
        diseaseMissingRowHeight,
        diseaseDeadPixelRate,
        diseaseGhostRails,
        diseaseGhostRailHeight,
        diseaseModuleDropout,
        offColor,
        autoScroll,
        scrollSpeed,
        scrollPause,
        displayType
    ]);

    const debouncedState = useDebounce(currentSignState, 300);

    const restoreState = useCallback((saved) => {
        setFrames(saved.frames);
        setPrFrames(saved.prFrames);
        setColor(saved.color);
        setWidth(saved.width);
        setHeight(saved.height);
        setSpeed(saved.speed);
        setPreviewMode(saved.previewMode);
        setRoute(saved.route);
        setRouteFont(saved.routeFont);
        setRouteColor(saved.routeColor);
        setRouteAlign(saved.routeAlign);
        if (saved.routeInvert !== undefined) setRouteInvert(saved.routeInvert);
        if (saved.routeBoxPadding !== undefined) setRouteBoxPadding(saved.routeBoxPadding);
        if (saved.routeBoxGap !== undefined) setRouteBoxGap(saved.routeBoxGap);
        if (saved.routeBoxColor !== undefined) setRouteBoxColor(saved.routeBoxColor);
        if (saved.routeXOffset !== undefined) setRouteXOffset(saved.routeXOffset);
        if (saved.routeYOffset !== undefined) setRouteYOffset(saved.routeYOffset);
        setLedShape(saved.ledShape);
        setLedSize(saved.ledSize);
        setLedGap(saved.ledGap);
        if (saved.ledGapY !== undefined) setLedGapY(saved.ledGapY);
        else setLedGapY(saved.ledGap);
        if (saved.ledGlow !== undefined) setLedGlow(saved.ledGlow);
        if (saved.signDisease !== undefined) setSignDisease(saved.signDisease);
        if (saved.diseaseSeed !== undefined) setDiseaseSeed(saved.diseaseSeed);
        if (saved.diseaseMissingRows !== undefined) setDiseaseMissingRows(saved.diseaseMissingRows);
        if (saved.diseaseMissingRowHeight !== undefined) setDiseaseMissingRowHeight(saved.diseaseMissingRowHeight);
        if (saved.diseaseDeadPixelRate !== undefined) setDiseaseDeadPixelRate(saved.diseaseDeadPixelRate);
        if (saved.diseaseGhostRails !== undefined) setDiseaseGhostRails(saved.diseaseGhostRails);
        if (saved.diseaseGhostRailHeight !== undefined) setDiseaseGhostRailHeight(saved.diseaseGhostRailHeight);
        if (saved.diseaseModuleDropout !== undefined) setDiseaseModuleDropout(saved.diseaseModuleDropout);
        setOffColor(saved.offColor);
        if (saved.autoScroll !== undefined) setAutoScroll(saved.autoScroll);
        if (saved.scrollSpeed !== undefined) setScrollSpeed(saved.scrollSpeed);
        if (saved.scrollPause !== undefined) setScrollPause(saved.scrollPause);
        if (saved.displayType !== undefined) setDisplayType(saved.displayType);
    }, [setFrames, setPrFrames]);

    const { undo, redo, canUndo, canRedo } = useUndo(debouncedState, restoreState);

    useUrlSync(debouncedState, graphicsById);

    const [isPreviewPinned, setIsPreviewPinned] = useState(() => {
        if (typeof window === "undefined") return true;
        return localStorage.getItem("signmatrix_preview_pinned") !== "false";
    });

    const togglePreviewPinned = useCallback(() => {
        setIsPreviewPinned((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("signmatrix_preview_pinned", String(next));
            } catch {}
            return next;
        });
    }, []);

    const handleCloseUpdateLog = () => {
        localStorage.setItem("signmatrix_update_seen", CURRENT_UPDATE_VERSION);
        setShowUpdateLog(false);
    };

    const handleDownload = (options = {}) => {
        const downloadOptions = {
            ...options,
            onProgress: (p) => {
                if (p && typeof p.percent === "number") {
                    setDownloadProgress(p.percent);
                }
            }
        };
        downloadSign(
            currentSignState,
            (val) => {
                setIsDownloading(val);
                if (!val) setDownloadProgress(null);
            },
            frames,
            prFrames,
            previewMode,
            graphicsById,
            downloadOptions
        );
    };

    const handleCopy = (options = {}) => {
        copySign(currentSignState, setIsCopying, (status) => {
            setCopiedStatus(status);
            setTimeout(() => setCopiedStatus(null), 2500);
        }, graphicsById, options);
    };

    const isAnimated = useMemo(() => {
        return isSignAnimated(currentSignState, graphicsById, { ignorePreviewMode: false });
    }, [currentSignState, graphicsById]);

    const handleFrameDragStart = (index, e) => {
        setDraggedFrameIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `frame:${index}`);
    };

    const handleFrameDragOver = (index, e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedFrameIndex !== null && dragOverFrameIndex !== index) {
            setDragOverFrameIndex(index);
        }
    };

    const handleFrameDragLeave = (index) => {
        if (dragOverFrameIndex === index) {
            setDragOverFrameIndex(null);
        }
    };

    const handleFrameDrop = (targetIndex, e) => {
        e.preventDefault();
        if (draggedFrameIndex !== null && draggedFrameIndex !== targetIndex) {
            reorderFrames(draggedFrameIndex, targetIndex);
        }
        setDraggedFrameIndex(null);
        setDragOverFrameIndex(null);
    };

    const handleFrameDragEnd = () => {
        setDraggedFrameIndex(null);
        setDragOverFrameIndex(null);
    };

    const handlePrDragStart = (index, e) => {
        setDraggedPrIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `pr:${index}`);
    };

    const handlePrDragOver = (index, e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedPrIndex !== null && dragOverPrIndex !== index) {
            setDragOverPrIndex(index);
        }
    };

    const handlePrDragLeave = (index) => {
        if (dragOverPrIndex === index) {
            setDragOverPrIndex(null);
        }
    };

    const handlePrDrop = (targetIndex, e) => {
        e.preventDefault();
        if (draggedPrIndex !== null && draggedPrIndex !== targetIndex) {
            reorderPrFrames(draggedPrIndex, targetIndex);
        }
        setDraggedPrIndex(null);
        setDragOverPrIndex(null);
    };

    const handlePrDragEnd = () => {
        setDraggedPrIndex(null);
        setDragOverPrIndex(null);
    };

    const resetHardwareSettings = () => {
        setWidth("200");
        setHeight("24");
        setColor("#FF9000");
        setOffColor("#404040");
        setLedShape("round");
        setLedSize("10");
        setLedGap("1");
        setLedGapY("2");
        setLedGlow("none");
        setSignDisease("none");
        setDiseaseSeed("1337");
        setDiseaseMissingRows("0");
        setDiseaseMissingRowHeight("1");
        setDiseaseDeadPixelRate("0.02");
        setDiseaseGhostRails("0");
        setDiseaseGhostRailHeight("1");
        setDiseaseModuleDropout(false);
        setSpeed("1800");
        setAutoScroll(true);
        setScrollSpeed("30");
        setScrollPause("1.0");
        setDisplayType("led");
    };

    const clearSignText = () => {
        setRoute("");
        setRouteColor("");
        setRouteXOffset("0");
        setRouteYOffset("0");
        setFrames([{
            id: Date.now(),
            line1: "",
            line1Font: "16d",
            line1Color: "",
            line1Spacing: "0",
            line1XOffset: "0",
            line1YOffset: "0",
            line2: "",
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
            icons: []
        }]);
        setPrFrames([]);
        setPreviewMode("all");
    };

    const customGraphicsCtxValue = useMemo(() => ({
        graphics,
        savedGraphics,
        sessionGraphics,
        graphicsById,
        saveGraphic,
        deleteGraphic,
        duplicateGraphic,
        mergeGraphics,
        openStudio
    }), [graphics, savedGraphics, sessionGraphics, graphicsById, saveGraphic, deleteGraphic, duplicateGraphic, mergeGraphics, openStudio]);

    return (<CustomGraphicsContext.Provider value={customGraphicsCtxValue}><div className="max-w-4xl mx-auto p-6 w-full space-y-4">
        <UpdateModal version={CURRENT_UPDATE_VERSION} onClose={handleCloseUpdateLog} isOpen={showUpdateLog}/>
        <CheatSheetModal isOpen={showCheatSheet} onClose={() => setShowCheatSheet(false)}/>

        <header className="flex justify-between items-center mb-6 relative">
            <h1 className="sr-only">Signmatrix — Bus Destination Sign Generator &amp; LED Matrix Simulator</h1>
            <div className="w-24"></div>
            <img src={logo} alt="Signmatrix — Bus Destination Sign Generator" className="h-16 object-contain"/>
            <div className="flex gap-1 w-24 justify-end">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                    className="flex items-center justify-center w-8 h-8 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                    <Icon name="undo" size={16} />
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                    className="flex items-center justify-center w-8 h-8 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                    <Icon name="redo" size={16} />
                </button>
            </div>
        </header>

        <div className={isPreviewPinned ? "sticky top-2 z-40 rounded-lg" : "relative"}>
            <LivePreview
                signState={currentSignState}
                graphicsById={graphicsById}
                isPinned={isPreviewPinned}
                onTogglePin={togglePreviewPinned}
            />

            <PreviewControls
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
                frames={frames}
                prFrames={prFrames}
                downloadSign={handleDownload}
                isDownloading={isDownloading}
                downloadProgress={downloadProgress}
                copySign={handleCopy}
                isCopying={isCopying}
                copiedStatus={copiedStatus}
                isAnimated={isAnimated}
            />
        </div>

        <div className="w-full">
            <PresetsPanel
                onApplyPreset={applyPreset}
                onClearText={clearSignText}
                userPresets={userPresets}
                onOpenSaveModal={() => setShowSavePresetModal(true)}
                onOpenManageModal={() => setShowManagePresetsModal(true)}
            />
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlobalRoutePanel route={route} setRoute={setRoute} routeAlign={routeAlign} setRouteAlign={setRouteAlign}
                              routeFont={routeFont} setRouteFont={setRouteFont} routeColor={routeColor} setRouteColor={setRouteColor}
                              routeInvert={routeInvert} setRouteInvert={setRouteInvert}
                              routeBoxPadding={routeBoxPadding} setRouteBoxPadding={setRouteBoxPadding}
                              routeBoxGap={routeBoxGap} setRouteBoxGap={setRouteBoxGap}
                              routeBoxColor={routeBoxColor} setRouteBoxColor={setRouteBoxColor}
                              routeXOffset={routeXOffset} setRouteXOffset={setRouteXOffset}
                              routeYOffset={routeYOffset} setRouteYOffset={setRouteYOffset}
                              setShowCheatSheet={setShowCheatSheet} height={height}/>

            <HardwarePanel speed={speed} color={color} height={height} width={width} ledGap={ledGap} ledGapY={ledGapY} ledShape={ledShape}
                           ledSize={ledSize} ledGlow={ledGlow} setLedGlow={setLedGlow}
                           signDisease={signDisease} setSignDisease={setSignDisease}
                           diseaseSeed={diseaseSeed} setDiseaseSeed={setDiseaseSeed}
                           diseaseMissingRows={diseaseMissingRows} setDiseaseMissingRows={setDiseaseMissingRows}
                           diseaseMissingRowHeight={diseaseMissingRowHeight} setDiseaseMissingRowHeight={setDiseaseMissingRowHeight}
                           diseaseDeadPixelRate={diseaseDeadPixelRate} setDiseaseDeadPixelRate={setDiseaseDeadPixelRate}
                           diseaseGhostRails={diseaseGhostRails} setDiseaseGhostRails={setDiseaseGhostRails}
                           diseaseGhostRailHeight={diseaseGhostRailHeight} setDiseaseGhostRailHeight={setDiseaseGhostRailHeight}
                           diseaseModuleDropout={diseaseModuleDropout} setDiseaseModuleDropout={setDiseaseModuleDropout}
                           setColor={setColor} offColor={offColor} setHeight={setHeight}
                           setLedGap={setLedGap} setLedGapY={setLedGapY} setSpeed={setSpeed} setLedSize={setLedSize} setLedShape={setLedShape}
                           setOffColor={setOffColor} setWidth={setWidth}
                           autoScroll={autoScroll} setAutoScroll={setAutoScroll}
                           scrollSpeed={scrollSpeed} setScrollSpeed={setScrollSpeed}
                           scrollPause={scrollPause} setScrollPause={setScrollPause}
                           displayType={displayType} setDisplayType={setDisplayType}
                           onReset={resetHardwareSettings}/>
            {frames.map((frame, index) => (
                <FrameView
                    key={frame.id}
                    removeFrame={removeFrame}
                    duplicateFrame={duplicateFrame}
                    updateFrame={updateFrame}
                    index={index}
                    frame={frame}
                    frames={frames}
                    height={height}
                    onDragStart={handleFrameDragStart}
                    onDragOver={handleFrameDragOver}
                    onDragLeave={handleFrameDragLeave}
                    onDrop={handleFrameDrop}
                    onDragEnd={handleFrameDragEnd}
                    isDragging={draggedFrameIndex === index}
                    isDragOver={dragOverFrameIndex === index}
                    label="Frame"
                />
            ))}

            <button
                onClick={addFrame}
                className="md:col-span-2 w-full py-4 bg-zinc-900 border border-dashed border-neutral-600 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
                <Icon name="add" size={18} /> Add Frame
            </button>

            <div className="md:col-span-2 mt-8 mb-2">
                <h2 className="text-2xl font-bold text-white pb-2">PR Messages</h2>
            </div>

            {prFrames.map((frame, index) => (
                <FrameView
                    key={frame.id}
                    removeFrame={removePrFrame}
                    duplicateFrame={duplicatePrFrame}
                    updateFrame={updatePrFrame}
                    index={index}
                    frame={frame}
                    frames={prFrames}
                    height={height}
                    onDragStart={handlePrDragStart}
                    onDragOver={handlePrDragOver}
                    onDragLeave={handlePrDragLeave}
                    onDrop={handlePrDrop}
                    onDragEnd={handlePrDragEnd}
                    isDragging={draggedPrIndex === index}
                    isDragOver={dragOverPrIndex === index}
                    label="PR Frame"
                />
            ))}

            <button
                onClick={addPrFrame}
                className="md:col-span-2 w-full py-4 bg-zinc-900 border border-dashed border-neutral-600 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors mb-8 flex items-center justify-center gap-1.5 cursor-pointer"
            >
                <Icon name="add" size={18} /> Add PR Frame
            </button>
        </section>
        <SuggestionBox version={CURRENT_UPDATE_VERSION} />
        <Footer version={CURRENT_UPDATE_VERSION} onShowUpdateLog={() => setShowUpdateLog(true)}/>

        <SavePresetModal
            isOpen={showSavePresetModal}
            onClose={() => setShowSavePresetModal(false)}
            onSave={(name) => savePreset(name, currentSignState, graphicsById)}
            currentState={currentSignState}
        />

        <ManagePresetsModal
            isOpen={showManagePresetsModal}
            onClose={() => setShowManagePresetsModal(false)}
            userPresets={userPresets}
            onDeletePreset={deletePreset}
            onApplyPreset={applyPreset}
            onExportPresets={exportPresets}
            onImportPresets={importPresets}
        />

        <GraphicStudioModal
            isOpen={studioModal.isOpen}
            initialGraphic={studioModal.initialGraphic}
            signHeight={height}
            signColor={color}
            onClose={() => setStudioModal(prev => ({ ...prev, isOpen: false }))}
            onSave={(graphicData, applyToSegment) => {
                const saved = saveGraphic(graphicData);
                if (applyToSegment && studioModal.onSaved) {
                    studioModal.onSaved(saved);
                }
                return saved;
            }}
        />
    </div></CustomGraphicsContext.Provider>);
}