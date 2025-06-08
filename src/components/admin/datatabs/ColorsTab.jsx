"use client"
import { useState } from "react"
import { ProductService } from "@/lib/service/productService"
import { Trash2, Plus, Edit2, Save, X } from "lucide-react"

const PREDEFINED_COLORS = [
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#00FF00" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray", hex: "#808080" }
];

export default function ColorsManagement({ colors, onDataChange, loading, saving, setSaving, setError }) {
  const [newColor, setNewColor] = useState("")
  const [editingColor, setEditingColor] = useState(null)

  const handleAddColor = async () => {
    if (!newColor.trim()) {
      alert("Please enter a color name")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await ProductService.createColor({ name: newColor.trim() })
      setNewColor("")
      await onDataChange()
      alert("Color added successfully!")
    } catch (error) {
      console.error("Error adding color:", error)
      setError(`Error adding color: ${error.message}`)
      alert(`Error adding color: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditColor = (color) => {
    setEditingColor({ ...color })
  }

  const handleSaveColor = async () => {
    if (!editingColor.name.trim()) {
      alert("Color name cannot be empty")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await ProductService.updateColor(editingColor.id, { name: editingColor.name })
      setEditingColor(null)
      await onDataChange()
      alert("Color updated successfully!")
    } catch (error) {
      console.error("Error updating color:", error)
      setError(`Error updating color: ${error.message}`)
      alert(`Error updating color: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteColor = async (id, name) => {
    if (!confirm(`Are you sure you want to delete color "${name}"?`)) return

    setSaving(true)
    setError(null)
    try {
      await ProductService.deleteColor(id)
      await onDataChange()
      alert("Color deleted successfully!")
    } catch (error) {
      console.error("Error deleting color:", error)
      setError(`Error deleting color: ${error.message}`)
      alert(`Error deleting color: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Color */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">Add New Color</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {PREDEFINED_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => setNewColor(color.name)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  newColor === color.name
                    ? 'border-purple-600 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-purple-400'
                }`}
                style={{ backgroundColor: color.hex }}
              >
                <div className="text-center">
                  <div className="w-full h-8 rounded mb-2 border border-gray-200" style={{ backgroundColor: color.hex }} />
                  <span className={`text-sm font-medium ${
                    color.name === 'White' ? 'text-gray-800' : 'text-white'
                  }`}>
                    {color.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Selected color name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                readOnly
              />
            </div>
            <button
              onClick={handleAddColor}
              disabled={saving || !newColor}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              {saving ? "Adding..." : "Add Color"}
            </button>
          </div>
        </div>
      </div>

      {/* Colors List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Existing Colors ({colors.length})</h3>
        {colors.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No colors added yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {colors.map((color) => {
              const predefinedColor = PREDEFINED_COLORS.find(c => c.name.toLowerCase() === color.name.toLowerCase());
              return (
                <div key={color.id} className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                  {editingColor?.id === color.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {PREDEFINED_COLORS.map((preColor) => (
                          <button
                            key={preColor.hex}
                            onClick={() => setEditingColor({ ...editingColor, name: preColor.name })}
                            className={`p-2 rounded border-2 transition-all ${
                              editingColor.name === preColor.name
                                ? 'border-purple-600 shadow-lg'
                                : 'border-gray-200 hover:border-purple-400'
                            }`}
                            style={{ backgroundColor: preColor.hex }}
                          >
                            <span className={`text-xs font-medium ${
                              preColor.name === 'White' ? 'text-gray-800' : 'text-white'
                            }`}>
                              {preColor.name}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveColor}
                          disabled={saving}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-1 rounded transition-colors"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => setEditingColor(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white p-1 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div
                        className="w-full h-8 rounded border border-gray-200"
                        style={{ backgroundColor: predefinedColor?.hex || '#808080' }}
                      />
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 capitalize">{color.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditColor(color)}
                            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteColor(color.id, color.name)}
                            className="text-red-600 hover:text-red-800 p-1 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
