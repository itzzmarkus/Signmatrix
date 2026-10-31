import { useState, useCallback, useMemo } from "react";
import {
    MAX_GRAPHIC_H,
    MAX_GRAPHIC_W,
    newGraphicId,
    normalizeRows,
    rowsToBase64
} from "../utils/graphicCodec.js";

const STORAGE_KEY = "signmatrix_custom_graphics";

function sanitizeGraphicRecord(item) {
    if (!item || typeof item !== "object") return null;
    const id = String(item.id || "").replace(/^@/, "").toLowerCase();
    if (!id || !/^[a-z0-9]{1,12}$/i.test(id)) return null;
    const width = parseInt(item.width, 10);
    const height = parseInt(item.height, 10);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    if (width < 1 || width > MAX_GRAPHIC_W || height < 1 || height > MAX_GRAPHIC_H) return null;
    if (!Array.isArray(item.rows) || item.rows.length === 0) return null;

    const rows = normalizeRows(item.rows, width, height);
    const data = rowsToBase64(rows, width, height);

    return {
        id,
        name: String(item.name || `Icon ${id.slice(0, 4).toUpperCase()}`).trim().slice(0, 40),
        width,
        height,
        rows,
        data,
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now()
    };
}

export function useCustomGraphics(initialSessionGraphics = []) {
    const [savedGraphics, setSavedGraphics] = useState(() => {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.map(sanitizeGraphicRecord).filter(Boolean);
        } catch (e) {
            console.error("Failed to load custom graphics from localStorage:", e);
            return [];
        }
    });

    const [sessionGraphics, setSessionGraphics] = useState(() => {
        const list = typeof initialSessionGraphics === "function"
            ? initialSessionGraphics()
            : initialSessionGraphics;
        if (!Array.isArray(list)) return [];
        return list.map(sanitizeGraphicRecord).filter(Boolean);
    });

    const persistGraphics = useCallback((nextList) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
            setSavedGraphics(nextList);
        } catch (e) {
            console.error("Failed to persist custom graphics to localStorage:", e);
            alert("Could not save custom icon to browser storage (storage may be full).");
        }
    }, []);

    const saveGraphic = useCallback((graphicInput) => {
        const id = graphicInput.id
            ? String(graphicInput.id).replace(/^@/, "").toLowerCase()
            : newGraphicId();
        const width = Math.max(1, Math.min(MAX_GRAPHIC_W, parseInt(graphicInput.width, 10) || 16));
        const height = Math.max(1, Math.min(MAX_GRAPHIC_H, parseInt(graphicInput.height, 10) || 16));
        const rows = normalizeRows(graphicInput.rows || [], width, height);
        const data = rowsToBase64(rows, width, height);
        const now = Date.now();

        const record = {
            id,
            name: String(graphicInput.name || "Untitled Icon").trim().slice(0, 40) || "Untitled Icon",
            width,
            height,
            rows,
            data,
            createdAt: graphicInput.createdAt || now,
            updatedAt: now
        };

        const existingIdx = savedGraphics.findIndex((g) => g.id === id);
        let updated;
        if (existingIdx >= 0) {
            updated = [...savedGraphics];
            updated[existingIdx] = { ...savedGraphics[existingIdx], ...record, updatedAt: now };
        } else {
            updated = [record, ...savedGraphics];
        }
        persistGraphics(updated);
        setSessionGraphics((prev) => prev.filter((g) => g.id !== id));
        return record;
    }, [savedGraphics, persistGraphics]);

    const deleteGraphic = useCallback((id) => {
        const cleanId = String(id).replace(/^@/, "").toLowerCase();
        const updated = savedGraphics.filter((g) => g.id !== cleanId);
        persistGraphics(updated);
        setSessionGraphics((prev) => prev.filter((g) => g.id !== cleanId));
    }, [savedGraphics, persistGraphics]);

    const duplicateGraphic = useCallback((id) => {
        const cleanId = String(id).replace(/^@/, "").toLowerCase();
        const source = savedGraphics.find((g) => g.id === cleanId) || sessionGraphics.find((g) => g.id === cleanId);
        if (!source) return null;
        return saveGraphic({
            name: `${source.name} (Copy)`,
            width: source.width,
            height: source.height,
            rows: [...source.rows]
        });
    }, [savedGraphics, sessionGraphics, saveGraphic]);

    const mergeGraphics = useCallback((incomingList, persistToLibrary = false) => {
        if (!Array.isArray(incomingList) || incomingList.length === 0) return;
        const sanitized = incomingList.map(sanitizeGraphicRecord).filter(Boolean);
        if (sanitized.length === 0) return;

        if (persistToLibrary) {
            const byId = new Map(savedGraphics.map((g) => [g.id, g]));
            for (const g of sanitized) {
                if (!byId.has(g.id)) {
                    byId.set(g.id, g);
                }
            }
            persistGraphics(Array.from(byId.values()));
        } else {
            const savedIds = new Set(savedGraphics.map((g) => g.id));
            setSessionGraphics((prev) => {
                const map = new Map(prev.map((g) => [g.id, g]));
                for (const g of sanitized) {
                    if (!savedIds.has(g.id)) {
                        map.set(g.id, g);
                    }
                }
                return Array.from(map.values());
            });
        }
    }, [savedGraphics, persistGraphics]);

    const graphicsById = useMemo(() => {
        const map = {};
        for (const g of sessionGraphics) {
            map[g.id] = { ...g, isSessionOnly: true };
        }
        for (const g of savedGraphics) {
            map[g.id] = { ...g, isSessionOnly: false };
        }
        return map;
    }, [savedGraphics, sessionGraphics]);

    const allGraphics = useMemo(() => {
        const savedIds = new Set(savedGraphics.map((g) => g.id));
        const unsavedSession = sessionGraphics
            .filter((g) => !savedIds.has(g.id))
            .map((g) => ({ ...g, isSessionOnly: true }));
        return [
            ...savedGraphics.map((g) => ({ ...g, isSessionOnly: false })),
            ...unsavedSession
        ];
    }, [savedGraphics, sessionGraphics]);

    return {
        graphics: allGraphics,
        savedGraphics,
        sessionGraphics,
        graphicsById,
        saveGraphic,
        deleteGraphic,
        duplicateGraphic,
        mergeGraphics
    };
}

export default useCustomGraphics;
