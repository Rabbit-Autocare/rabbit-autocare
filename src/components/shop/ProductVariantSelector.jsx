"use client"

export default function ProductVariantSelector({ variantType, options, selectedValue, onChange }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">{variantType}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`px-3 py-1.5 border rounded-md cursor-pointer text-sm transition-colors ${
              selectedValue === option.value
                ? "bg-black text-white border-black"
                : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <input
              type="radio"
              name={variantType}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}
