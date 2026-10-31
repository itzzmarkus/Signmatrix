import { Color, PixelCanvas, clamp } from "./PixelCanvas.js";
import { TextAlignment, roundToInt } from "./Layout.js";
import { AnimationType } from "./Destination.js";
import { applyOpticalLedGlow } from "./glowCompositor.js";
import { resolveDiseaseParams, applySignDisease } from "./signDisease.js";
import { getFlipdotStamp } from "./flipdotRenderer.js";

const circleMaskCache = new Map();

function getCircleCornerMask(ledSize) {
    if (circleMaskCache.has(ledSize)) {
        return circleMaskCache.get(ledSize);
    }
    const mask = new Uint8Array(ledSize * ledSize);
    const radius = ledSize / 2.0;
    const center = radius - 0.5;
    const rSq = radius * radius;

    for (let py = 0; py < ledSize; py++) {
        const dy = py - center;
        for (let px = 0; px < ledSize; px++) {
            const dx = px - center;
            if (dx * dx + dy * dy >= rSq) {
                mask[py * ledSize + px] = 1;
            }
        }
    }
    circleMaskCache.set(ledSize, mask);
    return mask;
}

export class DestSign {
    static ORANGE = new Color(255, 144, 0, 255);
    static DARK_GREY = new Color(64, 64, 64, 255);

    constructor({
        width,
        height,
        ledSize = 3,
        ledSpacing = 1,
        ledSpacingY = undefined,
        borderSize = 4,
        ledColor = DestSign.ORANGE,
        offColor = DestSign.DARK_GREY,
        borderColor = Color.BLACK,
        scrollTime = 1.75,
        defaultAnimation = AnimationType.NoAnimation,
        circles = false,
        maxScrollFramerate = 30,
        autoScroll = true,
        scrollSpeed = 30,
        scrollPause = 1.0,
        ledGlow = "none",
        signDisease = "none",
        diseaseSeed = 1337,
        diseaseOptions = {},
        displayType = "led",
        discColor = null
    }) {
        this.width = width | 0;
        this.height = height | 0;
        this.ledSize = ledSize | 0;
        this.ledSpacing = ledSpacing | 0;
        this.ledSpacingY = (ledSpacingY !== undefined && ledSpacingY !== null ? ledSpacingY : ledSpacing) | 0;
        this.borderSize = borderSize | 0;
        this.ledColor = ledColor;
        this.offColor = offColor;
        this.borderColor = borderColor;
        this.scrollTime = Math.fround(scrollTime);
        this.defaultAnimation =
            !defaultAnimation || defaultAnimation.type === "INHERIT"
                ? AnimationType.NoAnimation
                : defaultAnimation;
        this.circles = Boolean(circles);
        this.maxScrollFramerate = maxScrollFramerate | 0;
        this.autoScroll = Boolean(autoScroll);
        this.scrollSpeed = Math.fround(scrollSpeed);
        this.scrollPause = Math.fround(scrollPause);
        this.ledGlow = String(ledGlow || "none").toLowerCase();
        this.signDisease = resolveDiseaseParams(
            typeof signDisease === "object"
                ? { seed: diseaseSeed, ...signDisease }
                : { preset: signDisease, seed: diseaseSeed, ...diseaseOptions }
        );
        this.displayType = String(displayType || "led").toLowerCase();
        this.discColor = discColor
            ? String(discColor)
            : (this.ledColor && this.ledColor.r !== undefined
                ? ('#' + ((1 << 24) + (this.ledColor.r << 16) + (this.ledColor.g << 8) + this.ledColor.b).toString(16).slice(1).toUpperCase())
                : "#FF9000");

        this.outputWidth =
            this.width * this.ledSize + (this.width - 1) * this.ledSpacing + this.borderSize * 2;
        this.outputHeight =
            this.height * this.ledSize + (this.height - 1) * this.ledSpacingY + this.borderSize * 2;

        this.destination = null;
        this.pr = null;
    }

    get stateCount() {
        return (this.destination?.frames?.length || 0) + (this.pr?.frames?.length || 0);
    }

    getAllFrames() {
        return [...(this.destination?.frames || []), ...(this.pr?.frames || [])];
    }

    horizontalOverflowRange(dest, frame) {
        return Math.max(0, frame.totalWidth - (this.width - dest.effectiveRouteWidth));
    }

