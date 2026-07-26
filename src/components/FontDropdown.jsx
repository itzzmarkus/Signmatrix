const FONTS = [
    "5", "5d", "6", "6d", "7", "7d", "8", "8d", "9", "9d",
    "10d", "11d", "12d", "13d", "14d", "15d", "16d", "16t",
    "22t", "24q", "f16", "5x7", "8x14"
];

function FontDropdown({ label, value, onChange }) {
    return (
        <div className="flex flex-col flex-1 mb-4">
            <label className="text-sm text-neutral-400 mb-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
                {FONTS.map(f => (
                    <option key={f} value={f}>{f}</option>
                ))}
            </select>
        </div>
    );
}

export default FontDropdown;