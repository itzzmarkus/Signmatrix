import { useState, useRef, useEffect } from "react";
import Icon from "./Icon.jsx";

export default function PositionNudgeControl({
    xValue = "0",
    yValue = "0",
    onChangeX,
    onChangeY,
    onReset,
    label = "Position Offset (px)",
    compact = false
}) {
    const numX = parseInt(xValue, 10) || 0;
    const numY = parseInt(yValue, 10) || 0;
    const isNonZero = numX !== 0 || numY !== 0;

    const stepX = (delta) => {
        onChangeX(String(numX + delta));
    };

    const stepY = (delta) => {
        onChangeY(String(numY + delta));
    };

    const handleReset = () => {
        if (onReset) {
            onReset();
        } else {
            onChangeX("0");
            onChangeY("0");
        }
    };

    return (
        <div className="flex flex-col">
            {label && (
                <div className="flex items-center justify-between mb-1">
                    <label className={`${compact ? "text-xs" : "text-sm"} text-neutral-400`}>
                        {label}
                    </label>
                    {isNonZero && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                            title="Reset X and Y offsets to 0"
                        >
                            Reset
                        </button>
                    )}
                </div>
            )}
            <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-neutral-800 border border-neutral-600 rounded overflow-hidden h-8 flex-1 min-w-0">
                    <span className="w-5 shrink-0 text-[11px] font-bold text-neutral-400 select-none bg-neutral-900/60 h-full flex items-center justify-center border-r border-neutral-700">
                        X
                    </span>
                    <button
                        type="button"
                        onClick={() => stepX(-1)}
                        className="w-6 shrink-0 h-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors flex items-center justify-center cursor-pointer p-0"
                        title="Move left 1px"
                    >
                        <Icon name="remove" size={14} />
                    </button>
                    <input
                        type="number"
                        value={numX}
                        onChange={(e) => onChangeX(e.target.value)}
                        className="w-full min-w-0 flex-1 h-full bg-transparent text-center text-white text-xs px-0.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="X offset (negative = left, positive = right)"
                    />
                    <button
                        type="button"
                        onClick={() => stepX(1)}
                        className="w-6 shrink-0 h-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors flex items-center justify-center cursor-pointer p-0"
                        title="Move right 1px"
                    >
                        <Icon name="add" size={14} />
                    </button>
                </div>

                <div className="flex items-center bg-neutral-800 border border-neutral-600 rounded overflow-hidden h-8 flex-1 min-w-0">
                    <span className="w-5 shrink-0 text-[11px] font-bold text-neutral-400 select-none bg-neutral-900/60 h-full flex items-center justify-center border-r border-neutral-700">
                        Y
                    </span>
                    <button
                        type="button"
                        onClick={() => stepY(-1)}
                        className="w-6 shrink-0 h-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors flex items-center justify-center cursor-pointer p-0"
                        title="Move up 1px"
                    >
                        <Icon name="remove" size={14} />
                    </button>
                    <input
                        type="number"
                        value={numY}
                        onChange={(e) => onChangeY(e.target.value)}
                        className="w-full min-w-0 flex-1 h-full bg-transparent text-center text-white text-xs px-0.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Y offset (negative = up, positive = down)"
                    />
                    <button
                        type="button"
                        onClick={() => stepY(1)}
                        className="w-6 shrink-0 h-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors flex items-center justify-center cursor-pointer p-0"
                        title="Move down 1px"
                    >
                        <Icon name="add" size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function SegmentOffsetButton({
    xValue = "0",
    yValue = "0",
    onChangeX,
    onChangeY,
    onReset
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const numX = parseInt(xValue, 10) || 0;
    const numY = parseInt(yValue, 10) || 0;
    const isNonZero = numX !== 0 || numY !== 0;

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const fmt = (n) => (n > 0 ? `+${n}` : `${n}`);

    return (
        <div className="relative h-full shrink-0" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`h-full px-2 rounded border text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                    isNonZero
                        ? "bg-orange-500/15 border-orange-500/60 text-orange-300 hover:bg-orange-500/25"
                        : "bg-neutral-800 border-neutral-600 text-neutral-400 hover:text-white hover:border-neutral-500"
                }`}
                title="Nudge this segment's X/Y pixel position"
            >
                {isNonZero ? `${fmt(numX)},${fmt(numY)}` : <Icon name="open_with" size={14} />}
            </button>

            {open && (
                <div className="absolute right-0 top-11 z-30 w-56 p-3 rounded-lg bg-zinc-900 border border-neutral-600 shadow-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-neutral-700/80 pb-1.5">
                        <span className="text-xs font-semibold text-white">Segment Offset (px)</span>
                        {isNonZero && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (onReset) {
                                        onReset();
                                    } else {
                                        onChangeX("0");
                                        onChangeY("0");
                                    }
                                }}
                                className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    <PositionNudgeControl
                        xValue={xValue}
                        yValue={yValue}
                        onChangeX={onChangeX}
                        onChangeY={onChangeY}
                        onReset={onReset}
                        label=""
                        compact={true}
                    />
                    <p className="text-[10px] text-neutral-400 leading-tight">
                        X: left (−) / right (+) • Y: up (−) / down (+)
                    </p>
                </div>
            )}
        </div>
    );
}
