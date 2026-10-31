function InputGroup({label, title, type = "text", value, onChange, min, max, step, className = "", labelClassName = ""}) {
    return (
        <div className={`flex flex-col flex-1 min-w-0 ${className}`}>
            {label && <label className={`text-sm text-neutral-400 mb-1 whitespace-nowrap truncate ${labelClassName}`} title={title || label}>{label}</label>}
            <input
                type={type}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 px-3 rounded bg-neutral-800 border border-neutral-600 hover:border-neutral-500 text-white text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
        </div>
    );
}

export default InputGroup;