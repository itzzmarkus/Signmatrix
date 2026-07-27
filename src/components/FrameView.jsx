import FontDropdown from "./FontDropdown.jsx";
import InputGroup from "./InputGroup.jsx";

function LineEditor({
    title,
    textStr,
    fontStr,
    spacingStr,
    alignStr,
    onUpdateText,
    onUpdateFont,
    onUpdateSpacing,
    onUpdateAlign,
    placeholder
}) {
    const texts = (textStr || "").split("^");
    const fonts = (fontStr || "").split("^");
    const isSplit = texts.length > 1 || fonts.length > 1;

    const toggleSplit = () => {
        if (isSplit) {
            onUpdateText(texts.join(""));
            onUpdateFont(fonts[0] || "16d");
        } else {
            onUpdateText((textStr || "") + "^");
            onUpdateFont((fontStr || "16d") + "^" + (fontStr || "16d"));
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-neutral-400 font-semibold">{title}</label>
                <button onClick={toggleSplit} className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                    {isSplit ? "Standard" : "Mixed Fonts"}
                </button>
            </div>

            {!isSplit ? (
                <>
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder={placeholder}
                                value={texts[0] || ""}
                                onChange={(e) => onUpdateText(e.target.value)}
                                className="w-full h-10 px-3 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-neutral-500"
                            />
                        </div>
                        {onUpdateAlign && (
                            <select
                                value={alignStr || "CENTRE"}
                                onChange={(e) => onUpdateAlign(e.target.value)}
                                className="w-24 h-10 px-2 rounded bg-neutral-700 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            >
                                <option value="LEFT">Left</option>
                                <option value="CENTRE">Centre</option>
                                <option value="RIGHT">Right</option>
                            </select>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 ">
                        <div className="col-span-2">
                            <FontDropdown label="Font" value={fonts[0]} onChange={onUpdateFont} />
                        </div>
                        <div className="col-span-1">
                            <InputGroup label="Spacing" type="number" min="0" value={spacingStr} onChange={onUpdateSpacing} />
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-black/30 p-3 rounded-lg border border-neutral-700/50 space-y-3">
                    {texts.map((txt, idx) => (
                        <div key={idx} className="flex gap-2 items-center h-10">
                            <div className="flex-1 h-full">
                                <input
                                    type="text"
                                    placeholder={`Segment ${idx + 1}`}
                                    value={txt}
                                    onChange={(e) => {
                                        const newTexts = [...texts];
                                        newTexts[idx] = e.target.value;
                                        onUpdateText(newTexts.join("^"));
                                    }}
                                    className="w-full h-10 px-3 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-neutral-600"
                                />
                            </div>
                            <div className="w-32 h-full">
                                <FontDropdown
                                    value={fonts[idx] || fonts[0] || "16d"}
                                    onChange={(val) => {
                                        const newFonts = [...fonts];
                                        newFonts[idx] = val;
                                        onUpdateFont(newFonts.join("^"));
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const newTexts = [...texts];
                                    const newFonts = [...fonts];
                                    newTexts.splice(idx, 1);
                                    newFonts.splice(idx, 1);
                                    onUpdateText(newTexts.join("^"));
                                    onUpdateFont(newFonts.join("^"));
                                }}
                                className="w-8 h-full flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded font-bold transition-all"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <div className="flex justify-between items-end pt-2 mt-2 border-t border-neutral-700/50">
                        <button
                            onClick={() => {
                                const newTexts = [...texts, ""];
                                const newFonts = [...fonts, fonts[fonts.length - 1] || "16d"];

                                onUpdateText(newTexts.join("^"));
                                onUpdateFont(newFonts.join("^"));
                            }}
                            className="text-sm text-neutral-400 hover:text-white font-semibold transition-colors px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800"
                        >
                            + Add Segment
                        </button>

                        <div className="flex gap-3">
                            <div className="flex flex-col">
                                <label className="text-sm text-neutral-500 mb-1 font-semibold">Spacing</label>
                                <input type="number" min="0" value={spacingStr} onChange={(e) => onUpdateSpacing(e.target.value)} className="w-16 h-8 px-2 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                            </div>
                            {onUpdateAlign && (
                                <div className="flex flex-col">
                                    <label className="text-sm text-neutral-500 mb-1 font-semibold">Align</label>
                                    <select value={alignStr || "CENTRE"} onChange={(e) => onUpdateAlign(e.target.value)} className="w-20 h-8 px-1 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer">
                                        <option value="LEFT">Left</option>
                                        <option value="CENTRE">Centre</option>
                                        <option value="RIGHT">Right</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function FrameView({removeFrame, updateFrame, index, frame}) {
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
                                min="0.01"
                                step="0.01"
                                value={frame.animSpeed}
                                onChange={(e) => updateFrame(frame.id, "animSpeed", e.target.value)}
                                className="w-16 px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2 ml-2">
                        <label className="text-sm text-neutral-400 font-semibold" title="Leave blank to use the global hardware speed">Hold (ms):</label>
                        <input
                            type="number"
                            placeholder="Global"
                            min="100"
                            step="100"
                            value={frame.delay || ""}
                            onChange={(e) => updateFrame(frame.id, "delay", e.target.value)}
                            className="w-20 px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-neutral-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 pl-4 ml-2 border-l border-neutral-700">
                        <label className="text-sm text-neutral-400 font-semibold">Stack:</label>
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

                <LineEditor
                    title="Destination Line 1"
                    placeholder="e.g. 41ST AVE"
                    textStr={frame.line1}
                    fontStr={frame.line1Font}
                    spacingStr={frame.line1Spacing}
                    alignStr={frame.line1Align}
                    onUpdateText={(val) => updateFrame(frame.id, "line1", val)}
                    onUpdateFont={(val) => updateFrame(frame.id, "line1Font", val)}
                    onUpdateSpacing={(val) => updateFrame(frame.id, "line1Spacing", val)}
                    onUpdateAlign={(val) => updateFrame(frame.id, "line1Align", val)}
                />

                <LineEditor
                    title="Destination Line 2 (Optional)"
                    placeholder="Leave blank for unstacked"
                    textStr={frame.line2}
                    fontStr={frame.line2Font}
                    spacingStr={frame.line2Spacing}
                    alignStr={frame.line2Align}
                    onUpdateText={(val) => updateFrame(frame.id, "line2", val)}
                    onUpdateFont={(val) => updateFrame(frame.id, "line2Font", val)}
                    onUpdateSpacing={(val) => updateFrame(frame.id, "line2Spacing", val)}
                    onUpdateAlign={(val) => updateFrame(frame.id, "line2Align", val)}
                />

            </div>
        </div>
    );
}

export default FrameView;