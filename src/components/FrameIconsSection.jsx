import { useState } from "react";
import Icon from "./Icon.jsx";
import LogoCanvas from "./LogoCanvas.jsx";
import PositionNudgeControl from "./PositionNudgeControl.jsx";
import IconLibraryModal from "./IconLibraryModal.jsx";
import { useCustomGraphicsContext } from "../context/CustomGraphicsContext.js";
import { createIcon, resolveIconAsset } from "../utils/iconOverlays.js";

export default function FrameIconsSection({
    icons = [],
    onChangeIcons,
    currentSignHeight
}) {
    const { graphicsById, openStudio } = useCustomGraphicsContext();
    const [pickerState, setPickerState] = useState(null); // { mode: 'add' } or { mode: 'swap', index }

    const handleSelectLogo = (selected) => {
        if (!pickerState) return;

        if (pickerState.mode === "add") {
            const newIcon = createIcon({
                font: selected.font,
                char: selected.char,
                color: "",
                anchor: "LEFT",
                x: 0,
                y: 0
            });
            onChangeIcons([...icons, newIcon]);
        } else if (pickerState.mode === "swap" && pickerState.index !== undefined) {
            const next = [...icons];
            const existing = next[pickerState.index];
            if (existing) {
                next[pickerState.index] = {
                    ...existing,
                    font: selected.font,
                    char: selected.char
                };
                onChangeIcons(next);
            }
        }
        setPickerState(null);
    };

    const handleUpdate = (index, patch) => {
        const next = icons.map((ic, i) => (i === index ? { ...ic, ...patch } : ic));
        onChangeIcons(next);
    };

    const handleRemove = (index) => {
        const next = icons.filter((_, i) => i !== index);
        onChangeIcons(next);
    };

    return (
        <div className="mt-5 pt-4 border-t border-neutral-700/60">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <Icon name="palette" size={16} className="text-orange-400" />
                        Icons
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setPickerState({ mode: "add" })}
                    className="h-8 px-3 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 hover:border-orange-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Add an icon to this frame"
                >
                    <Icon name="add" size={15} className="text-orange-400" />
                    Add Icon
                </button>
            </div>

            {icons.length === 0 ? (
                <div className="text-xs text-neutral-500 bg-neutral-800/20 border border-neutral-700/60 rounded-lg p-3 text-center">
                    No icons on this frame yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {icons.map((ic, idx) => {
                        const asset = resolveIconAsset(ic.font, ic.char, graphicsById);
                        const displayColor = ic.color
                            ? (ic.color.startsWith("#") ? ic.color : `#${ic.color}`)
                            : "#FF9000";

                        return (
                            <div
                                key={ic.id || idx}
                                className="bg-neutral-800/50 border border-neutral-700/80 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="bg-black px-2 py-1 rounded border border-neutral-700 shrink-0 flex items-center justify-center min-h-[38px] min-w-[38px]">
                                        {asset.rows ? (
                                            <LogoCanvas
                                                rows={asset.rows}
                                                width={asset.width}
                                                height={asset.height}
                                                color={displayColor}
                                                offColor="#262626"
                                                scale={asset.width > 40 || asset.height > 16 ? 1 : 2}
                                            />
                                        ) : (
                                            <Icon name="warning" size={16} className="text-amber-400" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-neutral-400 bg-neutral-900/80 px-1.5 py-0.5 rounded shrink-0">
                                                {asset.width}×{asset.height}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => setPickerState({ mode: "swap", index: idx })}
                                                className="text-[11px] text-orange-400 hover:text-orange-300 font-medium flex items-center gap-0.5 cursor-pointer"
                                                title="Swap icon"
                                            >
                                                <Icon name="swap_horiz" size={13} /> Swap
                                            </button>
                                            {asset.kind === "custom" && asset.graphic && (
                                                <button
                                                    type="button"
                                                    onClick={() => openStudio(asset.graphic)}
                                                    className="text-[11px] text-neutral-400 hover:text-white font-medium flex items-center gap-0.5 cursor-pointer ml-1"
                                                    title="Edit pixels in Icon Maker"
                                                >
                                                    <Icon name="edit" size={13} /> Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center bg-neutral-900/90 border border-neutral-700 rounded p-0.5">
                                        {["LEFT", "CENTRE", "RIGHT"].map((anchor) => (
                                            <button
                                                key={anchor}
                                                type="button"
                                                onClick={() => handleUpdate(idx, { anchor })}
                                                className={`px-2.5 py-1 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                                                    ic.anchor === anchor
                                                        ? "bg-neutral-700 text-white shadow-sm"
                                                        : "text-neutral-400 hover:text-white"
                                                }`}
                                            >
                                                {anchor === "LEFT" ? "Left" : anchor === "CENTRE" ? "Centre" : "Right"}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="w-52 shrink-0">
                                        <PositionNudgeControl
                                            xValue={String(ic.x || 0)}
                                            yValue={String(ic.y || 0)}
                                            onChangeX={(val) => handleUpdate(idx, { x: parseInt(val, 10) || 0 })}
                                            onChangeY={(val) => handleUpdate(idx, { y: parseInt(val, 10) || 0 })}
                                            onReset={() => handleUpdate(idx, { x: 0, y: 0 })}
                                            compact={true}
                                            label=""
                                        />
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="color"
                                            value={ic.color ? `#${ic.color}` : "#ff9000"}
                                            onChange={(e) => handleUpdate(idx, { color: e.target.value.replace("#", "") })}
                                            className="w-8 h-8 p-0.5 rounded bg-neutral-900 border border-neutral-600 hover:border-neutral-500 cursor-pointer"
                                            title="Icon Colour (leave default to inherit sign colour)"
                                        />
                                        {ic.color && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdate(idx, { color: "" })}
                                                className="text-neutral-500 hover:text-white p-1 cursor-pointer"
                                                title="Reset to sign colour"
                                            >
                                                <Icon name="close" size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemove(idx)}
                                        className="text-neutral-500 hover:text-red-400 p-1.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                                        title="Remove icon"
                                    >
                                        <Icon name="close" size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <IconLibraryModal
                isOpen={pickerState !== null}
                onClose={() => setPickerState(null)}
                onSelectLogo={handleSelectLogo}
                currentSignHeight={currentSignHeight}
            />
        </div>
    );
}
