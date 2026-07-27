import InputGroup from "./InputGroup.jsx";
import FontDropdown from "./FontDropdown.jsx";

function GlobalRoutePanel({
    route, setRoute,
    routeAlign, setRouteAlign,
    routeFont, setRouteFont,
    routeColor, setRouteColor,
    routeSuffix, setRouteSuffix,
    routeSuffixFont, setRouteSuffixFont,
    routeSuffixColor, setRouteSuffixColor,
    setShowCheatSheet
}) {
    return (
        <div className="bg-zinc-900 p-5 rounded-lg border border-neutral-700">
            <div className="flex items-center gap-2 mb-4 border-b border-neutral-600 pb-3">
                <h2 className="text-lg font-semibold">Global Route</h2>
                <button
                    onClick={() => setShowCheatSheet(true)}
                    title="Formatting Help"
                    className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-700 text-neutral-300 hover:bg-orange-600 hover:text-white text-xs font-bold transition-colors"
                >
                    ?
                </button>
            </div>

            <div className="grid grid-cols-12 gap-x-4 gap-y-4 items-end">

                <div className="col-span-8">
                    <InputGroup label="Route Number" value={route} onChange={setRoute}/>
                </div>
                <div className="col-span-4">
                    <div className="flex flex-col">
                        <label className="text-sm text-neutral-400 mb-1">Route Side</label>
                        <select
                            value={routeAlign}
                            onChange={(e) => setRouteAlign(e.target.value)}
                            className="w-full h-10 px-3 rounded bg-neutral-700 border border-neutral-600 text-white focus:outline-none focus:ring-1 focus:ring-orange-500">
                            <option value="LEFT">Left</option>
                            <option value="RIGHT">Right</option>
                        </select>
                    </div>
                </div>

                <div className="col-span-8">
                    <FontDropdown label="Main Font" value={routeFont} onChange={setRouteFont}/>
                </div>
                <div className="col-span-4 flex flex-col">
                    <label className="text-sm text-neutral-400 mb-1">Colour</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={routeColor ? `#${routeColor}` : "#ff9000"}
                            onChange={(e) => setRouteColor(e.target.value.replace("#", ""))}
                            className="w-10 h-10 p-1 rounded bg-neutral-800 border border-neutral-600 cursor-pointer"
                        />
                        {routeColor && (
                            <button onClick={() => setRouteColor("")} className="text-xs text-neutral-500 hover:text-white" title="Reset to global">✕</button>
                        )}
                    </div>
                </div>

                <div className="col-span-12 border-t border-neutral-700/50 pt-4 mt-2 grid grid-cols-12 gap-x-4 items-end">
                    <div className="col-span-4">
                        <InputGroup label="Suffix" value={routeSuffix} onChange={setRouteSuffix}/>
                    </div>
                    <div className="col-span-5">
                        <FontDropdown label="Suffix Font" value={routeSuffixFont} onChange={setRouteSuffixFont}/>
                    </div>
                    <div className="col-span-3 flex flex-col">
                        <label className="text-sm text-neutral-400 mb-1">Colour</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={routeSuffixColor ? `#${routeSuffixColor}` : "#ff9000"}
                                onChange={(e) => setRouteSuffixColor(e.target.value.replace("#", ""))}
                                className="w-10 h-10 p-1 rounded bg-neutral-800 border border-neutral-600 cursor-pointer"
                            />
                            {routeSuffixColor && (
                                <button onClick={() => setRouteSuffixColor("")} className="text-xs text-neutral-500 hover:text-white" title="Reset to global">✕</button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default GlobalRoutePanel;