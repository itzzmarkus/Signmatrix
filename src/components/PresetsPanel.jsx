import { PRESETS } from "../data/presets.js";

function PresetsPanel({ onApplyPreset }) {
    return (
        <div className="bg-zinc-900 p-5 rounded-lg border border-neutral-700 w-full mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">Sign Presets</h2>
                </div>
                <select
                    onChange={(e) => onApplyPreset(e.target.value)}
                    defaultValue=""
                    className="p-2 h-10 rounded bg-neutral-800 border border-neutral-600 text-white focus:outline-none focus:border-orange-500 cursor-pointer min-w-[200px]"
                >
                    <option value="" disabled>Load a preset...</option>
                    {PRESETS.map(preset => (
                        <option key={preset.id} value={preset.id}>
                            {preset.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default PresetsPanel;