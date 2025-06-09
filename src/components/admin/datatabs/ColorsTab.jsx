"use client"
import { useState, useEffect } from "react"
import { ProductService } from "@/lib/service/productService"
import { Trash2, Plus, Edit2, Save, X, Check } from "lucide-react"

export default function ColorsTab() {
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingColor, setEditingColor] = useState(null)
  const [newColor, setNewColor] = useState({
    color: "",
    hex_code: "#000000"
  })

  useEffect(() => {
    fetchColors()
  }, [])

  const fetchColors = async () => {
    try {
      setLoading(true)
      const response = await ProductService.getColors()
      setColors(response.data || [])
      setError(null)
    } catch (err) {
      console.error("Error fetching colors:", err)
      setError("Failed to load colors. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewColor(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditingColor(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newColor.color.trim()) return

    try {
      await ProductService.createColor(newColor)
      setNewColor({ color: "", hex_code: "#000000" })
      fetchColors()
    } catch (err) {
      console.error("Error creating color:", err)
      setError("Failed to create color. Please try again.")
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingColor.color.trim()) return

    try {
      await ProductService.updateColor(editingColor.id, editingColor)
      setEditingColor(null)
      fetchColors()
    } catch (err) {
      console.error("Error updating color:", err)
      setError("Failed to update color. Please try again.")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this color?")) return

    try {
      await ProductService.deleteColor(id)
      fetchColors()
    } catch (err) {
      console.error("Error deleting color:", err)
      setError("Failed to delete color. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading colors...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add New Color Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Color</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              name="color"
              value={newColor.color}
              onChange={handleInputChange}
              placeholder="Color name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="hex_code"
              value={newColor.hex_code}
              onChange={handleInputChange}
              className="h-10 w-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              name="hex_code"
              value={newColor.hex_code}
              onChange={handleInputChange}
              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="#000000"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Add Color
          </button>
        </div>
      </form>

      {/* Colors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {colors.map((color) => (
          <div key={color.id} className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
            {editingColor?.id === color.id ? (
              <form onSubmit={handleUpdate} className="space-y-2">
                <input
                  type="text"
                  name="color"
                  value={editingColor.color}
                  onChange={handleEditInputChange}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="hex_code"
                    value={editingColor.hex_code}
                    onChange={handleEditInputChange}
                    className="h-8 w-8 p-1 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="hex_code"
                    value={editingColor.hex_code}
                    onChange={handleEditInputChange}
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    className="flex-1 px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingColor(null)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="submit"
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <span className="text-sm font-medium">{color.color}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingColor(color)}
                    className="p-1 text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(color.id)}
                    className="p-1 text-red-600 hover:text-red-700"
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
  )
}
