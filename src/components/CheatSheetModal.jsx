import { useEffect } from "react";
import Icon from "./Icon.jsx";

function CheatSheetModal({ isOpen, onClose }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-neutral-700 rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
                >
                    <Icon name="close" size={20} />
                </button>
                <h2 className="text-2xl font-bold text-white mb-2">Formatting</h2>
                <p className="text-sm text-neutral-400 mb-6">Use these in your text inputs to adjust the pixel layout.</p>

                <div className="space-y-4 text-sm text-neutral-300 mb-6">
                    <div className="bg-neutral-800 p-3 rounded border border-neutral-700">
                        <code className="text-orange-400 font-bold text-base">\1</code>
                        <p className="mt-1">Inserts 1 pixel of blank space.</p>
                    </div>

                    <div className="bg-neutral-800 p-3 rounded border border-neutral-700">
                        <code className="text-orange-400 font-bold text-base">\~</code>
                        <p className="mt-1">Pulls the next character backwards by exactly 1 pixel.</p>
                    </div>

                    <div className="bg-neutral-800 p-3 rounded border border-neutral-700">
                        <code className="text-orange-400 font-bold text-base">\\</code>
                        <p className="mt-1">Type two backslashes to render a single backslash on the sign.</p>
                    </div>
                    <p>ps: use CTRL+Z and SHIFT+CTRL+Z to undo and redo actions!</p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}

export default CheatSheetModal;