"use client"
import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { CategoryService } from "@/lib/service/microdataService"

export default function CategoriesManagement({ categories = [], loading, saving, setSaving, setError, onDataChange }) {
  const [newCategory, setNewCategory] = useState({
    name: "",
    is_microfiber: false,
  })
  const [editingCategory, setEditingCategory] = useState(null)

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return

    setSaving(true)
    setError(null)
    try {
      await CategoryService.createCategory({
        name: newCategory.name.trim(),
        is_microfiber: newCategory.is_microfiber,
      })
      setNewCategory({
        name: "",
        is_microfiber: false,
      })
      await onDataChange()
    } catch (error) {
      console.error("Error adding category:", error)
      setError(`Error adding category: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCategory = async (id, data) => {
    if (!data.name.trim()) return

    setSaving(true)
    setError(null)
    try {
      await CategoryService.updateCategory(id, {
        name: data.name.trim(),
        is_microfiber: data.is_microfiber,
      })
      setEditingCategory(null)
      await onDataChange()
    } catch (error) {
      console.error("Error updating category:", error)
      setError(`Error updating category: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id, categoryName) => {
    if (!confirm(`Are you sure you want to delete category "${categoryName}"?`)) return

    setSaving(true)
    setError(null)
    try {
      await CategoryService.deleteCategory(id)
      await onDataChange()
    } catch (error) {
      console.error("Error deleting category:", error)
      setError(`Error deleting category: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Category */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-3">Add New Category</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="e.g., Car Interior, Car Exterior"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_microfiber"
              checked={newCategory.is_microfiber}
              onChange={(e) => setNewCategory({ ...newCategory, is_microfiber: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="is_microfiber" className="ml-2 block text-sm text-gray-700">
              This is a microfiber category
            </label>
          </div>
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

      {/* Category List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Category List</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {categories.map((category) => (
            <div key={category.id} className="p-4">
              {editingCategory?.id === category.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingCategory.is_microfiber}
                      onChange={(e) => setEditingCategory({ ...editingCategory, is_microfiber: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      This is a microfiber category
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCategory(category.id, editingCategory)}
                      className="text-green-600 hover:text-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium">{category.name}</span>
                      {category.is_microfiber && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Microfiber
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCategory({ ...category })}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
