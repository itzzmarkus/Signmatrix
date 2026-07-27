function InputGroup({label, type = "text", value, onChange, min, max, step}) {
    return (
        <div className="flex flex-col flex-1">
            {label && <label className="text-sm text-neutral-400 mb-1">{label}</label>}
            <input
                type={type}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 px-3 rounded bg-neutral-700 border border-neutral-600 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
        </div>
    );
}

export default InputGroup;