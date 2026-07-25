import { useEffect, useState } from 'react';
import useDebounce from './hooks/useDebounce';
import LivePreview from './components/LivePreview';

import logo from './assets/Signmatrix.png';
import FrameView from "./components/FrameView.jsx";
import InputGroup from "./components/InputGroup.jsx";

const CURRENT_UPDATE_VERSION = "v1.1";

const getInitialState = (key, defaultVal) => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || defaultVal;
  }
  return defaultVal;
};

export default function App() {
  const [showUpdateLog, setShowUpdateLog] = useState(false);

  const [previewMode, setPreviewMode] = useState("all");

  const [color, setColor] = useState(() => getInitialState("color", "#FF9000"));
  const [width, setWidth] = useState(() => getInitialState("width", "200"));
  const [height, setHeight] = useState(() => getInitialState("height", "24"));
  const [speed, setSpeed] = useState(() => getInitialState("speed", "2500"));

  const [frames, setFrames] = useState(() => {
    const initRoute = getInitialState("route", "R5").split("|");
    const initRouteFont = getInitialState("routeFont", "22t").split("|");
    const initLine1 = getInitialState("line1", "HASTINGS  ST").split("|");
    const initLine1Font = getInitialState("line1Font", "12d").split("|");
    const initLine1Spacing = getInitialState("line1Spacing", "6").split("|");
    const initLine2 = getInitialState("line2", "TO KOOTENAY LOOP").split("|");
    const initLine2Font = getInitialState("line2Font", "9d").split("|");
    const initLine2Spacing = getInitialState("line2Spacing", "0").split("|");

    const maxFrames = Math.max(initLine1.length, initLine2.length, initRoute.length);
    const getVal = (arr, i) => arr[i] !== undefined ? arr[i] : (arr[arr.length - 1] || "");

    return Array.from({ length: maxFrames }).map((_, i) => ({
      id: Date.now() + i,
      route: getVal(initRoute, i),
      routeFont: getVal(initRouteFont, i),
      line1: getVal(initLine1, i),
      line1Font: getVal(initLine1Font, i),
      line1Spacing: getVal(initLine1Spacing, i),
      line2: getVal(initLine2, i),
      line2Font: getVal(initLine2Font, i),
      line2Spacing: getVal(initLine2Spacing, i),
    }));
  });

  const debouncedState = useDebounce({
    frames, color, width, height, speed, previewMode
  }, 300);

  useEffect(() => {
    const seenVersion = localStorage.getItem("signmatrix_update_seen");
    if (seenVersion !== CURRENT_UPDATE_VERSION) {
      setShowUpdateLog(true);
    }
  }, []);

  const handleCloseUpdateLog = () => {
    localStorage.setItem("signmatrix_update_seen", CURRENT_UPDATE_VERSION);
    setShowUpdateLog(false);
  };

  const addFrame = () => {
    const lastFrame = frames[frames.length - 1];
    setFrames([...frames, {
      id: Date.now(),
      route: lastFrame.route, routeFont: lastFrame.routeFont,
      line1: "", line1Font: lastFrame.line1Font, line1Spacing: lastFrame.line1Spacing,
      line2: "", line2Font: lastFrame.line2Font, line2Spacing: lastFrame.line2Spacing
    }]);
  };

  const removeFrame = (id) => {
    setPreviewMode("all");
    setFrames(frames.filter(f => f.id !== id));
  };

  const updateFrame = (id, field, value) => {
    setFrames(frames.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  useEffect(() => {
    const params = new URLSearchParams();

    params.set("route", debouncedState.frames.map(f => f.route).join("|"));
    params.set("routeFont", debouncedState.frames.map(f => f.routeFont).join("|"));
    params.set("line1", debouncedState.frames.map(f => f.line1).join("|"));
    params.set("line1Font", debouncedState.frames.map(f => f.line1Font).join("|"));
    params.set("line1Spacing", debouncedState.frames.map(f => f.line1Spacing).join("|"));
    params.set("line2", debouncedState.frames.map(f => f.line2).join("|"));
    params.set("line2Font", debouncedState.frames.map(f => f.line2Font).join("|"));
    params.set("line2Spacing", debouncedState.frames.map(f => f.line2Spacing).join("|"));

    if (debouncedState.color !== "#FF9000") params.set("color", debouncedState.color);
    if (debouncedState.width !== "200") params.set("width", debouncedState.width);
    if (debouncedState.height !== "24") params.set("height", debouncedState.height);
    if (debouncedState.speed !== "2500") params.set("speed", debouncedState.speed);

    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [debouncedState]);

  const buildApiUrl = () => {
    const query = new URLSearchParams();

    let targetFrames = debouncedState.frames;
    if (debouncedState.previewMode !== "all") {
      const frameIndex = parseInt(debouncedState.previewMode, 10);
      if (targetFrames[frameIndex]) {
        targetFrames = [targetFrames[frameIndex]];
      }
    }

    query.append("route", targetFrames.map(f => f.route).join("|"));
    query.append("routeFont", targetFrames.map(f => f.routeFont).join("|"));
    query.append("line1", targetFrames.map(f => f.line1).join("|"));
    query.append("line1Font", targetFrames.map(f => f.line1Font).join("|"));
    query.append("line1Spacing", targetFrames.map(f => f.line1Spacing).join("|"));
    query.append("line2", targetFrames.map(f => f.line2).join("|"));
    query.append("line2Font", targetFrames.map(f => f.line2Font).join("|"));
    query.append("line2Spacing", targetFrames.map(f => f.line2Spacing).join("|"));

    query.append("color", debouncedState.color.replace("#", ""));
    query.append("width", debouncedState.width);
    query.append("height", debouncedState.height);
    query.append("speed", debouncedState.speed);

    return `http://localhost:8080/api/sign?${query.toString()}`;
  };

  return (
      <div className="max-w-4xl mx-auto p-6 w-full space-y-4">
        {showUpdateLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-zinc-900 border border-neutral-700 rounded-lg shadow-2xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-white mb-2">New Signmatrix update</h2>
                <p className="text-sm text-neutral-400 mb-4">Version {CURRENT_UPDATE_VERSION}</p>
                <div className="text-neutral-300 space-y-3 mb-6">
                  <p>• Web link now auto updates, so you can share your terrible dest signs by just copy and pasting the URL!</p>
                  <p>• You can now add frames to your dest signs! As many as your heart desires! They will generate as animated GIFs.</p>
                  <p>• You can also pause at a frame to refine the Worst Dest Sign in the World!</p>
                </div>
                <button
                    onClick={handleCloseUpdateLog}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  epic, let's go!
                </button>
              </div>
            </div>
        )}

        <header className="flex justify-center mb-6">
          <img src={logo} alt="Signmatrix" className="h-16 object-contain" />
        </header>

        <LivePreview apiUrl={buildApiUrl()} />

        {frames.length > 1 && (
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              <button
                  onClick={() => setPreviewMode("all")}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${previewMode === "all" ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
              >
                ▶ Play
              </button>
              {frames.map((_, idx) => (
                  <button
                      key={idx}
                      onClick={() => setPreviewMode(idx.toString())}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${previewMode === idx.toString() ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
                  >
                    Frame {idx}
                  </button>
              ))}
            </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 p-6 rounded-lg border border-neutral-700 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 border-b border-neutral-600 pb-2">Global Settings</h2>
            <div className="flex flex-wrap md:flex-nowrap gap-4">
              <InputGroup label="Width (px)" type="number" value={width} onChange={setWidth} />
              <InputGroup label="Height (px)" type="number" value={height} onChange={setHeight} />
              <div className="flex flex-col flex-1 mb-4">
                <label className="text-sm text-neutral-400 mb-1">LED Colour</label>
                <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full h-10 p-1 bg-neutral-700 border border-neutral-600 rounded cursor-pointer"
                />
              </div>
              <InputGroup label="Flash Speed (ms)" type="number" min="500" step="100" value={speed} onChange={setSpeed} />
            </div>
          </div>

          {frames.map((frame, index) => (
              <FrameView removeFrame={removeFrame} updateFrame={updateFrame} index={index} frame={frame} frames={frames}/>
          ))}

          <button
              onClick={addFrame}
              className="md:col-span-2 w-full py-4 bg-zinc-900 border-1 border-neutral-600 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
          >
            + Add Frame
          </button>
        </section>
      </div>
  );
}