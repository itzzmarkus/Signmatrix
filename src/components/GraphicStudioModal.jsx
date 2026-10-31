import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import LogoCanvas from "./LogoCanvas.jsx";
import Icon from "./Icon.jsx";
import {
    MAX_GRAPHIC_H,
    MAX_GRAPHIC_W,
    normalizeRows,
    resizeRowsBottomLeft
} from "../utils/graphicCodec.js";
import { convertImageToMatrix, loadImageFromFile } from "../utils/imageToMatrix.js";

const MAX_UNDO = 50;

function createBlankRows(w, h) {
    return Array.from({ length: h }, () => "0".repeat(w));
}

function floodFillRows(rows, width, height, startX, startY, fillChar) {
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return rows;
    const grid = rows.map((r) => r.split(""));
    const targetChar = grid[startY][startX];
    if (targetChar === fillChar) return rows;

    const stack = [[startX, startY]];
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (grid[y][x] !== targetChar) continue;
        grid[y][x] = fillChar;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return grid.map((r) => r.join(""));
}

export default function GraphicStudioModal({
    isOpen,
    onClose,
    onSave,
    initialGraphic = null,
    currentSignHeight = 24,
    signColor = "#FF9000"
}) {
    if (!isOpen) return null;
    return (
        <GraphicStudioModalContent
            key={initialGraphic?.id || "new"}
            onClose={onClose}
            onSave={onSave}
            initialGraphic={initialGraphic}
            currentSignHeight={currentSignHeight}
            signColor={signColor}
        />
    );
}

