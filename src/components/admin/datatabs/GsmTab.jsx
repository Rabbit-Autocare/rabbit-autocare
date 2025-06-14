"use client"
import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { GsmService } from "@/lib/service/microdataService"

export default function GSMManagement({ gsms = [], loading, saving, setSaving, setError, onDataChange }) {
  const [newGsm, setNewGsm] = useState("")
  const [editingGsm, setEditingGsm] = useState(null)

  const handleAddGsm = async () => {
    if (!newGsm.trim()) return

    setSaving(true)
    setError(null)
    try {
      await GsmService.createGsm({ gsm: newGsm.trim() })
      setNewGsm("")
      await onDataChange()
    } catch (error) {
      console.error("Error adding GSM:", error)
      setError(`Error adding GSM: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateGsm = async (id, newValue) => {
    if (!newValue.trim()) return

    setSaving(true)
    setError(null)
    try {
      await GsmService.updateGsm(id, { gsm: newValue.trim() })
      setEditingGsm(null)
      await onDataChange()
    } catch (error) {
      console.error("Error updating GSM:", error)
      setError(`Error updating GSM: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGsm = async (id, gsm) => {
    if (!confirm(`Are you sure you want to delete GSM "${gsm}"?`)) return

    setSaving(true)
    setError(null)
    try {
      await GsmService.deleteGsm(id)
      await onDataChange()
    } catch (error) {
      console.error("Error deleting GSM:", error)
      setError(`Error deleting GSM: ${error.message}`)
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
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">GSM List</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {gsms.map((gsm) => (
            <div key={gsm.id} className="p-4 flex items-center justify-between">
              {editingGsm?.id === gsm.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="number"
                    value={editingGsm.gsm}
                    onChange={(e) => setEditingGsm({ ...editingGsm, gsm: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && handleUpdateGsm(gsm.id, editingGsm.gsm)}
                    min="1"
                  />
                  <button
                    onClick={() => handleUpdateGsm(gsm.id, editingGsm.gsm)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingGsm(null)}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-gray-900">{gsm.gsm} GSM</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingGsm(gsm)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGsm(gsm.id, gsm.gsm)}
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
