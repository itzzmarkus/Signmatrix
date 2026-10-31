import { useEffect, useRef } from "react";

function LogoCanvas({ rows, width, height, color = "#ff9000", offColor = "#262626", scale = 2 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dotSize = scale;
        const gap = 1;
        const pitch = dotSize + gap;

        canvas.width = width * pitch;
        canvas.height = height * pitch;

        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < height; y++) {
            const row = rows[y] || "";
            for (let x = 0; x < width; x++) {
                const isLit = row[x] === "1";
                ctx.fillStyle = isLit ? color : offColor;
                ctx.fillRect(x * pitch, y * pitch, dotSize, dotSize);
            }
        }
    }, [rows, width, height, color, offColor, scale]);

    return (
        <canvas
            ref={canvasRef}
            className="rounded"
            style={{ imageRendering: "pixelated" }}
        />
    );
}

export default LogoCanvas;
