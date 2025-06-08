"use client"
import { useState } from "react"
import { ProductService } from "@/lib/service/productService"
import { Trash2, Plus, Edit2, Save, X } from "lucide-react"

export default function SizesManagement({ sizes, onDataChange, loading, saving, setSaving, setError }) {
  const [newSize, setNewSize] = useState("")
  const [editingSize, setEditingSize] = useState(null)

  const handleAddSize = async () => {
    if (!newSize.trim()) {
      alert("Please enter a size")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await ProductService.createSize({ size_cm: newSize.trim() })
      setNewSize("")
      await onDataChange()
      alert("Size added successfully!")
    } catch (error) {
      console.error("Error adding size:", error)
      setError(`Error adding size: ${error.message}`)
      alert(`Error adding size: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditSize = (size) => {
    setEditingSize({ ...size })
  }

  const handleSaveSize = async () => {
    if (!editingSize.size_cm.trim()) {
      alert("Size cannot be empty")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await ProductService.updateSize(editingSize.id, { size_cm: editingSize.size_cm })
      setEditingSize(null)
      await onDataChange()
      alert("Size updated successfully!")
    } catch (error) {
      console.error("Error updating size:", error)
      setError(`Error updating size: ${error.message}`)
      alert(`Error updating size: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSize = async (id, size) => {
    if (!confirm(`Are you sure you want to delete size "${size}"?`)) return

    setSaving(true)
    setError(null)
    try {
      await ProductService.deleteSize(id)
      await onDataChange()
      alert("Size deleted successfully!")
    } catch (error) {
      console.error("Error deleting size:", error)
      setError(`Error deleting size: ${error.message}`)
      alert(`Error deleting size: ${error.message}`)
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
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder="Size (e.g., 40x60, 30x30, 50x80)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddSize()}
            />
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

      {/* Sizes List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Existing Sizes ({sizes.length})</h3>
        {sizes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No sizes added yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sizes.map((size) => (
              <div key={size.id} className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                {editingSize?.id === size.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      value={editingSize.size_cm}
                      onChange={(e) => setEditingSize({ ...editingSize, size_cm: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSaveSize}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-1 rounded transition-colors"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={() => setEditingSize(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white p-1 rounded transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{size.size_cm} cm</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditSize(size)}
                        className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSize(size.id, size.size_cm)}
                        className="text-red-600 hover:text-red-800 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
