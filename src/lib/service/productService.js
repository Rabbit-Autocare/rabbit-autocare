// Enhanced ProductService with direct category/subcategory storage

const API_BASE_URL = "/api/products"
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

  static async getProduct(productIdentifier, includeRelations = false) {
    try {
      const params = new URLSearchParams()
      const url = `${API_BASE_URL}/${productIdentifier}${params.toString() ? `?${params}` : ""}`
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
      // Add detailed logging for the fields in question
      console.log('Original data received:', {
        key_features: data.key_features,
        taglines: data.taglines,
        subcategory_names: data.subcategory_names
      });

      const transformedData = {
        ...data,
        variants: Array.isArray(data.variants)
          ? data.variants.map((variant) => ({
              id: variant.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              gsm: variant.gsm || "",
              size: variant.size || "",
              color: variant.color || "",
              color_hex: variant.color_hex || null,
              quantity: variant.quantity || "",
              unit: variant.unit || "ml",
              price: Number.parseFloat(variant.price) || 0,
              stock: Number.parseInt(variant.stock) || 0,
              compare_at_price: variant.compareAtPrice || null,
            }))
          : [],
        subcategory_names: Array.isArray(data.subcategory_names)
          ? data.subcategory_names
          : data.subcategory_names
            ? [data.subcategory_names]
            : [],
        key_features: Array.isArray(data.key_features) ? data.key_features : [],
        taglines: Array.isArray(data.taglines) ? data.taglines : [],
      }

      // Log the transformed data
      console.log('Transformed data being sent:', {
        key_features: transformedData.key_features,
        taglines: transformedData.taglines,
        subcategory_names: transformedData.subcategory_names
      });

      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      // Add detailed logging for the fields in question
      console.log('Original update data received:', {
        key_features: updateData.key_features,
        taglines: updateData.taglines,
        subcategory_names: updateData.subcategory_names
      });

      const transformedData = {
        id,
        ...updateData,
        variants: Array.isArray(updateData.variants)
          ? updateData.variants.map((variant) => ({
              id: variant.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              gsm: variant.gsm || "",
              size: variant.size || "",
              color: variant.color || "",
              color_hex: variant.color_hex || null,
              quantity: variant.quantity || "",
              unit: variant.unit || "ml",
              price: Number.parseFloat(variant.price) || 0,
              stock: Number.parseInt(variant.stock) || 0,
              compare_at_price: variant.compareAtPrice || null,
            }))
          : [],
        subcategory_names: Array.isArray(updateData.subcategory_names)
          ? updateData.subcategory_names
          : updateData.subcategory_names
            ? [updateData.subcategory_names]
            : [],
        key_features: Array.isArray(updateData.key_features) ? updateData.key_features : [],
        taglines: Array.isArray(updateData.taglines) ? updateData.taglines : [],
      }

      // Log the transformed data
      console.log('Transformed update data being sent:', {
        key_features: transformedData.key_features,
        taglines: transformedData.taglines,
        subcategory_names: transformedData.subcategory_names
      });

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
