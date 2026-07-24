import { useState } from 'react';
import useDebounce from './hooks/useDebounce';
import FontDropdown from './components/FontDropdown';
import LivePreview from './components/LivePreview';

import logo from './assets/Signmatrix.png';

const InputGroup = ({ label, type = "text", value, onChange, min }) => (
    <div className="flex flex-col flex-1 mb-4">
      <label className="text-sm text-neutral-400 mb-1">{label}</label>
      <input
          type={type}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
);

export default function App() {
  const [route, setRoute] = useState("R5");
  const [routeFont, setRouteFont] = useState("22t");

  const [line1, setLine1] = useState("HASTINGS  ST");
  const [line1Font, setLine1Font] = useState("12d");
  const [line1Spacing, setLine1Spacing] = useState("6");

  const [line2, setLine2] = useState("TO KOOTENAY LOOP");
  const [line2Font, setLine2Font] = useState("9d");
  const [line2Spacing, setLine2Spacing] = useState("0");

  const [color, setColor] = useState("#FF9000");
  const [width, setWidth] = useState("200");
  const [height, setHeight] = useState("24");

  const debouncedState = useDebounce({
    route, routeFont, line1, line1Font, line1Spacing,
    line2, line2Font, line2Spacing, color, width, height
  }, 300);

  const buildApiUrl = () => {
    const query = new URLSearchParams();
    if (debouncedState.route) query.append("route", debouncedState.route);
    query.append("routeFont", debouncedState.routeFont);

    if (debouncedState.line1) query.append("line1", debouncedState.line1);
    query.append("line1Font", debouncedState.line1Font);
    query.append("line1Spacing", debouncedState.line1Spacing);

    if (debouncedState.line2) query.append("line2", debouncedState.line2);
    query.append("line2Font", debouncedState.line2Font);
    query.append("line2Spacing", debouncedState.line2Spacing);

    query.append("color", debouncedState.color.replace("#", ""));
    query.append("width", debouncedState.width);
    query.append("height", debouncedState.height);

    return `https://signmatrix-backend.onrender.com/api/sign?${query.toString()}`;
  };

  return (
      <div className="max-w-4xl mx-auto p-6 w-full space-y-6">
        <header className="flex justify-center mb-6">
          <img src={logo} alt="Signmatrix" className="h-16 object-contain" />
        </header>

        <LivePreview apiUrl={buildApiUrl()} />

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 p-6 rounded-lg border border-neutral-700">
            <h2 className="text-xl font-semibold mb-4 border-b border-neutral-600 pb-2">Route</h2>
            <InputGroup label="Text" value={route} onChange={setRoute} />
            <FontDropdown label="Font / Size" value={routeFont} onChange={setRouteFont} />
          </div>

          <div className="bg-zinc-900 p-6 rounded-lg border border-neutral-700">
            <h2 className="text-xl font-semibold mb-4 border-b border-neutral-600 pb-2">Sign</h2>
            <div className="flex gap-4">
              <InputGroup label="Width (px)" type="number" value={width} onChange={setWidth} />
              <InputGroup label="Height (px)" type="number" value={height} onChange={setHeight} />
            </div>
            <div className="flex flex-col mb-4">
              <label className="text-sm text-neutral-400 mb-1">LED Color</label>
              <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-full h-10 p-1 bg-neutral-700 border border-neutral-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-lg border border-neutral-700">
            <h2 className="text-xl font-semibold mb-4 border-b border-neutral-600 pb-2">Destination Line 1</h2>
            <InputGroup label="Text" value={line1} onChange={setLine1} />
            <div className="flex gap-4">
              <FontDropdown label="Font / Size" value={line1Font} onChange={setLine1Font} />
              <InputGroup label="Letter Spacing" type="number" min="0" value={line1Spacing} onChange={setLine1Spacing} />
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-lg border border-neutral-700">
            <h2 className="text-xl font-semibold mb-4 border-b border-neutral-600 pb-2">Destination Line 2</h2>
            <InputGroup label="Text (Leave blank for unstacked)" value={line2} onChange={setLine2} />
            <div className="flex gap-4">
              <FontDropdown label="Font / Size" value={line2Font} onChange={setLine2Font} />
              <InputGroup label="Letter Spacing" type="number" min="0" value={line2Spacing} onChange={setLine2Spacing} />
            </div>
          </div>
        </section>
      </div>
  );
}