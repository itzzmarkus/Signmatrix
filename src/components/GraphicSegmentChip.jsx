import LogoCanvas from "./LogoCanvas.jsx";
import Icon from "./Icon.jsx";
import { useCustomGraphicsContext } from "../context/CustomGraphicsContext.js";
import { resolveIconAsset } from "../utils/iconOverlays.js";

export default function GraphicSegmentChip({
    fontValue,
    charValue,
    colorHex,
    onChangeGraphic,
    onConvertToText,
    onDetach
}) {
    const { graphicsById, openStudio } = useCustomGraphicsContext();
    const asset = resolveIconAsset(fontValue, charValue, graphicsById);
    const displayColor = colorHex
        ? (colorHex.startsWith("#") ? colorHex : `#${colorHex}`)
        : "#FF9000";

    return (
        <div className="flex items-center justify-between gap-2 h-10 px-2.5 rounded bg-neutral-800 border border-orange-500/50 text-xs flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                {asset.kind !== "missing" ? (
                    <>
                        <div className="bg-black px-1.5 py-0.5 rounded border border-neutral-700 shrink-0 flex items-center max-h-8 overflow-hidden">
                            <LogoCanvas
                                rows={asset.rows}
                                width={asset.width}
                                height={asset.height}
                                color={displayColor}
                                offColor="#262626"
                                scale={1}
                            />
                        </div>
                        <span className="text-white font-semibold truncate" title={asset.name}>
                            {asset.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                            {asset.width}×{asset.height}
                        </span>
                    </>
                ) : (
                    <span className="text-amber-400 font-semibold truncate flex items-center gap-1">
                        <Icon name="warning" size={14} /> Missing Icon ({asset.name})
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {asset.kind === "custom" && (
                    <button
                        type="button"
                        onClick={() => openStudio(asset.graphic)}
                        className="px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Edit pixels in Icon Maker"
                    >
                        <Icon name="edit" size={13} /> Edit
                    </button>
                )}
                {onChangeGraphic && (
                    <button
                        type="button"
                        onClick={onChangeGraphic}
                        className="px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Swap with another icon"
                    >
                        <Icon name="swap_horiz" size={13} /> Swap
                    </button>
                )}
                {onDetach && (
                    <button
                        type="button"
                        onClick={onDetach}
                        className="px-2 py-1 rounded bg-orange-600/80 hover:bg-orange-500 text-white text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Move icon out of text line to position freely"
                    >
                        <Icon name="open_with" size={13} /> Detach
                    </button>
                )}
                {onConvertToText && (
                    <button
                        type="button"
                        onClick={onConvertToText}
                        className="px-2 py-1 rounded bg-neutral-700/70 hover:bg-neutral-600 text-neutral-400 hover:text-white text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                        title="Switch back to text"
                    >
                        <Icon name="text_fields" size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