    isAnimated() {
        const allFrames = this.getAllFrames();
        if (allFrames.length >= 2) return true;
        if (allFrames.some((f) => f.hscroll && f.hscroll.type !== "NO_SCROLL")) return true;
        if (this.autoScroll) {
            const dests = [this.destination, this.pr].filter(Boolean);
            for (const dest of dests) {
                for (const frame of dest.frames) {
                    if (this.horizontalOverflowRange(dest, frame) > 0) return true;
                }
            }
        }
        return false;
    }

    getInheritedAnimation(destFrame) {
        if (!destFrame.animation || destFrame.animation.type === "INHERIT") {
            return this.defaultAnimation;
        }
        return destFrame.animation;
    }

    generateMatrixForState(state) {
        if (state < 0 || state >= this.stateCount) {
            throw new Error(`State (${state}) is out of bounds (max ${this.stateCount})`);
        }
        const numDestFrames = this.destination?.frames?.length || 0;
        const onPr = state >= numDestFrames;
        const currentDest = onPr ? this.pr : this.destination;
        const frameIdx = onPr ? state - numDestFrames : state;
        return currentDest.generateMatrixCanvas(this.width, this.height, currentDest.frames[frameIdx]);
    }

    getEffectiveMatrixForState(state, options = {}) {
        const raw = this.generateMatrixForState(state);
        const diseaseConfig = options.signDisease !== undefined ? options.signDisease : this.signDisease;
        return diseaseConfig && diseaseConfig.preset !== "none"
            ? applySignDisease(raw, diseaseConfig, this.ledColor.rgb | 0, options.previousMatrix)
            : raw;
    }

    generateImageForState(state, options = {}) {
        return this.generateImageForMatrix(this.generateMatrixForState(state), options);
    }

    generateImageForFrame(destination, destFrame, options = {}) {
        return this.generateImageForMatrix(
            destination.generateMatrixCanvas(this.width, this.height, destFrame),
            options
        );
    }

