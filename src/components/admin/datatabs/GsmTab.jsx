"use client"
import { useState } from "react"
import { Trash2, Plus, Edit2, Save, X } from "lucide-react"

export default function GsmTab({ gsms, onDataChange, saving, setSaving, setError }) {
  const [newGsm, setNewGsm] = useState("")
  const [editingGsm, setEditingGsm] = useState(null)

  const handleAddGsm = async () => {
    if (!newGsm.trim()) {
      alert("Please enter a GSM value")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const { ProductService } = await import("@/lib/service/productService")
      await ProductService.createGsm({ gsm: parseInt(newGsm.trim()) })
      setNewGsm("")
      await onDataChange()
      alert("GSM added successfully!")
    } catch (error) {
      console.error("Error adding GSM:", error)
      setError(`Error adding GSM: ${error.message}`)
      alert(`Error adding GSM: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditGsm = (gsm) => {
    setEditingGsm({ ...gsm })
  }

  const handleSaveGsm = async () => {
    if (!editingGsm.gsm || editingGsm.gsm <= 0) {
      alert("GSM value must be a positive number")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const { ProductService } = await import("@/lib/service/productService")
      await ProductService.updateGsm(editingGsm.id, { gsm: parseInt(editingGsm.gsm) })
      setEditingGsm(null)
      await onDataChange()
      alert("GSM updated successfully!")
    } catch (error) {
      console.error("Error updating GSM:", error)
      setError(`Error updating GSM: ${error.message}`)
      alert(`Error updating GSM: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGsm = async (id, gsm) => {
    if (!confirm(`Are you sure you want to delete GSM "${gsm}"?`)) return

    setSaving(true)
    setError(null)
    try {
      const { ProductService } = await import("@/lib/service/productService")
      await ProductService.deleteGsm(id)
      await onDataChange()
      alert("GSM deleted successfully!")
    } catch (error) {
      console.error("Error deleting GSM:", error)
      setError(`Error deleting GSM: ${error.message}`)
      alert(`Error deleting GSM: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New GSM */}
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h3 className="text-lg font-semibold text-orange-800 mb-3">Add New GSM</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <input
              type="number"
              value={newGsm}
              onChange={(e) => setNewGsm(e.target.value)}
              placeholder="GSM value (e.g., 300, 400, 500)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddGsm()}
              min="1"
            />
            <p className="text-sm text-gray-600 mt-1">GSM (Grams per Square Meter) - fabric weight measurement</p>
          </div>
          <button
            onClick={handleAddGsm}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            {saving ? "Adding..." : "Add GSM"}
          </button>
        </div>
      </div>

      {/* GSM List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Existing GSM Values ({gsms.length})</h3>
        {gsms.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No GSM values added yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {gsms
              .sort((a, b) => a.gsm - b.gsm)
              .map((gsm) => (
                <div key={gsm.id} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                  {editingGsm?.id === gsm.id ? (
                    <div className="space-y-3">
                      <input
                        type="number"
                        value={editingGsm.gsm}
                        onChange={(e) => setEditingGsm({ ...editingGsm, gsm: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                        min="1"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveGsm}
                          disabled={saving}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-2 rounded transition-colors flex items-center justify-center"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => setEditingGsm(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{gsm.gsm}</div>
                        <div className="text-sm text-gray-600">GSM</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditGsm(gsm)}
                          className="flex-1 text-blue-600 hover:text-blue-800 p-2 transition-colors border border-blue-200 rounded hover:bg-blue-50"
                        >
                          <Edit2 size={14} className="mx-auto" />
                        </button>
                        <button
                          onClick={() => handleDeleteGsm(gsm.id, gsm.gsm)}
                          className="text-red-600 hover:text-red-800 p-2 transition-colors border border-red-200 rounded hover:bg-red-50"
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
