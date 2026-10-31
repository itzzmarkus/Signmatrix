function UpdateModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4">
            <div className="bg-zinc-900 border border-neutral-700 rounded-lg shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-white">Try out Signmatrix Beta (v2.0)!</h2>
                </div>
                <p className="text-sm text-neutral-400 mb-4">A massive update is here!</p>
                <div className="text-neutral-300 text-sm space-y-2.5 mb-6">
                    <p>⚡ <b>Instant rendering:</b> runs 100% in your browser (also works fully offline as a PWA)</p>
                    <p>🔤 <b>137 fonts:</b> 62 brand new fonts added</p>
                    <p>🟡 <b>New presets:</b> bunch of new presets added</p>
                    <p>✨ <b>Visual effects:</b> LED glow, round bulbs, sign disease & camera shutter</p>
                    <p>🎨 <b>Icon studio & exports:</b> draw custom icons, plus export to MP4 & SVG</p>
                    <p className="text-neutral-400 text-xs pt-1">As always, please report any bugs using the suggestion box on the beta site!</p>
                </div>
                <a
                    href="https://signmatrix-beta.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="block text-center w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 px-4 rounded transition-colors mb-2"
                >
                    take me to v2.0 beta →
                </a>
                <button
                    onClick={onClose}
                    className="w-full text-center text-neutral-400 hover:text-neutral-200 text-xs py-1.5 transition-colors"
                >
                    stay on v1.9 for now
                </button>
            </div>
        </div>
    );
}

export default UpdateModal;
