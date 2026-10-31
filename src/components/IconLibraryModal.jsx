import { useState, useEffect } from "react";
import { TRANSIT_LOGOS } from "../data/transitLogos.js";
import LogoCanvas from "./LogoCanvas.jsx";
import Icon from "./Icon.jsx";
import { useCustomGraphicsContext } from "../context/CustomGraphicsContext.js";

function IconLibraryModal({ isOpen, onClose, onSelectLogo, currentSignHeight }) {
    const {
        graphics: customGraphics,
        saveGraphic,
        deleteGraphic,
        duplicateGraphic,
        openStudio
    } = useCustomGraphicsContext();

    const [activeTab, setActiveTab] = useState("ALL");

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const counts = {
        custom: customGraphics.length,
        ALL: TRANSIT_LOGOS.length + customGraphics.length,
        logo: TRANSIT_LOGOS.filter((l) => l.font === "logo").length,
        logo16: TRANSIT_LOGOS.filter((l) => l.font === "logo16").length,
        smartgraphics: TRANSIT_LOGOS.filter((l) => l.font === "smartgraphics").length
    };

    const showCustomSection = activeTab === "custom" || activeTab === "ALL";
    const filteredBuiltInLogos =
        activeTab === "custom"
            ? []
            : TRANSIT_LOGOS.filter((logo) => {
                  if (activeTab !== "ALL" && logo.font !== activeTab) return false;
                  return true;
              });

    const handleSelectCustom = (g) => {
        onSelectLogo({
            id: g.id,
            name: g.name,
            char: "A",
            font: `@${g.id}`,
            width: g.width,
            height: g.height,
            rows: g.rows
        });
        onClose();
    };

    const handleOpenNewGraphic = () => {
        openStudio(null, (savedGraphic) => {
            if (savedGraphic) {
                handleSelectCustom(savedGraphic);
            }
        });
    };

    const handleEditCopyOfBuiltIn = (e, logo) => {
        e.stopPropagation();
        openStudio(
            {
                name: `${logo.name} (Custom)`,
                width: logo.width,
                height: logo.height,
                rows: [...logo.rows]
            },
            (savedGraphic) => {
                if (savedGraphic) {
                    handleSelectCustom(savedGraphic);
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/70">
            <div
                className="bg-zinc-900 border border-neutral-700 rounded-xl shadow-2xl max-w-3xl w-full p-6 relative flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 border-b border-neutral-700/80 pb-3 gap-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">Icon Library</h2>
                        <button
                            type="button"
                            onClick={handleOpenNewGraphic}
                            className="px-3 py-1 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                            <Icon name="add" size={15} /> Icon Maker
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
                        title="Close (Esc)"
                    >
                        <Icon name="close" size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5 bg-neutral-800/80 p-1 rounded-lg border border-neutral-700/60 mb-4 w-fit">
                    <button
                        onClick={() => setActiveTab("ALL")}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            activeTab === "ALL"
                                ? "bg-orange-600 text-white"
                                : "text-neutral-400 hover:text-white"
                        }`}
                    >
                        All ({counts.ALL})
                    </button>
                    <button
                        onClick={() => setActiveTab("custom")}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            activeTab === "custom"
                                ? "bg-orange-600 text-white"
                                : "text-neutral-400 hover:text-white"
                        }`}
                    >
                        Custom Icons ({counts.custom})
                    </button>
                    <button
                        onClick={() => setActiveTab("logo")}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            activeTab === "logo"
                                ? "bg-orange-600 text-white"
                                : "text-neutral-400 hover:text-white"
                        }`}
                    >
                        Hanover 14px ({counts.logo})
                    </button>
                    <button
                        onClick={() => setActiveTab("logo16")}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            activeTab === "logo16"
                                ? "bg-orange-600 text-white"
                                : "text-neutral-400 hover:text-white"
                        }`}
                    >
                        Hanover 16px ({counts.logo16})
                    </button>
                    <button
                        onClick={() => setActiveTab("smartgraphics")}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            activeTab === "smartgraphics"
                                ? "bg-orange-600 text-white"
                                : "text-neutral-400 hover:text-white"
                        }`}
                    >
                        Smart 20px ({counts.smartgraphics})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                    {activeTab === "custom" && customGraphics.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-neutral-400 bg-neutral-800/30 border border-dashed border-neutral-700 rounded-xl">
                            <Icon name="palette" size={36} className="text-neutral-500 mb-2" />
                            <p className="text-sm font-semibold text-white mb-4">No custom icons yet</p>
                            <button
                                type="button"
                                onClick={handleOpenNewGraphic}
                                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                                <Icon name="add" size={16} /> Create Your First Icon
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {activeTab === "custom" && (
                                <button
                                    type="button"
                                    onClick={handleOpenNewGraphic}
                                    className="flex flex-col items-center justify-center bg-neutral-800/40 hover:bg-neutral-800 border-2 border-dashed border-neutral-600 hover:border-orange-500 rounded-lg p-3 min-h-[108px] transition-all cursor-pointer group"
                                >
                                    <Icon name="add" size={28} className="text-orange-400 group-hover:scale-110 transition-transform mb-1" />
                                    <span className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                                        New Icon
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                        Draw or Import
                                    </span>
                                </button>
                            )}

                            {showCustomSection &&
                                customGraphics.map((g) => {
                                    const isRecommendedHeight =
                                        !currentSignHeight || Number(currentSignHeight) >= g.height;

                                    return (
                                        <div
                                            key={`custom-${g.id}`}
                                            onClick={() => handleSelectCustom(g)}
                                            className={`group flex flex-col items-center text-left bg-neutral-800/60 hover:bg-neutral-800 border border-orange-500/40 hover:border-orange-500 rounded-lg p-3 transition-all cursor-pointer relative ${
                                                g.width >= 60 ? "col-span-2" : ""
                                            }`}
                                        >
                                            <div
                                                className="absolute top-1.5 left-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => openStudio(g)}
                                                    className="px-1.5 py-0.5 rounded bg-neutral-900/90 hover:bg-orange-600 text-neutral-200 hover:text-white text-[10px] font-semibold border border-neutral-700 cursor-pointer flex items-center gap-0.5"
                                                    title="Edit in Icon Maker"
                                                >
                                                    <Icon name="edit" size={12} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => duplicateGraphic(g.id)}
                                                    className="p-1 rounded bg-neutral-900/90 hover:bg-neutral-700 text-neutral-200 hover:text-white text-[10px] border border-neutral-700 cursor-pointer flex items-center justify-center"
                                                    title="Duplicate"
                                                >
                                                    <Icon name="content_copy" size={12} />
                                                </button>
                                                {g.isSessionOnly && (
                                                    <button
                                                        type="button"
                                                        onClick={() => saveGraphic(g)}
                                                        className="px-1.5 py-0.5 rounded bg-emerald-700/90 hover:bg-emerald-600 text-white text-[10px] font-semibold cursor-pointer"
                                                        title="Save shared icon to Custom Icons"
                                                    >
                                                        Save
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window.confirm(`Delete custom icon "${g.name}"?`)) {
                                                            deleteGraphic(g.id);
                                                        }
                                                    }}
                                                    className="p-1 rounded bg-neutral-900/90 hover:bg-red-600 text-neutral-400 hover:text-white text-[10px] border border-neutral-700 cursor-pointer flex items-center justify-center"
                                                    title="Delete icon"
                                                >
                                                    <Icon name="delete" size={12} />
                                                </button>
                                            </div>

                                            <div className="w-full flex items-center justify-center bg-black/60 border border-neutral-700/50 rounded py-2 mb-2 min-h-[56px] overflow-x-auto group-hover:border-orange-500/50 transition-colors">
                                                <LogoCanvas
                                                    rows={g.rows}
                                                    width={g.width}
                                                    height={g.height}
                                                    color="#FF9000"
                                                    offColor="#333333"
                                                    scale={g.width > 50 ? 1 : g.height > 16 ? 1 : 2}
                                                />
                                            </div>

                                            <div className="w-full flex items-center justify-between gap-1 text-xs pt-1 min-w-0">
                                                <span
                                                    className="px-1.5 py-0.5 rounded bg-orange-600/20 text-orange-300 border border-orange-500/30 font-semibold text-[10px] truncate"
                                                    title={g.name}
                                                >
                                                    {g.name}
                                                </span>
                                                <span className="font-mono text-neutral-400 text-[10px] shrink-0">
                                                    {g.width}×{g.height}px
                                                </span>
                                            </div>

                                            {!isRecommendedHeight && (
                                                <span
                                                    className="absolute top-1.5 right-1.5 text-amber-500 text-xs flex items-center"
                                                    title={`Warning: Sign height (${currentSignHeight}px) is shorter than this icon (${g.height}px)`}
                                                >
                                                    <Icon name="warning" size={14} />
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}

                            {filteredBuiltInLogos.map((logo) => {
                                const isRecommendedHeight =
                                    !currentSignHeight ||
                                    Number(currentSignHeight) >= logo.height;

                                return (
                                    <div
                                        key={logo.id}
                                        onClick={() => {
                                            onSelectLogo(logo);
                                            onClose();
                                        }}
                                        className={`group flex flex-col items-center text-left bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700 hover:border-orange-500 rounded-lg p-3 transition-all cursor-pointer relative ${
                                            logo.width >= 60 ? "col-span-2" : ""
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={(e) => handleEditCopyOfBuiltIn(e, logo)}
                                            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-neutral-900/90 hover:bg-orange-600 text-neutral-300 hover:text-white text-[10px] font-semibold border border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer flex items-center gap-0.5"
                                            title="Customize a copy of this icon in Icon Maker"
                                        >
                                            <Icon name="edit" size={12} /> Edit Copy
                                        </button>

                                        <div className="w-full flex items-center justify-center bg-black/60 border border-neutral-700/50 rounded py-2 mb-2 min-h-[56px] overflow-x-auto group-hover:border-orange-500/50 transition-colors">
                                            <LogoCanvas
                                                rows={logo.rows}
                                                width={logo.width}
                                                height={logo.height}
                                                color="#FF9000"
                                                offColor="#333333"
                                                scale={logo.width > 50 ? 1 : logo.height > 16 ? 1 : 2}
                                            />
                                        </div>

                                        <div className="w-full flex items-center justify-between gap-1 text-xs pt-1 min-w-0">
                                            <span
                                                className="px-1.5 py-0.5 rounded bg-neutral-700/80 text-neutral-200 font-mono text-[10px] font-semibold truncate group-hover:text-white transition-colors"
                                                title={logo.font}
                                            >
                                                {logo.font === "smartgraphics" ? "smartgfx" : logo.font}
                                            </span>
                                            <span className="font-mono text-neutral-400 text-[10px] shrink-0">
                                                {logo.width}×{logo.height}px
                                            </span>
                                        </div>

                                        {!isRecommendedHeight && (
                                            <span
                                                className="absolute top-1.5 right-1.5 text-amber-500 text-xs flex items-center"
                                                title={`Warning: Sign height (${currentSignHeight}px) is shorter than this logo (${logo.height}px)`}
                                            >
                                                <Icon name="warning" size={14} />
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-700/60 flex items-center justify-between text-xs text-neutral-400">
                    <div>
                        Shown:{" "}
                        <span className="text-white font-medium">
                            {(showCustomSection ? customGraphics.length : 0) + filteredBuiltInLogos.length}
                        </span>{" "}
                        icons available
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default IconLibraryModal;
