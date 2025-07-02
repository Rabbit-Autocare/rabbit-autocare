"use client"
import { useState } from "react"
import ProductForm from "@/components/admin/ProductForm"
import MicrodataManagementForm from "@/components/admin/MicrodataManagementForm"
import { ProductService } from "@/lib/service/productService"
import { Plus, Settings, Trash2, Package, Search, ChevronDown, Pencil, ChevronRight } from "lucide-react"
import React from "react"

// Custom Components
function Button({ children, onClick, className = "", variant = "primary", size = "md" }) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  )
}

function Input({ type = "text", className = "", ...props }) {
  return (
    <input
      type={type}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      {...props}
    />
  )
}

function Select({ children, value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${className}`}
    >
      {children}
    </select>
  )
}

function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    secondary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

function getVariantFields(variants) {
  // Returns an array of field names that are present (not null/empty) in at least one variant
  const fields = ["gsm", "size", "color", "color_hex", "quantity", "unit", "price", "stock"]
  return fields.filter((field) => variants.some((v) => v[field] !== undefined && v[field] !== null && v[field] !== ""))
}

function formatRupee(amount) {
  if (amount === undefined || amount === null) return ""
  return `₹${Number(amount).toFixed(2)}`
}

// Helper to get visible product columns
function getVisibleProductColumns(products) {
  const columns = [
    { key: 'main_image_url', label: 'Image' },
    { key: 'name', label: 'Product' },
    { key: 'product_code', label: 'Code' },
    { key: 'product_type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'variants', label: 'Variants' },
    { key: 'total_stock', label: 'Total Stock' },
    { key: 'price_range', label: 'Price Range' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];
  return columns.filter(col => {
    if (col.key === 'variants' || col.key === 'total_stock' || col.key === 'price_range' || col.key === 'status' || col.key === 'actions') return true;
    if (col.key === 'main_image_url') return products.some(p => p.main_image_url || (Array.isArray(p.images) && p.images.length > 0));
    return products.some(p => p[col.key] !== undefined && p[col.key] !== null && p[col.key] !== '');
  });
}

// Helper to get visible variant columns
function getVisibleVariantColumns(variants, productType) {
  const columns = [
    { key: 'variant_code', label: 'Variant Code' },
    { key: 'size', label: 'Size' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit', label: 'Unit' },
    { key: 'weight_grams', label: 'Weight (g)' },
    { key: 'gsm', label: 'GSM' },
    { key: 'dimensions', label: 'Dimensions' },
    { key: 'color', label: 'Color' },
    { key: 'base_price', label: 'Base Price (Inc. GST)' },
    { key: 'base_price_excluding_gst', label: 'Price (Exc. GST)' },
    { key: 'stock', label: 'Stock' },
    { key: 'is_active', label: 'Active' },
  ];
  return columns.filter(col => {
    if (col.key === 'variant_code' || col.key === 'base_price_excluding_gst') {
      // Always show if any variant has a value
      return variants.some(v => v[col.key] !== undefined && v[col.key] !== null && v[col.key] !== '');
    }
    if (col.key === 'unit' && productType === 'microfiber') return false;
    if (col.key === 'color') {
      return variants.some(v => {
        const val = v[col.key];
        return Array.isArray(val) ? val.length > 0 : val !== undefined && val !== null && val !== '';
      });
    }
    return variants.some(v => v[col.key] !== undefined && v[col.key] !== null && v[col.key] !== '');
  });
}

// Add a helper for stock badge color
function getStockBadge(stock) {
  if (stock === undefined || stock === null) return <span className="text-gray-400">—</span>;
  if (stock === 0) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">0</span>;
  if (stock < 10) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{stock}</span>;
  return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">{stock}</span>;
}

// Add a helper for active status dot
function ActiveDot({ active }) {
  if (active === undefined || active === null) return <span className="text-gray-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
      <span className="text-xs">{active ? 'Yes' : 'No'}</span>
    </span>
  );
}

export default function AdminProductsClient({ initialProducts, initialCategories, initialColors, initialSizes, initialGsmValues, initialQuantities, initialError }) {
  const [products, setProducts] = useState(initialProducts || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [expandedRows, setExpandedRows] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categories, setCategories] = useState(initialCategories || [])
  const [imageIndexes, setImageIndexes] = useState({}) // { [productId]: currentIndex }
  const [currentView, setCurrentView] = useState("list") // 'list', 'create', 'edit', 'microdata'

  // Only fetch data if we don't have initial data or if we need to refresh
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await ProductService.getProducts()
      console.log("Fetched products:", response) // Debug log
      if (response.success && response.products) {
        setProducts(response.products)
      } else {
        console.error("Invalid response format:", response)
        setProducts([])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      alert("Error fetching products: " + error.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await ProductService.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await ProductService.deleteProduct(id)
      await fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Error deleting product: " + error.message)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
    setCurrentView("edit")
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setShowForm(true)
    setCurrentView("create")
  }

  const handleBack = () => {
    setShowForm(false)
    setEditingProduct(null)
    setCurrentView("list")
  }

  const handleSuccess = async () => {
    await fetchProducts()
    setShowForm(false)
    setEditingProduct(null)
    setCurrentView("list")
  }

  const toggleRow = (productId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }))
  }

  const handlePrevImage = (product) => {
    setImageIndexes((prev) => ({
      ...prev,
      [product.id]: Math.max(0, (prev[product.id] || 0) - 1),
    }))
  }

  const handleNextImage = (product) => {
    setImageIndexes((prev) => ({
      ...prev,
      [product.id]: Math.min((product.images?.length || 1) - 1, (prev[product.id] || 0) + 1),
    }))
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category_name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const visibleProductColumns = getVisibleProductColumns(filteredProducts);

  // Show error state if initial data fetch failed
  if (initialError && products.length === 0) {
    return (
      <div className="p-6 max-w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Products</h3>
          <p className="text-red-600 mt-1">{initialError}</p>
          <Button onClick={fetchProducts} className="mt-3" variant="destructive">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (currentView === "microdata") {
    return <MicrodataManagementForm onBack={handleBack} />
  }

  if (showForm) {
    return <ProductForm product={editingProduct} categories={categories} colors={initialColors} sizes={initialSizes} gsmValues={initialGsmValues} quantities={initialQuantities} onSuccess={handleSuccess} onCancel={handleBack} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <Button onClick={() => setCurrentView("microdata")} variant="secondary">
            <Settings size={16} className="mr-2" />
            Microdata Management
          </Button>
          <Button onClick={handleCreate}>
            <Plus size={16} className="mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="min-w-[150px]"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleProductColumns.map(col => (
                  <th key={col.key} className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                  const minPrice = product.variants?.length > 0 ? Math.min(...product.variants.map((v) => v.base_price || Infinity)) : null;
                  const maxPrice = product.variants?.length > 0 ? Math.max(...product.variants.map((v) => v.base_price || -Infinity)) : null;
                  return (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        {visibleProductColumns.map(col => {
                          if (col.key === 'main_image_url') {
                            return (
                              <td key={col.key} className="px-4 py-4 text-sm text-gray-900">
                                {Array.isArray(product.images) && product.images.length > 0 ? (
                                  <div className="relative w-14 h-14 flex items-center justify-center">
                                    <img
                                      src={product.images[imageIndexes[product.id] || 0]}
                                      alt={product.name}
                                      className="w-12 h-12 object-cover rounded border"
                                    />
                                    {product.images.length > 1 && (
                                      <>
                                        <button
                                          onClick={e => { e.stopPropagation(); handlePrevImage(product); }}
                                          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-0.5 text-xs text-gray-700 hover:bg-blue-100"
                                          style={{ zIndex: 2 }}
                                          disabled={(imageIndexes[product.id] || 0) === 0}
                                          tabIndex={-1}
                                          title="Previous image"
                                        >
                                          &#8592;
                                        </button>
                                        <button
                                          onClick={e => { e.stopPropagation(); handleNextImage(product); }}
                                          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-0.5 text-xs text-gray-700 hover:bg-blue-100"
                                          style={{ zIndex: 2 }}
                                          disabled={(imageIndexes[product.id] || 0) === product.images.length - 1}
                                          tabIndex={-1}
                                          title="Next image"
                                        >
                                          &#8594;
                                        </button>
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-1 rounded-t mt-1">{(imageIndexes[product.id] || 0) + 1}/{product.images.length}</span>
                                      </>
                                    )}
                                  </div>
                                ) : product.main_image_url ? (
                                  <img src={product.main_image_url} alt={product.name} className="w-12 h-12 object-cover rounded border" />
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            );
                          }
                          if (col.key === 'name') {
                            return (
                              <td key={col.key} className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={() => toggleRow(product.id)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                                  >
                                    {expandedRows[product.id] ? (
                                      <ChevronDown className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-600" />
                                    )}
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-gray-900 truncate">{product.name}</div>
                                  </div>
                                </div>
                              </td>
                            );
                          }
                          if (col.key === 'variants') {
                            return (
                              <td key={col.key} className="px-4 py-4 text-sm text-gray-900">
                                <span className="font-medium">{product.variants?.length || 0}</span>
                                <span className="text-gray-500 ml-1">variants</span>
                              </td>
                            );
                          }
                          if (col.key === 'total_stock') {
                            return (
                              <td key={col.key} className="px-4 py-4 text-sm text-gray-900">
                                <span className="font-medium">{totalStock}</span>
                              </td>
                            );
                          }
                          if (col.key === 'price_range') {
                            return (
                              <td key={col.key} className="px-4 py-4 text-sm text-gray-900">
                                {minPrice !== null && minPrice !== Infinity ? (
                                  <div>
                                    <div className="font-medium">{formatRupee(minPrice)}</div>
                                    {minPrice !== maxPrice && maxPrice !== -Infinity && (
                                      <div className="text-xs text-gray-500">to {formatRupee(maxPrice)}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            );
                          }
                          if (col.key === 'status') {
                            return (
                              <td key={col.key} className="px-4 py-4 text-sm">
                                <Badge variant={product.variants?.some((v) => v.stock > 0) ? "success" : "danger"}>
                                  {product.variants?.some((v) => v.stock > 0) ? "In Stock" : "Out of Stock"}
                                </Badge>
                              </td>
                            );
                          }
                          if (col.key === 'actions') {
                            return (
                              <td key={col.key} className="px-4 py-4 text-sm flex gap-2 items-center justify-center">
                                <button onClick={() => handleEdit(product)} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="Edit">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="p-1 rounded hover:bg-red-100 text-red-600" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            );
                          }
                          // Default: just show the value or dash
                          return (
                            <td key={col.key} className="px-4 py-4 text-sm text-gray-900">{product[col.key] || "—"}</td>
                          );
                        })}
                      </tr>
                      {/* Expandable row for variant details */}
                      {expandedRows[product.id] && (
                        <tr>
                          <td colSpan={visibleProductColumns.length} className="bg-gray-50 px-6 py-4">
                            <div className="overflow-x-auto">
                              {/* Compute visible variant columns for this product */}
                              {(() => {
                                const visibleVariantColumns = getVisibleVariantColumns(product.variants || [], product.product_type);
                                return (
                                  <table className="min-w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                                    <thead className="bg-white">
                                      <tr>
                                        {visibleVariantColumns.map(col => (
                                          <th key={col.key} className="px-2 py-2">{col.label}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {product.variants?.map((variant) => (
                                        <tr key={variant.id}>
                                          {visibleVariantColumns.map(col => {
                                            let value = variant[col.key];
                                            if (col.key === 'color') {
                                              value = Array.isArray(value) ? (value.length ? value.join(", ") : "—") : (value || "—");
                                            }
                                            if (col.key === 'base_price' || col.key === 'base_price_excluding_gst') {
                                              value = value !== undefined && value !== null ? formatRupee(value) : "—";
                                            }
                                            if (col.key === 'is_active') {
                                              return <td key={col.key} className="px-2 py-2 text-center align-middle"><ActiveDot active={variant.is_active} /></td>;
                                            }
                                            if (col.key === 'stock') {
                                              return <td key={col.key} className="px-2 py-2 text-center align-middle">{getStockBadge(variant.stock)}</td>;
                                            }
                                            if (value === undefined || value === null || value === "") value = "—";
                                            return <td key={col.key} className="px-2 py-2 text-center align-middle">{value}</td>;
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
