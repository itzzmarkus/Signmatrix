import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { SignCompiler } from "../engine/SignCompiler.js";
import { buildSignSpec } from "./signUtils.js";

export function isWebCodecsSupported() {
    return (
        typeof window !== "undefined" &&
        typeof window.VideoEncoder === "function" &&
        typeof window.VideoFrame === "function"
    );
}

async function selectSupportedAvcCodec(width, height) {
    const candidateCodecs = [
        "avc1.420033",
        "avc1.4d0033",
        "avc1.640033",
        "avc1.42002a",
        "avc1.4d002a",
        "avc1.64002a",
        "avc1.420028",
        "avc1.4d0028",
        "avc1.640028",
        "avc1.42001f"
    ];

    if (typeof VideoEncoder.isConfigSupported !== "function") {
        return "avc1.420033";
    }

    for (const codec of candidateCodecs) {
        try {
            const support = await VideoEncoder.isConfigSupported({
                codec,
                width,
                height,
                bitrate: 4_000_000,
                framerate: 60,
                latencyMode: "realtime"
            });
            if (support && support.supported) {
                return codec;
            }
        } catch {}
    }

    return "avc1.420033";
}

async function safeFlush(encoder, timeoutMs = 4000) {
    if (!encoder || encoder.state !== "configured") return;

    let timeoutHandle;
    const timeoutPromise = new Promise((resolve) => {
        timeoutHandle = setTimeout(() => {
            console.warn(
                `VideoEncoder.flush() timed out after ${timeoutMs}ms; proceeding with muxer finalisation.`
            );
            resolve();
        }, timeoutMs);
    });

    try {
        await Promise.race([encoder.flush(), timeoutPromise]);
    } catch (err) {
        console.warn("VideoEncoder.flush() reported:", err);
    } finally {
        clearTimeout(timeoutHandle);
    }
}

