"use client"
import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { SizeService } from "@/lib/service/microdataService"

export default function SizesManagement({ sizes = [], loading, saving, setSaving, setError, onDataChange }) {
  const [newSize, setNewSize] = useState("")
  const [editingSize, setEditingSize] = useState(null)

  const handleAddSize = async () => {
    if (!newSize.trim()) return

    setSaving(true)
    setError(null)
    try {
      await SizeService.createSize({ size_cm: newSize.trim() })
      setNewSize("")
      await onDataChange()
    } catch (error) {
      console.error("Error adding size:", error)
      setError(`Error adding size: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSize = async (id, newValue) => {
    if (!newValue.trim()) return

    setSaving(true)
    setError(null)
    try {
      await SizeService.updateSize(id, { size_cm: newValue.trim() })
      setEditingSize(null)
      await onDataChange()
    } catch (error) {
      console.error("Error updating size:", error)
      setError(`Error updating size: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSize = async (id, size) => {
    if (!confirm(`Are you sure you want to delete size "${size}"?`)) return

    setSaving(true)
    setError(null)
    try {
      await SizeService.deleteSize(id)
      await onDataChange()
    } catch (error) {
      console.error("Error deleting size:", error)
      setError(`Error deleting size: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Size */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Add New Size</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <input
              type="text"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder="Size (e.g., 40x60, 30x30)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddSize()}
            />
            <p className="text-sm text-gray-600 mt-1">Enter size in centimeters (e.g., 40x60)</p>
          </div>
          <button
            onClick={handleAddSize}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            {saving ? "Adding..." : "Add Size"}
          </button>
        </div>
      </div>

      {/* Size List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Size List</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {sizes.map((size) => (
            <div key={size.id} className="p-4 flex items-center justify-between">
              {editingSize?.id === size.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editingSize.size_cm}
                    onChange={(e) => setEditingSize({ ...editingSize, size_cm: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && handleUpdateSize(size.id, editingSize.size_cm)}
                  />
                  <button
                    onClick={() => handleUpdateSize(size.id, editingSize.size_cm)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSize(null)}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-gray-900">{size.size_cm}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingSize(size)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSize(size.id, size.size_cm)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
