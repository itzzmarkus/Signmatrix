import { useState, useCallback } from "react";
import { collectReferencedGraphicIds } from "../utils/graphicCodec.js";

const STORAGE_KEY = "signmatrix_user_presets";

export function useUserPresets() {
    const [userPresets, setUserPresets] = useState(() => {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Failed to parse user presets from localStorage:", e);
            return [];
        }
    });

    const persistPresets = (presets) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
            setUserPresets(presets);
        } catch (e) {
            console.error("Failed to save user presets to localStorage:", e);
            alert("Could not save preset to browser storage (storage may be full or blocked).");
        }
    };

    const savePreset = useCallback((name, state, graphicsById = {}) => {
        const trimmedName = name.trim();
        if (!trimmedName) return false;

        const usedGraphicIds = collectReferencedGraphicIds(state);
        const embeddedGraphics = usedGraphicIds
            .map((id) => graphicsById[id])
            .filter(Boolean)
            .map(({ id, name: gName, width, height, rows }) => ({
                id,
                name: gName,
                width,
                height,
                rows
            }));

        const newPreset = {
            id: `user-${Date.now()}`,
            name: trimmedName,
            createdAt: Date.now(),
            width: String(state.width || "200"),
            height: String(state.height || "24"),
            speed: String(state.speed || "1800"),
            color: state.color || "#FF9000",
            offColor: state.offColor || "#404040",
            ledShape: state.ledShape || "round",
            ledSize: String(state.ledSize || "12"),
            ledGap: String(state.ledGap || "3"),
            ledGapY: String(state.ledGapY ?? state.ledGap ?? "3"),
            ledGlow: state.ledGlow || "none",
            displayType: state.displayType || "led",
            signDisease: state.signDisease || "none",
            diseaseSeed: String(state.diseaseSeed !== undefined ? state.diseaseSeed : "1337"),
            diseaseMissingRows: String(state.diseaseMissingRows || "0"),
            diseaseMissingRowHeight: String(state.diseaseMissingRowHeight || "1"),
            diseaseDeadPixelRate: String(state.diseaseDeadPixelRate || "0.02"),
            diseaseGhostRails: String(state.diseaseGhostRails || "0"),
            diseaseGhostRailHeight: String(state.diseaseGhostRailHeight || "1"),
            diseaseModuleDropout: Boolean(state.diseaseModuleDropout),
            autoScroll: state.autoScroll !== undefined ? state.autoScroll : true,
            scrollSpeed: String(state.scrollSpeed || "30"),
            scrollPause: String(state.scrollPause !== undefined ? state.scrollPause : "1.0"),
            route: state.route || "",
            routeFont: state.routeFont || "24qa1",
            routeColor: state.routeColor || "",
            routeAlign: state.routeAlign || "LEFT",
            routeInvert: state.routeInvert || false,
            routeBoxPadding: String(state.routeBoxPadding || "3"),
            routeBoxGap: String(state.routeBoxGap || "2"),
            routeBoxColor: state.routeBoxColor || "",
            routeXOffset: String(state.routeXOffset || "0"),
            routeYOffset: String(state.routeYOffset || "0"),
            frames: (state.frames || []).map(({ id, ...f }) => ({
                line1: f.line1 !== undefined ? f.line1 : "",
                line1Font: f.line1Font || "16d",
                line1Color: f.line1Color || "",
                line1Spacing: f.line1Spacing || "0",
                line1Align: f.line1Align || "CENTRE",
                line1XOffset: f.line1XOffset || "0",
                line1YOffset: f.line1YOffset || "0",
                line2: f.line2 !== undefined ? f.line2 : "",
                line2Font: f.line2Font || "7",
                line2Color: f.line2Color || "",
                line2Spacing: f.line2Spacing || "0",
                line2Align: f.line2Align || "CENTRE",
                line2XOffset: f.line2XOffset || "0",
                line2YOffset: f.line2YOffset || "0",
                animation: f.animation || "NONE",
                animSpeed: f.animSpeed || "0.25",
                verticalSpacing: f.verticalSpacing || "FLUSH",
                delay: f.delay || "",
                icons: Array.isArray(f.icons) ? f.icons.map(({ id: _iconId, ...ic }) => ic) : []
            })),
            prFrames: (state.prFrames || []).map(({ id, ...f }) => ({
                line1: f.line1 !== undefined ? f.line1 : "",
                line1Font: f.line1Font || "16d",
                line1Color: f.line1Color || "",
                line1Spacing: f.line1Spacing || "0",
                line1Align: f.line1Align || "CENTRE",
                line1XOffset: f.line1XOffset || "0",
                line1YOffset: f.line1YOffset || "0",
                line2: f.line2 !== undefined ? f.line2 : "",
                line2Font: f.line2Font || "7",
                line2Color: f.line2Color || "",
                line2Spacing: f.line2Spacing || "0",
                line2Align: f.line2Align || "CENTRE",
                line2XOffset: f.line2XOffset || "0",
                line2YOffset: f.line2YOffset || "0",
                animation: f.animation || "NONE",
                animSpeed: f.animSpeed || "0.25",
                verticalSpacing: f.verticalSpacing || "FLUSH",
                delay: f.delay || "",
                icons: Array.isArray(f.icons) ? f.icons.map(({ id: _iconId, ...ic }) => ic) : []
            })),
            ...(embeddedGraphics.length > 0 ? { graphics: embeddedGraphics } : {})
        };

        const updated = [newPreset, ...userPresets.filter(p => p.id !== newPreset.id)];
        persistPresets(updated);
        return newPreset;
    }, [userPresets]);

    const deletePreset = useCallback((presetId) => {
        const updated = userPresets.filter(p => p.id !== presetId);
        persistPresets(updated);
    }, [userPresets]);

    const exportPresets = useCallback(() => {
        if (userPresets.length === 0) {
            alert("No saved presets to export.");
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userPresets, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `signmatrix-presets-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }, [userPresets]);

    const importPresets = useCallback((jsonString) => {
        try {
            const imported = JSON.parse(jsonString);
            if (!Array.isArray(imported)) {
                throw new Error("Invalid format: expected a JSON array of presets.");
            }

            const valid = imported.filter(item => item && typeof item === "object" && item.name && Array.isArray(item.frames));
            if (valid.length === 0) {
                throw new Error("No valid presets found in JSON file.");
            }

            const sanitized = valid.map((item, idx) => ({
                ...item,
                id: item.id && item.id.startsWith("user-") ? item.id : `user-${Date.now()}-${idx}`,
                createdAt: item.createdAt || Date.now()
            }));

            const existingIds = new Set(userPresets.map(p => p.id));
            const newToAdd = sanitized.filter(p => !existingIds.has(p.id));
            const merged = [...newToAdd, ...userPresets];

            persistPresets(merged);
            return { success: true, count: newToAdd.length };
        } catch (e) {
            console.error("Import presets failed:", e);
            return { success: false, error: e.message };
        }
    }, [userPresets]);

    return {
        userPresets,
        savePreset,
        deletePreset,
        exportPresets,
        importPresets
    };
}

export default useUserPresets;
