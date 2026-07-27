export const PRESETS = [
    {
        id: "titan-stacked",
        name: "Titan Stacked",
        color: "#FF9000", width: "200", height: "24", speed: "2500", offColor: "#404040", ledShape: "square", ledSize: "3", ledGap: "1",
        route: "R5", routeFont: "24q", routeAlign: "LEFT", routeSuffix: "", routeSuffixFont: "16d",
        frames: [{ id: Date.now(), line1: "HASTINGS  ST", line1Font: "12d", line1Spacing: "6", line2: "TO KOOTENAY LOOP", line2Font: "9", line2Spacing: "0", animation: "NONE", animSpeed: "0.25", line1Align: "CENTRE", line2Align: "CENTRE", verticalSpacing: "FLUSH" }],
        prFrames: []
    },
    {
        id: "titan-unstacked",
        name: "Titan Unstacked",
        color: "#FF9000", width: "200", height: "24", speed: "2500", offColor: "#404040", ledShape: "square", ledSize: "3", ledGap: "1",
        route: "11", routeFont: "24q", routeAlign: "LEFT", routeSuffix: "", routeSuffixFont: "16d",
        frames: [{ id: Date.now(), line1: "FIFA FAN FESTIVAL", line1Font: "12d", line1Spacing: "0", line2: "", line2Font: "9", line2Spacing: "0", animation: "NONE", animSpeed: "0.25", line1Align: "CENTRE", line2Align: "CENTRE", verticalSpacing: "FLUSH" }],
        prFrames: []
    },
    {
        id: "horizon-stacked",
        name: "Horizon Stacked",
        color: "#FF9000", width: "160", height: "16", speed: "2500", offColor: "#404040", ledShape: "square", ledSize: "3", ledGap: "1",
        route: "119", routeFont: "16d", routeAlign: "LEFT", routeSuffix: "", routeSuffixFont: "16d",
        frames: [{ id: Date.now() + 4, line1: "KINGSWAY", line1Font: "8d", line1Spacing: "7", line2: "TO EDMONDS STN", line2Font: "7", line2Spacing: "0", animation: "NONE", animSpeed: "0.25", line1Align: "CENTRE", line2Align: "CENTRE", verticalSpacing: "FLUSH" }],
        prFrames: []
    },
    {
        id: "horizon-unstacked",
        name: "Horizon Unstacked",
        color: "#FF9000", width: "160", height: "16", speed: "2500", offColor: "#404040", ledShape: "square", ledSize: "3", ledGap: "1",
        route: "130", routeFont: "16d", routeAlign: "LEFT", routeSuffix: "", routeSuffixFont: "16d",
        frames: [{ id: Date.now() + 4, line1: "METROTOWN STN", line1Font: "12d", line1Spacing: "0", line2: "", line2Font: "7", line2Spacing: "0", animation: "NONE", animSpeed: "0.25", line1Align: "CENTRE", line2Align: "CENTRE", verticalSpacing: "FLUSH" }],
        prFrames: []
    },
    {
        id: "axion-stacked",
        name: "Axion Stacked",
        color: "#FF9000", width: "160", height: "16", speed: "2500", offColor: "#404040", ledShape: "square", ledSize: "3", ledGap: "1",
        route: "130", routeFont: "balios16", routeAlign: "LEFT", routeSuffix: "", routeSuffixFont: "16d",
        frames: [{ id: Date.now() + 4, line1: "WILLINGDON", line1Font: "balios8d", line1Spacing: "5", line2: "TO METROTOWN STN", line2Font: "balios7", line2Spacing: "0", animation: "NONE", animSpeed: "0.25", line1Align: "CENTRE", line2Align: "CENTRE", verticalSpacing: "FLUSH" }],
        prFrames: []
    },
    {
        id: "axion-unstacked",
        name: "Axion Unstacked",
        color: "#FF9000", width: "160", height: "16", speed: "2500", offColor: "#404040", ledShape: "square", ledSize: "3", ledGap: "1",
        route: "130", routeFont: "balios16", routeAlign: "LEFT", routeSuffix: "", routeSuffixFont: "16d",
        frames: [{ id: Date.now() + 4, line1: "METROTOWN STN", line1Font: "balios12", line1Spacing: "0", line2: "", line2Font: "7", line2Spacing: "0", animation: "NONE", animSpeed: "0.25", line1Align: "CENTRE", line2Align: "CENTRE", verticalSpacing: "FLUSH" }],
        prFrames: []
    },
    {
        id: "side1",
        name: "Side Sign (96x8)",
        color: "#FF9000", width: "96", height: "8", speed: "2500", offColor: "#404040", ledShape: "round", ledSize: "6", ledGap: "1",
        route: "503", routeFont: "8", routeAlign: "LEFT", routeSuffix: "", routeSuffixFont: "16d",
        frames: [{ id: Date.now() + 4, line1: "LANGLEY CTR", line1Font: "7", line1Spacing: "0", line2: "", line2Font: "7", line2Spacing: "0", animation: "NONE", animSpeed: "0.25", line1Align: "CENTRE", line2Align: "CENTRE", verticalSpacing: "FLUSH" }],
        prFrames: []
    },
    {
        id: "side2",
        name: "Side Sign (14x112)",
        color: "#FF9000", width: "112", height: "14", speed: "2500", offColor: "#404040", ledShape: "round", ledSize: "6", ledGap: "1",
        route: "19", routeFont: "14d", routeAlign: "LEFT", routeSuffix: "", routeSuffixFont: "16d",
        frames: [{ id: Date.now() + 4, line1: "STANLEY PARK", line1Font: "8d", line1Spacing: "0", line2: "", line2Font: "7", line2Spacing: "0", animation: "NONE", animSpeed: "0.25", line1Align: "CENTRE", line2Align: "CENTRE", verticalSpacing: "FLUSH" }],
        prFrames: []
    }
];