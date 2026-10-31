import { useState, useEffect, useRef } from "react";
import Icon from "./Icon.jsx";

function getSuggestedName(currentState) {
    const route = currentState?.route?.trim();
    const line1 = currentState?.frames?.[0]?.line1?.replace(/\^/g, " ")?.trim();
    if (route && line1) {
        return `${route} - ${line1}`;
    } else if (route) {
        return `Route ${route}`;
    } else if (line1) {
        return line1;
    }
    return "My Custom Sign";
}

function SavePresetModal({ isOpen, onClose, onSave, currentState }) {
    const [name, setName] = useState(() => getSuggestedName(currentState));
    const inputRef = useRef(null);
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            if (!hasInitializedRef.current) {
                hasInitializedRef.current = true;
                setName(getSuggestedName(currentState));
                const timer = setTimeout(() => {
                    inputRef.current?.focus();
                    inputRef.current?.select();
                }, 50);
                return () => clearTimeout(timer);
            }
        } else {
            hasInitializedRef.current = false;
        }
    }, [isOpen, currentState]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onSave(trimmed);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-neutral-700 rounded-xl p-6 max-w-md w-full shadow-2xl relative text-neutral-200">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-700/80 pb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Save Sign to My Presets
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
                    >
                        <Icon name="close" size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                            Preset Name
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. 99 B-Line to UBC"
                            className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-neutral-500"
                            maxLength={60}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>Save Preset</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SavePresetModal;
