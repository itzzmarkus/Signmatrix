function Icon({
    name,
    size = 16,
    fill = false,
    weight = 400,
    grade = 0,
    className = "",
    title
}) {
    const opsz = Math.min(48, Math.max(20, size));
    return (
        <span
            aria-hidden="true"
            title={title}
            className={`material-symbols-outlined ${className}`}
            style={{
                fontSize: `${size}px`,
                width: `${size}px`,
                height: `${size}px`,
                fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opsz}`
            }}
        >
            {name}
        </span>
    );
}

export default Icon;
