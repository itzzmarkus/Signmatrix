import { useState } from "react";
import InputGroup from "./InputGroup.jsx";
import Icon from "./Icon.jsx";
import { DISEASE_PRESETS } from "../engine/signDisease.js";

function HardwarePanel({
    width, setWidth,
    height, setHeight,
    color, setColor,
    offColor, setOffColor,
    ledShape, setLedShape,
    ledSize, setLedSize,
    ledGap, setLedGap,
    ledGapY, setLedGapY,
    ledGlow = "none", setLedGlow,
    signDisease = "none", setSignDisease,
    diseaseSeed = "1337", setDiseaseSeed,
    diseaseMissingRows = "0", setDiseaseMissingRows,
    diseaseMissingRowHeight = "1", setDiseaseMissingRowHeight,
    diseaseDeadPixelRate = "0.02", setDiseaseDeadPixelRate,
    diseaseGhostRails = "0", setDiseaseGhostRails,
    diseaseGhostRailHeight = "1", setDiseaseGhostRailHeight,
    diseaseModuleDropout = false, setDiseaseModuleDropout,
    speed, setSpeed,
    autoScroll, setAutoScroll,
    scrollSpeed, setScrollSpeed,
    scrollPause, setScrollPause,
    displayType = "led", setDisplayType,
    onReset
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`bg-zinc-900 p-5 rounded-lg border border-neutral-700 transition-all ${isCollapsed ? 'self-start h-auto' : 'h-full'}`}>
            <div className={`flex justify-between items-center ${isCollapsed ? '' : 'mb-3 border-b border-neutral-600 pb-2'}`}>
                <div
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-2 cursor-pointer select-none group"
                >
                    <button
                        type="button"
                        aria-label={isCollapsed ? "Expand Hardware Panel" : "Collapse Hardware Panel"}
                        className="text-neutral-400 group-hover:text-white transition-colors flex items-center"
                    >
                        <Icon
                            name="expand_more"
                            size={18}
                            className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                        />
                    </button>
                    <h2 className="text-lg font-semibold text-white group-hover:text-neutral-200">Hardware</h2>
                    {isCollapsed && (
                        <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700/60 font-mono ml-1">
                            {width}×{height}px
                        </span>
                    )}
                </div>
                <button
                    onClick={onReset}
                    title="Reset to defaults"
                    className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white transition-colors px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded cursor-pointer"
                >
                    Reset to defaults
                </button>
            </div>

            {!isCollapsed && (
                <>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InputGroup label="Width (px)" type="number" value={width} onChange={setWidth}/>
                <InputGroup label="Height (px)" type="number" value={height} onChange={setHeight}/>

                <div className="flex flex-col h-full min-w-0">
                    <label
                        className="text-sm text-neutral-400 mb-1 truncate whitespace-nowrap"
                        title={displayType === "led" ? "Lit & Unlit LED Colours" : "Disc & Unlit Colours"}
                    >
                        Lit / Unlit
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 h-10">
                        <input
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-full h-full p-1 bg-neutral-800 border border-neutral-600 hover:border-neutral-500 rounded transition-colors cursor-pointer"
                            title={displayType === "led" ? "Lit Colour (ON)" : "Disc Colour (ON)"}
                        />
                        <input
                            type="color"
                            value={offColor}
                            onChange={e => setOffColor(e.target.value)}
                            className="w-full h-full p-1 bg-neutral-800 border border-neutral-600 hover:border-neutral-500 rounded transition-colors cursor-pointer"
                            title={displayType === "led" ? "Unlit Colour (OFF)" : "Unlit / Background Colour (OFF)"}
                        />
                    </div>
                </div>

                <InputGroup label="Flash (ms)" title="Flash Speed (ms)" type="number" min="500" step="100" value={speed} onChange={setSpeed}/>

                <div className="flex flex-col h-full min-w-0">
                    <label className="text-sm text-neutral-400 mb-1 whitespace-nowrap">LED Shape</label>
                    <select
                        value={ledShape}
                        onChange={(e) => setLedShape(e.target.value)}
                        className="w-full h-10 px-2.5 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-sm transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                        <option value="square">Square</option>
                        <option value="round">Round (Size ≥ 4)</option>
                    </select>
                </div>

                <InputGroup label="Size (px)" title="LED Size (px)" type="number" min="1" value={ledSize} onChange={setLedSize}/>

                <div className="flex flex-col flex-1 min-w-0 col-span-2">
                    <label className="text-sm text-neutral-400 mb-1 whitespace-nowrap" title="LED Gap X / Y (px)">LED Gap X / Y (px)</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center bg-neutral-800 border border-neutral-600 hover:border-neutral-500 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 rounded h-10 overflow-hidden transition-colors">
                            <span className="w-6 shrink-0 h-full flex items-center justify-center bg-neutral-900/60 border-r border-neutral-700 text-xs text-neutral-400 font-bold select-none">
                                X
                            </span>
                            <input
                                type="number"
                                min="0"
                                max="16"
                                value={ledGap ?? "1"}
                                onChange={(e) => setLedGap(e.target.value)}
                                className="w-full min-w-0 flex-1 h-full bg-transparent px-2 text-center text-white text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title="Horizontal LED gap in pixels"
                            />
                        </div>
                        <div className="flex items-center bg-neutral-800 border border-neutral-600 hover:border-neutral-500 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 rounded h-10 overflow-hidden transition-colors">
                            <span className="w-6 shrink-0 h-full flex items-center justify-center bg-neutral-900/60 border-r border-neutral-700 text-xs text-neutral-400 font-bold select-none">
                                Y
                            </span>
                            <input
                                type="number"
                                min="0"
                                max="16"
                                value={ledGapY !== undefined ? ledGapY : (ledGap ?? "2")}
                                onChange={(e) => setLedGapY ? setLedGapY(e.target.value) : setLedGap(e.target.value)}
                                className="w-full min-w-0 flex-1 h-full bg-transparent px-2 text-center text-white text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title="Vertical LED gap in pixels"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-700/60 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-medium text-neutral-400">
                    Display Type
                </span>
                <div className="inline-flex rounded bg-neutral-800 p-0.5 border border-neutral-700/70 text-xs">
                    {[
                        { id: "led", label: "LED Matrix" },
                        { id: "flipdot", label: "Flip-Dot" }
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                                if (setDisplayType) setDisplayType(opt.id);
                                if (opt.id === "flipdot" && setLedShape) setLedShape("round");
                            }}
                            className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                                (displayType === "flipdot" ? "flipdot" : "led") === opt.id
                                    ? "bg-neutral-700 text-white font-medium shadow-xs"
                                    : "text-neutral-400 hover:text-neutral-200"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {setLedGlow && displayType !== "flipdot" && (
                <div className="mt-4 pt-3 border-t border-neutral-700/60 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium text-neutral-300 flex items-center gap-1.5">
                        LED Glow
                    </span>
                    <div className="inline-flex rounded-md bg-neutral-800 p-0.5 border border-neutral-700">
                        {[
                            { id: "none", label: "Off" },
                            { id: "subtle", label: "Subtle" },
                            { id: "medium", label: "Realistic" },
                            { id: "bright", label: "Bright" }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setLedGlow(opt.id)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                                    ledGlow === opt.id
                                        ? "bg-orange-600 text-white shadow-sm"
                                        : "text-neutral-400 hover:text-white"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {setSignDisease && (
                <div className="mt-4 pt-3 border-t border-neutral-700/60">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm font-medium text-neutral-300 flex items-center gap-1.5" title="Add dead pixels, missing rows, and stuck lines to break your sign">
                            Sign Disease
                        </span>
                        <div className="inline-flex flex-wrap rounded-md bg-neutral-800 p-0.5 border border-neutral-700">
                            {[
                                { id: "none", label: "None" },
                                { id: "mild", label: "Mild" },
                                { id: "moderate", label: "Moderate" },
                                { id: "severe", label: "Severe" },
                                { id: "terminal", label: "Terminal" }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSignDisease(opt.id)}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                                        signDisease === opt.id
                                            ? "bg-orange-600 text-white shadow-sm"
                                            : "text-neutral-400 hover:text-white"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {signDisease !== "none" && (
                        <div className="mt-3 bg-neutral-950/40 rounded-lg p-3 border border-neutral-800/80 space-y-3">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-neutral-400 font-medium">Seed: #{diseaseSeed}</span>
                                <button
                                    type="button"
                                    onClick={() => setDiseaseSeed(String(Math.floor(Math.random() * 9000 + 1000)))}
                                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[11px] font-semibold text-neutral-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Randomize dead pixel and line positions"
                                >
                                    <Icon name="refresh" size={13} />
                                    <span>Reroll</span>
                                </button>
                            </div>

                            {signDisease === "custom" ? (
                                <>
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-xs text-neutral-400 font-medium whitespace-nowrap">
                                            Dead Pixels ({Math.round((parseFloat(diseaseDeadPixelRate) || 0) * 100)}%)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="0.15"
                                            step="0.005"
                                            value={diseaseDeadPixelRate ?? "0.02"}
                                            onChange={(e) => setDiseaseDeadPixelRate(e.target.value)}
                                            className="w-40 sm:w-52 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <label className="text-xs text-neutral-400 font-medium whitespace-nowrap">
                                            Missing Rows
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5" title="How many dead rows">
                                                <span className="text-[10px] text-neutral-500">Lines:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={diseaseMissingRows ?? "0"}
                                                    onChange={(e) => setDiseaseMissingRows(e.target.value)}
                                                    className="w-10 h-6 bg-transparent text-white text-xs text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5" title="How thick each dead row is">
                                                <span className="text-[10px] text-neutral-500">Thick:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={diseaseMissingRowHeight ?? "1"}
                                                    onChange={(e) => setDiseaseMissingRowHeight ? setDiseaseMissingRowHeight(e.target.value) : null}
                                                    className="w-8 h-6 bg-transparent text-white text-xs text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="text-[10px] text-neutral-500">px</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <label className="text-xs text-neutral-400 font-medium whitespace-nowrap">
                                            Ghost Rails
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5" title="How many stuck lit rows">
                                                <span className="text-[10px] text-neutral-500">Lines:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={diseaseGhostRails ?? "0"}
                                                    onChange={(e) => setDiseaseGhostRails(e.target.value)}
                                                    className="w-10 h-6 bg-transparent text-white text-xs text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5" title="How thick each stuck row is">
                                                <span className="text-[10px] text-neutral-500">Thick:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={diseaseGhostRailHeight ?? "1"}
                                                    onChange={(e) => setDiseaseGhostRailHeight ? setDiseaseGhostRailHeight(e.target.value) : null}
                                                    className="w-8 h-6 bg-transparent text-white text-xs text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="text-[10px] text-neutral-500">px</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-800">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(diseaseModuleDropout)}
                                                onChange={(e) => setDiseaseModuleDropout(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded bg-neutral-800 border-neutral-600 accent-orange-500 cursor-pointer"
                                            />
                                            <span className="text-xs text-neutral-300">Sub-Module</span>
                                        </label>
                                        <span className="text-[11px] text-neutral-500 italic">Blacks out 40px module</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const p = DISEASE_PRESETS[signDisease] || DISEASE_PRESETS.moderate;
                                            if (setDiseaseMissingRows) setDiseaseMissingRows(String(p.missingRows));
                                            if (setDiseaseMissingRowHeight) setDiseaseMissingRowHeight(String(p.missingRowHeight || 1));
                                            if (setDiseaseDeadPixelRate) setDiseaseDeadPixelRate(String(p.deadPixelRate));
                                            if (setDiseaseGhostRails) setDiseaseGhostRails(String(p.ghostRails));
                                            if (setDiseaseGhostRailHeight) setDiseaseGhostRailHeight(String(p.ghostRailHeight || 1));
                                            if (setDiseaseModuleDropout) setDiseaseModuleDropout(Boolean(p.moduleDropout));
                                            setSignDisease("custom");
                                        }}
                                        className="text-[11px] text-orange-400 hover:text-orange-300 underline cursor-pointer shrink-0"
                                    >
                                        Customize
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-neutral-700/60 flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="w-4 h-4 rounded bg-neutral-800 border-neutral-600 accent-orange-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-neutral-300">Auto-scroll on overflow</span>
                </label>
                {autoScroll && (
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-neutral-400 whitespace-nowrap">Scroll Speed (px/s):</label>
                            <input
                                type="number"
                                min="5"
                                max="150"
                                step="5"
                                value={scrollSpeed}
                                onChange={(e) => setScrollSpeed(e.target.value)}
                                className="w-20 h-9 px-2.5 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-neutral-400 whitespace-nowrap" title="How long to wait before scrolling again (negative values start the next scroll early)">
                                Restart Delay (s):
                            </label>
                            <input
                                type="number"
                                min="-10"
                                max="10"
                                step="0.1"
                                value={scrollPause}
                                onChange={(e) => setScrollPause(e.target.value)}
                                className="w-20 h-9 px-2.5 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                )}
            </div>
                </>
            )}
        </div>
    );
}

export default HardwarePanel;