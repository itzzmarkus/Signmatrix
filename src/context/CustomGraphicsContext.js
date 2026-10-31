import { createContext, useContext } from "react";

export const CustomGraphicsContext = createContext({
    graphics: [],
    savedGraphics: [],
    sessionGraphics: [],
    graphicsById: {},
    saveGraphic: () => null,
    deleteGraphic: () => {},
    duplicateGraphic: () => null,
    mergeGraphics: () => {},
    openStudio: () => {}
});

export function useCustomGraphicsContext() {
    return useContext(CustomGraphicsContext);
}

export default CustomGraphicsContext;

