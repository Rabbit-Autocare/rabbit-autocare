"use client"
import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { QuantityService } from "@/lib/service/microdataService"

const UNIT_OPTIONS = [
  { value: "ml", label: "Milliliters (ml)" },
  { value: "l", label: "Liters (l)" },
  { value: "g", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "pcs", label: "Pieces (pcs)" },
]

export default function QuantityManagement({ quantities = [], loading, saving, setSaving, setError, onDataChange }) {
  const [newQuantity, setNewQuantity] = useState({ quantity: "", unit: "ml" })
  const [editingQuantity, setEditingQuantity] = useState(null)

  const handleAddQuantity = async () => {
    if (!newQuantity.quantity.trim()) return

    setSaving(true)
    setError(null)
    try {
      await QuantityService.createQuantity({
        quantity: newQuantity.quantity.trim(),
        unit: newQuantity.unit
      })
      setNewQuantity({ quantity: "", unit: "ml" })
      await onDataChange()
    } catch (error) {
      console.error("Error adding quantity:", error)
      setError(`Error adding quantity: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateQuantity = async (id, newValue, unit) => {
    if (!newValue.trim()) return

    setSaving(true)
    setError(null)
    try {
      await QuantityService.updateQuantity(id, {
        quantity: newValue.trim(),
        unit: unit
      })
      setEditingQuantity(null)
      await onDataChange()
    } catch (error) {
      console.error("Error updating quantity:", error)
      setError(`Error updating quantity: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuantity = async (id, quantity, unit) => {
    if (!confirm(`Are you sure you want to delete quantity "${quantity} ${unit}"?`)) return

    setSaving(true)
    setError(null)
    try {
      await QuantityService.deleteQuantity(id)
      await onDataChange()
    } catch (error) {
      console.error("Error deleting quantity:", error)
      setError(`Error deleting quantity: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Quantity */}
      <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
        <h3 className="text-lg font-semibold text-teal-800 mb-3">Add New Quantity</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              step="0.01"
              value={newQuantity.quantity}
              onChange={(e) => setNewQuantity({ ...newQuantity, quantity: e.target.value })}
              placeholder="e.g., 500, 1.5, 250"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddQuantity()}
              min="0.01"
            />
          </div>
          <div className="min-w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={newQuantity.unit}
              onChange={(e) => setNewQuantity({ ...newQuantity, unit: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddQuantity}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            {saving ? "Adding..." : "Add Quantity"}
          </button>
        </div>
      </div>

      {/* Quantity List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quantity List</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {quantities.map((quantity) => (
            <div key={quantity.id} className="p-4 flex items-center justify-between">
              {editingQuantity?.id === quantity.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={editingQuantity.quantity}
                    onChange={(e) => setEditingQuantity({ ...editingQuantity, quantity: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && handleUpdateQuantity(quantity.id, editingQuantity.quantity, editingQuantity.unit)}
                    min="0.01"
                  />
                  <select
                    value={editingQuantity.unit}
                    onChange={(e) => setEditingQuantity({ ...editingQuantity, unit: e.target.value })}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {UNIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleUpdateQuantity(quantity.id, editingQuantity.quantity, editingQuantity.unit)}
                    className="text-teal-600 hover:text-teal-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingQuantity(null)}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-gray-900">{quantity.quantity} {quantity.unit}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingQuantity(quantity)}
                      className="text-teal-600 hover:text-teal-700"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuantity(quantity.id, quantity.quantity, quantity.unit)}
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
