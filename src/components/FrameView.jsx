import FontDropdown from "./FontDropdown.jsx";
import InputGroup from "./InputGroup.jsx";

function FrameView({removeFrame, updateFrame, index, frame, frames}) {
    return (
        <div key={frame.id} className="bg-zinc-900 p-5 rounded-lg border border-neutral-700 relative md:col-span-2">

            <div className="flex flex-wrap justify-between items-end mb-4 border-b border-neutral-600 pb-3 gap-4">
                <h2 className="text-xl font-semibold m-0 flex items-center">
                    Frame {index + 1}
                </h2>

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-neutral-400 font-semibold">Transition:</label>
                        <select
                            value={frame.animation}
                            onChange={(e) => updateFrame(frame.id, "animation", e.target.value)}
                            className="px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                            <option value="NONE">None</option>
                            <option value="FALLDOWN">Fall Down</option>
                            <option value="FALLUP">Fall Up</option>
                            <option value="SIDEWIPE">Side Wipe</option>
                            <option value="SCROLL">Scroll</option>
                        </select>
                    </div>

                    {frame.animation !== "NONE" && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-neutral-400 font-semibold">Speed (s):</label>
                            <input
                                type="number"
                                min="0.1"
                                step="0.05"
                                value={frame.animSpeed}
                                onChange={(e) => updateFrame(frame.id, "animSpeed", e.target.value)}
                                className="w-16 px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2 pl-4 ml-2">
                        <label
                            className="text-sm text-neutral-400 font-semibold">Stack:</label>
                        <select
                            value={frame.verticalSpacing}
                            onChange={(e) => updateFrame(frame.id, "verticalSpacing", e.target.value)}
                            className="px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                            <option value="FLUSH">Flush to Edges</option>
                            <option value="EQUISPACED">Equispaced</option>
                        </select>
                    </div>
                    <button
                        onClick={() => removeFrame(frame.id)}
                        className="text-red-500 hover:text-red-400 text-sm font-bold ml-2"
                    >
                        ✕ Remove
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">

                <div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <InputGroup label="Destination Line 1" value={frame.line1}
                                        onChange={(val) => updateFrame(frame.id, "line1", val)}/>
                        </div>
                        <div className="flex flex-col w-24 mb-4">
                            <label className="text-sm text-neutral-400 mb-1">Align</label>
                            <select value={frame.line1Align}
                                    onChange={(e) => updateFrame(frame.id, "line1Align", e.target.value)}
                                    className="w-full h-10 px-2 rounded bg-neutral-700 border border-neutral-600 text-white text-sm focus:outline-none">
                                <option value="LEFT">Left</option>
                                <option value="CENTRE">Centre</option>
                                <option value="RIGHT">Right</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 items-end">
                        <div className="col-span-2">
                            <FontDropdown
                                label="L1 Font"
                                value={frame.line1Font}
                                onChange={(val) => updateFrame(frame.id, "line1Font", val)}
                            />
                        </div>
                        <div className="col-span-1">
                            <InputGroup
                                label="L1 Spacing"
                                type="number"
                                min="0"
                                value={frame.line1Spacing}
                                onChange={(val) => updateFrame(frame.id, "line1Spacing", val)}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <InputGroup
                        label="Line 2 (leave blank for unstacked)"
                        value={frame.line2}
                        onChange={(val) => updateFrame(frame.id, "line2", val)}
                    />
                    <div className="grid grid-cols-3 gap-x-4 items-end">
                        <div className="col-span-2">
                            <FontDropdown
                                label="L2 Font"
                                value={frame.line2Font}
                                onChange={(val) => updateFrame(frame.id, "line2Font", val)}
                            />
                        </div>
                        <div className="col-span-1">
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

            </div>
        </div>
    );
}

export default FrameView;