import { useEffect, useRef, useMemo } from "react";
import Icon from "./Icon.jsx";
import { buildSignSpec } from "../utils/signUtils.js";
import { SignCompiler } from "../engine/SignCompiler.js";

function runFlipdotSweep(canvas, compiledSign, fromMatrix, toMatrix, onComplete = null) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => {};

    const outW = compiledSign.outputWidth;
    const outH = compiledSign.outputHeight;
    const w = compiledSign.width;
    const h = compiledSign.height;
    const totalDots = w * h;

    const fromPixels = fromMatrix ? fromMatrix.pixels : null;
    const toPixels = toMatrix.pixels;

    const dotStartTimes = new Float32Array(totalDots);
    const dotFlipDurations = new Float32Array(totalDots);
    const dotNeedsFlip = new Uint8Array(totalDots);
    const dotAngles = new Float32Array(totalDots);

    const columnFlips = new Int32Array(w);

    const msPerColumn = w >= 140 ? 6.0 : (w <= 84 ? 8.0 : 7.5);
    const sweepDuration = Math.round(w * msPerColumn);
    const baseDotDuration = 70;

    for (let x = 0; x < w; x++) {
        let colChangeCount = 0;
        const colBaseTime = (x / w) * sweepDuration;

        for (let y = 0; y < h; y++) {
            const idx = y * w + x;
            const wasOn = fromPixels ? ((fromPixels[idx] >>> 24) !== 0) : false;
            const willBeOn = (toPixels[idx] >>> 24) !== 0;

            if (wasOn !== willBeOn) {
                dotNeedsFlip[idx] = 1;
                colChangeCount++;

                const jitter = ((x * 13 + y * 29) % 7) * 2.2;
                const rowStagger = (y / h) * 20.0;

                dotStartTimes[idx] = colBaseTime + rowStagger + jitter;
                dotFlipDurations[idx] = baseDotDuration + ((x * 7 + y * 17) % 5) * 2.0;
                dotAngles[idx] = wasOn ? 0.0 : Math.PI;
            } else {
                dotNeedsFlip[idx] = 0;
                dotAngles[idx] = willBeOn ? 0.0 : Math.PI;
            }
        }
        columnFlips[x] = colChangeCount;
    }

    const totalAnimDuration = sweepDuration + 50 + baseDotDuration + 24;
    const startTime = performance.now();
    let animId = null;
    let cancelled = false;

    const frame = (now) => {
        if (cancelled) return;
        const elapsed = now - startTime;

        const allSettled = elapsed >= totalAnimDuration;

        for (let idx = 0; idx < totalDots; idx++) {
            if (dotNeedsFlip[idx] === 0) {
                continue;
            }

            const tStart = dotStartTimes[idx];
            const tDur = dotFlipDurations[idx];
            const willBeOn = (toPixels[idx] >>> 24) !== 0;
            const tRel = elapsed - tStart;

            if (tRel <= 0.0) {
                dotAngles[idx] = willBeOn ? Math.PI : 0.0;
            } else if (tRel >= tDur) {
                const bounceElapsed = tRel - tDur;
                let bounce = 0.0;
                if (bounceElapsed < 22) {
                    bounce = 0.12 * Math.exp(-bounceElapsed / 5.5) * Math.sin(bounceElapsed * 0.5);
                }
                if (willBeOn) {
                    dotAngles[idx] = Math.max(0.0, bounce);
                } else {
                    dotAngles[idx] = Math.min(Math.PI, Math.PI - bounce);
                }
            } else {
                const u = tRel / tDur;
                const ease = u * u * (3.0 - 2.0 * u);
                if (willBeOn) {
                    dotAngles[idx] = Math.PI * (1.0 - ease);
                } else {
                    dotAngles[idx] = Math.PI * ease;
                }
            }
        }

        const upscaled = compiledSign.generateImageForMatrix(toMatrix, {
            dotAngles
        });
        const imgData = new ImageData(upscaled.toRgbaBytes(), outW, outH);
        ctx.putImageData(imgData, 0, 0);

        if (!allSettled) {
            animId = requestAnimationFrame(frame);
        } else {
            if (onComplete) onComplete();
        }
    };

    animId = requestAnimationFrame(frame);

    return () => {
        cancelled = true;
        if (animId !== null) cancelAnimationFrame(animId);
    };
}

