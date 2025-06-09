// Enhanced ProductService with direct category/subcategory storage

const API_BASE_URL = "/api/products"
const SIZES_API = "/api/products/size"
const COLORS_API = "/api/products/colors"
const CATEGORIES_API = "/api/products/category"
const GETBYCATEGORY = "/api/products/by-category"
const GSM_API = "/api/products/gsm"
const QUANTITY_API = "/api/products/quantity"

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
                  id: variant.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  gsm: variant.gsm || "",
                  size: variant.size || "",
                  color: variant.color || "",
                  color_hex: variant.color_hex || null,
                  price: Number.parseFloat(variant.price) || 0,
                  stock: Number.parseInt(variant.stock) || 0,
                  compare_at_price: variant.compareAtPrice || null,
                }
              } else {
                return {
                  id: variant.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  quantity: variant.quantity || "",
                  unit: variant.unit || "ml",
                  color: variant.color || "",
                  color_hex: variant.color_hex || null,
                  price: Number.parseFloat(variant.price) || 0,
                  stock: Number.parseInt(variant.stock) || 0,
                  compare_at_price: variant.compareAtPrice || null,
                }
              }
            })
          : [],
      }

      // Log the transformed data for debugging
      console.log('Sending product data to API (from ProductService.createProduct):', JSON.stringify(transformedData, null, 2));

      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(transformedData),
      })

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', {
          status: res.status,
          statusText: res.statusText,
          errorText: errorText
        });

        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || `API error: ${res.status}`);
        } catch (e) {
          if (errorText) {
            throw new Error(`API error: ${errorText}`);
          } else {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
          }
        }
      }

      const json = await res.json();
      console.log('API Response:', json);
      return this.transformProductData(json.product || json);
    } catch (error) {
      console.error("Error in createProduct:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        data: data
      });
      throw error;
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
                  id: variant.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  gsm: variant.gsm || "",
                  size: variant.size || "",
                  color: variant.color || "",
                  color_hex: variant.color_hex || null,
                  price: Number.parseFloat(variant.price) || 0,
                  stock: Number.parseInt(variant.stock) || 0,
                  compare_at_price: variant.compareAtPrice || null,
                }
              } else {
                return {
                  id: variant.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  quantity: variant.quantity || "",
                  unit: variant.unit || "ml",
                  color: variant.color || "",
                  color_hex: variant.color_hex || null,
                  price: Number.parseFloat(variant.price) || 0,
                  stock: Number.parseInt(variant.stock) || 0,
                  compare_at_price: variant.compareAtPrice || null,
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

      // Log the transformed data for debugging
      console.log('Sending product data to API (from ProductService.updateProduct):', JSON.stringify(transformedData, null, 2));

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

  // ============= GSM MANAGEMENT =============

  static async getGSM() {
    try {
      const res = await fetch(GSM_API)
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
      return {
        success: true,
        data: Array.isArray(data) ? data : data.data || []
      }
    } catch (error) {
      console.error("Error in getGSM:", error)
      throw error
    }
  }

  static async createGsm(data) {
    try {
      const res = await fetch(GSM_API, {
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
      console.error("Error in createGsm:", error)
      throw error
    }
  }

  static async updateGsm(id, data) {
    try {
      const res = await fetch(GSM_API, {
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
      console.error("Error in updateGsm:", error)
      throw error
    }
  }

  static async deleteGsm(id) {
    try {
      const res = await fetch(`${GSM_API}?id=${id}`, {
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
      console.error("Error in deleteGsm:", error)
      throw error
    }
  }

  // ============= QUANTITY MANAGEMENT =============

  static async getQuantities() {
    try {
      const res = await fetch(QUANTITY_API)

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
      return {
        success: true,
        data: Array.isArray(data) ? data : data.data || []
      }
    } catch (error) {
      console.error("Error in getQuantities:", error)
      throw error
    }
  }

  static async createQuantity(data) {
    try {
      const res = await fetch(QUANTITY_API, {
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
      console.error("Error in createQuantity:", error)
      throw error
    }
  }

  static async updateQuantity(id, data) {
    try {
      const res = await fetch(QUANTITY_API, {
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
      console.error("Error in updateQuantity:", error)
      throw error
    }
  }

  static async deleteQuantity(id) {
    try {
      const res = await fetch(`${QUANTITY_API}?id=${id}`, {
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
      console.error("Error in deleteQuantity:", error)
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
    const transformedData = {
      ...product,
      category: product.category_name,
      subcategory: product.subcategory_name,
      variants: (product.variants || []).map(variant => {
        if (product.is_microfiber) {
          return {
            id: variant.id,
            gsm: variant.gsm,
            size: variant.size,
            color: variant.color,
            color_hex: variant.color_hex || null,
            stock: variant.stock || 0,
            price: variant.price || 0,
            compareAtPrice: variant.compare_at_price || null
          };
        } else {
          return {
            id: variant.id,
            quantity: variant.quantity,
            unit: variant.unit,
            color: variant.color,
            color_hex: variant.color_hex || null,
            stock: variant.stock || 0,
            price: variant.price || 0,
            compareAtPrice: variant.compare_at_price || null
          };
        }
      })
    };

    return transformedData;
  }

  generateVariantId() {
    return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
