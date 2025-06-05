// Enhanced ProductService with direct category/subcategory storage

const API_BASE_URL = "/api/products"
const SIZES_API = "/api/products/size"
const COLORS_API = "/api/products/colors"
const CATEGORIES_API = "/api/products/category"
const GETBYCATEGORY = "/api/products/by-category"

export class ProductService {
  // ============= PRODUCTS =============

  static async getProducts({ code, limit, sort, filters = {} } = {}) {
    const params = new URLSearchParams()
    if (code) params.append("code", code)
    if (limit) params.append("limit", limit)
    if (sort) params.append("sort", sort)

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          // For array values, add each item as a separate parameter with the same key
          value.forEach((item) => params.append(key + "[]", item))
        } else {
          params.append(key, value)
        }
      }
    })

    const url = params.toString() ? `${API_BASE_URL}?${params}` : API_BASE_URL

    try {
      const res = await fetch(url)
      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const data = await res.json()
      const products = Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : []
      const total = data.total || products.length

      const transformedProducts = products.map((product) => this.transformProductData(product))

      return {
        success: data.success || true,
        products: transformedProducts,
        total: total,
      }
    } catch (error) {
      console.error("Error in getProducts:", error)
      throw error
    }
  }

  static async getProduct(id, includeRelations = false) {
    try {
      const params = new URLSearchParams()
      const url = `${API_BASE_URL}/${id}${params.toString() ? `?${params}` : ""}`
      console.log("Fetching single product from URL:", url)

      const res = await fetch(url)
      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const data = await res.json()
      const product = data.product || data

      return this.transformProductData(product)
    } catch (error) {
      console.error("Error in getProduct:", error)
      throw error
    }
  }

  static async createProduct(data) {
    try {
      // Transform variants to use direct values
      const transformedData = {
        product_code: data.product_code,
        name: data.name,
        description: data.description,
        category_name: data.category_name,
        is_microfiber: data.is_microfiber,
        main_image_url: data.main_image_url,
        images: data.images || [],
        key_features: data.key_features || [],
        taglines: data.taglines || [],
        subcategory_names: Array.isArray(data.subcategory_names)
          ? data.subcategory_names
          : data.subcategory_names
            ? [data.subcategory_names]
            : [],
        variants: Array.isArray(data.variants)
          ? data.variants.map((variant) => {
              if (data.is_microfiber) {
                return {
                  gsm: variant.gsm || "",
                  size: variant.size || "",
                  color: variant.color || "",
                  price: Number.parseFloat(variant.price) || 0,
                  stock: Number.parseInt(variant.stock) || 0,
                  compareAtPrice: variant.compareAtPrice || null,
                }
              } else {
                return {
                  quantity: variant.quantity || "",
                  unit: variant.unit || "ml",
                  price: Number.parseFloat(variant.price) || 0,
                  stock: Number.parseInt(variant.stock) || 0,
                  compareAtPrice: variant.compareAtPrice || null,
                }
              }
            })
          : [],
      }

      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return this.transformProductData(json.product || json)
    } catch (error) {
      console.error("Error in createProduct:", error)
      throw error
    }
  }

  static async updateProduct(id, updateData) {
    try {
      // Transform variants to use direct values
      const transformedData = {
        id,
        ...updateData,
        variants: Array.isArray(updateData.variants)
          ? updateData.variants.map((variant) => {
              if (updateData.is_microfiber) {
                return {
                  gsm: variant.gsm || "",
                  size: variant.size || "",
                  color: variant.color || "",
                  price: Number.parseFloat(variant.price) || 0,
                  stock: Number.parseInt(variant.stock) || 0,
                  compareAtPrice: variant.compareAtPrice || null,
                }
              } else {
                return {
                  quantity: variant.quantity || "",
                  unit: variant.unit || "ml",
                  price: Number.parseFloat(variant.price) || 0,
                  stock: Number.parseInt(variant.stock) || 0,
                  compareAtPrice: variant.compareAtPrice || null,
                }
              }
            })
          : [],
        subcategory_names: Array.isArray(updateData.subcategory_names)
          ? updateData.subcategory_names
          : updateData.subcategory_names
            ? [updateData.subcategory_names]
            : [],
      }

      const res = await fetch(API_BASE_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return this.transformProductData(json.product || json)
    } catch (error) {
      console.error("Error in updateProduct:", error)
      throw error
    }
  }

  static async deleteProduct(id) {
    try {
      const res = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in deleteProduct:", error)
      throw error
    }
  }

  // ============= CATEGORIES =============

  static async getCategories() {
    try {
      const res = await fetch(CATEGORIES_API)

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in getCategories:", error)
      throw error
    }
  }

  static async createCategory(data) {
    try {
      const res = await fetch(CATEGORIES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in createCategory:", error)
      throw error
    }
  }

  static async updateCategory(id, data) {
    try {
      const res = await fetch(CATEGORIES_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in updateCategory:", error)
      throw error
    }
  }

  static async deleteCategory(id) {
    try {
      const res = await fetch(`${CATEGORIES_API}?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in deleteCategory:", error)
      throw error
    }
  }

  // ============= SIZES =============

  static async getSizes() {
    try {
      const res = await fetch(SIZES_API)

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in getSizes:", error)
      throw error
    }
  }

  static async createSize(data) {
    try {
      const res = await fetch(SIZES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in createSize:", error)
      throw error
    }
  }

  static async updateSize(id, data) {
    try {
      const res = await fetch(SIZES_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in updateSize:", error)
      throw error
    }
  }

  static async deleteSize(id) {
    try {
      const res = await fetch(`${SIZES_API}?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in deleteSize:", error)
      throw error
    }
  }

  // ============= COLORS =============

  static async getColors() {
    try {
      const res = await fetch(COLORS_API)

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in getColors:", error)
      throw error
    }
  }

  static async createColor(data) {
    try {
      const res = await fetch(COLORS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in createColor:", error)
      throw error
    }
  }

  static async updateColor(id, data) {
    try {
      const res = await fetch(COLORS_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in updateColor:", error)
      throw error
    }
  }

  static async deleteColor(id) {
    try {
      const res = await fetch(`${COLORS_API}?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const json = await res.json()
      return json
    } catch (error) {
      console.error("Error in deleteColor:", error)
      throw error
    }
  }

  // ============= PRODUCTS BY CATEGORY =============

  static async getProductsByCategory(categoryName, { limit, sort, filters = {} } = {}) {
    try {
      if (!categoryName || categoryName === "all") {
        console.log("getProductsByCategory: Category not specified or 'all', calling getProducts.")
        return this.getProducts({ limit, sort, filters })
      }

      console.log("getProductsByCategory: Fetching for category:", categoryName, "with filters:", filters)

      const combinedFilters = { ...filters, category: categoryName }
      return this.getProducts({ limit, sort, filters: combinedFilters })
    } catch (error) {
      console.error("Error in getProductsByCategory:", error)
      throw error
    }
  }

  // ============= KITS & COMBOS =============

  static async getKitsAndCombos({ limit, sort, filters = {} } = {}) {
    try {
      const params = new URLSearchParams()
      if (limit) params.append("limit", limit)

      const url = params.toString() ? `/api/products/kits?${params}` : `/api/products/kits`
      console.log("Fetching kits from URL:", url)

      const res = await fetch(url)

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `API error: ${res.status}`)
        } catch (e) {
          throw new Error(`API error: ${errorText || res.statusText || res.status}`)
        }
      }

      const data = await res.json()
      console.log("Raw API response for kits:", data)

      const products = Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : []
      const total = data.total || products.length

      const transformedProducts = products.map((product) => this.transformProductData(product))

      return {
        success: data.success || true,
        products: transformedProducts,
        total: total,
      }
    } catch (error) {
      console.error("Error in getKitsAndCombos:", error)
      throw error
    }
  }

  // ============= DATA TRANSFORMATION =============

  static transformProductData(product) {
    if (!product) return null

    // Handle category data from direct fields
    let categoryData = null
    if (product.category_name) {
      categoryData = {
        name: product.category_name,
        slug: product.category_name.toLowerCase().replace(/\s+/g, "-"),
      }
    }

    // Handle subcategory data from direct field
    let subcategories = []
    if (product.subcategory_names) {
      if (Array.isArray(product.subcategory_names)) {
        subcategories = product.subcategory_names.map((name) => ({
          name: name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
        }))
      } else if (typeof product.subcategory_names === "string") {
        subcategories = [
          {
            name: product.subcategory_names,
            slug: product.subcategory_names.toLowerCase().replace(/\s+/g, "-"),
          },
        ]
      }
    }

    // Transform variants to use direct values
    const transformedVariants = Array.isArray(product.variants)
      ? product.variants.map((variant) => {
          if (product.is_microfiber) {
            return {
              id: variant.id,
              size: variant.size || "",
              color: variant.color || "",
              gsm: variant.gsm || "",
              price: variant.price || 0,
              stock: variant.stock || 0,
              compareAtPrice: variant.compare_at_price || variant.compareAtPrice || null,
              sku: variant.sku || "",
              barcode: variant.barcode || "",
              weight: variant.weight || 0,
              dimensions: variant.dimensions || {},
              images: variant.images || [],
            }
          } else {
            return {
              id: variant.id,
              quantity: variant.quantity || "",
              unit: variant.unit || "",
              price: variant.price || 0,
              stock: variant.stock || 0,
              compareAtPrice: variant.compare_at_price || variant.compareAtPrice || null,
              sku: variant.sku || "",
              barcode: variant.barcode || "",
              weight: variant.weight || 0,
              dimensions: variant.dimensions || {},
              images: variant.images || [],
            }
          }
        })
      : []

    // Clean up the product object
    const cleanProduct = { ...product }
    // Remove any legacy fields that might still exist
    delete cleanProduct.category
    delete cleanProduct.categories
    delete cleanProduct.main_category
    delete cleanProduct.product_subcategories

    return {
      ...cleanProduct,
      category: categoryData,
      main_category: categoryData, // Keep for compatibility
      subcategories: subcategories,
      variants: transformedVariants,

      // Ensure core fields are present
      id: product.id || null,
      product_code: product.product_code || "",
      name: product.name || "Unnamed Product",
      description: product.description || "",
      is_microfiber: product.is_microfiber || false,
      main_image_url: product.main_image_url || "/placeholder.svg",
      images: Array.isArray(product.images) ? product.images : product.main_image_url ? [product.main_image_url] : [],
      key_features: Array.isArray(product.key_features) ? product.key_features : [],
      taglines: Array.isArray(product.taglines) ? product.taglines : [],
      reviews: Array.isArray(product.reviews) ? product.reviews : [],
      averageRating:
        typeof product.averageRating === "number"
          ? product.averageRating
          : Array.isArray(product.reviews) && product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
            : 0,
      created_at: product.created_at || null,
      updated_at: product.updated_at || null,
    }
  }

  // ============= UTILITY METHODS =============

  static formatProductForDisplay(product) {
    if (!product) return null

    const transformedProduct = this.transformProductData(product)
    if (!transformedProduct || !transformedProduct.id) return null

    const variants = transformedProduct.variants || []
    const totalStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
    const availableVariants = variants.filter((v) => (v.stock || 0) > 0).length
    const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price || 0)) : 0
    const maxPrice = variants.length > 0 ? Math.max(...variants.map((v) => v.price || 0)) : 0

    return {
      ...transformedProduct,
      totalStock,
      availableVariants,
      minPrice,
      maxPrice,
    }
  }

  static extractProducts(response) {
    if (!response) return []
    if (Array.isArray(response.products)) {
      return response.products
    }
    if (Array.isArray(response.data)) {
      return response.data
    }
    if (Array.isArray(response)) {
      return response
    }
    return []
  }

  static extractTotalCount(response) {
    if (response && typeof response.total === "number") {
      return response.total
    }
    return this.extractProducts(response).length
  }

  static hasCategoryData(product) {
    return (
      product && product.category_name !== undefined && product.category_name !== null && product.category_name !== ""
    )
  }

  static getLowestPrice(variants) {
    if (!Array.isArray(variants) || variants.length === 0) return 0
    return Math.min(...variants.map((v) => Number.parseFloat(v.price) || 0))
  }

  static getHighestPrice(variants) {
    if (!Array.isArray(variants) || variants.length === 0) return 0
    return Math.max(...variants.map((v) => Number.parseFloat(v.price) || 0))
  }
}
