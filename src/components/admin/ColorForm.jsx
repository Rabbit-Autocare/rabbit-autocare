import { useState } from 'react';
import { ProductService } from '@/lib/service/productService';
import { Plus, Trash2, X } from 'lucide-react';

export default function ColorForm({ onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    color: '',
    hex_code: '#000000'
  });

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    // Validation
    if (!form.color.trim()) {
      alert("Color name is required");
      return;
    }

    // Validate hex code
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(form.hex_code)) {
      alert("Please enter a valid hex color code");
      return;
    }

    setSaving(true);
    try {
      await ProductService.createColor(form);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving color:", error);
      alert("Error saving color: " + (error.message || "Unknown error occurred"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add New Color</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Name *
          </label>
          <input
            type="text"
            name="color"
            value={form.color}
            onChange={handleInput}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter color name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hex Color Code *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="hex_code"
              value={form.hex_code}
              onChange={handleInput}
              className="h-10 w-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              name="hex_code"
              value={form.hex_code}
              onChange={handleInput}
              required
              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="#000000"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Click the color picker or enter a hex code (e.g., #FF0000)
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {saving ? "Saving..." : "Add Color"}
          </button>
        </div>
      </form>
    </div>
  );
}
