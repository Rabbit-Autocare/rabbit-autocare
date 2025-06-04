export class FilterService {
  /**
   * Filter products based on multiple criteria
   * @param {Array} products - Array of products to filter
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered products
   */
  static filterProducts(products, filters = {}) {
    if (!products || !Array.isArray(products)) return [];

    return products.filter(product => {
      // Price filter
      if (filters.min_price !== undefined || filters.max_price !== undefined) {
        const minPrice = Number(filters.min_price) || 0;
        const maxPrice = Number(filters.max_price) || Infinity;
        const productPrice = this.getProductPrice(product);

        if (productPrice < minPrice || productPrice > maxPrice) {
          return false;
        }
      }

      // Rating filter
      if (filters.min_rating) {
        if ((product.rating || 0) < filters.min_rating) {
          return false;
        }
      }

      // Category filter - Updated to handle joined category data
      if (filters.categories && filters.categories.length > 0) {
        const productCategories = this.getProductCategories(product);
        const hasMatchingCategory = filters.categories.some(cat =>
          productCategories.some(pc => this.matchesCategory(pc, cat))
        );

        if (!hasMatchingCategory) {
          return false;
        }
      }

      // Size filter
      if (filters.sizes && filters.sizes.length > 0) {
        const productSizes = this.getProductSizes(product);
        const hasMatchingSize = filters.sizes.some(size =>
          productSizes.includes(size)
        );

        if (!hasMatchingSize) {
          return false;
        }
      }

      // Color filter
      if (filters.colors && filters.colors.length > 0) {
        const productColors = this.getProductColors(product);
        const hasMatchingColor = filters.colors.some(color =>
          productColors.includes(color)
        );

        if (!hasMatchingColor) {
          return false;
        }
      }

      // GSM filter
      if (filters.gsm && filters.gsm.length > 0) {
        const productGsm = this.getProductGsm(product);
        const hasMatchingGsm = filters.gsm.some(gsm =>
          productGsm.includes(gsm)
        );

        if (!hasMatchingGsm) {
          return false;
        }
      }

      // Quantity filter
      if (filters.quantities && filters.quantities.length > 0) {
        const productQuantities = this.getProductQuantities(product);
        const hasMatchingQuantity = filters.quantities.some(quantity =>
          productQuantities.includes(quantity)
        );

        if (!hasMatchingQuantity) {
          return false;
        }
      }

      // In stock filter
      if (filters.in_stock) {
        const isInStock = this.isProductInStock(product);
        if (!isInStock) {
          return false;
        }
      }

      // Microfiber filter
      if (filters.is_microfiber !== undefined) {
        if (product.is_microfiber !== filters.is_microfiber) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Build filter parameters for API calls
   * @param {Object} params - Filter parameters
   * @returns {Object} API-ready filter object
   */
  static buildFilters(params = {}) {
    const filters = {};

    // Price
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      if (params.minPrice !== undefined) filters.min_price = params.minPrice;
      if (params.maxPrice !== undefined) filters.max_price = params.maxPrice;
    }

    // Category
    if (params.selectedCategories?.length > 0) {
      filters.categories = params.selectedCategories;
    }

    // Rating
    if (params.selectedRating) {
      filters.min_rating = params.selectedRating;
    }

    // Size
    if (params.selectedSize?.length > 0) {
      filters.sizes = params.selectedSize;
    }

    // Color
    if (params.selectedColor?.length > 0) {
      filters.colors = params.selectedColor;
    }

    // GSM
    if (params.selectedGsm?.length > 0) {
      filters.gsm = params.selectedGsm;
    }

    // Quantity
    if (params.selectedQuantity?.length > 0) {
      filters.quantities = params.selectedQuantity;
    }

    // In stock
    if (params.inStockOnly) {
      filters.in_stock = true;
    }

    // Microfiber
    if (params.isMicrofiber !== undefined) {
      filters.is_microfiber = params.isMicrofiber;
    }

    return filters;
  }

  // Helper methods - Updated to handle joined data

  static getProductPrice(product) {
    if (product.price !== undefined) return Number(product.price);
    if (product.variants?.length > 0) {
      return Math.min(...product.variants.map(v => Number(v.price || 0)));
    }
    return 0;
  }

  /**
   * Extract category information from product - Updated for joined data
   * Handles the category data from the API join operation
   */
  static getProductCategories(product) {
    const categories = [];

    // Priority 1: Handle transformed 'category' field (from ProductService transformation)
    if (product.category && typeof product.category === 'object') {
      if (product.category.slug) categories.push(product.category.slug);
      if (product.category.id) categories.push(product.category.id);
      if (product.category.name) categories.push(product.category.name.toLowerCase().replace(/\s+/g, '-'));
    }

    // Priority 2: Handle 'main_category' field (from ProductService transformation)
    if (product.main_category && typeof product.main_category === 'object') {
      if (product.main_category.slug) categories.push(product.main_category.slug);
      if (product.main_category.id) categories.push(product.main_category.id);
      if (product.main_category.name) categories.push(product.main_category.name.toLowerCase().replace(/\s+/g, '-'));
    }

    // Priority 3: Handle main_category_id (direct ID reference)
    if (product.main_category_id && !categories.length) {
      categories.push(product.main_category_id);
    }

    // Priority 4: Handle legacy 'categories' field (should be cleaned up by ProductService)
    if (product.categories && typeof product.categories === 'object' && !categories.length) {
      if (product.categories.slug) categories.push(product.categories.slug);
      if (product.categories.id) categories.push(product.categories.id);
      if (product.categories.name) categories.push(product.categories.name.toLowerCase().replace(/\s+/g, '-'));
    }

    // Handle subcategories
    if (product.subcategories && Array.isArray(product.subcategories)) {
      product.subcategories.forEach(subcat => {
        if (subcat.category && typeof subcat.category === 'object') {
          if (subcat.category.slug) categories.push(subcat.category.slug);
          if (subcat.category.id) categories.push(subcat.category.id);
          if (subcat.category.name) categories.push(subcat.category.name.toLowerCase().replace(/\s+/g, '-'));
        } else if (subcat.category_id) {
          categories.push(subcat.category_id);
        }
      });
    }

    return [...new Set(categories)]; // Remove duplicates
  }

  static getProductSizes(product) {
    if (product.sizes && Array.isArray(product.sizes)) return product.sizes;
    if (product.variants?.length > 0) {
      return [...new Set(product.variants.map(v => v.size).filter(Boolean))];
    }
    if (product.size) return [product.size];
    return [];
  }

  static getProductColors(product) {
    if (product.colors && Array.isArray(product.colors)) return product.colors;
    if (product.variants?.length > 0) {
      return [...new Set(product.variants.map(v => v.color).filter(Boolean))];
    }
    if (product.color) return [product.color];
    return [];
  }

  static getProductGsm(product) {
    if (product.gsm && Array.isArray(product.gsm)) return product.gsm;
    if (product.variants?.length > 0) {
      return [...new Set(product.variants.map(v => v.gsm).filter(Boolean))];
    }
    if (product.gsm) return [product.gsm];
    return [];
  }

  static getProductQuantities(product) {
    if (product.quantities && Array.isArray(product.quantities)) return product.quantities;
    if (product.variants?.length > 0) {
      return [...new Set(product.variants.map(v => v.quantity).filter(Boolean))];
    }
    if (product.quantity) return [product.quantity];
    return [];
  }

  static isProductInStock(product) {
    // Check main stock_quantity field
    if (product.stock_quantity !== undefined) return Number(product.stock_quantity) > 0;

    // Check legacy stock field
    if (product.stock !== undefined) return Number(product.stock) > 0;

    // Check variants
    if (product.variants?.length > 0) {
      return product.variants.some(v => Number(v.stock || v.stock_quantity || 0) > 0);
    }

    return true; // Default to true if no stock info available
  }

  /**
   * Enhanced category matching to handle joined data
   */
  static matchesCategory(productCategory, requestedCategory) {
    if (!productCategory || !requestedCategory) return false;

    // Direct match
    if (productCategory === requestedCategory) return true;

    // Convert to string and lowercase for comparison
    const prodCat = String(productCategory).toLowerCase().trim();
    const reqCat = String(requestedCategory).toLowerCase().trim();

    if (prodCat === reqCat) return true;

    // Handle common category variations and slug mappings
    const categoryMap = {
      'microfiber': ['microfiber-cloth', 'microfiber cloth', 'microfiber_cloth', 'microfiber-cloths'],
      'car-interior': ['car interior', 'interior', 'car_interior', 'car interior care'],
      'car-exterior': ['car exterior', 'exterior', 'car_exterior', 'car exterior care'],
      'kits-combos': ['kits', 'combos', 'kits & combos', 'kits_combos', 'kits and combos'],
      'accessories': ['accessory', 'car accessories', 'auto accessories'],
    };

    // Check if requested category has variations
    if (categoryMap[reqCat]) {
      return categoryMap[reqCat].some(variation =>
        prodCat.includes(variation) || variation.includes(prodCat)
      );
    }

    // Check reverse mapping
    for (const [key, variations] of Object.entries(categoryMap)) {
      if (variations.includes(reqCat) && (prodCat === key || prodCat.includes(key))) {
        return true;
      }
      if (variations.includes(prodCat) && (reqCat === key || reqCat.includes(key))) {
        return true;
      }
    }

    // Partial matching for slugs and names
    if (prodCat.includes(reqCat) || reqCat.includes(prodCat)) {
      return true;
    }

    return false;
  }

  /**
   * Validate that products have proper category data after API join
   */
  static validateProductCategoryData(products) {
    if (!Array.isArray(products)) return false;

    return products.every(product => {
      const categories = this.getProductCategories(product);
      return categories.length > 0;
    });
  }

  /**
   * Debug helper to inspect category data structure
   */
  static debugProductCategories(product) {
    return {
      main_category_id: product.main_category_id,
      main_category: product.main_category,
      category: product.category,
      categories: product.categories, // Should be undefined after ProductService transformation
      subcategories: product.subcategories,
      extracted_categories: this.getProductCategories(product)
    };
  }
}
