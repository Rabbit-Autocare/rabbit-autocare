"use client"
import { useState } from "react"
import { ProductService } from "@/lib/service/productService"
import { Trash2, Plus, Edit2, Save, X } from "lucide-react"

export default function CategoriesManagement({ categories, onDataChange, loading, saving, setSaving, setError }) {
  const [newCategory, setNewCategory] = useState({ name: "", is_microfiber: false })
  const [editingCategory, setEditingCategory] = useState(null)

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Please enter a category name")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await ProductService.createCategory(newCategory)
      setNewCategory({ name: "", is_microfiber: false })
      await onDataChange()
      alert("Category added successfully!")
    } catch (error) {
      console.error("Error adding category:", error)
      setError(`Error adding category: ${error.message}`)
      alert(`Error adding category: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory({ ...category })
  }

  const handleSaveCategory = async () => {
    if (!editingCategory.name.trim()) {
      alert("Category name cannot be empty")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await ProductService.updateCategory(editingCategory.id, {
        name: editingCategory.name,
        is_microfiber: editingCategory.is_microfiber,
      })
      setEditingCategory(null)
      await onDataChange()
      alert("Category updated successfully!")
    } catch (error) {
      console.error("Error updating category:", error)
      setError(`Error updating category: ${error.message}`)
      alert(`Error updating category: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return

    setSaving(true)
    setError(null)
    try {
      await ProductService.deleteCategory(id)
      await onDataChange()
      alert("Category deleted successfully!")
    } catch (error) {
      console.error("Error deleting category:", error)
      setError(`Error deleting category: ${error.message}`)
      alert(`Error deleting category: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Category */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-3">Add New Category</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-64">
            <input
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Category name (e.g., Car Care, Microfiber Cloths)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            />
          </div>
          <label className="flex items-center bg-white px-4 py-3 rounded-lg border border-gray-300">
            <input
              type="checkbox"
              checked={newCategory.is_microfiber}
              onChange={(e) => setNewCategory({ ...newCategory, is_microfiber: e.target.checked })}
              className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium">Is Microfiber?</span>
          </label>
          <button
            onClick={handleAddCategory}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            {saving ? "Adding..." : "Add Category"}
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Existing Categories ({categories.length})</h3>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No categories added yet</div>
        ) : (
          <div className="grid gap-3">
            {categories.map((category) => (
              <div key={category.id} className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                {editingCategory?.id === category.id ? (
                  <div className="flex flex-wrap gap-3 items-center">
                    <input
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="flex-1 min-w-64 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingCategory.is_microfiber}
                        onChange={(e) => setEditingCategory({ ...editingCategory, is_microfiber: e.target.checked })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm">Is Microfiber?</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCategory}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-2 rounded transition-colors"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{category.name}</span>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          category.is_microfiber ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {category.is_microfiber ? "Microfiber" : "Bottle/Liquid"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="text-red-600 hover:text-red-800 p-1 transition-colors"
                      >
                        <Trash2 size={16} />
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
