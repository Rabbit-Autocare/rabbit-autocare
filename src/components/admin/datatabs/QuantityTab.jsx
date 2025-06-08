"use client"
import { useState } from "react"
import { Trash2, Plus, Edit2, Save, X } from "lucide-react"

export default function QuantityTab({ quantities, onDataChange, saving, setSaving, setError }) {
  const [newQuantity, setNewQuantity] = useState({ quantity: "", unit: "ml" })
  const [editingQuantity, setEditingQuantity] = useState(null)

  const UNIT_OPTIONS = [
    { value: "ml", label: "ml (Milliliters)" },
    { value: "l", label: "L (Liters)" },
    { value: "g", label: "g (Grams)" },
    { value: "kg", label: "kg (Kilograms)" },
    { value: "pcs", label: "pcs (Pieces)" },
    { value: "pack", label: "pack (Pack)" },
  ]

  const handleAddQuantity = async () => {
    if (!newQuantity.quantity.trim()) {
      alert("Please enter a quantity value")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const { ProductService } = await import("@/lib/service/productService")
      await ProductService.createQuantity({
        quantity: parseFloat(newQuantity.quantity.trim()),
        unit: newQuantity.unit,
      })
      setNewQuantity({ quantity: "", unit: "ml" })
      await onDataChange()
      alert("Quantity added successfully!")
    } catch (error) {
      console.error("Error adding quantity:", error)
      setError(`Error adding quantity: ${error.message}`)
      alert(`Error adding quantity: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditQuantity = (quantity) => {
    setEditingQuantity({ ...quantity })
  }

  const handleSaveQuantity = async () => {
    if (!editingQuantity.quantity || editingQuantity.quantity <= 0) {
      alert("Quantity value must be a positive number")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const { ProductService } = await import("@/lib/service/productService")
      await ProductService.updateQuantity(editingQuantity.id, {
        quantity: parseFloat(editingQuantity.quantity),
        unit: editingQuantity.unit,
      })
      setEditingQuantity(null)
      await onDataChange()
      alert("Quantity updated successfully!")
    } catch (error) {
      console.error("Error updating quantity:", error)
      setError(`Error updating quantity: ${error.message}`)
      alert(`Error updating quantity: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuantity = async (id, quantity, unit) => {
    if (!confirm(`Are you sure you want to delete quantity "${quantity} ${unit}"?`)) return

    setSaving(true)
    setError(null)
    try {
      const { ProductService } = await import("@/lib/service/productService")
      await ProductService.deleteQuantity(id)
      await onDataChange()
      alert("Quantity deleted successfully!")
    } catch (error) {
      console.error("Error deleting quantity:", error)
      setError(`Error deleting quantity: ${error.message}`)
      alert(`Error deleting quantity: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const formatQuantityDisplay = (qty, unit) => {
    // Format the quantity nicely
    const num = parseFloat(qty)
    const formatted = num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '')
    return `${formatted} ${unit}`
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

      {/* Quantities List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Existing Quantities ({quantities.length})</h3>
        {quantities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No quantities added yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {quantities
              .sort((a, b) => {
                // Sort by unit first, then by quantity
                if (a.unit !== b.unit) return a.unit.localeCompare(b.unit)
                return parseFloat(a.quantity) - parseFloat(b.quantity)
              })
              .map((quantity) => (
                <div key={quantity.id} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                  {editingQuantity?.id === quantity.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingQuantity.quantity}
                          onChange={(e) => setEditingQuantity({ ...editingQuantity, quantity: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                          min="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                        <select
                          value={editingQuantity.unit}
                          onChange={(e) => setEditingQuantity({ ...editingQuantity, unit: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                        >
                          {UNIT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveQuantity}
                          disabled={saving}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-2 rounded transition-colors flex items-center justify-center"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => setEditingQuantity(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-teal-600">
                          {formatQuantityDisplay(quantity.quantity, quantity.unit)}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {UNIT_OPTIONS.find(opt => opt.value === quantity.unit)?.label.split(' (')[1]?.replace(')', '') || quantity.unit}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditQuantity(quantity)}
                          className="flex-1 text-blue-600 hover:text-blue-800 p-2 transition-colors border border-blue-200 rounded hover:bg-blue-50"
                        >
                          <Edit2 size={14} className="mx-auto" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuantity(quantity.id, quantity.quantity, quantity.unit)}
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
