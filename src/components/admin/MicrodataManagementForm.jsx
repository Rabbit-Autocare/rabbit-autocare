"use client"
import { useEffect, useState } from "react"
import { ProductService } from "@/lib/service/productService"
import { Trash2, Plus, Edit2, Save, X, AlertTriangle } from "lucide-react"

const PREDEFINED_COLORS = [
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#00FF00" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray", hex: "#808080" }
];

export default function MicrodataManagementForm({ onClose }) {
  const [activeTab, setActiveTab] = useState("categories")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Data states
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])

  // Form states
  const [newCategory, setNewCategory] = useState({ name: "", is_microfiber: false })
  const [newSize, setNewSize] = useState("")
  const [newColor, setNewColor] = useState("")

  // Edit states
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSize, setEditingSize] = useState(null)
  const [editingColor, setEditingColor] = useState(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch each data type separately to isolate errors
      try {
        const categoriesRes = await ProductService.getCategories()
        setCategories(categoriesRes.data || [])
      } catch (err) {
        console.error("Error fetching categories:", err)
        setError((prev) => prev || "Failed to load categories")
      }

      try {
        const sizesRes = await ProductService.getSizes()
        setSizes(sizesRes.data || [])
      } catch (err) {
        console.error("Error fetching sizes:", err)
        setError((prev) => prev || "Failed to load sizes")
      }

      try {
        const colorsRes = await ProductService.getColors()
        setColors(colorsRes.data || [])
      } catch (err) {
        console.error("Error fetching colors:", err)
        setError((prev) => prev || "Failed to load colors")
      }
    } catch (err) {
      console.error("Error in fetchAllData:", err)
      setError("Failed to load data. Please check your network connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  // Category operations
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
      await fetchAllData()
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
      await fetchAllData()
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
      await fetchAllData()
      alert("Category deleted successfully!")
    } catch (error) {
      console.error("Error deleting category:", error)
      setError(`Error deleting category: ${error.message}`)
      alert(`Error deleting category: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Size operations
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
      await fetchAllData()
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
      await fetchAllData()
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
      await fetchAllData()
      alert("Size deleted successfully!")
    } catch (error) {
      console.error("Error deleting size:", error)
      setError(`Error deleting size: ${error.message}`)
      alert(`Error deleting size: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Color operations
  const handleAddColor = async () => {
    if (!newColor.trim()) {
      alert("Please enter a color name")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await ProductService.createColor({ name: newColor.trim() })
      setNewColor("")
      await fetchAllData()
      alert("Color added successfully!")
    } catch (error) {
      console.error("Error adding color:", error)
      setError(`Error adding color: ${error.message}`)
      alert(`Error adding color: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditColor = (color) => {
    setEditingColor({ ...color })
  }

  const handleSaveColor = async () => {
    if (!editingColor.name.trim()) {
      alert("Color name cannot be empty")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await ProductService.updateColor(editingColor.id, { name: editingColor.name })
      setEditingColor(null)
      await fetchAllData()
      alert("Color updated successfully!")
    } catch (error) {
      console.error("Error updating color:", error)
      setError(`Error updating color: ${error.message}`)
      alert(`Error updating color: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteColor = async (id, name) => {
    if (!confirm(`Are you sure you want to delete color "${name}"?`)) return

    setSaving(true)
    setError(null)
    try {
      await ProductService.deleteColor(id)
      await fetchAllData()
      alert("Color deleted successfully!")
    } catch (error) {
      console.error("Error deleting color:", error)
      setError(`Error deleting color: ${error.message}`)
      alert(`Error deleting color: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const renderCategoriesTab = () => (
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

  const renderSizesTab = () => (
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

  const renderColorsTab = () => (
    <div className="space-y-6">
      {/* Add New Color */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">Add New Color</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {PREDEFINED_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => setNewColor(color.name)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  newColor === color.name
                    ? 'border-purple-600 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-purple-400'
                }`}
                style={{ backgroundColor: color.hex }}
              >
                <div className="text-center">
                  <div className="w-full h-8 rounded mb-2 border border-gray-200" style={{ backgroundColor: color.hex }} />
                  <span className={`text-sm font-medium ${
                    color.name === 'White' ? 'text-gray-800' : 'text-white'
                  }`}>
                    {color.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Selected color name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                readOnly
              />
            </div>
            <button
              onClick={handleAddColor}
              disabled={saving || !newColor}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              {saving ? "Adding..." : "Add Color"}
            </button>
          </div>
        </div>
      </div>

      {/* Colors List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Existing Colors ({colors.length})</h3>
        {colors.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No colors added yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {colors.map((color) => {
              const predefinedColor = PREDEFINED_COLORS.find(c => c.name.toLowerCase() === color.name.toLowerCase());
              return (
                <div key={color.id} className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                  {editingColor?.id === color.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {PREDEFINED_COLORS.map((preColor) => (
                          <button
                            key={preColor.hex}
                            onClick={() => setEditingColor({ ...editingColor, name: preColor.name })}
                            className={`p-2 rounded border-2 transition-all ${
                              editingColor.name === preColor.name
                                ? 'border-purple-600 shadow-lg'
                                : 'border-gray-200 hover:border-purple-400'
                            }`}
                            style={{ backgroundColor: preColor.hex }}
                          >
                            <span className={`text-xs font-medium ${
                              preColor.name === 'White' ? 'text-gray-800' : 'text-white'
                            }`}>
                              {preColor.name}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveColor}
                          disabled={saving}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-1 rounded transition-colors"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => setEditingColor(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white p-1 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div
                        className="w-full h-8 rounded border border-gray-200"
                        style={{ backgroundColor: predefinedColor?.hex || '#808080' }}
                      />
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 capitalize">{color.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditColor(color)}
                            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteColor(color.id, color.name)}
                            className="text-red-600 hover:text-red-800 p-1 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )

  const tabs = [
    { id: "categories", label: "Categories", count: categories.length, color: "green" },
    { id: "sizes", label: "Sizes", count: sizes.length, color: "blue" },
    { id: "colors", label: "Colors", count: colors.length, color: "purple" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading microdata...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Microdata Management</h2>
          <p className="text-gray-600 mt-1">Manage categories, sizes, and colors for your products</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
          <button onClick={fetchAllData} className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline">
            Try again
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? `border-${tab.color}-500 text-${tab.color}-600`
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id ? `bg-${tab.color}-100 text-${tab.color}-600` : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "categories" && renderCategoriesTab()}
        {activeTab === "sizes" && renderSizesTab()}
        {activeTab === "colors" && renderColorsTab()}
      </div>

      {/* Info Panel */}
      <div className="bg-gray-50 border-t border-gray-200 p-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Usage Guidelines:</h4>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Categories:</strong> Create product categories. Mark as "Microfiber" for cloth products, leave
                  unchecked for bottle/liquid products.
                </p>
                <p>
                  <strong>Sizes:</strong> Add dimensions for microfiber products (e.g., 40x60, 30x30). These will be
                  used when creating microfiber variants.
                </p>
                <p>
                  <strong>Colors:</strong> Add color options for microfiber products. These will be available when
                  creating product variants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
