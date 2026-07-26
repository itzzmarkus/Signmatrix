import InputGroup from "./InputGroup.jsx";
import FontDropdown from "./FontDropdown.jsx";

function GlobalRoutePanel({
                              route,
                              setRoute,
                              routeAlign,
                              setRouteAlign,
                              routeFont,
                              setRouteFont,
                              routeSuffix,
                              setRouteSuffix,
                              routeSuffixFont,
                              setRouteSuffixFont,
                              setShowCheatSheet
                          }) {
    return (<div className="bg-zinc-900 p-5 rounded-lg border border-neutral-700">
        <div className="flex items-center gap-2 mb-3 border-b border-neutral-600 pb-2">
            <h2 className="text-lg font-semibold">Global Route</h2>
            <button
                onClick={() => setShowCheatSheet(true)}
                title="Formatting Help"
                className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-700 text-neutral-300 hover:bg-orange-600 hover:text-white text-xs font-bold transition-colors"
            >
                ?
            </button>
        </div>
        <div className="grid grid-cols-5 gap-x-4">
            <div className="col-span-3"><InputGroup label="Route Number" value={route} onChange={setRoute}/>
            </div>
            <div className="col-span-2">
                <div className="flex flex-col mb-4">
                    <label className="text-sm text-neutral-400 mb-1">Route Side</label>
                    <select value={routeAlign} onChange={(e) => setRouteAlign(e.target.value)}
                            className="w-full p-2 h-10 rounded bg-neutral-700 border border-neutral-600 text-white focus:outline-none">
                        <option value="LEFT">Left</option>
                        <option value="RIGHT">Right</option>
                    </select>
                </div>
            </div>
            <div className="col-span-2"><FontDropdown label="Main Font" value={routeFont}
                                                      onChange={setRouteFont}/></div>
            <div className="col-span-1"><InputGroup label="Suffix" value={routeSuffix}
                                                    onChange={setRouteSuffix}/></div>
            <div className="col-span-2"><FontDropdown label="Suffix Font" value={routeSuffixFont}
                                                      onChange={setRouteSuffixFont}/></div>
        </div>
    </div>)
}

export default GlobalRoutePanel;