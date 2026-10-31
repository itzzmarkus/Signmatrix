import { useState, useRef, useEffect } from "react";
import Icon from "./Icon.jsx";

function PreviewControls({
    previewMode,
    setPreviewMode,
    frames,
    prFrames,
    downloadSign,
    isDownloading,
    downloadProgress,
    copySign,
    isCopying,
    copiedStatus,
    isAnimated = false
}) {
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!showDownloadMenu) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowDownloadMenu(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setShowDownloadMenu(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showDownloadMenu]);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-900/95 backdrop-blur-md p-3 rounded-b-lg border-x border-b border-neutral-700">
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                {(frames.length > 1 || prFrames.some(f => f.line1.trim() !== "" || f.line2.trim() !== "")) && (
                    <>
                        <button
                            onClick={() => setPreviewMode("all")}
                            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1 ${previewMode === "all" ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
                        >
                            <Icon name="play_arrow" size={16} fill={true} /> Play
                        </button>
                        {frames.map((_, idx) => (
                            <button
                                key={`frame-${idx}`}
                                onClick={() => setPreviewMode(idx.toString())}
                                className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${previewMode === idx.toString() ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
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
                                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${previewMode === `pr-${idx}` ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
                                >
                                    PR {idx + 1}
                                </button>
                            );
                        })}
                    </>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => copySign()}
                        disabled={isCopying || isDownloading || isAnimated}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap border ${
                            copiedStatus
                                ? 'bg-emerald-600 border-emerald-500 text-white cursor-pointer'
                                : isAnimated
                                ? 'bg-neutral-800/40 border-neutral-700/40 text-neutral-500 cursor-not-allowed opacity-50'
                                : isCopying || isDownloading
                                ? 'bg-neutral-800/60 border-neutral-700 text-neutral-400 cursor-not-allowed'
                                : 'bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-100 border-neutral-600 hover:border-neutral-500 cursor-pointer'
                        }`}
                        title={
                            isAnimated
                                ? "Can't copy animated signs to clipboard — use Download instead!"
                                : "Copy sign to clipboard"
                        }
                    >
                        {isCopying ? (
                            <>
                                <Icon name="progress_activity" size={16} className="animate-spin text-neutral-300" />
                                Copying...
                            </>
                        ) : copiedStatus ? (
                            <>
                                <Icon name="check" size={16} />
                                Copied Image!
                            </>
                        ) : (
                            <>
                                <Icon name="content_copy" size={16} className={isAnimated ? "text-neutral-500" : ""} />
                                Copy
                            </>
                        )}
                    </button>
                </div>

                <div className="relative inline-flex items-stretch rounded-lg shadow-sm" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => downloadSign({ transparent: false })}
                        disabled={isDownloading || isCopying}
                        className={`flex items-center gap-2 pl-3.5 pr-2.5 py-1.5 rounded-l-lg font-bold text-white text-xs sm:text-sm whitespace-nowrap cursor-pointer transition-colors border-r border-orange-700/60 ${
                            isDownloading ? 'bg-orange-600/50 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500'
                        }`}
                        title="Download sign"
                    >
                        {isDownloading ? (
                            <>
                                <Icon name="progress_activity" size={16} className="animate-spin" />
                                {typeof downloadProgress === "number"
                                    ? `Encoding ${downloadProgress}%`
                                    : "Generating..."}
                            </>
                        ) : (
                            <>
                                <Icon name="download" size={16} />
                                Download
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDownloadMenu(prev => !prev)}
                        disabled={isDownloading || isCopying}
                        className={`flex items-center justify-center px-2 py-1.5 rounded-r-lg font-bold text-white text-xs sm:text-sm transition-colors cursor-pointer ${
                            isDownloading ? 'bg-orange-600/50 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500'
                        }`}
                        title="Download options"
                        aria-label="Download options"
                    >
                        <Icon name={showDownloadMenu ? "arrow_drop_up" : "arrow_drop_down"} size={16} />
                    </button>

                    {showDownloadMenu && (
                        <div className="absolute right-0 bottom-full mb-1.5 min-w-[240px] bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl py-1 z-50">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDownloadMenu(false);
                                    downloadSign({ transparent: false });
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <Icon name="download" size={16} className="text-orange-400 shrink-0" />
                                <span>Download Sign</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDownloadMenu(false);
                                    downloadSign({ transparent: true });
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <Icon name="opacity" size={16} className="text-emerald-400 shrink-0" />
                                <span>Download Transparent Sign</span>
                            </button>

                            <div className="border-t border-neutral-800 my-1" />

                            <button
                                type="button"
                                onClick={() => {
                                    setShowDownloadMenu(false);
                                    downloadSign({ format: "svg", transparent: false, withUnlit: true });
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <Icon name="polyline" size={16} className="text-cyan-400 shrink-0" />
                                <span>Download SVG</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDownloadMenu(false);
                                    downloadSign({ format: "svg", transparent: true });
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <Icon name="draw" size={16} className="text-sky-400 shrink-0" />
                                <span>Download Transparent SVG</span>
                            </button>

                            <div className="border-t border-neutral-800 my-1" />

                            <button
                                type="button"
                                onClick={() => {
                                    setShowDownloadMenu(false);
                                    downloadSign({ format: "video" });
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs sm:text-sm hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <Icon name="movie" size={16} className="text-purple-400 shrink-0" />
                                <span>Download Video (.mp4)</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PreviewControls;