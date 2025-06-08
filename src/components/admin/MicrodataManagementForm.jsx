"use client"
import { useEffect, useState } from "react"
import { ProductService } from "@/lib/service/productService"
import { X, AlertTriangle } from "lucide-react"

// Import all tab components
import CategoriesManagement from "../admin/datatabs/CategoryTab"
import SizesManagement from "../admin/datatabs/SizeTab"
import ColorsManagement from "../admin/datatabs/ColorsTab"
import GSMManagement from "../admin/datatabs/GsmTab"
import QuantityManagement from "../admin/datatabs/QuantityTab"

export default function MicrodataManagementForm({ onClose }) {
  const [activeTab, setActiveTab] = useState("categories")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Data states
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [gsm, setGsm] = useState([])
  const [quantities, setQuantities] = useState([])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch each data type separately to isolate errors
      const fetchPromises = [
        ProductService.getCategories().then(res => setCategories(res.data || [])).catch(err => {
          console.error("Error fetching categories:", err)
          setError((prev) => prev || "Failed to load categories")
        }),
        ProductService.getSizes().then(res => setSizes(res.data || [])).catch(err => {
          console.error("Error fetching sizes:", err)
          setError((prev) => prev || "Failed to load sizes")
        }),
        ProductService.getColors().then(res => setColors(res.data || [])).catch(err => {
          console.error("Error fetching colors:", err)
          setError((prev) => prev || "Failed to load colors")
        }),
        ProductService.getGSM().then(res => setGsm(res.data || [])).catch(err => {
          console.error("Error fetching GSM:", err)
          setError((prev) => prev || "Failed to load GSM")
        }),
        ProductService.getQuantities().then(res => setQuantities(res.data || [])).catch(err => {
          console.error("Error fetching quantities:", err)
          setError((prev) => prev || "Failed to load quantities")
        })
      ]

      await Promise.allSettled(fetchPromises)
    } catch (err) {
      console.error("Error in fetchAllData:", err)
      setError("Failed to load data. Please check your network connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: "categories", label: "Categories", count: categories.length, color: "green" },
    { id: "sizes", label: "Sizes", count: sizes.length, color: "blue" },
    { id: "colors", label: "Colors", count: colors.length, color: "purple" },
    { id: "gsm", label: "GSM", count: gsm.length, color: "indigo" },
    { id: "quantities", label: "Quantities", count: quantities.length, color: "pink" },
  ]

  const renderTabContent = () => {
    const commonProps = {
      loading,
      saving,
      setSaving,
      setError,
      onDataChange: fetchAllData
    }

    switch (activeTab) {
      case "categories":
        return <CategoriesManagement categories={categories} {...commonProps} />
      case "sizes":
        return <SizesManagement sizes={sizes} {...commonProps} />
      case "colors":
        return <ColorsManagement colors={colors} {...commonProps} />
      case "gsm":
        return <GSMManagement gsms={gsm} {...commonProps} />
      case "quantities":
        return <QuantityManagement quantities={quantities} {...commonProps} />
      default:
        return <CategoriesManagement categories={categories} {...commonProps} />
    }
  }

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
          <p className="text-gray-600 mt-1">Manage categories, sizes, colors, GSM, and quantities for your products</p>
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
        <nav className="flex space-x-8 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
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
        {renderTabContent()}
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
                <p>
                  <strong>GSM:</strong> Add GSM (grams per square meter) values for microfiber products to indicate
                  thickness and quality.
                </p>
                <p>
                  <strong>Quantities:</strong> Add quantity options for bulk orders and packaging variants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