export async function exportVideo60Fps(signState, graphicsById = {}, options = {}) {
    if (!isWebCodecsSupported()) {
        throw new Error(
            "WebCodecs API is not supported in this browser. Please use modern Chrome, Edge, Safari 16.4+, or Firefox."
        );
    }

    const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};

    const spec = buildSignSpec(signState, graphicsById, options);
    const sign = SignCompiler.compile(spec);

    const signW = sign.outputWidth;
    const signH = sign.outputHeight;
    const videoWidth = signW & ~1;
    const videoHeight = signH & ~1;

    if (videoWidth <= 0 || videoHeight <= 0) {
        throw new Error("Invalid sign dimensions for video export.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext("2d", { alpha: false });

    const fps = 60;
    const dt = 1000 / fps;
    const isAnimated = sign.isAnimated();
    const isFlipdot = sign.displayType === "flipdot";
    const matrixFrames = isAnimated ? sign.generateAnimatedMatrixFrames() : [];

    const timelinePhases = [];

    if (!isAnimated || matrixFrames.length <= 1) {
        const staticImage = sign.generateImageForState(0, { transparent: false });
        timelinePhases.push({
            durationMs: 2000,
            getImage: () => staticImage
        });
    } else if (isFlipdot) {
        const w = sign.width;
        const h = sign.height;
        const totalDots = w * h;
        const msPerColumn = w >= 140 ? 6.0 : (w <= 84 ? 8.0 : 7.5);
        const sweepDuration = Math.round(w * msPerColumn);
        const baseDotDuration = 70;
        const totalFlipDuration = sweepDuration + 50 + baseDotDuration + 24;

        for (let i = 0; i < matrixFrames.length; i++) {
            const cur = matrixFrames[i];
            const next = matrixFrames[(i + 1) % matrixFrames.length];

            let isDiff = false;
            if (cur.matrix.width === next.matrix.width && cur.matrix.height === next.matrix.height) {
                const p1 = cur.matrix.pixels;
                const p2 = next.matrix.pixels;
                for (let j = 0; j < p1.length; j++) {
                    if (p1[j] !== p2[j]) {
                        isDiff = true;
                        break;
                    }
                }
            } else {
                isDiff = true;
            }

            const holdMs = Math.max(800, cur.ms || 2000);
            const holdImage = sign.generateImageForMatrix(cur.matrix, { transparent: false });
            timelinePhases.push({
                durationMs: holdMs,
                getImage: () => holdImage
            });

            if (isDiff) {
                const curPix = cur.matrix.pixels;
                const nextPix = next.matrix.pixels;
                const dotStartTimes = new Float32Array(totalDots);
                const dotFlipDurations = new Float32Array(totalDots);
                const dotNeedsFlip = new Uint8Array(totalDots);

                for (let mx = 0; mx < w; mx++) {
                    const colBaseTime = (mx / w) * sweepDuration;
                    for (let my = 0; my < h; my++) {
                        const idx = my * w + mx;
                        const wasOn = (curPix[idx] >>> 24) !== 0;
                        const willBeOn = (nextPix[idx] >>> 24) !== 0;

                        if (wasOn !== willBeOn) {
                            dotNeedsFlip[idx] = 1;
                            const jitter = ((mx * 13 + my * 29) % 7) * 2.2;
                            const rowStagger = (my / h) * 20.0;
                            dotStartTimes[idx] = colBaseTime + rowStagger + jitter;
                            dotFlipDurations[idx] = baseDotDuration + ((mx * 7 + my * 17) % 5) * 2.0;
                        }
                    }
                }

                timelinePhases.push({
                    durationMs: totalFlipDuration,
                    getImage: (tRel) => {
                        const angles = new Float32Array(totalDots);
                        for (let idx = 0; idx < totalDots; idx++) {
                            const willBeOn = (nextPix[idx] >>> 24) !== 0;
                            if (dotNeedsFlip[idx] === 0) {
                                angles[idx] = willBeOn ? 0.0 : Math.PI;
                                continue;
                            }

                            const tStart = dotStartTimes[idx];
                            const tDur = dotFlipDurations[idx];
                            const rel = tRel - tStart;

                            if (rel <= 0.0) {
                                angles[idx] = willBeOn ? Math.PI : 0.0;
                            } else if (rel >= tDur) {
                                const bounceElapsed = rel - tDur;
                                let bounce = 0.0;
                                if (bounceElapsed < 22) {
                                    bounce = 0.12 * Math.exp(-bounceElapsed / 5.5) * Math.sin(bounceElapsed * 0.5);
                                }
                                angles[idx] = willBeOn ? Math.max(0.0, bounce) : Math.min(Math.PI, Math.PI - bounce);
                            } else {
                                const u = rel / tDur;
                                const ease = u * u * (3.0 - 2.0 * u);
                                angles[idx] = willBeOn ? Math.PI * (1.0 - ease) : Math.PI * ease;
                            }
                        }
                        return sign.generateImageForMatrix(next.matrix, { dotAngles: angles, transparent: false });
                    }
                });
            }
        }
    } else {
        for (let i = 0; i < matrixFrames.length; i++) {
            const mf = matrixFrames[i];
            const cachedImage = sign.generateImageForMatrix(mf.matrix, { transparent: false });
            timelinePhases.push({
                durationMs: mf.ms || 2000,
                getImage: () => cachedImage
            });
        }
    }

    const totalDurationMs = timelinePhases.reduce((acc, p) => acc + p.durationMs, 0);
    const totalFrames = Math.max(1, Math.round(totalDurationMs / dt));

    const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
            codec: "avc",
            width: videoWidth,
            height: videoHeight,
            frameRate: fps
        },
        fastStart: "in-memory",
        firstTimestampBehavior: "strict"
    });

    const avcCodec = await selectSupportedAvcCodec(videoWidth, videoHeight);
    let encoderError = null;
    const frameDurationMicros = Math.round(1_000_000 / fps);

    const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
            try {
                const chunkData = new Uint8Array(chunk.byteLength);
                chunk.copyTo(chunkData);
                const chunkDuration =
                    Number.isFinite(chunk.duration) && chunk.duration > 0
                        ? chunk.duration
                        : frameDurationMicros;

                muxer.addVideoChunkRaw(
                    chunkData,
                    chunk.type,
                    chunk.timestamp,
                    chunkDuration,
                    meta
                );
            } catch (err) {
                console.error("Error writing chunk to mp4-muxer:", err);
                encoderError = err;
            }
        },
        error: (err) => {
            encoderError = err;
            console.error("VideoEncoder error event:", err);
        }
    });

    videoEncoder.configure({
        codec: avcCodec,
        width: videoWidth,
        height: videoHeight,
        bitrate: 4_000_000,
        framerate: fps,
        latencyMode: "realtime"
    });

    let currentPhaseIndex = 0;
    let phaseStartMs = 0;

    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        if (encoderError) {
            throw new Error(
                `Video encoding failed: ${encoderError.message || encoderError}`
            );
        }

        if (videoEncoder.encodeQueueSize > 5) {
            await new Promise((resolve) => setTimeout(resolve, 5));
        }

        const currentTimeMs = frameIdx * dt;

        while (
            currentPhaseIndex < timelinePhases.length - 1 &&
            currentTimeMs >= phaseStartMs + timelinePhases[currentPhaseIndex].durationMs
        ) {
            phaseStartMs += timelinePhases[currentPhaseIndex].durationMs;
            currentPhaseIndex++;
        }

        const currentPhase = timelinePhases[currentPhaseIndex];
        const tRel = Math.max(0, currentTimeMs - phaseStartMs);
        const pixelImage = currentPhase.getImage(tRel);

        const imgData = new ImageData(pixelImage.toRgbaBytes(), pixelImage.width, pixelImage.height);
        ctx.putImageData(imgData, 0, 0);

        const timestampMicros = Math.round(frameIdx * (1_000_000 / fps));
        const videoFrame = new VideoFrame(canvas, {
            timestamp: timestampMicros,
            duration: frameDurationMicros
        });

        const isKeyFrame = frameIdx % 60 === 0;
        videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
        videoFrame.close();

        const percent = Math.min(99, Math.round(((frameIdx + 1) / totalFrames) * 100));
        onProgress({ currentFrame: frameIdx + 1, totalFrames, percent });

        if (frameIdx % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }

    await safeFlush(videoEncoder, 4000);
    muxer.finalize();

    onProgress({ currentFrame: totalFrames, totalFrames, percent: 100 });

    const { buffer } = muxer.target;
    return new Blob([buffer], { type: "video/mp4" });
}

export async function downloadSignVideo(signState, setIsDownloading, graphicsById = {}, options = {}) {
    try {
        if (typeof setIsDownloading === "function") setIsDownloading(true);

        const videoBlob = await exportVideo60Fps(signState, graphicsById, options);
        const objectUrl = window.URL.createObjectURL(videoBlob);

        const routeName = signState.route ? signState.route.replace(/\s+/g, "-") : "custom";
        const fileName = `signmatrix-${routeName}.mp4`;

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
        console.error("Error generating 60 FPS video export:", error);
        alert(
            error.message || "An error occurred while generating your 60 FPS MP4 video export."
        );
    } finally {
        if (typeof setIsDownloading === "function") setIsDownloading(false);
    }
}
