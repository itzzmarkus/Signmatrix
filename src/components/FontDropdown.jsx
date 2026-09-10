const FONTS = [
  "5", "5d", "6", "6d", "7", "7d", "7dn", "8", "8d", "9", "9d",
  "10d", "10df", "10dc", "11d", "12d", "13d", "14d", "14da1", "15d",
  "16d", "16t", "18t", "20t", "22t", "22q", "24q", "24qa1", "f16",

  "l10", "l10d", "l11d", "l12d", "l13d", "l14d", "l14da1", "l15d", "l16d", "l16t",

  "5x7", "8x14",
  "balios7", "balios7w", "balios8", "balios8d", "balios10",
  "balios12", "balios14", "balios16", "balios16w"
];

function FontDropdown({ label, value, onChange }) {
    return (
        <div className="flex flex-col flex-1">
            {label && <label className="text-sm text-neutral-400 mb-1">{label}</label>}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 px-3 rounded bg-neutral-700 border border-neutral-600 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
                {FONTS.map(f => (
                    <option key={f} value={f}>{f}</option>
                ))}
            </select>
        </div>
    );
}

export default FontDropdown;