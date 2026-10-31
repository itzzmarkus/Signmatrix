import { useState } from "react";
import FontDropdown from "./FontDropdown.jsx";
import IconLibraryModal from "./IconLibraryModal.jsx";
import GraphicSegmentChip from "./GraphicSegmentChip.jsx";
import PositionNudgeControl, { SegmentOffsetButton } from "./PositionNudgeControl.jsx";
import Icon from "./Icon.jsx";

function GlobalRoutePanel({
    route, setRoute,
    routeAlign, setRouteAlign,
    routeFont, setRouteFont,
    routeColor, setRouteColor,
    routeInvert, setRouteInvert,
    routeBoxPadding, setRouteBoxPadding,
    routeBoxGap, setRouteBoxGap,
    routeBoxColor, setRouteBoxColor,
    routeXOffset = "0", setRouteXOffset,
    routeYOffset = "0", setRouteYOffset,
    setShowCheatSheet,
    height
}) {
    const [pickerTarget, setPickerTarget] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const texts = (route || "").split("^");
    const fonts = (routeFont || "").split("^");
    const colors = (routeColor || "").split("^");
    const xOffsets = (routeXOffset || "0").split("^");
    const yOffsets = (routeYOffset || "0").split("^");
    const isSplit = texts.length > 1 || fonts.length > 1 || colors.length > 1;

    const toggleSplit = () => {
        if (isSplit) {
            setRoute(texts.join(""));
            setRouteFont(fonts[0] || "24qa1");
            setRouteColor(colors[0] || "");
            setRouteXOffset?.(xOffsets[0] || "0");
            setRouteYOffset?.(yOffsets[0] || "0");
        } else {
            setRoute((route || "") + "^");
            setRouteFont((routeFont || "24qa1") + "^" + (fonts[0]?.startsWith("@") ? "16d" : (fonts[0] || "16d")));
            setRouteColor((routeColor || "") + "^" + (colors[colors.length - 1] || ""));
            setRouteXOffset?.((routeXOffset || "0") + "^" + (xOffsets[xOffsets.length - 1] || "0"));
            setRouteYOffset?.((routeYOffset || "0") + "^" + (yOffsets[yOffsets.length - 1] || "0"));
        }
    };

    const handleSelectLogo = (logo) => {
        if (!pickerTarget) return;

        if (pickerTarget.mode === "standard") {
            const currentText = texts[0] || "";
            const currentFont = fonts[0] || "24qa1";
            const currentColor = colors[0] || "";
            const currentX = xOffsets[0] || "0";
            const currentY = yOffsets[0] || "0";

            if (!currentText.trim() || currentFont.startsWith("@")) {
                setRoute(logo.char);
                setRouteFont(logo.font);
            } else {
                setRoute(`${logo.char}^${currentText.trimStart()}`);
                setRouteFont(`${logo.font}^${currentFont}`);
                setRouteColor(`^${currentColor}`);
                setRouteXOffset?.(`0^${currentX}`);
                setRouteYOffset?.(`0^${currentY}`);
            }
        } else if (pickerTarget.mode === "add-segment") {
            const newTexts = [...texts, logo.char];
            const newFonts = [...fonts, logo.font];
            const newColors = [...colors, ""];
            const newXs = [...xOffsets, "0"];
            const newYs = [...yOffsets, "0"];
            setRoute(newTexts.join("^"));
            setRouteFont(newFonts.join("^"));
            setRouteColor(newColors.join("^"));
            setRouteXOffset?.(newXs.join("^"));
            setRouteYOffset?.(newYs.join("^"));
        } else if (pickerTarget.mode === "segment") {
            const idx = pickerTarget.index;
            const newTexts = [...texts];
            const newFonts = [...fonts];
            newTexts[idx] = logo.char;
            newFonts[idx] = logo.font;
            setRoute(newTexts.join("^"));
            setRouteFont(newFonts.join("^"));
        }

        setPickerTarget(null);
    };

    return (
        <div className={`bg-zinc-900 p-5 rounded-lg border border-neutral-700 transition-all ${isCollapsed ? 'self-start h-auto' : 'h-full'}`}>
            <div className={`flex justify-between items-center ${isCollapsed ? '' : 'mb-3 border-b border-neutral-600 pb-2'}`}>
                <div
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-2 cursor-pointer select-none group"
                >
                    <button
                        type="button"
                        aria-label={isCollapsed ? "Expand Global Route Panel" : "Collapse Global Route Panel"}
                        className="text-neutral-400 group-hover:text-white transition-colors flex items-center"
                    >
                        <Icon
                            name="expand_more"
                            size={18}
                            className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                        />
                    </button>
                    <h2 className="text-lg font-semibold text-white group-hover:text-neutral-200">Global Route</h2>
                    {isCollapsed && (
                        <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700/60 font-mono ml-1">
                            {route ? route.replace(/\^/g, ' ') : "None"}
                        </span>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowCheatSheet(true);
                        }}
                        title="Formatting Help"
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-700 text-neutral-300 hover:bg-orange-600 hover:text-white transition-colors cursor-pointer ml-1"
                    >
                        <Icon name="question_mark" size={13} />
                    </button>
                </div>
                {!isCollapsed && (
                    <button
                        onClick={toggleSplit}
                        className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors cursor-pointer"
                    >
                        {isSplit ? "Standard" : "Mixed Fonts"}
                    </button>
                )}
            </div>

            {!isCollapsed && (
                <>

            {!isSplit ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-x-4 gap-y-4 items-end">
                        <div className="col-span-8 flex flex-col">
                            <label className="text-sm text-neutral-400 mb-1">Route Number</label>
                            {(fonts[0] || "").startsWith("@") ? (
                                <GraphicSegmentChip
                                    fontValue={fonts[0]}
                                    colorHex={colors[0]}
                                    onChangeGraphic={() => setPickerTarget({ mode: "standard" })}
                                    onConvertToText={() => {
                                        setRoute("");
                                        setRouteFont("24qa1");
                                    }}
                                />
                            ) : (
                                <input
                                    type="text"
                                    placeholder="e.g. R5"
                                    value={texts[0] || ""}
                                    onChange={(e) => setRoute(e.target.value)}
                                    className="w-full h-10 px-3 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-neutral-500"
                                />
                            )}
                        </div>

                        <div className="col-span-4 flex flex-col">
                            <label className="text-sm text-neutral-400 mb-1">Route Side</label>
                            <select
                                value={routeAlign}
                                onChange={(e) => setRouteAlign(e.target.value)}
                                className="w-full h-10 px-3 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer text-sm"
                            >
                                <option value="LEFT">Left</option>
                                <option value="RIGHT">Right</option>
                            </select>
                        </div>

                        {!(fonts[0] || "").startsWith("@") && (
                            <div className="col-span-8">
                                <FontDropdown label="Font" value={fonts[0] || "24qa1"} onChange={(val) => setRouteFont(val)} />
                            </div>
                        )}

                        <div className={`${(fonts[0] || "").startsWith("@") ? "col-span-4" : "col-span-4"} flex flex-col`}>
                            <label className="text-sm text-neutral-400 mb-1">Colour</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={colors[0] ? `#${colors[0]}` : "#ff9000"}
                                    onChange={(e) => setRouteColor(e.target.value.replace("#", ""))}
                                    className="w-10 h-10 p-1 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 cursor-pointer"
                                />
                                {colors[0] && (
                                    <button
                                        onClick={() => setRouteColor("")}
                                        className="text-neutral-500 hover:text-white flex items-center justify-center p-1 cursor-pointer"
                                        title="Reset to global"
                                    >
                                        <Icon name="close" size={15} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {setRouteXOffset && setRouteYOffset && (
                            <div className={`${(fonts[0] || "").startsWith("@") ? "col-span-8" : "col-span-12"}`}>
                                <PositionNudgeControl
                                    xValue={xOffsets[0] || "0"}
                                    yValue={yOffsets[0] || "0"}
                                    onChangeX={(val) => setRouteXOffset(val)}
                                    onChangeY={(val) => setRouteYOffset(val)}
                                    compact={true}
                                />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-neutral-400">Route Side</label>
                        <select
                            value={routeAlign}
                            onChange={(e) => setRouteAlign(e.target.value)}
                            className="w-28 h-8 px-2 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                        >
                            <option value="LEFT">Left</option>
                            <option value="RIGHT">Right</option>
                        </select>
                    </div>

                    <div className="bg-black/30 p-3 rounded-lg border border-neutral-700/50 space-y-3">
                        {texts.map((txt, idx) => {
                            const segFont = fonts[idx] || fonts[0] || "24qa1";
                            const isGraphicSeg = segFont.startsWith("@");
                            const segX = xOffsets[idx] !== undefined ? xOffsets[idx] : (xOffsets[0] || "0");
                            const segY = yOffsets[idx] !== undefined ? yOffsets[idx] : (yOffsets[0] || "0");

                            const updateSegX = (val) => {
                                const next = texts.map((_, i) => (xOffsets[i] !== undefined ? xOffsets[i] : (xOffsets[0] || "0")));
                                next[idx] = val;
                                setRouteXOffset?.(next.join("^"));
                            };
                            const updateSegY = (val) => {
                                const next = texts.map((_, i) => (yOffsets[i] !== undefined ? yOffsets[i] : (yOffsets[0] || "0")));
                                next[idx] = val;
                                setRouteYOffset?.(next.join("^"));
                            };
                            const resetSegXY = () => {
                                const nextX = texts.map((_, i) => (xOffsets[i] !== undefined ? xOffsets[i] : (xOffsets[0] || "0")));
                                const nextY = texts.map((_, i) => (yOffsets[i] !== undefined ? yOffsets[i] : (yOffsets[0] || "0")));
                                nextX[idx] = "0";
                                nextY[idx] = "0";
                                setRouteXOffset?.(nextX.join("^"));
                                setRouteYOffset?.(nextY.join("^"));
                            };

                            return (
                                <div key={idx} className="flex gap-2 items-center h-10">
                                    {isGraphicSeg ? (
                                        <GraphicSegmentChip
                                            fontValue={segFont}
                                            colorHex={colors[idx] || colors[0]}
                                            onChangeGraphic={() => setPickerTarget({ mode: "segment", index: idx })}
                                            onConvertToText={() => {
                                                const newTexts = [...texts];
                                                const newFonts = [...fonts];
                                                newTexts[idx] = "";
                                                newFonts[idx] = "16d";
                                                setRoute(newTexts.join("^"));
                                                setRouteFont(newFonts.join("^"));
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <div className="flex-1 h-full">
                                                <input
                                                    type="text"
                                                    placeholder={`Segment ${idx + 1}`}
                                                    value={txt}
                                                    onChange={(e) => {
                                                        const newTexts = [...texts];
                                                        newTexts[idx] = e.target.value;
                                                        setRoute(newTexts.join("^"));
                                                    }}
                                                    className="w-full h-10 px-3 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-neutral-600"
                                                />
                                            </div>
                                            <div className="w-32 h-full">
                                                <FontDropdown
                                                    value={segFont}
                                                    onChange={(val) => {
                                                        const newFonts = [...fonts];
                                                        newFonts[idx] = val;
                                                        setRouteFont(newFonts.join("^"));
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div className="w-10 h-full shrink-0">
                                        <input
                                            type="color"
                                            value={colors[idx] ? `#${colors[idx]}` : (colors[0] ? `#${colors[0]}` : "#ff9000")}
                                            onChange={(e) => {
                                                const newColors = [...colors];
                                                newColors[idx] = e.target.value.replace("#", "");
                                                setRouteColor(newColors.join("^"));
                                            }}
                                            title="Segment Colour"
                                            className="w-full h-full p-1 rounded bg-neutral-800 border border-neutral-600 cursor-pointer"
                                        />
                                    </div>
                                    {setRouteXOffset && setRouteYOffset && (
                                        <SegmentOffsetButton
                                            xValue={segX}
                                            yValue={segY}
                                            onChangeX={updateSegX}
                                            onChangeY={updateSegY}
                                            onReset={resetSegXY}
                                        />
                                    )}
                                    <button
                                        onClick={() => {
                                            const newTexts = [...texts];
                                            const newFonts = [...fonts];
                                            const newColors = [...colors];
                                            const newXs = texts.map((_, i) => (xOffsets[i] !== undefined ? xOffsets[i] : (xOffsets[0] || "0")));
                                            const newYs = texts.map((_, i) => (yOffsets[i] !== undefined ? yOffsets[i] : (yOffsets[0] || "0")));
                                            newTexts.splice(idx, 1);
                                            newFonts.splice(idx, 1);
                                            newColors.splice(idx, 1);
                                            newXs.splice(idx, 1);
                                            newYs.splice(idx, 1);
                                            setRoute(newTexts.join("^"));
                                            setRouteFont(newFonts.join("^"));
                                            setRouteColor(newColors.join("^"));
                                            setRouteXOffset?.(newXs.join("^"));
                                            setRouteYOffset?.(newYs.join("^"));
                                        }}
                                        className="w-8 h-full flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded font-bold transition-all shrink-0 cursor-pointer"
                                        title="Remove segment"
                                    >
                                        <Icon name="close" size={16} />
                                    </button>
                                </div>
                            );
                        })}

                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-neutral-700/50">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const newTexts = [...texts, ""];
                                        const newFonts = [...fonts, fonts[fonts.length - 1] || "16d"];
                                        const newColors = [...colors, colors[colors.length - 1] || ""];
                                        const newXs = [...texts.map((_, i) => (xOffsets[i] !== undefined ? xOffsets[i] : (xOffsets[0] || "0"))), "0"];
                                        const newYs = [...texts.map((_, i) => (yOffsets[i] !== undefined ? yOffsets[i] : (yOffsets[0] || "0"))), "0"];

                                        setRoute(newTexts.join("^"));
                                        setRouteFont(newFonts.join("^"));
                                        setRouteColor(newColors.join("^"));
                                        setRouteXOffset?.(newXs.join("^"));
                                        setRouteYOffset?.(newYs.join("^"));
                                    }}
                                    className="text-sm text-neutral-400 hover:text-white font-semibold transition-colors px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 flex items-center gap-1 cursor-pointer"
                                >
                                    <Icon name="add" size={15} /> Add Segment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-6
             mt-1 border-neutral-700/60">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                        Route Box Style
                    </label>
                    <div className="inline-flex rounded-lg bg-neutral-800 p-0.5 border border-neutral-700">
                        <button
                            type="button"
                            onClick={() => setRouteInvert(false)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                !routeInvert
                                    ? "bg-neutral-700 text-white shadow-sm"
                                    : "text-neutral-400 hover:text-white"
                            }`}
                        >
                            Standard
                        </button>
                        <button
                            type="button"
                            onClick={() => setRouteInvert(true)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                routeInvert
                                    ? "bg-orange-600 text-white shadow-sm"
                                    : "text-neutral-400 hover:text-white"
                            }`}
                        >
                            Inverted
                        </button>
                    </div>
                </div>

                <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {routeInvert && (
                        <div>
                            <label className="text-xs text-neutral-400 mb-1 block">Box Padding (px)</label>
                            <input
                                type="number"
                                min="0"
                                max="16"
                                value={routeBoxPadding}
                                onChange={(e) => setRouteBoxPadding(e.target.value)}
                                className="w-full h-8 px-2.5 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-neutral-400 mb-1 block">Separator Gap (px)</label>
                        <input
                            type="number"
                            min="0"
                            max="16"
                            value={routeBoxGap}
                            onChange={(e) => setRouteBoxGap(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                    </div>
                    {routeInvert && (
                        <div>
                            <label className="text-xs text-neutral-400 mb-1 block">Custom Box Colour</label>
                            <div className="flex items-center gap-2 h-8">
                                <input
                                    type="color"
                                    value={routeBoxColor ? `#${routeBoxColor.replace("#", "")}` : (colors[0] ? `#${colors[0]}` : "#ff9000")}
                                    onChange={(e) => setRouteBoxColor(e.target.value.replace("#", ""))}
                                    className="w-8 h-8 p-0.5 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 cursor-pointer"
                                    title="Pick custom box background color"
                                />
                                {routeBoxColor ? (
                                    <button
                                        type="button"
                                        onClick={() => setRouteBoxColor("")}
                                        className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-700 rounded border border-neutral-600 cursor-pointer"
                                        title="Reset to default route colour"
                                    >
                                        Default
                                    </button>
                                ) : (
                                    <span className="text-[11px] text-neutral-500 italic">Default</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
                </>
            )}

            <IconLibraryModal
                isOpen={pickerTarget !== null}
                onClose={() => setPickerTarget(null)}
                onSelectLogo={handleSelectLogo}
                currentSignHeight={height}
            />
        </div>
    );
}

export default GlobalRoutePanel;