function GraphicStudioModalContent({
    onClose,
    onSave,
    initialGraphic = null,
    currentSignHeight = 24,
    signColor = "#FF9000"
}) {
    const defaultH = Math.max(1, Math.min(MAX_GRAPHIC_H, parseInt(currentSignHeight, 10) || 16));
    const initW = initialGraphic
        ? Math.max(1, Math.min(MAX_GRAPHIC_W, parseInt(initialGraphic.width, 10) || defaultH))
        : defaultH;
    const initH = initialGraphic
        ? Math.max(1, Math.min(MAX_GRAPHIC_H, parseInt(initialGraphic.height, 10) || defaultH))
        : defaultH;

    const [activeTab, setActiveTab] = useState("draw");
    const [name, setName] = useState(() => initialGraphic?.name || "Custom Icon");
    const [width, setWidth] = useState(initW);
    const [height, setHeight] = useState(initH);
    const [rows, setRows] = useState(() =>
        initialGraphic
            ? normalizeRows(initialGraphic.rows || [], initW, initH)
            : createBlankRows(initW, initH)
    );
    const [tool, setTool] = useState("pen");
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [hoverCell, setHoverCell] = useState(null);

    const [importedImg, setImportedImg] = useState(null);
    const [importTargetH, setImportTargetH] = useState(initH);
    const [importThreshold, setImportThreshold] = useState(128);
    const [importInvert, setImportInvert] = useState(false);
    const [importTrim, setImportTrim] = useState(true);
    const [importError, setImportError] = useState("");

    const canvasRef = useRef(null);
    const dragStateRef = useRef({ active: false, paintValue: "1", snapshotSaved: false });
    const fileInputRef = useRef(null);

    const pushHistory = useCallback((prevW, prevH, prevRows) => {
        setUndoStack((stack) => [
            ...stack.slice(-(MAX_UNDO - 1)),
            { width: prevW, height: prevH, rows: [...prevRows] }
        ]);
        setRedoStack([]);
    }, []);

    const handleUndo = useCallback(() => {
        setUndoStack((stack) => {
            if (stack.length === 0) return stack;
            const prev = stack[stack.length - 1];
            setRedoStack((r) => [...r, { width, height, rows: [...rows] }]);
            setWidth(prev.width);
            setHeight(prev.height);
            setRows(prev.rows);
            return stack.slice(0, -1);
        });
    }, [width, height, rows]);

    const handleRedo = useCallback(() => {
        setRedoStack((stack) => {
            if (stack.length === 0) return stack;
            const next = stack[stack.length - 1];
            setUndoStack((u) => [...u, { width, height, rows: [...rows] }]);
            setWidth(next.width);
            setHeight(next.height);
            setRows(next.rows);
            return stack.slice(0, -1);
        });
    }, [width, height, rows]);

    const handleResize = useCallback((newWInput, newHInput) => {
        const nextW = Math.max(1, Math.min(MAX_GRAPHIC_W, parseInt(newWInput, 10) || 1));
        const nextH = Math.max(1, Math.min(MAX_GRAPHIC_H, parseInt(newHInput, 10) || 1));
        if (nextW === width && nextH === height) return;
        pushHistory(width, height, rows);
        const nextRows = resizeRowsBottomLeft(rows, width, height, nextW, nextH);
        setWidth(nextW);
        setHeight(nextH);
        setRows(nextRows);
    }, [width, height, rows, pushHistory]);

    const shiftRows = useCallback((dx, dy) => {
        pushHistory(width, height, rows);
        const next = [];
        for (let y = 0; y < height; y++) {
            const srcY = y - dy;
            const srcRow = srcY >= 0 && srcY < height ? rows[srcY] : "";
            let line = "";
            for (let x = 0; x < width; x++) {
                const srcX = x - dx;
                line += srcX >= 0 && srcX < width && srcRow[srcX] === "1" ? "1" : "0";
            }
            next.push(line);
        }
        setRows(next);
    }, [width, height, rows, pushHistory]);

    const flipHorizontal = useCallback(() => {
        pushHistory(width, height, rows);
        setRows(rows.map((r) => r.split("").reverse().join("")));
    }, [width, height, rows, pushHistory]);

    const flipVertical = useCallback(() => {
        pushHistory(width, height, rows);
        setRows([...rows].reverse());
    }, [width, height, rows, pushHistory]);

    const invertPixels = useCallback(() => {
        pushHistory(width, height, rows);
        setRows(
            rows.map((r) =>
                r
                    .split("")
                    .map((c) => (c === "1" ? "0" : "1"))
                    .join("")
            )
        );
    }, [width, height, rows, pushHistory]);

    const clearPixels = useCallback(() => {
        pushHistory(width, height, rows);
        setRows(createBlankRows(width, height));
    }, [width, height, rows, pushHistory]);

    const cellSize = useMemo(() => {
        if (width > 80) return 8;
        if (width > 48) return 11;
        if (width > 32 || height > 24) return 14;
        return 18;
    }, [width, height]);

    useEffect(() => {
        if (activeTab !== "draw") return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const totalW = width * cellSize + 1;
        const totalH = height * cellSize + 1;
        canvas.width = totalW;
        canvas.height = totalH;

        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, totalW, totalH);

        const activeHex = signColor && signColor.startsWith("#") ? signColor : `#${signColor || "FF9000"}`;

        for (let y = 0; y < height; y++) {
            const row = rows[y] || "";
            for (let x = 0; x < width; x++) {
                const isLit = row[x] === "1";
                const px = x * cellSize + 1;
                const py = y * cellSize + 1;
                const size = cellSize - 1;

                ctx.fillStyle = isLit ? activeHex : "#27272a";
                ctx.fillRect(px, py, size, size);
            }
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
        ctx.lineWidth = 1;
        for (let x = 5; x < width; x += 5) {
            const gx = x * cellSize + 0.5;
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, totalH);
            ctx.stroke();
        }
        for (let y = 5; y < height; y += 5) {
            const gy = y * cellSize + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(totalW, gy);
            ctx.stroke();
        }

        if (hoverCell && hoverCell.x >= 0 && hoverCell.x < width && hoverCell.y >= 0 && hoverCell.y < height) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(
                hoverCell.x * cellSize + 1,
                hoverCell.y * cellSize + 1,
                cellSize - 1,
                cellSize - 1
            );
        }
    }, [activeTab, rows, width, height, cellSize, signColor, hoverCell]);

    const getCellFromPointerEvent = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor(((e.clientX - rect.left) * scaleX) / cellSize);
        const y = Math.floor(((e.clientY - rect.top) * scaleY) / cellSize);
        if (x < 0 || x >= width || y < 0 || y >= height) return null;
        return { x, y };
    };

    const applyCellEdit = (x, y, paintValue) => {
        setRows((prevRows) => {
            const currentRow = prevRows[y] || "0".repeat(width);
            if (currentRow[x] === paintValue) return prevRows;
            const nextRows = [...prevRows];
            nextRows[y] = currentRow.slice(0, x) + paintValue + currentRow.slice(x + 1);
            return nextRows;
        });
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        const cell = getCellFromPointerEvent(e);
        if (!cell) return;

        const isRightClick = e.button === 2;
        if (tool === "fill" && !isRightClick) {
            const currentBit = (rows[cell.y] && rows[cell.y][cell.x]) || "0";
            const nextBit = currentBit === "1" ? "0" : "1";
            pushHistory(width, height, rows);
            setRows(floodFillRows(rows, width, height, cell.x, cell.y, nextBit));
            return;
        }

        const paintValue = (isRightClick || tool === "eraser")
            ? "0"
            : (((rows[cell.y] && rows[cell.y][cell.x]) || "0") === "1" ? "0" : "1");

        pushHistory(width, height, rows);
        dragStateRef.current = { active: true, paintValue };
        applyCellEdit(cell.x, cell.y, paintValue);
    };

    const handlePointerMove = (e) => {
        const cell = getCellFromPointerEvent(e);
        setHoverCell(cell);
        if (!dragStateRef.current.active || !cell) return;
        applyCellEdit(cell.x, cell.y, dragStateRef.current.paintValue);
    };

    const handlePointerUp = () => {
        dragStateRef.current.active = false;
    };

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
                return;
            }
            const tag = document.activeElement?.tagName?.toLowerCase();
            const isTyping = tag === "input" || tag === "textarea";

            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
                if (isTyping) return;
                e.preventDefault();
                e.stopPropagation();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
                return;
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
                if (isTyping) return;
                e.preventDefault();
                e.stopPropagation();
                handleRedo();
                return;
            }

            if (isTyping || activeTab !== "draw") return;

            if (e.key.toLowerCase() === "b") setTool("pen");
            else if (e.key.toLowerCase() === "e") setTool("eraser");
            else if (e.key.toLowerCase() === "g") setTool("fill");
        };

        window.addEventListener("keydown", onKeyDown, true);
        return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [activeTab, onClose, handleUndo, handleRedo]);

    useEffect(() => {
        const onPaste = async (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) {
                        try {
                            setImportError("");
                            const img = await loadImageFromFile(file);
                            setImportedImg(img);
                            setActiveTab("import");
                        } catch (err) {
                            setImportError(err.message || "Failed to load pasted image");
                        }
                    }
                    break;
                }
            }
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, []);

    const importedPreview = useMemo(() => {
        if (!importedImg) return null;
        return convertImageToMatrix(importedImg, {
            targetHeight: importTargetH,
            threshold: importThreshold,
            invert: importInvert,
            trimEmptyColumns: importTrim
        });
    }, [importedImg, importTargetH, importThreshold, importInvert, importTrim]);

    const handleFileSelect = async (file) => {
        if (!file) return;
        try {
            setImportError("");
            const img = await loadImageFromFile(file);
            setImportedImg(img);
        } catch (err) {
            setImportError(err.message || "Could not read image file");
        }
    };

    const handleApplyImported = () => {
        if (!importedPreview) return;
        pushHistory(width, height, rows);
        setWidth(importedPreview.width);
        setHeight(importedPreview.height);
        setRows(importedPreview.rows);
        setActiveTab("draw");
    };

    const handleSaveGraphic = () => {
        const saved = onSave({
            id: initialGraphic?.id || undefined,
            name: name.trim() || "Custom Icon",
            width,
            height,
            rows,
            createdAt: initialGraphic?.createdAt
        });
        onClose(saved);
    };

    const isTallerThanSign = currentSignHeight && height > Number(currentSignHeight);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-black/70">
            <div
                className="bg-zinc-900 border border-neutral-700 rounded-xl shadow-2xl max-w-4xl w-full p-6 relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 border-b border-neutral-700/80 pb-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">
                            {initialGraphic?.id ? "Edit Custom Icon" : "Icon Maker"}
                        </h2>
                        <span className="text-xs px-2 py-0.5 rounded bg-orange-600/20 text-orange-400 border border-orange-500/30 font-mono">
                            {width}×{height}px
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onClose()}
                        className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
                        title="Close (Esc)"
                    >
                        <Icon name="close" size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="block text-xs text-neutral-400 mb-1">Icon Name</label>
                            <input
                                type="text"
                                maxLength={40}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. My Transit Logo"
                                className="w-48 h-9 px-3 rounded bg-neutral-800 border border-neutral-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-400 mb-1">Width (1–{MAX_GRAPHIC_W})</label>
                            <input
                                type="number"
                                min={1}
                                max={MAX_GRAPHIC_W}
                                value={width}
                                onChange={(e) => handleResize(e.target.value, height)}
                                className="w-20 h-9 px-2.5 rounded bg-neutral-800 border border-neutral-600 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-400 mb-1">Height (1–{MAX_GRAPHIC_H})</label>
                            <input
                                type="number"
                                min={1}
                                max={MAX_GRAPHIC_H}
                                value={height}
                                onChange={(e) => handleResize(width, e.target.value)}
                                className="w-20 h-9 px-2.5 rounded bg-neutral-800 border border-neutral-600 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                        {isTallerThanSign && (
                            <span
                                className="h-9 px-2.5 flex items-center gap-1.5 rounded bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs"
                                title={`Current sign height is ${currentSignHeight}px`}
                            >
                                <Icon name="warning" size={15} /> Taller than sign ({currentSignHeight}px)
                            </span>
                        )}
                    </div>

                    <div className="inline-flex rounded-lg bg-neutral-800 p-1 border border-neutral-700">
                        <button
                            type="button"
                            onClick={() => setActiveTab("draw")}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                activeTab === "draw"
                                    ? "bg-orange-600 text-white"
                                    : "text-neutral-400 hover:text-white"
                            }`}
                        >
                            <Icon name="brush" size={15} /> Draw Pixels
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("import")}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                activeTab === "import"
                                    ? "bg-orange-600 text-white"
                                    : "text-neutral-400 hover:text-white"
                            }`}
                        >
                            <Icon name="add_photo_alternate" size={15} /> Import Image
                        </button>
                    </div>
                </div>

                {activeTab === "draw" ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-800/70 border border-neutral-700/70 rounded-lg px-3 py-2 mb-3 text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setTool("pen")}
                                    className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                                        tool === "pen"
                                            ? "bg-orange-600 text-white"
                                            : "bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
                                    }`}
                                    title="Pen Tool (B) — Click or drag to toggle/paint LEDs"
                                >
                                    <Icon name="edit" size={14} /> Pen
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTool("eraser")}
                                    className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                                        tool === "eraser"
                                            ? "bg-orange-600 text-white"
                                            : "bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
                                    }`}
                                    title="Eraser Tool (E) — Right-click also erases"
                                >
                                    <Icon name="ink_eraser" size={14} /> Eraser
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTool("fill")}
                                    className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                                        tool === "fill"
                                            ? "bg-orange-600 text-white"
                                            : "bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
                                    }`}
                                    title="Flood Fill (G)"
                                >
                                    <Icon name="format_color_fill" size={14} /> Fill
                                </button>

                                <span className="h-4 w-px bg-neutral-700 mx-1" />

                                <button
                                    type="button"
                                    onClick={() => shiftRows(-1, 0)}
                                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 cursor-pointer flex items-center justify-center"
                                    title="Nudge Left 1px"
                                >
                                    <Icon name="arrow_back" size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => shiftRows(0, -1)}
                                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 cursor-pointer flex items-center justify-center"
                                    title="Nudge Up 1px"
                                >
                                    <Icon name="arrow_upward" size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => shiftRows(0, 1)}
                                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 cursor-pointer flex items-center justify-center"
                                    title="Nudge Down 1px"
                                >
                                    <Icon name="arrow_downward" size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => shiftRows(1, 0)}
                                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 cursor-pointer flex items-center justify-center"
                                    title="Nudge Right 1px"
                                >
                                    <Icon name="arrow_forward" size={15} />
                                </button>

                                <span className="h-4 w-px bg-neutral-700 mx-1" />

                                <button
                                    type="button"
                                    onClick={flipHorizontal}
                                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 cursor-pointer flex items-center gap-1"
                                    title="Flip Horizontally"
                                >
                                    <Icon name="flip" size={15} /> Flip H
                                </button>
                                <button
                                    type="button"
                                    onClick={flipVertical}
                                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 cursor-pointer flex items-center gap-1"
                                    title="Flip Vertically"
                                >
                                    <Icon name="flip" size={15} className="rotate-90" /> Flip V
                                </button>
                                <button
                                    type="button"
                                    onClick={invertPixels}
                                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 cursor-pointer flex items-center gap-1"
                                    title="Invert Lit/Unlit Pixels"
                                >
                                    <Icon name="invert_colors" size={15} /> Invert
                                </button>
                                <button
                                    type="button"
                                    onClick={clearPixels}
                                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-red-900/40 text-neutral-300 hover:text-red-300 border border-neutral-700 cursor-pointer flex items-center gap-1"
                                    title="Clear Canvas"
                                >
                                    <Icon name="delete_sweep" size={15} /> Clear
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    disabled={undoStack.length === 0}
                                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 border border-neutral-700 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                                    title="Undo (Ctrl+Z)"
                                >
                                    <Icon name="undo" size={15} /> Undo
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRedo}
                                    disabled={redoStack.length === 0}
                                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 border border-neutral-700 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                                    title="Redo (Ctrl+Y)"
                                >
                                    <Icon name="redo" size={15} /> Redo
                                </button>
                            </div>
                        </div>

                        <div
                            className="flex-1 overflow-auto bg-black border border-neutral-700 rounded-lg p-4 flex items-center justify-center min-h-[240px] select-none"
                            onMouseLeave={() => {
                                setHoverCell(null);
                                dragStateRef.current.active = false;
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                onContextMenu={(e) => e.preventDefault()}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                className="cursor-crosshair shadow-lg"
                                style={{ imageRendering: "pixelated", touchAction: "none" }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-[260px]">
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer?.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                            className="border-2 border-dashed border-neutral-700 hover:border-orange-500/70 rounded-xl p-6 bg-neutral-800/30 flex flex-col items-center justify-center text-center transition-colors"
                        >
                            <p className="text-sm text-neutral-200 font-semibold mb-1">
                                Drop an image here, paste with Ctrl+V, or pick a file
                            </p>
                            <p className="text-xs text-neutral-400 mb-3">
                                Automatically converts your image into an icon
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white text-xs font-semibold cursor-pointer"
                            >
                                Choose Image File...
                            </button>
                            {importError && (
                                <p className="text-xs text-red-400 mt-2">{importError}</p>
                            )}
                        </div>

                        {importedPreview && (
                            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">
                                            Target Height (1–{MAX_GRAPHIC_H}px)
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={MAX_GRAPHIC_H}
                                            value={importTargetH}
                                            onChange={(e) => setImportTargetH(e.target.value)}
                                            className="w-full h-8 px-2.5 rounded bg-neutral-800 border border-neutral-600 text-white text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">
                                            Brightness Threshold ({importThreshold})
                                        </label>
                                        <input
                                            type="range"
                                            min={1}
                                            max={254}
                                            value={importThreshold}
                                            onChange={(e) => setImportThreshold(Number(e.target.value))}
                                            className="w-full accent-orange-500 cursor-pointer"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer pt-4">
                                        <input
                                            type="checkbox"
                                            checked={importInvert}
                                            onChange={(e) => setImportInvert(e.target.checked)}
                                            className="accent-orange-500"
                                        />
                                        Invert Light / Dark
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer pt-4">
                                        <input
                                            type="checkbox"
                                            checked={importTrim}
                                            onChange={(e) => setImportTrim(e.target.checked)}
                                            className="accent-orange-500"
                                        />
                                        Trim Empty Side Columns
                                    </label>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/60 border border-neutral-700/70 rounded-lg p-3">
                                    <div className="flex items-center gap-3 overflow-x-auto">
                                        <LogoCanvas
                                            rows={importedPreview.rows}
                                            width={importedPreview.width}
                                            height={importedPreview.height}
                                            color={signColor || "#FF9000"}
                                            offColor="#262626"
                                            scale={3}
                                        />
                                        <span className="text-xs font-mono text-neutral-400">
                                            Result: {importedPreview.width}×{importedPreview.height}px
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleApplyImported}
                                        className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1"
                                    >
                                        Load into Pixel Editor <Icon name="arrow_forward" size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 pt-3 border-t border-neutral-700/80 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-400">Actual Size Preview:</span>
                        <div className="bg-black px-2.5 py-1.5 rounded border border-neutral-700 flex items-center">
                            <LogoCanvas
                                rows={rows}
                                width={width}
                                height={height}
                                color={signColor || "#FF9000"}
                                offColor="#262626"
                                scale={2}
                            />
                        </div>
                        {hoverCell && activeTab === "draw" && (
                            <span className="text-xs font-mono text-neutral-500">
                                ({hoverCell.x + 1}, {hoverCell.y + 1})
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveGraphic}
                            className="px-5 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md"
                        >
                            Save Icon
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
