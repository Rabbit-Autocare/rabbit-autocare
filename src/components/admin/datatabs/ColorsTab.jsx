"use client"
import { useState } from "react"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { ColorService } from "@/lib/service/microdataService"

export default function ColorsManagement({ colors = [], loading, saving, setSaving, setError, onDataChange }) {
  const [newColor, setNewColor] = useState({
    color: "",
    hex_code: "#000000"
  })
  const [editingColor, setEditingColor] = useState(null)

  const handleAddColor = async () => {
    if (!newColor.color.trim() || !newColor.hex_code.trim()) return

    setSaving(true)
    setError(null)
    try {
      await ColorService.createColor({
        color: newColor.color.trim(),
        hex_code: newColor.hex_code.trim()
      })
      setNewColor({ color: "", hex_code: "#000000" })
      await onDataChange()
    } catch (error) {
      console.error("Error adding color:", error)
      setError(`Error adding color: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateColor = async (id, data) => {
    if (!data.color.trim() || !data.hex_code.trim()) return

    setSaving(true)
    setError(null)
    try {
      await ColorService.updateColor(id, {
        color: data.color.trim(),
        hex_code: data.hex_code.trim()
      })
      setEditingColor(null)
      await onDataChange()
    } catch (error) {
      console.error("Error updating color:", error)
      setError(`Error updating color: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteColor = async (id, colorName) => {
    if (!confirm(`Are you sure you want to delete color "${colorName}"?`)) return

    setSaving(true)
    setError(null)
    try {
      await ColorService.deleteColor(id)
      await onDataChange()
    } catch (error) {
      console.error("Error deleting color:", error)
      setError(`Error deleting color: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Color */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">Add New Color</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Name</label>
            <input
              type="text"
              value={newColor.color}
              onChange={(e) => setNewColor({ ...newColor, color: e.target.value })}
              placeholder="e.g., Red, Blue, Green"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddColor()}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newColor.hex_code}
              onChange={(e) => setNewColor({ ...newColor, hex_code: e.target.value })}
              className="h-11 w-11 p-1 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={newColor.hex_code}
              onChange={(e) => setNewColor({ ...newColor, hex_code: e.target.value })}
              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              placeholder="#000000"
              className="w-28 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddColor}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            {saving ? "Adding..." : "Add Color"}
          </button>
        </div>
      </div>

      {/* Color List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Color List</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
          {colors.length === 0 ? (
            <div className="col-span-full text-center py-4 text-gray-500">No colors added yet.</div>
          ) : (
            colors.map((color) => (
              <div key={color.id} className="bg-gray-50 p-3 border border-gray-200 rounded-lg">
                {editingColor?.id === color.id ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Color Name</label>
                      <input
                        type="text"
                        value={editingColor.color}
                        onChange={(e) => setEditingColor({ ...editingColor, color: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingColor.hex_code}
                        onChange={(e) => setEditingColor({ ...editingColor, hex_code: e.target.value })}
                        className="h-8 w-8 p-0.5 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingColor.hex_code}
                        onChange={(e) => setEditingColor({ ...editingColor, hex_code: e.target.value })}
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setEditingColor(null)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={() => handleUpdateColor(color.id, editingColor)}
                        className="text-purple-600 hover:text-purple-700 p-1"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full border border-gray-300 mb-2 shadow-sm"
                      style={{ backgroundColor: color.hex_code }}
                    />
                    <span className="text-sm font-medium text-gray-800 text-center mb-2">
                      {color.color}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingColor({ ...color })}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteColor(color.id, color.color)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
