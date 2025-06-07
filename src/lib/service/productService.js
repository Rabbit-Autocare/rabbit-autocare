import { supabase } from '@/lib/supabaseClient';
import variantService from './variantService';

const API_BASE_URL = "/api/products"
const SIZES_API = "/api/products/size"
const COLORS_API = "/api/products/colors"
const CATEGORIES_API = "/api/products/category"
const GETBYCATEGORY = "/api/products/by-category"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export class ProductService {
  // ============= PRODUCTS =============

  async getProducts({ limit = 10, offset = 0, sort = 'created_at:desc' } = {}) {
    try {
      const [sortField, sortOrder] = sort.split(':');

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          subcategory:subcategories(name),
          variants:product_variants(
            id,
            sku,
            price,
            stock_quantity,
            is_package,
            package_quantity,
            attributes:product_variant_attributes(
              variant_type:variant_types(name, display_name),
              variant_value:variant_values(value, display_value)
            )
          )
        `)
        .eq('is_active', true)
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Transform the data to include formatted variants
      const products = data.map(product => ({
        ...product,
        variants: product.variants.map(variant => ({
          ...variant,
          attributes: variant.attributes.reduce((acc, attr) => ({
            ...acc,
            [attr.variant_type.name]: {
              type: attr.variant_type.display_name,
              value: attr.variant_value.value,
              displayValue: attr.variant_value.display_value
            }
          }), {})
        }))
      }));

      return {
        success: true,
        products,
        total: products.length
      };
    } catch (error) {
      console.error('Error in getProducts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getProduct(productId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          subcategory:subcategories(name),
          variants:product_variants(
            id,
            sku,
            price,
            stock_quantity,
            is_package,
            package_quantity,
            attributes:product_variant_attributes(
              variant_type:variant_types(name, display_name),
              variant_value:variant_values(value, display_value)
            )
          )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Transform the data to include formatted variants
      const product = {
        ...data,
        variants: data.variants.map(variant => ({
          ...variant,
          attributes: variant.attributes.reduce((acc, attr) => ({
            ...acc,
            [attr.variant_type.name]: {
              type: attr.variant_type.display_name,
              value: attr.variant_value.value,
              displayValue: attr.variant_value.display_value
            }
          }), {})
        }))
      };

      return {
        success: true,
        product
      };
    } catch (error) {
      console.error('Error in getProduct:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createProduct(productData) {
    try {
      const {
        name,
        description,
        category_id,
        subcategory_id,
        product_code,
        has_variants,
        variants = []
      } = productData;

      // Create the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name,
          description,
          category_id,
          subcategory_id,
          product_code,
          has_variants,
          is_active: true
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create variants if provided
      if (variants.length > 0) {
        for (const variant of variants) {
          await variantService.createProductVariant(product.id, {
            ...variant,
            product_code
          });
        }
      }

      return {
        success: true,
        product
      };
    } catch (error) {
      console.error('Error in createProduct:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateProduct(productId, productData) {
    try {
      const {
        name,
        description,
        category_id,
        subcategory_id,
        product_code,
        has_variants,
        variants = []
      } = productData;

      // Update the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .update({
          name,
          description,
          category_id,
          subcategory_id,
          product_code,
          has_variants,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single();

      if (productError) throw productError;

      // Get existing variants
      const existingVariants = await variantService.getProductVariants(productId);

      // Delete variants that are no longer present
      const variantIdsToKeep = variants.map(v => v.id).filter(Boolean);
      for (const existingVariant of existingVariants) {
        if (!variantIdsToKeep.includes(existingVariant.id)) {
          await variantService.deleteProductVariant(existingVariant.id);
        }
      }

      // Update or create variants
      for (const variant of variants) {
        if (variant.id) {
          await variantService.updateProductVariant(variant.id, variant);
        } else {
          await variantService.createProductVariant(productId, {
            ...variant,
            product_code
          });
        }
      }

      return {
        success: true,
        product
      };
    } catch (error) {
      console.error('Error in updateProduct:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteProduct(productId) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= CATEGORIES =============

  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in getCategories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createCategory(data) {
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

  async updateCategory(id, data) {
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

  async deleteCategory(id) {
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

  async getSizes() {
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

  async createSize(data) {
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

  async updateSize(id, data) {
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

  async deleteSize(id) {
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

  async getColors() {
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

  async createColor(data) {
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

  async updateColor(id, data) {
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

  async deleteColor(id) {
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

  async getProductsByCategory(categoryName, { limit, sort, filters = {} } = {}) {
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

  async getKitsAndCombos({ limit, sort, filters = {} } = {}) {
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

  transformProductData(product) {
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

  formatProductForDisplay(product) {
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

  extractProducts(response) {
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

  extractTotalCount(response) {
    if (response && typeof response.total === "number") {
      return response.total
    }
    return this.extractProducts(response).length
  }

  hasCategoryData(product) {
    return (
      product && product.category_name !== undefined && product.category_name !== null && product.category_name !== ""
    )
  }

  getLowestPrice(variants) {
    if (!Array.isArray(variants) || variants.length === 0) return 0
    return Math.min(...variants.map((v) => Number.parseFloat(v.price) || 0))
  }

  getHighestPrice(variants) {
    if (!Array.isArray(variants) || variants.length === 0) return 0
    return Math.max(...variants.map((v) => Number.parseFloat(v.price) || 0))
  }

  async getProductById(productCode) {
    try {
      console.log("ProductService: Fetching product with code", productCode)

      // First, let's try the most specific endpoint format
      const url = `${API_BASE_URL}/${encodeURIComponent(productCode)}`
      console.log("ProductService: Trying specific product URL:", url)

      let res = await fetch(url)
      let data

      if (!res.ok) {
        console.log("ProductService: Specific URL failed, trying query parameter approach")

        // If specific URL fails, try query parameters
        const queryUrl = `${API_BASE_URL}?product_code=${encodeURIComponent(productCode)}`
        console.log("ProductService: Trying query URL:", queryUrl)

        res = await fetch(queryUrl)

        if (!res.ok) {
          // Try alternative parameter names
          const altQueryUrl = `${API_BASE_URL}?code=${encodeURIComponent(productCode)}`
          console.log("ProductService: Trying alternative query URL:", altQueryUrl)

          res = await fetch(altQueryUrl)

          if (!res.ok) {
            const errorText = await res.text()
            console.error("ProductService: All API attempts failed. Last error:", errorText)
            throw new Error(`Product with code ${productCode} not found in API`)
          }
        }
      }

      data = await res.json()
      console.log("ProductService: Full API Response for product code", productCode, data)

      // Handle different response formats and STRICTLY match product codes
      let productData = null

      if (Array.isArray(data.products) && data.products.length > 0) {
        productData = data.products.find((p) => p.product_code === productCode)
        console.log("ProductService: Searching in products array for", productCode)
      } else if (Array.isArray(data.data) && data.data.length > 0) {
        productData = data.data.find((p) => p.product_code === productCode)
        console.log("ProductService: Searching in data array for", productCode)
      } else if (Array.isArray(data) && data.length > 0) {
        productData = data.find((p) => p.product_code === productCode)
        console.log("ProductService: Searching in direct array for", productCode)
      } else if (data.product && data.product.product_code === productCode) {
        productData = data.product
        console.log("ProductService: Found product in product field")
      } else if (data.product_code === productCode) {
        productData = data
        console.log("ProductService: Using data directly - product code matches")
      }

      // CRITICAL: Don't use fallback products - only return exact matches
      if (!productData) {
        console.error("ProductService: No exact match found for product code:", productCode)
        console.error("ProductService: Available products:", data)
        throw new Error(`Product with code '${productCode}' not found`)
      }

      // Double-check the product code matches
      if (productData.product_code !== productCode) {
        console.error("ProductService: Product code verification failed!")
        console.error("ProductService: Expected:", productCode, "Got:", productData.product_code)
        throw new Error(`Product code mismatch: expected '${productCode}', got '${productData.product_code}'`)
      }

      console.log("ProductService: Successfully found exact match:", productData)
      return this.transformProductData(productData)
    } catch (error) {
      console.error("ProductService: Error fetching product:", error)
      throw error
    }
  }

  // Alternative method to get all products and filter client-side (fallback option)
  async getProductByIdClientFilter(productCode) {
    try {
      console.log("ProductService: Client-side filtering for product code", productCode)

      // Get all products
      const url = `${API_BASE_URL}`
      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const data = await res.json()
      console.log("ProductService: Got all products, filtering for", productCode)

      let allProducts = []
      if (Array.isArray(data.products)) {
        allProducts = data.products
      } else if (Array.isArray(data.data)) {
        allProducts = data.data
      } else if (Array.isArray(data)) {
        allProducts = data
      }

      const product = allProducts.find((p) => p.product_code === productCode)

      if (!product) {
        console.error("ProductService: Product not found in all products list")
        console.error(
          "ProductService: Available product codes:",
          allProducts.map((p) => p.product_code),
        )
        throw new Error(`Product with code '${productCode}' not found`)
      }

      console.log("ProductService: Found product via client-side filter:", product)
      return this.transformProductData(product)
    } catch (error) {
      console.error("ProductService: Client-side filter error:", error)
      throw error
    }
  }
}

export default new ProductService();
