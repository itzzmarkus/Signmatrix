import { useRef, useEffect } from "react";
import Icon from "./Icon.jsx";

function ManagePresetsModal({
    isOpen,
    onClose,
    userPresets,
    onDeletePreset,
    onApplyPreset,
    onExportPresets,
    onImportPresets
}) {
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content === "string") {
                const res = onImportPresets(content);
                if (res.success) {
                    alert(`Successfully imported ${res.count} preset(s)!`);
                } else {
                    alert(`Failed to import presets: ${res.error}`);
                }
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-neutral-700 rounded-xl p-6 max-w-xl w-full shadow-2xl relative text-neutral-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-700/80 pb-3">
                    <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Manage Saved Presets
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
                    >
                        <Icon name="close" size={20} />
                    </button>
                </div>

                <div className="flex items-center justify-between gap-3 mb-4 p-2.5 bg-neutral-800/60 rounded-lg border border-neutral-700/60 text-xs">
                    <span className="text-neutral-400">Backup or restore your saved presets</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Import presets from a .json file"
                        >
                            <Icon name="upload" size={14} /> Import JSON
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={onExportPresets}
                            disabled={userPresets.length === 0}
                            className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-200 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Export all presets to a .json backup file"
                        >
                            <Icon name="download" size={14} /> Export JSON
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {userPresets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-neutral-500 text-center">
                            <p className="text-lg font-semibold text-neutral-400">No saved presets yet</p>
                        </div>
                    ) : (
                        userPresets.map((preset) => (
                            <div
                                key={preset.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 transition-all"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-white text-sm truncate max-w-xs">
                                            {preset.name}
                                        </span>
                                        {preset.route && (
                                            <span className="text-[10px] font-mono bg-orange-950/40 border border-orange-700/60 px-1.5 py-0.5 rounded text-orange-300">
                                                Route: {preset.route.replace(/\^/g, " ")}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-neutral-400">
                                            {preset.frames?.length || 1} frame(s)
                                        </span>
                                    </div>
                                    {preset.frames?.[0]?.line1 && (
                                        <p className="text-xs text-neutral-400 truncate mt-1 font-mono">
                                            {preset.frames[0].line1.replace(/\^/g, " ")}
                                            {preset.frames[0].line2 && ` / ${preset.frames[0].line2.replace(/\^/g, " ")}`}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onApplyPreset(preset.id);
                                            onClose();
                                        }}
                                        className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Load
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete preset "${preset.name}"?`)) {
                                                onDeletePreset(preset.id);
                                            }
                                        }}
                                        className="p-1.5 rounded bg-neutral-700/70 hover:bg-red-900/60 hover:text-red-300 text-neutral-400 text-xs transition-colors flex items-center justify-center cursor-pointer"
                                        title="Delete preset"
                                    >
                                        <Icon name="delete" size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end pt-4 mt-3 border-t border-neutral-700/60">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ManagePresetsModal;
