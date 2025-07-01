"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, X, Package, ImageIcon, AlertCircle } from "lucide-react"
import { ProductService } from "@/lib/service/productService"
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import React from "react"

const GST_RATE = 0.18 // 18% GST

// Custom Components
function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  onClick,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-100",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function Input({ type = "text", className = "", error = false, ...props }) {
  const baseClasses =
    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  const errorClasses = error ? "border-red-500 focus:ring-red-500" : "border-gray-300"

  return <input type={type} className={`${baseClasses} ${errorClasses} ${className}`} {...props} />
}

function Textarea({ className = "", error = false, ...props }) {
  const baseClasses =
    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
  const errorClasses = error ? "border-red-500 focus:ring-red-500" : "border-gray-300"

  return <textarea className={`${baseClasses} ${errorClasses} ${className}`} {...props} />
}

function Label({ children, htmlFor, className = "" }) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
      {children}
    </label>
  )
}

function Select({ children, value, onValueChange, placeholder, error = false, className = "" }) {
  const baseClasses =
    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
  const errorClasses = error ? "border-red-500 focus:ring-red-500" : "border-gray-300"

  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`${baseClasses} ${errorClasses} ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  )
}

function SelectItem({ children, value }) {
  return <option value={value}>{children}</option>
}

function Checkbox({ checked, onCheckedChange, id, className = "" }) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${className}`}
    />
  )
}

function Card({ children, className = "" }) {
  return <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>{children}</div>
}

function CardHeader({ children, className = "" }) {
  return <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>
}

function CardTitle({ children, className = "" }) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
}

