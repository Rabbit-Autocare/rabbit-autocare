import { supabase } from '@/lib/supabaseClient';

/**
 * Transform cart items into a comprehensive format for checkout
 * This function fetches complete product/kit/combo details and organizes them for order summary
 */
export async function transformCartForCheckout(cartItems, userId) {
  try {
    console.log('transformCartForCheckout: Starting transformation with cartItems:', cartItems);

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.log('transformCartForCheckout: No cart items to transform');
      return [];
    }

    const transformedItems = [];

    for (const cartItem of cartItems) {
      console.log('Processing cart item:', cartItem);

      try {
        if (cartItem.product_id) {
          // Handle regular products
          const productData = await transformProductItem(cartItem);
          if (productData) {
            transformedItems.push(productData);
          }
        } else if (cartItem.combo_id) {
          // Handle combos
          const comboData = await transformComboItem(cartItem);
          if (comboData) {
            transformedItems.push(comboData);
          }
        } else if (cartItem.kit_id) {
          // Handle kits
          const kitData = await transformKitItem(cartItem);
          if (kitData) {
            transformedItems.push(kitData);
          }
        } else {
          console.warn('transformCartForCheckout: Unknown cart item type:', cartItem);
        }
      } catch (itemError) {
        console.error('Error transforming individual cart item:', itemError, cartItem);
        // Continue with other items even if one fails
      }
    }

    console.log('transformCartForCheckout: Transformed items:', transformedItems);
    return transformedItems;
  } catch (error) {
    console.error('Error transforming cart for checkout:', error);
    throw error;
  }
}

/**
 * Transform a product cart item with complete details
 */
async function transformProductItem(cartItem) {
  try {
    // Fetch complete product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', cartItem.product_id)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      return null;
    }

    // Parse variant data
    let variantDetails = null;
    let variantPrice = product.price || 0;
    let variantDisplayText = 'Default';

    if (cartItem.variant) {
      try {
        const variant = typeof cartItem.variant === 'string'
          ? JSON.parse(cartItem.variant)
          : cartItem.variant;

        variantDetails = {
          id: variant.id,
          size: variant.size,
          color: variant.color,
          gsm: variant.gsm,
          quantity_value: variant.quantity_value,
          unit: variant.unit,
          is_package: variant.is_package,
          package_quantity: variant.package_quantity,
          stock: variant.stock,
          price: variant.price || product.price
        };

        // Generate display text
        const parts = [];
        if (variant.color) parts.push(variant.color);
        if (variant.size) parts.push(variant.size);
        if (variant.gsm) parts.push(`${variant.gsm} GSM`);
        if (variant.quantity_value && variant.unit) {
          parts.push(`${variant.quantity_value} ${variant.unit}`);
        }
        if (variant.is_package && variant.package_quantity) {
          parts.push(`Package of ${variant.package_quantity}`);
        }

        variantDisplayText = parts.length > 0 ? parts.join(' / ') : 'Default';
        variantPrice = variant.price || product.price;
      } catch (parseError) {
        console.error('Error parsing variant:', parseError);
      }
    }

    return {
      id: cartItem.id,
      type: 'product',
      product_id: product.id,
      product_code: product.product_code,
      name: product.name,
      description: product.description,
      main_image_url: product.main_image_url,
      images: product.images,
      variant: variantDetails,
      variant_display_text: variantDisplayText,
      price: variantPrice,
      quantity: cartItem.quantity,
      total_price: variantPrice * cartItem.quantity,
      is_microfiber: product.is_microfiber,
      key_features: product.key_features,
      taglines: product.taglines,
      category_name: product.category_name
    };
  } catch (error) {
    console.error('Error transforming product item:', error);
    return null;
  }
}

/**
 * Transform a combo cart item with complete details
 */