    generateImageForMatrix(matrixCanvas, options = {}) {
        const transparent = Boolean(options.transparent);
        const outW = this.outputWidth;
        const outH = this.outputHeight;
        const out = new PixelCanvas(outW, outH);
        const outPixels = out.pixels;

        const borderArgb = this.borderColor.rgb | 0;
        const blackArgb = Color.BLACK.rgb | 0;
        const offArgb = this.offColor.rgb | 0;

        if (!transparent) {
            outPixels.fill(blackArgb);
            if (borderArgb !== blackArgb && this.borderSize > 0) {
                out.fillRect(0, 0, outW, this.borderSize, this.borderColor);
                out.fillRect(0, outH - this.borderSize, outW, this.borderSize, this.borderColor);
                out.fillRect(0, 0, this.borderSize, outH, this.borderColor);
                out.fillRect(outW - this.borderSize, 0, this.borderSize, outH, this.borderColor);
            }
        } else {
            outPixels.fill(0);
        }

        const ledSize = this.ledSize;
        const stepX = ledSize + this.ledSpacing;
        const stepY = ledSize + this.ledSpacingY;
        const borderSize = this.borderSize;
        const useCircles = this.circles && ledSize >= 4;
        const circleMask = useCircles ? getCircleCornerMask(ledSize) : null;

        const diseaseConfig = options.signDisease !== undefined ? options.signDisease : this.signDisease;
        const effectiveMatrix = diseaseConfig && diseaseConfig.preset !== "none"
            ? applySignDisease(matrixCanvas, diseaseConfig, this.ledColor.rgb | 0, options.previousMatrix)
            : matrixCanvas;

        const displayType = options.displayType || this.displayType || "led";
        const discColor = options.discColor || this.discColor || (this.ledColor && this.ledColor.r !== undefined
            ? ('#' + ((1 << 24) + (this.ledColor.r << 16) + (this.ledColor.g << 8) + this.ledColor.b).toString(16).slice(1).toUpperCase())
            : "#FF9000");
        const isFlipdot = displayType === "flipdot";

        const mtxPixels = effectiveMatrix.pixels;
        const mtxW = effectiveMatrix.width;
        const w = this.width;
        const h = this.height;

        let activeStamp = null;
        let inactiveStamp = null;
        if (isFlipdot) {
            activeStamp = getFlipdotStamp(ledSize, discColor, displayType, 0.0, transparent);
            inactiveStamp = getFlipdotStamp(ledSize, discColor, displayType, Math.PI, transparent);
        }

        const dotAngles = options.dotAngles;
        const columnFlipProgress = options.columnFlipProgress;

        for (let my = 0; my < h; my++) {
            const baseY = borderSize + my * stepY;
            const mtxRow = my * mtxW;
            for (let mx = 0; mx < w; mx++) {
                const baseX = borderSize + mx * stepX;
                const srcPx = mtxPixels[mtxRow + mx];
                const alpha = (srcPx >>> 24) & 0xff;

                if (transparent && alpha === 0) {
                    continue;
                }

                if (isFlipdot) {
                    let stamp;
                    if (dotAngles) {
                        const angle = dotAngles[my * w + mx];
                        if (angle <= 0.001) {
                            stamp = activeStamp;
                        } else if (angle >= Math.PI - 0.001) {
                            stamp = inactiveStamp;
                        } else {
                            stamp = getFlipdotStamp(ledSize, discColor, displayType, angle, transparent);
                        }
                    } else if (columnFlipProgress && columnFlipProgress[mx] !== undefined) {
                        const prog = columnFlipProgress[mx];
                        if (prog <= 0.0) {
                            stamp = alpha !== 0 ? activeStamp : inactiveStamp;
                        } else if (prog >= 1.0) {
                            stamp = alpha !== 0 ? inactiveStamp : activeStamp;
                        } else {
                            stamp = getFlipdotStamp(ledSize, discColor, displayType, prog * Math.PI, transparent);
                        }
                    } else {
                        stamp = alpha !== 0 ? activeStamp : inactiveStamp;
                    }

                    for (let py = 0; py < ledSize; py++) {
                        const rowOffset = (baseY + py) * outW + baseX;
                        const maskRow = py * ledSize;
                        for (let px = 0; px < ledSize; px++) {
                            const sp = stamp[maskRow + px];
                            if (!transparent || sp !== 0) {
                                outPixels[rowOffset + px] = sp;
                            }
                        }
                    }
                } else {
                    const cellColor = alpha !== 0 ? srcPx : offArgb;

                    if (!useCircles) {
                        for (let py = 0; py < ledSize; py++) {
                            const rowOffset = (baseY + py) * outW + baseX;
                            for (let px = 0; px < ledSize; px++) {
                                outPixels[rowOffset + px] = cellColor;
                            }
                        }
                    } else {
                        for (let py = 0; py < ledSize; py++) {
                            const rowOffset = (baseY + py) * outW + baseX;
                            const maskRow = py * ledSize;
                            for (let px = 0; px < ledSize; px++) {
                                if (circleMask[maskRow + px] === 0) {
                                    outPixels[rowOffset + px] = cellColor;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (!isFlipdot && this.ledGlow && this.ledGlow !== "none") {
            applyOpticalLedGlow({
                outPixels,
                outW,
                outH,
                matrixCanvas: effectiveMatrix,
                ledSize,
                ledSpacing: this.ledSpacing,
                ledSpacingY: this.ledSpacingY,
                borderSize,
                useCircles,
                circleMask,
                ledGlow: this.ledGlow,
                transparent
            });
        }

        return out;
    }

    generateAnimatedMatrixFrames() {
        const numDestFrames = this.destination?.frames?.length || 0;
        const framesList = [];
        const stateCount = this.stateCount;
        if (stateCount === 0) return framesList;

        const stateEntries = [];
        for (let state = 0; state < stateCount; state++) {
            const onPr = state >= numDestFrames;
            const currentDest = onPr ? this.pr : this.destination;
            const index = onPr ? state - numDestFrames : state;
            const currentFrame = currentDest.frames[index];
            const rawTime =
                index < currentDest.screenTimes.length ? currentDest.screenTimes[index] : this.scrollTime;
            const stateTime = rawTime <= 0 ? this.scrollTime : rawTime;
            stateEntries.push({
                dest: currentDest,
                frame: currentFrame,
                matrix: currentDest.generateMatrixCanvas(this.width, this.height, currentFrame),
                stateTime: Math.fround(stateTime)
            });
        }

        const dests = [this.destination, this.pr].filter(Boolean);
        const allNoAnimation = dests.every((d) =>
            d.frames.every((f) => this.getInheritedAnimation(f).type === "NONE")
        );
        const hasOverflow =
            this.autoScroll &&
            stateEntries.some((s) => this.horizontalOverflowRange(s.dest, s.frame) > 0);

        if (allNoAnimation || stateCount === 1 || hasOverflow) {
            for (let i = 0; i < stateCount; i++) {
                const stateEntry = stateEntries[i];
                const overflowRange = this.autoScroll
                    ? this.horizontalOverflowRange(stateEntry.dest, stateEntry.frame)
                    : 0;

                if (overflowRange === 0) {
                    const currentFrameTime = roundToInt(Math.fround(stateEntry.stateTime * 1000.0));
                    framesList.push({ matrix: stateEntry.matrix, ms: currentFrameTime });
                } else {
                    const framerate = this.maxScrollFramerate;
                    const pixelsPerSecond = Math.max(1.0, this.scrollSpeed);
                    const destinationWidth = this.width - stateEntry.dest.effectiveRouteWidth;
                    const frameDelay = Math.max(3, roundToInt(Math.fround(1000.0 / framerate)));

                    if (this.scrollPause < 0) {
                        const prevIndex = (i - 1 + stateCount) % stateCount;
                        const nextIndex = (i + 1) % stateCount;
                        const prevStateEntry = stateEntries[prevIndex];
                        const nextStateEntry = stateEntries[nextIndex];

                        const maxOverlap = Math.max(
                            0,
                            stateEntry.frame.totalWidth + destinationWidth - 10
                        );
                        const overlapPixels = clamp(
                            roundToInt(Math.fround(-this.scrollPause * pixelsPerSecond)),
                            0,
                            maxOverlap
                        );
                        const advanceDistance = Math.max(
                            1,
                            stateEntry.frame.totalWidth + destinationWidth - overlapPixels
                        );
                        const prevAdvanceDistance = Math.max(
                            1,
                            prevStateEntry.frame.totalWidth + destinationWidth - overlapPixels
                        );

                        const numFrames = Math.max(
                            1,
                            roundToInt(Math.fround((advanceDistance / pixelsPerSecond) * framerate))
                        );

                        for (let f = 0; f < numFrames; f++) {
                            const travel = roundToInt(
                                Math.fround((advanceDistance * Math.fround(f)) / numFrames)
                            );
                            const primaryOffset = destinationWidth - travel;

                            const leftOffset = primaryOffset - prevAdvanceDistance;
                            const rightOffset = primaryOffset + advanceDistance;

                            let secondaryFrame = null;
                            let secondaryOffset = null;
                            if (leftOffset + prevStateEntry.frame.totalWidth > 0) {
                                secondaryFrame = prevStateEntry.frame;
                                secondaryOffset = leftOffset;
                            } else if (rightOffset < destinationWidth) {
                                secondaryFrame = nextStateEntry.frame;
                                secondaryOffset = rightOffset;
                            }

                            const matrix = stateEntry.dest.generateMatrixCanvas(
                                this.width,
                                this.height,
                                stateEntry.frame,
                                true,
                                primaryOffset,
                                secondaryFrame,
                                secondaryOffset
                            );
                            framesList.push({ matrix, ms: frameDelay });
                        }
                    } else {
                        const travelDistance = stateEntry.frame.totalWidth + destinationWidth;
                        const travelFrames = Math.max(
                            1,
                            roundToInt(Math.fround((travelDistance / pixelsPerSecond) * framerate))
                        );

                        for (let frame = 0; frame <= travelFrames; frame++) {
                            const position = roundToInt(
                                Math.fround((travelDistance * Math.fround(frame)) / travelFrames)
                            );
                            const matrix = stateEntry.dest.generateMatrixCanvas(
                                this.width,
                                this.height,
                                stateEntry.frame,
                                true,
                                destinationWidth - position
                            );
                            framesList.push({ matrix, ms: frameDelay });
                        }

                        const blankPauseFrames = roundToInt(
                            Math.fround(this.scrollPause * framerate)
                        );
                        if (blankPauseFrames > 0) {
                            const blankMatrix = stateEntry.dest.generateMatrixCanvas(
                                this.width,
                                this.height,
                                stateEntry.frame,
                                true,
                                -stateEntry.frame.totalWidth
                            );
                            for (let b = 0; b < blankPauseFrames; b++) {
                                framesList.push({ matrix: blankMatrix, ms: frameDelay });
                            }
                        }
                    }
                }
            }
        } else {
            for (let i = 0; i < stateCount; i++) {
                const nextIndex = (i + 1) % stateEntries.length;
                const prevDest = stateEntries[i].dest;
                const nextDest = stateEntries[nextIndex].dest;
                const prevFrame = stateEntries[i].frame;
                const nextFrame = stateEntries[nextIndex].frame;
                const ani = this.getInheritedAnimation(prevFrame);
                let stillFrameDelay = roundToInt(Math.fround(stateEntries[i].stateTime * 1000.0));

                if (ani.delay <= 0 && stillFrameDelay <= 0) {
                    stillFrameDelay = roundToInt(Math.fround(1000.0 / this.maxScrollFramerate));
                }
                if (stillFrameDelay > 0) {
                    framesList.push({ matrix: stateEntries[i].matrix, ms: stillFrameDelay });
                }

                if (ani.delay > 0) {
                    const framerate = this.maxScrollFramerate;
                    const keepRouteNum =
                        prevDest === nextDest && prevDest.effectiveRouteWidth > 0;
                    let prevMtx = prevDest.generateMatrixCanvas(
                        this.width,
                        this.height,
                        prevFrame,
                        true
                    );
                    let nextMtx = nextDest.generateMatrixCanvas(
                        this.width,
                        this.height,
                        nextFrame,
                        true
                    );
                    const routeNumImg = keepRouteNum
                        ? prevMtx.getSubCanvas(
                              prevDest.routeAlignment === TextAlignment.RIGHT
                                  ? this.width - prevDest.effectiveRouteWidth
                                  : 0,
                              0,
                              prevDest.effectiveRouteWidth,
                              prevMtx.height
                          )
                        : null;
                    const numFrames = roundToInt(Math.fround(framerate * ani.delay));
                    if (ani.type === "SCROLL") {
                        prevMtx = prevDest.generateMatrixCanvas(
                            this.width,
                            this.height,
                            prevFrame,
                            false
                        );
                        nextMtx = nextDest.generateMatrixCanvas(
                            this.width,
                            this.height,
                            nextFrame,
                            false
                        );
                    }

                    for (let f = 0; f < numFrames; f++) {
                        const progress = Math.fround(f / Math.fround(numFrames));
                        const ms = Math.max(
                            3,
                            roundToInt(Math.fround((1000.0 * ani.delay) / numFrames))
                        );
                        const mtx = new PixelCanvas(this.width, this.height);

                        if (ani.type === "FALLDOWN") {
                            const yOffset = Math.trunc(progress * mtx.height);
                            mtx.blitCanvas(prevMtx, 0, yOffset);
                            mtx.blitCanvas(nextMtx, 0, -mtx.height + yOffset);
                            if (routeNumImg !== null) {
                                const routeWidth = prevDest.effectiveRouteWidth;
                                const x =
                                    prevDest.routeAlignment === TextAlignment.RIGHT
                                        ? mtx.width - routeWidth
                                        : 0;
                                mtx.clearRect(x, 0, routeWidth, mtx.height);
                                mtx.blitCanvas(routeNumImg, x, 0);
                            }
                        } else if (ani.type === "FALLUP") {
                            const yOffset = Math.trunc(progress * mtx.height);
                            mtx.blitCanvas(prevMtx, 0, -yOffset);
                            mtx.blitCanvas(nextMtx, 0, mtx.height - yOffset);
                            if (routeNumImg !== null) {
                                const routeWidth = prevDest.effectiveRouteWidth;
                                const x =
                                    prevDest.routeAlignment === TextAlignment.RIGHT
                                        ? mtx.width - routeWidth
                                        : 0;
                                mtx.clearRect(x, 0, routeWidth, mtx.height);
                                mtx.blitCanvas(routeNumImg, x, 0);
                            }
                        } else if (ani.type === "SIDEWIPE") {
                            mtx.blitCanvas(prevMtx, 0, 0);
                            const xOffset = Math.trunc(progress * mtx.width);
                            if (xOffset > 0) {
                                mtx.clearRect(0, 0, xOffset, mtx.height);
                                mtx.blitCanvas(
                                    nextMtx.getSubCanvas(0, 0, xOffset, nextMtx.height),
                                    0,
                                    0
                                );
                            }
                        } else if (ani.type === "SCROLL") {
                            const xOffset = Math.trunc(progress * mtx.width);
                            mtx.blitCanvas(prevMtx, -xOffset, 0);
                            mtx.blitCanvas(nextMtx, mtx.width - xOffset, 0);
                            if (routeNumImg !== null) {
                                const routeWidth = prevDest.effectiveRouteWidth;
                                const x =
                                    prevDest.routeAlignment === TextAlignment.RIGHT
                                        ? mtx.width - routeWidth
                                        : 0;
                                mtx.clearRect(x, 0, routeWidth, mtx.height);
                                mtx.blitCanvas(routeNumImg, x, 0);
                            }
                        }

                        framesList.push({ matrix: mtx, ms });
                    }
                }
            }
        }

        return framesList;
    }

    generateAnimatedFrames() {
        const matrixFrames = this.generateAnimatedMatrixFrames();
        return matrixFrames.map(({ matrix, ms }) => ({
            image: this.generateImageForMatrix(matrix),
            ms
        }));
    }
}