function CardContent({ children, className = "" }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    secondary: "bg-blue-100 text-blue-800",
    outline: "border border-gray-300 text-gray-700",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

function Separator({ className = "" }) {
  return <hr className={`border-gray-200 ${className}`} />
}

// Helper functions
function calculateBasePriceExGST(basePrice) {
  if (!basePrice || isNaN(basePrice)) return 0
  return Number((Number.parseFloat(basePrice) / (1 + GST_RATE)).toFixed(2))
}

function generateVariantId() {
  return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateVariantCode(productData, variant) {
  if (!productData.product_code) return ""

  const parts = [productData.product_code]

  if (productData.product_type === "microfiber") {
    if (variant.size) parts.push(`S${variant.size}`)
    if (variant.gsm) parts.push(`G${variant.gsm}`)
    if (variant.color) parts.push(variant.color.substring(0, 3).toUpperCase())
  } else {
    if (variant.quantity) parts.push(`Q${variant.quantity}`)
    if (variant.unit) parts.push(variant.unit.toUpperCase())
    if (variant.color) parts.push(variant.color.substring(0, 3).toUpperCase())
  }

  return parts.join("-")
}

function MultiInputField({ label, items, setItems, placeholder, newValue, setNewValue }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={placeholder} />
        <Button
          type="button"
          onClick={() => {
            if (newValue.trim()) {
              setItems([...items, newValue.trim()])
              setNewValue("")
            }
          }}
          size="sm"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              {item}
              <button
                type="button"
                className="ml-1 hover:text-red-600"
                onClick={() => setItems(items.filter((_, i) => i !== index))}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductForm({ product, onSuccess, onCancel, categories, colors, sizes, gsmValues, quantityMicrodata = [] }) {
  // Debug log for categories
  console.log('ProductForm categories prop:', categories);

  // Debug log for Supabase user authentication
  React.useEffect(() => {
    async function checkUser() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Supabase user:', user);
    }
    checkUser();
  }, []);

  // Form state matching exact database schema
  const [formData, setFormData] = useState({
    product_code: "",
    name: "",
    description: "",
    product_type: "regular", // 'microfiber' or 'regular'
    category: "",
    subcategory: [], // JSONB array
    hsn_code: "",
    features: [], // JSONB array
    usage_instructions: [], // JSONB array
    warnings: [], // JSONB array
    main_image_url: "",
    images: [], // JSONB array
    taglines: [], // JSONB array
  })

  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Add this inside ProductForm component, after useState declarations
  const supabase = createSupabaseBrowserClient();
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [imagesUploading, setImagesUploading] = useState(false);

  const [newFeature, setNewFeature] = useState("");
  const [newInstruction, setNewInstruction] = useState("");
  const [newWarning, setNewWarning] = useState("");
  const [newTagline, setNewTagline] = useState("");
  const [newImage, setNewImage] = useState("");

  // Load microdata and initialize form
  useEffect(() => {
    if (product) {
      initializeFormWithProduct(product)
    } else {
      addInitialVariant()
    }
  }, [product])

  const initializeFormWithProduct = (productData) => {
    setFormData({
      product_code: productData.product_code || "",
      name: productData.name || "",
      description: productData.description || "",
      product_type: productData.product_type || "regular",
      category: productData.category || "",
      subcategory: Array.isArray(productData.subcategory) ? productData.subcategory : [],
      hsn_code: productData.hsn_code || "",
      features: Array.isArray(productData.features) ? productData.features : [],
      usage_instructions: Array.isArray(productData.usage_instructions) ? productData.usage_instructions : [],
      warnings: Array.isArray(productData.warnings) ? productData.warnings : [],
      main_image_url: productData.main_image_url || "",
      images: Array.isArray(productData.images) ? productData.images : [],
      taglines: Array.isArray(productData.taglines) ? productData.taglines : [],
    })

    if (productData.variants && Array.isArray(productData.variants)) {
      setVariants(
        productData.variants.map((variant) => ({
          id: variant.id || generateVariantId(),
          variant_code: variant.variant_code || "",
          size: variant.size || "",
          quantity: variant.quantity || 0,
          unit: variant.unit || "ml",
          weight_grams: variant.weight_grams || 0,
          gsm: variant.gsm || 0,
          dimensions: variant.dimensions || "",
          color: Array.isArray(variant.color) ? variant.color[0] : variant.color || "",
          color_hex: Array.isArray(variant.color_hex) ? variant.color_hex[0] : variant.color_hex || "",
          base_price: variant.base_price || 0,
          base_price_excluding_gst: variant.base_price_excluding_gst || 0,
          stock: variant.stock || 0,
          is_active: variant.is_active !== false,
        })),
      )
    }
  }

  const addInitialVariant = () => {
    const initialVariant = createNewVariant()
    setVariants([initialVariant])
  }

  const createNewVariant = () => {
    return {
      id: generateVariantId(),
      variant_code: "",
      size: "",
      quantity: 0,
      unit: "ml",
      weight_grams: 0,
      gsm: 0,
      dimensions: "",
      color: "",
      color_hex: "",
      base_price: 0,
      base_price_excluding_gst: 0,
      stock: 0,
      is_active: true,
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleVariantChange = (variantId, field, value) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const updatedVariant = { ...variant, [field]: value }

          // Auto-calculate GST excluded price when base price changes
          if (field === "base_price") {
            updatedVariant.base_price_excluding_gst = calculateBasePriceExGST(Number(value) || 0)
          }

          return updatedVariant
        }
        return variant
      }),
    )
  }

  const addVariant = () => {
    const newVariant = createNewVariant()
    setVariants((prev) => [...prev, newVariant])
  }

  const removeVariant = (variantId) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((variant) => variant.id !== variantId))
    }
  }

  const handleSubcategoryToggle = (categoryName, checked) => {
    setFormData((prev) => ({
      ...prev,
      subcategory: checked
        ? [...prev.subcategory, categoryName]
        : prev.subcategory.filter((sub) => sub !== categoryName),
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields validation
    if (!formData.product_code.trim()) newErrors.product_code = "Product code is required"
    if (!formData.name.trim()) newErrors.name = "Product name is required"
    if (!formData.product_type) newErrors.product_type = "Product type is required"

    // Variants validation
    if (variants.length === 0) {
      newErrors.variants = "At least one variant is required"
    } else {
      variants.forEach((variant, index) => {
        if (!variant.color.trim()) {
          newErrors[`variant_${index}_color`] = "Color is required"
        }
        if (variant.base_price <= 0) {
          newErrors[`variant_${index}_price`] = "Price must be greater than 0"
        }
        if (formData.product_type === "microfiber") {
          if (!variant.size) newErrors[`variant_${index}_size`] = "Size is required for microfiber"
          if (!variant.gsm) newErrors[`variant_${index}_gsm`] = "GSM is required for microfiber"
        } else {
          if (!variant.quantity) newErrors[`variant_${index}_quantity`] = "Quantity is required for regular products"
          if (!variant.unit) newErrors[`variant_${index}_unit`] = "Unit is required for regular products"
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const transformDataForSubmission = () => {
    // Transform data to match database schema
    return {
      ...formData,
      variants: variants.map((variant) => ({
        ...variant,
        variant_code: variant.variant_code || generateVariantCode(formData, variant),
        // Ensure proper data types
        base_price: Number(variant.base_price),
        base_price_excluding_gst: Number(variant.base_price_excluding_gst),
        stock: Number(variant.stock),
        weight_grams: variant.weight_grams ? Number(variant.weight_grams) : null,
        gsm: variant.gsm ? Number(variant.gsm) : null,
        quantity: variant.quantity ? Number(variant.quantity) : null,
        // Handle JSONB fields for color - convert to array format for database
        color: variant.color ? [variant.color] : null,
        color_hex: variant.color_hex ? [variant.color_hex] : null,
      })),
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const productData = transformDataForSubmission()

      if (product?.id) {
        await ProductService.updateProduct(product.id, productData)
      } else {
        await ProductService.createProduct(productData)
      }

      onSuccess()
    } catch (error) {
      console.error("Error submitting form:", error)
      setErrors({ submit: error.message || "Failed to save product" })
    } finally {
      setSubmitting(false)
    }
  }

  const isMicrofiber = formData.product_type === "microfiber"

  async function handleMainImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setMainImageUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'main');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        handleInputChange('main_image_url', data.url);
      } else {
        alert('Failed to upload image: ' + (data.error || 'Unknown error') + ` (file: ${file.name})`);
      }
    } catch (err) {
      alert('Failed to upload image: ' + err.message + ` (file: ${file.name})`);
    }
    setMainImageUploading(false);
  }

  async function handleDroppedImages(files) {
    if (!files.length) return;
    setImagesUploading(true);
    const uploadedUrls = [];
    let anyError = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      // Optionally, you can add a type field if you want to organize folders
      formData.append('type', 'products');
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          anyError = true;
          alert('Failed to upload image: ' + (data.error || 'Unknown error') + ` (file: ${file.name})`);
        }
      } catch (err) {
        anyError = true;
        alert('Failed to upload image: ' + err.message + ` (file: ${file.name})`);
      }
    }
    handleInputChange('images', [...formData.images, ...uploadedUrls]);
    setImagesUploading(false);
    // If main_image_url is not set, set it to the first image
    if (!formData.main_image_url && uploadedUrls.length > 0) {
      handleInputChange('main_image_url', uploadedUrls[0]);
    }
    // Clear the file input value so the same files can be selected again
    const input = document.getElementById('additional_images_upload_input');
    if (input) input.value = '';
    if (anyError) {
      alert('Some images failed to upload. Please check your connection or try again.');
    }
  }

  function removeAdditionalImage(idx) {
    handleInputChange('images', formData.images.filter((_, i) => i !== idx));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading form data...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{product ? "Edit Product" : "Create New Product"}</h2>
          <p className="text-gray-600 mt-1">
            {product ? "Update product information and variants" : "Add a new product with variants"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={submitting} className="min-w-[120px]">
            {submitting ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{errors.submit}</span>
        </div>
      )}

      <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_code">Product Code *</Label>
                <Input
                  id="product_code"
                  value={formData.product_code}
                  onChange={(e) => handleInputChange("product_code", e.target.value)}
                  placeholder="Enter unique product code"
                  error={!!errors.product_code}
                />
                {errors.product_code && <p className="text-sm text-red-600 mt-1">{errors.product_code}</p>}
              </div>

              <div>
                <Label htmlFor="product_type">Product Type *</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => handleInputChange("product_type", value)}
                  placeholder="Select product type"
                  error={!!errors.product_type}
                >
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="microfiber">Microfiber</SelectItem>
                </Select>
                {errors.product_type && <p className="text-sm text-red-600 mt-1">{errors.product_type}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                error={!!errors.name}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                  placeholder="Select category"
                >
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name || category.category_name}>
                      {category.name || category.category_name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="hsn_code">HSN Code</Label>
                <Input
                  id="hsn_code"
                  value={formData.hsn_code}
                  onChange={(e) => handleInputChange("hsn_code", e.target.value)}
                  placeholder="Enter HSN code"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subcategories */}
        <Card>
          <CardHeader>
            <CardTitle>Subcategories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sub_${category.id}`}
                    checked={formData.subcategory.includes(category.name || category.category_name)}
                    onCheckedChange={(checked) => handleSubcategoryToggle(category.name || category.category_name, checked)}
                  />
                  <Label htmlFor={`sub_${category.id}`} className="text-sm">
                    {category.name || category.category_name}
                  </Label>
                </div>
              ))}
            </div>
            {formData.subcategory.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.subcategory.map((sub, index) => (
                  <Badge key={index} variant="secondary">
                    {sub}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="main_image_upload">Main Image</Label>
              <input
                id="main_image_upload"
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                disabled={mainImageUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {mainImageUploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
              {formData.main_image_url && (
                <div className="mt-2">
                  <img src={formData.main_image_url} alt="Main" className="h-24 rounded border" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="additional_images_upload">Additional Images</Label>
              <div
                className={`mt-2 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition hover:border-blue-400 bg-gray-50 relative ${imagesUploading ? 'opacity-60 pointer-events-none' : ''}`}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={async e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (imagesUploading) return;
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                  if (files.length) await handleDroppedImages(files);
                }}
                onClick={() => {
                  if (!imagesUploading) document.getElementById('additional_images_upload_input').click();
                }}
              >
                <input
                  id="additional_images_upload_input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={imagesUploading}
                  onChange={async e => {
                    if (imagesUploading) return;
                    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
                    if (files.length) await handleDroppedImages(files);
                    e.target.value = '';
                  }}
                />
                <span className="text-gray-500 text-sm mb-2">Drag & drop images here, or click to select</span>
                {imagesUploading && <span className="text-xs text-blue-600 mt-1">Uploading...</span>}
              </div>
              {formData.images && formData.images.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`Additional ${idx + 1}`} className="h-20 w-20 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeAdditionalImage(idx); }}
                        className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-bl px-1 py-0.5 text-xs text-red-600 opacity-0 group-hover:opacity-100 transition"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 left-0 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-tr rounded-bl">Main</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MultiInputField
              label="Features"
              items={formData.features}
              setItems={(items) => handleInputChange("features", items)}
              placeholder="Enter feature"
              newValue={newFeature}
              setNewValue={setNewFeature}
            />

            <MultiInputField
              label="Usage Instructions"
              items={formData.usage_instructions}
              setItems={(items) => handleInputChange("usage_instructions", items)}
              placeholder="Enter usage instruction"
              newValue={newInstruction}
              setNewValue={setNewInstruction}
            />

            <MultiInputField
              label="Warnings"
              items={formData.warnings}
              setItems={(items) => handleInputChange("warnings", items)}
              placeholder="Enter warning"
              newValue={newWarning}
              setNewValue={setNewWarning}
            />

            <MultiInputField
              label="Taglines"
              items={formData.taglines}
              setItems={(items) => handleInputChange("taglines", items)}
              placeholder="Enter tagline"
              newValue={newTagline}
              setNewValue={setNewTagline}
            />
          </CardContent>
        </Card>

        {/* Product Variants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Product Variants
              <Button onClick={addVariant} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errors.variants && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.variants}</p>
              </div>
            )}

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <Card key={variant.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Variant {index + 1}
                        {variant.variant_code && (
                          <span className="text-sm font-normal text-gray-500 ml-2">({variant.variant_code})</span>
                        )}
                      </CardTitle>
                      {variants.length > 1 && (
                        <Button variant="destructive" size="sm" onClick={() => removeVariant(variant.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Manual Variant Code Input */}
                    <div>
                      <Label>Variant Code *</Label>
                      <Input
                        value={variant.variant_code || ""}
                        onChange={e => handleVariantChange(variant.id, "variant_code", e.target.value)}
                        placeholder="Enter unique variant code"
                      />
                    </div>
                    {/* Common fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Color *</Label>
                        <Select
                          value={variant.color}
                          onValueChange={(value) => handleVariantChange(variant.id, "color", value)}
                          placeholder="Select color"
                          error={!!errors[`variant_${index}_color`]}
                        >
                          {colors.map((color) => (
                            <SelectItem key={color.id} value={color.color}>
                              <div className="flex items-center gap-2">
                                {color.hex_code && (
                                  <span
                                    className="inline-block w-4 h-4 rounded border border-gray-300"
                                    style={{ backgroundColor: color.hex_code }}
                                  />
                                )}
                                <span>{color.color}</span>
                                {color.hex_code && (
                                  <span className="text-xs text-gray-400 ml-1">{color.hex_code}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                        {errors[`variant_${index}_color`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`variant_${index}_color`]}</p>
                        )}
                      </div>
                      <div>
                        <Label>Color Hex Code</Label>
                        <Input
                          value={variant.color_hex || ""}
                          onChange={(e) => handleVariantChange(variant.id, "color_hex", e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    {/* Type-specific fields */}
                    {isMicrofiber ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label>Size *</Label>
                          <Select
                            value={variant.size || ""}
                            onValueChange={(value) => handleVariantChange(variant.id, "size", value)}
                            placeholder="Select size"
                            error={!!errors[`variant_${index}_size`]}
                          >
                            {sizes.map((size) => (
                              <SelectItem key={size.id} value={size.size_cm.toString()}>
                                {size.size_cm} cm
                              </SelectItem>
                            ))}
                          </Select>
                          {errors[`variant_${index}_size`] && (
                            <p className="text-sm text-red-600 mt-1">{errors[`variant_${index}_size`]}</p>
                          )}
                        </div>

                        <div>
                          <Label>GSM *</Label>
                          <Select
                            value={variant.gsm?.toString() || ""}
                            onValueChange={(value) => handleVariantChange(variant.id, "gsm", Number.parseInt(value))}
                            placeholder="Select GSM"
                            error={!!errors[`variant_${index}_gsm`]}
                          >
                            {gsmValues.map((gsm) => (
                              <SelectItem key={gsm.id} value={gsm.gsm.toString()}>
                                {gsm.gsm} GSM
                              </SelectItem>
                            ))}
                          </Select>
                          {errors[`variant_${index}_gsm`] && (
                            <p className="text-sm text-red-600 mt-1">{errors[`variant_${index}_gsm`]}</p>
                          )}
                        </div>

                        <div>
                          <Label>Weight (grams)</Label>
                          <Input
                            type="number"
                            value={variant.weight_grams || ""}
                            onChange={(e) =>
                              handleVariantChange(variant.id, "weight_grams", Number.parseInt(e.target.value) || 0)
                            }
                            placeholder="Enter weight"
                          />
                        </div>

                        <div>
                          <Label>Dimensions</Label>
                          <Input
                            value={variant.dimensions || ""}
                            onChange={(e) => handleVariantChange(variant.id, "dimensions", e.target.value)}
                            placeholder="e.g., 30x40 cm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Quantity *</Label>
                          <select
                            value={variant.quantity || ''}
                            onChange={e => handleVariantChange(variant.id, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select quantity</option>
                            {[...new Set(quantityMicrodata.map(q => q.quantity))].map(qty => (
                              <option key={qty} value={qty}>{qty}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Unit *</Label>
                          <select
                            value={variant.unit || ''}
                            onChange={e => handleVariantChange(variant.id, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select unit</option>
                            {[...new Set(quantityMicrodata.map(q => q.unit))].map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Pricing and Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Base Price (Inc. GST) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.base_price || ""}
                          onChange={(e) =>
                            handleVariantChange(variant.id, "base_price", Number.parseFloat(e.target.value) || 0)
                          }
                          placeholder="Enter base price"
                          error={!!errors[`variant_${index}_price`]}
                        />
                        {errors[`variant_${index}_price`] && (
                          <p className="text-sm text-red-600 mt-1">{errors[`variant_${index}_price`]}</p>
                        )}
                      </div>

                      <div>
                        <Label>Price (Exc. GST)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.base_price_excluding_gst?.toFixed(2) || ""}
                          readOnly
                          className="bg-gray-50"
                          placeholder="Auto-calculated"
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-calculated at {GST_RATE * 100}% GST</p>
                      </div>

                      <div>
                        <Label>Stock Quantity</Label>
                        <Input
                          type="number"
                          value={variant.stock || ""}
                          onChange={(e) =>
                            handleVariantChange(variant.id, "stock", Number.parseInt(e.target.value) || 0)
                          }
                          placeholder="Enter stock quantity"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`active_${variant.id}`}
                        checked={variant.is_active}
                        onCheckedChange={(checked) => handleVariantChange(variant.id, "is_active", checked)}
                      />
                      <Label htmlFor={`active_${variant.id}`}>Active variant</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
