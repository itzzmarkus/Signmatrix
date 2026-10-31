import { PRESETS } from "../data/presets.js";
import Icon from "./Icon.jsx";

function PresetsPanel({
    onApplyPreset,
    onClearText,
    userPresets = [],
    onOpenSaveModal,
    onOpenManageModal
}) {
    return (
        <div className="bg-zinc-900 p-5 rounded-lg border border-neutral-700 w-full mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">Sign Presets</h2>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        type="button"
                        onClick={onOpenSaveModal}
                        title="Save your current sign as a preset"
                        className="flex items-center gap-1.5 text-xs font-bold text-white px-3.5 h-10 bg-orange-600 hover:bg-orange-500 rounded transition-colors whitespace-nowrap cursor-pointer shadow-xs active:scale-95"
                    >
                        <Icon name="bookmark_add" size={16} />
                        <span>Save Preset</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClearText}
                        title="Clear all text (keeps hardware settings)"
                        className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white px-3 h-10 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded transition-colors whitespace-nowrap cursor-pointer active:scale-95"
                    >
                        <Icon name="delete" size={16} />
                        Clear Text
                    </button>

                    <div className="flex items-center gap-1.5">
                        <select
                            onChange={(e) => {
                                onApplyPreset(e.target.value);
                                e.target.value = "";
                            }}
                            defaultValue=""
                            className="p-2 h-10 rounded bg-neutral-800 border border-neutral-600 text-white focus:outline-none focus:border-orange-500 cursor-pointer min-w-[190px] text-sm"
                        >
                            <option value="" disabled>Load a preset...</option>
                            {userPresets.length > 0 && (
                                <optgroup label="My Saved Presets">
                                    {userPresets.map(preset => (
                                        <option key={preset.id} value={preset.id}>
                                            {preset.name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            <optgroup label="Default Presets">
                                {PRESETS.map(preset => (
                                    <option key={preset.id} value={preset.id}>
                                        {preset.name}
                                    </option>
                                ))}
                            </optgroup>
                        </select>

                        <button
                            type="button"
                            onClick={onOpenManageModal}
                            title="Manage Saved Presets (Import, Export, Delete)"
                            className="h-10 px-3 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-300 hover:text-white transition-colors cursor-pointer active:scale-95"
                            aria-label="Manage Presets"
                        >
                            <Icon name="settings" size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PresetsPanel;