async function transformComboItem(cartItem) {
  try {
    // Fetch complete combo details
    const { data: combo, error: comboError } = await supabase
      .from('combos')
      .select('*')
      .eq('id', cartItem.combo_id)
      .single();

    if (comboError) {
      console.error('Error fetching combo:', comboError);
      return null;
    }

    // Fetch combo products
    const { data: comboProducts, error: productsError } = await supabase
      .from('combo_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('combo_id', cartItem.combo_id);

    if (productsError) {
      console.error('Error fetching combo products:', productsError);
      return null;
    }

    // Parse included variants
    let includedVariants = [];
    if (cartItem.variant && Array.isArray(cartItem.variant)) {
      includedVariants = cartItem.variant.map(variant => {
        const comboProduct = comboProducts.find(cp => cp.product_id === variant.product_id);
        return {
          product_id: variant.product_id,
          product_name: comboProduct?.product?.name || 'Unknown Product',
          product_code: comboProduct?.product?.product_code,
          variant_id: variant.variant_id,
          quantity: variant.quantity,
          variant_details: variant
        };
      });
    }

    return {
      id: cartItem.id,
      type: 'combo',
      combo_id: combo.id,
      name: combo.name,
      description: combo.description,
      main_image_url: combo.main_image_url,
      images: combo.images,
      price: combo.price,
      original_price: combo.original_price,
      discount_percentage: combo.discount_percentage,
      quantity: cartItem.quantity,
      total_price: combo.price * cartItem.quantity,
      included_products: comboProducts.map(cp => ({
        product_id: cp.product_id,
        product_name: cp.product?.name,
        product_code: cp.product?.product_code,
        variant_id: cp.variant_id,
        quantity: cp.quantity
      })),
      included_variants: includedVariants
    };
  } catch (error) {
    console.error('Error transforming combo item:', error);
    return null;
  }
}

/**
 * Transform a kit cart item with complete details
 */
async function transformKitItem(cartItem) {
  try {
    // Fetch complete kit details
    const { data: kit, error: kitError } = await supabase
      .from('kits')
      .select('*')
      .eq('id', cartItem.kit_id)
      .single();

    if (kitError) {
      console.error('Error fetching kit:', kitError);
      return null;
    }

    // Fetch kit products
    const { data: kitProducts, error: productsError } = await supabase
      .from('kit_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('kit_id', cartItem.kit_id);

    if (productsError) {
      console.error('Error fetching kit products:', productsError);
      return null;
    }

    // Parse included variants
    let includedVariants = [];
    if (cartItem.variant && Array.isArray(cartItem.variant)) {
      includedVariants = cartItem.variant.map(variant => {
        const kitProduct = kitProducts.find(kp => kp.product_id === variant.product_id);
        return {
          product_id: variant.product_id,
          product_name: kitProduct?.product?.name || 'Unknown Product',
          product_code: kitProduct?.product?.product_code,
          variant_id: variant.variant_id,
          quantity: variant.quantity,
          variant_details: variant
        };
      });
    }

    return {
      id: cartItem.id,
      type: 'kit',
      kit_id: kit.id,
      name: kit.name,
      description: kit.description,
      main_image_url: kit.main_image_url,
      images: kit.images,
      price: kit.price,
      original_price: kit.original_price,
      discount_percentage: kit.discount_percentage,
      quantity: cartItem.quantity,
      total_price: kit.price * cartItem.quantity,
      included_products: kitProducts.map(kp => ({
        product_id: kp.product_id,
        product_name: kp.product?.name,
        product_code: kp.product?.product_code,
        variant_id: kp.variant_id,
        quantity: kp.quantity
      })),
      included_variants: includedVariants
    };
  } catch (error) {
    console.error('Error transforming kit item:', error);
    return null;
  }
}

/**
 * Calculate order totals with coupon discount
 */
export function calculateOrderTotals(transformedItems, coupon = null) {
  const subtotal = transformedItems.reduce((sum, item) => sum + item.total_price, 0);

  let discount = 0;
  let discountPercentage = 0;

  if (coupon) {
    discountPercentage = coupon.value || 0;
    discount = (subtotal * discountPercentage) / 100;
  }

  const grandTotal = Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    discountPercentage,
    grandTotal,
    itemCount: transformedItems.length,
    totalQuantity: transformedItems.reduce((sum, item) => sum + item.quantity, 0)
  };
}

/**
 * Format price for display
 */
export function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