function LivePreview({ signState, graphicsById = {}, isPinned = true, onTogglePin }) {
    const canvasRef = useRef(null);
    const prevMatrixRef = useRef(null);
    const prevDisplayTypeRef = useRef(null);
    const activeSweepCancelRef = useRef(null);

    const compiledSign = useMemo(() => {
        if (!signState) return null;
        try {
            const spec = buildSignSpec(signState, graphicsById);
            return SignCompiler.compile(spec);
        } catch (err) {
            console.error("Failed to compile sign preview:", err);
            return null;
        }
    }, [signState, graphicsById]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !compiledSign) return;

        const outW = compiledSign.outputWidth;
        const outH = compiledSign.outputHeight;
        if (canvas.width !== outW) canvas.width = outW;
        if (canvas.height !== outH) canvas.height = outH;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (activeSweepCancelRef.current) {
            activeSweepCancelRef.current();
            activeSweepCancelRef.current = null;
        }

        const isFlipdot = compiledSign.displayType === "flipdot";
        const displayTypeChanged = prevDisplayTypeRef.current !== null && prevDisplayTypeRef.current !== compiledSign.displayType;
        prevDisplayTypeRef.current = compiledSign.displayType;

        const drawMatrixFrame = (frameEntry, cacheFrame = true) => {
            if (cacheFrame) {
                if (!frameEntry.imageData) {
                    const upscaled = compiledSign.generateImageForMatrix(frameEntry.matrix);
                    frameEntry.imageData = new ImageData(upscaled.toRgbaBytes(), outW, outH);
                }
                ctx.putImageData(frameEntry.imageData, 0, 0);
            } else {
                const upscaled = compiledSign.generateImageForMatrix(frameEntry.matrix);
                const imgData = new ImageData(upscaled.toRgbaBytes(), outW, outH);
                ctx.putImageData(imgData, 0, 0);
            }
        };

        if (!compiledSign.isAnimated()) {
            const matrix = compiledSign.generateMatrixForState(0);
            const prevMatrix = prevMatrixRef.current;

            if (displayTypeChanged && isFlipdot) {
                activeSweepCancelRef.current = runFlipdotSweep(canvas, compiledSign, null, matrix, () => {
                    activeSweepCancelRef.current = null;
                    prevMatrixRef.current = matrix;
                });
                return;
            }

            let hasChanged = !prevMatrix || prevMatrix.width !== matrix.width || prevMatrix.height !== matrix.height;
            if (!hasChanged) {
                const pPix = prevMatrix.pixels;
                const mPix = matrix.pixels;
                for (let i = 0; i < pPix.length; i++) {
                    if (pPix[i] !== mPix[i]) {
                        hasChanged = true;
                        break;
                    }
                }
            }

            if (isFlipdot && hasChanged && prevMatrix) {
                activeSweepCancelRef.current = runFlipdotSweep(canvas, compiledSign, prevMatrix, matrix, () => {
                    activeSweepCancelRef.current = null;
                    prevMatrixRef.current = matrix;
                });
            } else {
                drawMatrixFrame({ matrix }, false);
                prevMatrixRef.current = matrix;
            }
            return;
        }

        const matrixFrames = compiledSign.generateAnimatedMatrixFrames();
        if (matrixFrames.length === 0) return;

        const shouldCacheFrames = matrixFrames.length <= 10 && !isFlipdot;

        let currentIdx = 0;
        let timerId = null;
        let cancelled = false;

        const step = () => {
            if (cancelled) return;
            const entry = matrixFrames[currentIdx];
            const prevMatrix = prevMatrixRef.current;

            if (isFlipdot && prevMatrix && matrixFrames.length > 1) {
                activeSweepCancelRef.current = runFlipdotSweep(canvas, compiledSign, prevMatrix, entry.matrix, () => {
                    activeSweepCancelRef.current = null;
                    prevMatrixRef.current = entry.matrix;
                });
            } else {
                drawMatrixFrame(entry, shouldCacheFrames);
                prevMatrixRef.current = entry.matrix;
            }

            const delayMs = Math.max(30, Math.round((entry.ms || 30) / 10) * 10);
            currentIdx = (currentIdx + 1) % matrixFrames.length;
            timerId = window.setTimeout(step, delayMs);
        };

        step();

        return () => {
            cancelled = true;
            if (timerId !== null) {
                window.clearTimeout(timerId);
            }
            if (activeSweepCancelRef.current) {
                activeSweepCancelRef.current();
                activeSweepCancelRef.current = null;
            }
        };
    }, [compiledSign]);

    const useSmoothDownscale = (compiledSign?.ledSize ?? 12) >= 5;
    const isFlipdot = compiledSign?.displayType === "flipdot";

    return (
        <section className="relative bg-black border border-neutral-700 p-5 sm:p-6 min-h-[104px] rounded-t-lg flex justify-center items-center group">
            {onTogglePin && (
                <button
                    type="button"
                    onClick={onTogglePin}
                    title={isPinned ? "Unpin preview from top of screen" : "Pin preview to top of screen"}
                    className={`absolute top-2 right-2 px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                        isPinned
                            ? "bg-neutral-900/90 text-orange-400 border-orange-500/40 opacity-80 hover:opacity-100"
                            : "bg-neutral-900/80 text-neutral-400 border-neutral-700 opacity-60 group-hover:opacity-100 hover:text-white"
                    }`}
                >
                    <Icon
                        name="keep"
                        size={14}
                        fill={isPinned}
                        className={isPinned ? "rotate-0" : "rotate-45"}
                    />
                    <span className="hidden sm:inline">{isPinned ? "Pinned" : "Pin"}</span>
                </button>
            )}
            <canvas
                ref={canvasRef}
                role="img"
                aria-label={isFlipdot ? "Flip-Dot Sign Preview" : "LED Sign Preview"}
                className="max-w-full w-auto h-auto object-contain"
                style={{ imageRendering: useSmoothDownscale ? "auto" : "pixelated" }}
            />
        </section>
    );
}

export default LivePreview;
