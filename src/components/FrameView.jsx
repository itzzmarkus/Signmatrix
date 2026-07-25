import FontDropdown from "./FontDropdown.jsx";
import InputGroup from "./InputGroup.jsx";

function FrameView({removeFrame, updateFrame, index, frame, frames}) {
    return (
        <div key={frame.id} className="bg-zinc-900 p-6 rounded-lg border border-neutral-700 relative md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 border-b border-neutral-600 pb-2">
                Frame {index + 1}
            </h2>

            {frames.length > 1 && (
                <button
                    onClick={() => removeFrame(frame.id)}
                    className="absolute top-6 right-6 text-red-500 hover:text-red-400 text-sm font-bold"
                >
                    ✕ Remove
                </button>
            )}

            {/* Added items-end to anchor the inputs to the bottom */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 items-end">
                <div className="md:col-span-6">
                    <InputGroup
                        label="Route Text"
                        value={frame.route}
                        onChange={(val) => updateFrame(frame.id, "route", val)}
                    />
                </div>
                <div className="md:col-span-6">
                    <FontDropdown
                        label="Route Font"
                        value={frame.routeFont}
                        onChange={(val) => updateFrame(frame.id, "routeFont", val)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 items-end">
                <div className="md:col-span-6">
                    <InputGroup
                        label="Destination Line 1"
                        value={frame.line1}
                        onChange={(val) => updateFrame(frame.id, "line1", val)}
                    />
                </div>
                <div className="md:col-span-4">
                    <FontDropdown
                        label="L1 Font"
                        value={frame.line1Font}
                        onChange={(val) => updateFrame(frame.id, "line1Font", val)}
                    />
                </div>
                <div className="md:col-span-2">
                    <InputGroup
                        label="L1 Spacing"
                        type="number"
                        min="0"
                        value={frame.line1Spacing}
                        onChange={(val) => updateFrame(frame.id, "line1Spacing", val)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 items-end">
                <div className="md:col-span-6">
                    <InputGroup
                        label="Line 2 (Blank = Unstacked)"
                        value={frame.line2}
                        onChange={(val) => updateFrame(frame.id, "line2", val)}
                    />
                </div>
                <div className="md:col-span-4">
                    <FontDropdown
                        label="L2 Font"
                        value={frame.line2Font}
                        onChange={(val) => updateFrame(frame.id, "line2Font", val)}
                    />
                </div>
                <div className="md:col-span-2">
                    <InputGroup
                        label="L2 Spacing"
                        type="number"
                        min="0"
                        value={frame.line2Spacing}
                        onChange={(val) => updateFrame(frame.id, "line2Spacing", val)}
                    />
                </div>
            </div>
        </div>
    );
}

export default FrameView;