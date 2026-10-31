import { useState } from "react";
import FontDropdown from "./FontDropdown.jsx";
import InputGroup from "./InputGroup.jsx";
import IconLibraryModal from "./IconLibraryModal.jsx";
import GraphicSegmentChip from "./GraphicSegmentChip.jsx";
import PositionNudgeControl, { SegmentOffsetButton } from "./PositionNudgeControl.jsx";
import FrameIconsSection from "./FrameIconsSection.jsx";
import Icon from "./Icon.jsx";
import { isIconFont, createIcon } from "../utils/iconOverlays.js";

function LineEditor({
    title,
    textStr,
    fontStr,
    colorStr,
    spacingStr,
    alignStr,
    xOffsetStr = "0",
    yOffsetStr = "0",
    onUpdateText,
    onUpdateFont,
    onUpdateColor,
    onUpdateSpacing,
    onUpdateAlign,
    onUpdateXOffset,
    onUpdateYOffset,
    onDetachIcon,
    placeholder,
    currentSignHeight
}) {
    const [pickerTarget, setPickerTarget] = useState(null);
    const texts = (textStr || "").split("^");
    const fonts = (fontStr || "").split("^");
    const colors = (colorStr || "").split("^");
    const xOffsets = (xOffsetStr || "0").split("^");
    const yOffsets = (yOffsetStr || "0").split("^");
    const isSplit = texts.length > 1 || fonts.length > 1 || colors.length > 1;

    const handleSelectLogo = (logo) => {
        if (!pickerTarget) return;

        if (pickerTarget.mode === "standard") {
            const currentText = texts[0] || "";
            const currentFont = fonts[0] || "16d";
            const currentColor = colors[0] || "";
            const currentX = xOffsets[0] || "0";
            const currentY = yOffsets[0] || "0";

            if (!currentText.trim() || currentFont.startsWith("@")) {
                onUpdateText(logo.char);
                onUpdateFont(logo.font);
            } else {
                onUpdateText(`${logo.char}^ ${currentText.trimStart()}`);
                onUpdateFont(`${logo.font}^${currentFont}`);
                onUpdateColor(`^${currentColor}`);
                onUpdateXOffset?.(`0^${currentX}`);
                onUpdateYOffset?.(`0^${currentY}`);
            }
        } else if (pickerTarget.mode === "add-segment") {
            const newTexts = [...texts, logo.char];
            const newFonts = [...fonts, logo.font];
            const newColors = [...colors, ""];
            const newXs = [...xOffsets, "0"];
            const newYs = [...yOffsets, "0"];
            onUpdateText(newTexts.join("^"));
            onUpdateFont(newFonts.join("^"));
            onUpdateColor(newColors.join("^"));
            onUpdateXOffset?.(newXs.join("^"));
            onUpdateYOffset?.(newYs.join("^"));
        } else if (pickerTarget.mode === "segment") {
            const idx = pickerTarget.index;
            const newTexts = [...texts];
            const newFonts = [...fonts];
            newTexts[idx] = logo.char;
            newFonts[idx] = logo.font;
            onUpdateText(newTexts.join("^"));
            onUpdateFont(newFonts.join("^"));
        }

        setPickerTarget(null);
    };

    const toggleSplit = () => {
        if (isSplit) {
            onUpdateText(texts.join(""));
            onUpdateFont(fonts[0] || "16d");
            onUpdateColor(colors[0] || "");
            onUpdateXOffset?.(xOffsets[0] || "0");
            onUpdateYOffset?.(yOffsets[0] || "0");
        } else {
            const fallbackSecondFont = (fonts[0] || "").startsWith("@") ? "16d" : (fontStr || "16d");
            onUpdateText((textStr || "") + "^");
            onUpdateFont((fontStr || "16d") + "^" + fallbackSecondFont);
            onUpdateColor((colorStr || "") + "^" + (colors[colors.length - 1] || ""));
            onUpdateXOffset?.((xOffsetStr || "0") + "^" + (xOffsets[xOffsets.length - 1] || "0"));
            onUpdateYOffset?.((yOffsetStr || "0") + "^" + (yOffsets[yOffsets.length - 1] || "0"));
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-neutral-400">{title}</label>
                <button onClick={toggleSplit} className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors cursor-pointer">
                    {isSplit ? "Standard" : "Mixed Fonts"}
                </button>
            </div>

            {!isSplit ? (
                <>
                    <div className="flex gap-2 mb-3">
                        {isIconFont(fonts[0]) ? (
                            <GraphicSegmentChip
                                fontValue={fonts[0]}
                                charValue={texts[0]}
                                colorHex={colors[0]}
                                onChangeGraphic={() => setPickerTarget({ mode: "standard" })}
                                onDetach={onDetachIcon ? () => onDetachIcon({ font: fonts[0], char: texts[0] || "A", color: colors[0] || "" }, () => {
                                    onUpdateText("");
                                    onUpdateFont("16d");
                                }) : undefined}
                                onConvertToText={() => {
                                    onUpdateText("");
                                    onUpdateFont("16d");
                                }}
                            />
                        ) : (
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={texts[0] || ""}
                                    onChange={(e) => onUpdateText(e.target.value)}
                                    className="w-full h-10 px-3 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-neutral-500"
                                />
                            </div>
                        )}
                        {onUpdateAlign && (
                            <select
                                value={alignStr || "CENTRE"}
                                onChange={(e) => onUpdateAlign(e.target.value)}
                                className="w-24 h-10 px-2 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            >
                                <option value="LEFT">Left</option>
                                <option value="CENTRE">Centre</option>
                                <option value="RIGHT">Right</option>
                            </select>
                        )}
                    </div>
                    <div className="grid grid-cols-4 gap-x-4 gap-y-3 items-end">
                        {!isIconFont(fonts[0]) && (
                            <div className="col-span-2">
                                <FontDropdown label="Font" value={fonts[0]} onChange={onUpdateFont} />
                            </div>
                        )}
                        <div className={`${isIconFont(fonts[0]) ? "col-span-3" : "col-span-1"} flex flex-col`}>
                            <label className="text-neutral-400 mb-1 text-sm">Colour</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={colors[0] ? `#${colors[0]}` : "#ff9000"}
                                    onChange={(e) => onUpdateColor(e.target.value.replace("#", ""))}
                                    className="w-10 h-10 p-1 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 cursor-pointer"
                                />
                                {colors[0] && (
                                    <button onClick={() => onUpdateColor("")} className="text-neutral-500 hover:text-white flex items-center justify-center p-1 cursor-pointer" title="Reset to global">
                                        <Icon name="close" size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="col-span-1">
                            <InputGroup label="Spacing" type="number" min="-5" value={spacingStr} onChange={onUpdateSpacing} />
                        </div>
                        {onUpdateXOffset && onUpdateYOffset && (
                            <div className="col-span-4 pt-0.5">
                                <PositionNudgeControl
                                    xValue={xOffsets[0] || "0"}
                                    yValue={yOffsets[0] || "0"}
                                    onChangeX={onUpdateXOffset}
                                    onChangeY={onUpdateYOffset}
                                    compact={true}
                                />
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-black/30 p-3 rounded-lg border border-neutral-700/50 space-y-3">
                    {texts.map((txt, idx) => {
                        const segFont = fonts[idx] || fonts[0] || "16d";
                        const isGraphicSeg = isIconFont(segFont);
                        const segX = xOffsets[idx] !== undefined ? xOffsets[idx] : (xOffsets[0] || "0");
                        const segY = yOffsets[idx] !== undefined ? yOffsets[idx] : (yOffsets[0] || "0");

                        const updateSegX = (val) => {
                            const next = texts.map((_, i) => (xOffsets[i] !== undefined ? xOffsets[i] : (xOffsets[0] || "0")));
                            next[idx] = val;
                            onUpdateXOffset?.(next.join("^"));
                        };
                        const updateSegY = (val) => {
                            const next = texts.map((_, i) => (yOffsets[i] !== undefined ? yOffsets[i] : (yOffsets[0] || "0")));
                            next[idx] = val;
                            onUpdateYOffset?.(next.join("^"));
                        };
                        const resetSegXY = () => {
                            const nextX = texts.map((_, i) => (xOffsets[i] !== undefined ? xOffsets[i] : (xOffsets[0] || "0")));
                            const nextY = texts.map((_, i) => (yOffsets[i] !== undefined ? yOffsets[i] : (yOffsets[0] || "0")));
                            nextX[idx] = "0";
                            nextY[idx] = "0";
                            onUpdateXOffset?.(nextX.join("^"));
                            onUpdateYOffset?.(nextY.join("^"));
                        };

                        return (
                            <div key={idx} className="flex gap-2 items-center h-10">
                                {isGraphicSeg ? (
                                    <GraphicSegmentChip
                                        fontValue={segFont}
                                        charValue={txt}
                                        colorHex={colors[idx] || colors[0]}
                                        onChangeGraphic={() => setPickerTarget({ mode: "segment", index: idx })}
                                        onDetach={onDetachIcon ? () => onDetachIcon({ font: segFont, char: txt || "A", color: colors[idx] || "" }, () => {
                                            const newTexts = [...texts];
                                            const newFonts = [...fonts];
                                            const newColors = [...colors];
                                            newTexts.splice(idx, 1);
                                            newFonts.splice(idx, 1);
                                            newColors.splice(idx, 1);
                                            onUpdateText(newTexts.join("^"));
                                            onUpdateFont(newFonts.join("^"));
                                            onUpdateColor(newColors.join("^"));
                                        }) : undefined}
                                        onConvertToText={() => {
                                            const newTexts = [...texts];
                                            const newFonts = [...fonts];
                                            newTexts[idx] = "";
                                            newFonts[idx] = "16d";
                                            onUpdateText(newTexts.join("^"));
                                            onUpdateFont(newFonts.join("^"));
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
                                                    onUpdateText(newTexts.join("^"));
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
                                                    onUpdateFont(newFonts.join("^"));
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
                                            onUpdateColor(newColors.join("^"));
                                        }}
                                        title="Segment Colour"
                                        className="w-full h-full p-1 rounded bg-neutral-800 border border-neutral-600 cursor-pointer"
                                    />
                                </div>
                                {onUpdateXOffset && onUpdateYOffset && (
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
                                        onUpdateText(newTexts.join("^"));
                                        onUpdateFont(newFonts.join("^"));
                                        onUpdateColor(newColors.join("^"));
                                        onUpdateXOffset?.(newXs.join("^"));
                                        onUpdateYOffset?.(newYs.join("^"));
                                    }}
                                    className="w-8 h-full flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded font-bold transition-all shrink-0 cursor-pointer"
                                    title="Remove segment"
                                >
                                    <Icon name="close" size={16} />
                                </button>
                            </div>
                        );
                    })}

                    <div className="flex justify-between items-end pt-2 mt-2 border-t border-neutral-700/50">
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const newTexts = [...texts, ""];
                                    const newFonts = [...fonts, fonts[fonts.length - 1] || "16d"];
                                    const newColors = [...colors, colors[colors.length - 1] || ""];
                                    const newXs = [...texts.map((_, i) => (xOffsets[i] !== undefined ? xOffsets[i] : (xOffsets[0] || "0"))), "0"];
                                    const newYs = [...texts.map((_, i) => (yOffsets[i] !== undefined ? yOffsets[i] : (yOffsets[0] || "0"))), "0"];

                                    onUpdateText(newTexts.join("^"));
                                    onUpdateFont(newFonts.join("^"));
                                    onUpdateColor(newColors.join("^"));
                                    onUpdateXOffset?.(newXs.join("^"));
                                    onUpdateYOffset?.(newYs.join("^"));
                                }}
                                className="text-sm text-neutral-400 hover:text-white font-semibold transition-colors px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 flex items-center gap-1 cursor-pointer"
                            >
                                <Icon name="add" size={15} /> Add Segment
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-col">
                                <label className="text-xs text-neutral-400 mb-1">Spacing</label>
                                <input type="number" min="-5" value={spacingStr} onChange={(e) => onUpdateSpacing(e.target.value)} className="w-16 h-8 px-2 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                            </div>
                            {onUpdateAlign && (
                                <div className="flex flex-col">
                                    <label className="text-xs text-neutral-400 mb-1">Align</label>
                                    <select value={alignStr || "CENTRE"} onChange={(e) => onUpdateAlign(e.target.value)} className="w-20 h-8 px-1 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer">
                                        <option value="LEFT">Left</option>
                                        <option value="CENTRE">Centre</option>
                                        <option value="RIGHT">Right</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <IconLibraryModal
                isOpen={pickerTarget !== null}
                onClose={() => setPickerTarget(null)}
                onSelectLogo={handleSelectLogo}
                currentSignHeight={currentSignHeight}
            />
        </div>
    );
}

function FrameView({
    removeFrame,
    updateFrame,
    duplicateFrame,
    index,
    frame,
    height,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    isDragging,
    isDragOver,
    label = "Frame"
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleDetachIcon = (iconData, clearTextCallback) => {
        const newIcon = createIcon({
            font: iconData.font,
            char: iconData.char,
            color: iconData.color,
            anchor: "LEFT",
            x: 0,
            y: 0
        });
        updateFrame(frame.id, "icons", [...(frame.icons || []), newIcon]);
        clearTextCallback?.();
    };

    return (
        <div
            key={frame.id}
            onDragOver={(e) => onDragOver?.(index, e)}
            onDragLeave={(e) => onDragLeave?.(index, e)}
            onDrop={(e) => onDrop?.(index, e)}
            className={`bg-zinc-900 p-5 rounded-lg border relative md:col-span-2 transition-all duration-150 ${
                isDragging
                    ? "opacity-40 border-dashed border-orange-500 scale-[0.99] ring-2 ring-orange-500/20"
                    : isDragOver
                    ? "border-orange-500 ring-2 ring-orange-500/60 bg-zinc-800/90"
                    : "border-neutral-700 hover:border-neutral-600"
            }`}
        >
            <div className={`flex items-center justify-between ${isCollapsed ? '' : 'mb-4 border-b border-neutral-700/80 pb-3'} gap-3`}>
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        draggable={true}
                        onDragStart={(e) => onDragStart?.(index, e)}
                        onDragEnd={() => onDragEnd?.()}
                        className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-orange-400 p-1 -ml-1 rounded hover:bg-neutral-800 transition-colors flex items-center justify-center shrink-0"
                        title="Drag to reorder frame"
                    >
                        <Icon name="drag_indicator" size={20} />
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="flex items-center gap-2 group cursor-pointer text-left select-none shrink-0"
                        aria-label={isCollapsed ? `Expand ${label} ${index + 1}` : `Collapse ${label} ${index + 1}`}
                    >
                        <Icon
                            name="expand_more"
                            size={18}
                            className={`text-neutral-400 group-hover:text-white transition-transform duration-200 shrink-0 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                        />
                        <span className="text-lg font-semibold text-white group-hover:text-neutral-200 whitespace-nowrap">
                            {label} {index + 1}
                        </span>
                    </button>

                    {isCollapsed && (
                        <div className="flex items-center gap-2 text-xs font-mono ml-2 overflow-hidden truncate max-w-xs sm:max-w-md">
                            <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700/60 truncate" title={frame.line1}>
                                {frame.line1 ? frame.line1.replace(/\^/g, ' ') : "—"}
                            </span>
                            {frame.line2 && (
                                <span className="px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-400 border border-neutral-700/60 truncate" title={frame.line2}>
                                    / {frame.line2.replace(/\^/g, ' ')}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isCollapsed && (
                        <div className="flex items-center gap-1.5 mr-1">
                            {frame.icons && frame.icons.length > 0 && (
                                <span className="text-xs text-orange-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 flex items-center gap-1" title={`${frame.icons.length} icon(s)`}>
                                    <Icon name="palette" size={13} /> {frame.icons.length}
                                </span>
                            )}
                            {frame.delay && (
                                <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700" title="Hold time">
                                    {frame.delay}ms
                                </span>
                            )}
                            {frame.animation && frame.animation !== "NONE" && (
                                <span className="text-xs text-orange-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                                    {frame.animation}
                                </span>
                            )}
                        </div>
                    )}

                    {duplicateFrame && (
                        <button
                            type="button"
                            onClick={() => duplicateFrame(frame.id)}
                            className="text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors px-2.5 py-1 rounded hover:bg-neutral-800 border border-neutral-700/60"
                            title={`Duplicate ${label} ${index + 1}`}
                        >
                            <Icon name="content_copy" size={14} className="text-neutral-400" />
                            Duplicate
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => removeFrame(frame.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-bold px-2 py-1 rounded hover:bg-red-500/10 cursor-pointer transition-colors flex items-center gap-1"
                        title={`Remove ${label} ${index + 1}`}
                    >
                        <Icon name="close" size={14} /> Remove
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 bg-neutral-800/40 border border-neutral-700/60 rounded-md px-3.5 py-2.5 mb-5 text-sm">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-neutral-400">Transition:</label>
                            <select
                                value={frame.animation}
                                onChange={(e) => updateFrame(frame.id, "animation", e.target.value)}
                                className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            >
                                <option value="NONE">None</option>
                                <option value="FALLDOWN">Fall Down</option>
                                <option value="FALLUP">Fall Up</option>
                                <option value="SIDEWIPE">Side Wipe</option>
                                <option value="SCROLL">Scroll</option>
                            </select>
                        </div>

                        {frame.animation !== "NONE" && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-neutral-400">Speed (s):</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={frame.animSpeed}
                                    onChange={(e) => updateFrame(frame.id, "animSpeed", e.target.value)}
                                    className="w-16 px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-neutral-400" title="Leave blank to use the global hardware speed">Hold (ms):</label>
                            <input
                                type="number"
                                placeholder="Global"
                                min="100"
                                step="100"
                                value={frame.delay || ""}
                                onChange={(e) => updateFrame(frame.id, "delay", e.target.value)}
                                className="w-20 px-2.5 py-1 rounded bg-neutral-800 border border-neutral-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-neutral-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-neutral-400">Stack:</label>
                            <select
                                value={frame.verticalSpacing}
                                onChange={(e) => updateFrame(frame.id, "verticalSpacing", e.target.value)}
                                className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            >
                                <option value="FLUSH">Flush to Edges</option>
                                <option value="EQUISPACED">Equispaced</option>
                            </select>
                        </div>
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <LineEditor
                        title="Destination Line 1"
                        placeholder="e.g. 41ST AVE"
                        textStr={frame.line1}
                        fontStr={frame.line1Font}
                        colorStr={frame.line1Color}
                        spacingStr={frame.line1Spacing}
                        alignStr={frame.line1Align}
                        xOffsetStr={frame.line1XOffset || "0"}
                        yOffsetStr={frame.line1YOffset || "0"}
                        onUpdateText={(val) => updateFrame(frame.id, "line1", val)}
                        onUpdateFont={(val) => updateFrame(frame.id, "line1Font", val)}
                        onUpdateColor={(val) => updateFrame(frame.id, "line1Color", val)}
                        onUpdateSpacing={(val) => updateFrame(frame.id, "line1Spacing", val)}
                        onUpdateAlign={(val) => updateFrame(frame.id, "line1Align", val)}
                        onUpdateXOffset={(val) => updateFrame(frame.id, "line1XOffset", val)}
                        onUpdateYOffset={(val) => updateFrame(frame.id, "line1YOffset", val)}
                        onDetachIcon={handleDetachIcon}
                        currentSignHeight={height}
                    />

                    <LineEditor
                        title="Destination Line 2 (Optional)"
                        placeholder="Leave blank for unstacked"
                        textStr={frame.line2}
                        fontStr={frame.line2Font}
                        colorStr={frame.line2Color}
                        spacingStr={frame.line2Spacing}
                        alignStr={frame.line2Align}
                        xOffsetStr={frame.line2XOffset || "0"}
                        yOffsetStr={frame.line2YOffset || "0"}
                        onUpdateText={(val) => updateFrame(frame.id, "line2", val)}
                        onUpdateFont={(val) => updateFrame(frame.id, "line2Font", val)}
                        onUpdateColor={(val) => updateFrame(frame.id, "line2Color", val)}
                        onUpdateSpacing={(val) => updateFrame(frame.id, "line2Spacing", val)}
                        onUpdateAlign={(val) => updateFrame(frame.id, "line2Align", val)}
                        onUpdateXOffset={(val) => updateFrame(frame.id, "line2XOffset", val)}
                        onUpdateYOffset={(val) => updateFrame(frame.id, "line2YOffset", val)}
                        onDetachIcon={handleDetachIcon}
                        currentSignHeight={height}
                    />
                </div>

                <FrameIconsSection
                    icons={frame.icons || []}
                    onChangeIcons={(newIcons) => updateFrame(frame.id, "icons", newIcons)}
                    currentSignHeight={height}
                />
            </>
            )}
        </div>
    );
}

export default FrameView;