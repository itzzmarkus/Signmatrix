import { useEffect } from "react";

function UpdateModal({ version, isOpen, onClose }) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-neutral-700 rounded-xl shadow-2xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-white mb-2">New Signmatrix update</h2>
                <p className="text-sm text-neutral-400 mb-4">Version {version}</p>
                <div className="text-neutral-300 space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-1 text-sm">
                    <div>
                        <p className="font-semibold text-orange-400 mb-1">v2.01:</p>
                        <p className="text-neutral-200">- Updated INIT font with lowercase letters & improved existing letters</p>
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-400 mb-1">v2.0:</p>
                        <div className="space-y-2 text-neutral-300">
                            <p>- Everything now renders locally in your browser! Works offline too, and it's a lot faster</p>
                            <p>- Added 62 new fonts! 137 total :o</p>
                            <p>- Added flip-dot (might be buggy), LED glow, round LEDs as default for presets, X/Y pixel pitch, and sign disease for extra terrible signs</p>
                            <p>- Added an icon library and an icon maker where you can draw your own icons or upload/paste an image</p>
                            <p>- You can now nudge text & route positions, invert the route box, customize auto-scroll speed/pause (finally!), and save your own custom presets</p>
                            <p>- Added 60 FPS MP4 video export, SVG vector export, transparent downloads, copy to clipboard, and way shorter share links</p>
                        </div>
                    </div>
                    <p className="text-neutral-400 text-xs pt-1">- As always, please report any bugs in the suggestion box. Currently in beta.</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
                >
                    epic, let's go!
                </button>
            </div>
        </div>
    );
}

export default UpdateModal;