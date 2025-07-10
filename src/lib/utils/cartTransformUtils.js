import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();

/**
 * Transform cart items into a comprehensive format for checkout
 * This function fetches complete product/kit/combo details and organizes them for order summary
 */
export async function transformCartForCheckout(cartItems, userId) {
  try {
    // console.log('transformCartForCheckout: Starting transformation with cartItems:', cartItems);

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

    // console.log('transformCartForCheckout: Transformed items:', transformedItems);
    return transformedItems;
  } catch (error) {
    console.error('Error transforming cart for checkout:', error);
    throw error;
  }
}

/**
 * Transform a product cart item with complete details
 */
async function fetchVariantById(variantId) {
  if (!variantId) return null;
  const { data, error } = await supabase.from('variants').select('*').eq('id', variantId).single();
  if (error) {
    console.error('Error fetching variant:', error);
    return null;
  }
  return data;
}

async function transformProductItem(cartItem) {
  try {
    // Fetch complete product details (new schema)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', cartItem.product_id)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      return null;
    }

    // Always fetch the latest variant data from product_variants
    let variantDetails = null;
    if (cartItem.variant && cartItem.variant.id) {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', cartItem.variant.id)
        .single();
      if (variantError) {
        console.error('Error fetching product variant:', variantError);
        // Fallback to cartItem.variant if DB fetch fails
        variantDetails = cartItem.variant;
      } else {
        variantDetails = variant;
      }
    } else {
      variantDetails = cartItem.variant || null;
    }

    // Compose display text for variant
    let variantDisplayText = 'Default';
    if (variantDetails) {
      if (product.product_type === 'microfiber') {
        const size = variantDetails.size ? `${variantDetails.size}` : '';
        const color = variantDetails.color ? `${variantDetails.color}` : '';
        const gsm = variantDetails.gsm ? `${variantDetails.gsm}gsm` : '';
        variantDisplayText = [size, color, gsm].filter(Boolean).join(', ');
      } else if (variantDetails.quantity && variantDetails.unit) {
        variantDisplayText = `${variantDetails.quantity}${variantDetails.unit}`;
      } else if (variantDetails.variant_code) {
        variantDisplayText = `Code: ${variantDetails.variant_code}`;
      } else if (variantDetails.id) {
        variantDisplayText = `Variant ID: ${variantDetails.id}`;
      }
    }

    // Use correct price fields from new schema
    let variantPrice = 0;
    if (variantDetails) {
      variantPrice = Number(variantDetails.base_price) || Number(variantDetails.price) || 0;
    }

    // Compose the returned object using only valid columns
    return {
      id: cartItem.id,
      type: 'product',
      product_id: product.id,
      product_code: product.product_code,
      name: product.name,
      description: product.description,
      product_type: product.product_type,
      category: product.category,
      subcategory: product.subcategory,
      hsn_code: product.hsn_code,
      features: product.features,
      usage_instructions: product.usage_instructions,
      warnings: product.warnings,
      main_image_url: product.main_image_url,
      images: product.images,
      taglines: product.taglines,
      variant: variantDetails,
      variant_display_text: variantDisplayText,
      price: variantPrice,
      base_price: variantDetails?.base_price ?? null,
      base_price_excluding_gst: variantDetails?.base_price_excluding_gst ?? null,
      compare_at_price: variantDetails?.compare_at_price ?? null,
      quantity: cartItem.quantity,
      total_price: variantPrice * cartItem.quantity,
      stock: variantDetails?.stock ?? null,
      is_active: variantDetails?.is_active ?? null,
      weight_grams: variantDetails?.weight_grams ?? null,
      gsm: variantDetails?.gsm ?? null,
      size: variantDetails?.size ?? null,
      color: variantDetails?.color ?? null,
      color_hex: variantDetails?.color_hex ?? null,
      unit: variantDetails?.unit ?? null,
      dimensions: variantDetails?.dimensions ?? null,
      variant_code: variantDetails?.variant_code ?? null,
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
    const { data: combo, error: comboError } = await supabase
      .from('combos')
      .select('*')
      .eq('id', cartItem.combo_id)
      .single();
    if (comboError) {
      console.error('Error fetching combo:', comboError);
      return null;
    }
    const { data: comboProducts, error: productsError } = await supabase
      .from('combo_products')
      .select(`*, product:products(*)`)
      .eq('combo_id', cartItem.combo_id);
    if (productsError) {
      console.error('Error fetching combo products:', productsError);
      return null;
    }
    // Fetch and attach variant details for each included product
    const includedProducts = await Promise.all(
      comboProducts.map(async (cp) => {
        let variant = null;
        if (cp.variant_id) {
          const { data: v, error: vErr } = await supabase.from('product_variants').select('*').eq('id', cp.variant_id).single();
          if (!vErr) variant = v;
        }
        return {
          product_id: cp.product_id,
          product_name: cp.product?.name,
          product_code: cp.product?.product_code,
          variant_id: cp.variant_id,
          variant,
          is_microfiber: cp.product?.is_microfiber,
          quantity: cp.quantity
        };
      })
    );
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
      discount_percentage: combo.discount_percent ?? combo.discount_percentage ?? 0,
      quantity: cartItem.quantity,
      total_price: combo.price * cartItem.quantity,
      included_products: includedProducts,
      included_variants: []
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
    const { data: kit, error: kitError } = await supabase
      .from('kits')
      .select('*')
      .eq('id', cartItem.kit_id)
      .single();
    if (kitError) {
      console.error('Error fetching kit:', kitError);
      return null;
    }
    const { data: kitProducts, error: productsError } = await supabase
      .from('kit_products')
      .select(`*, product:products(*)`)
      .eq('kit_id', cartItem.kit_id);
    if (productsError) {
      console.error('Error fetching kit products:', productsError);
      return null;
    }
    // Fetch and attach variant details for each included product
    const includedProducts = await Promise.all(
      kitProducts.map(async (kp) => {
        let variant = null;
        if (kp.variant_id) {
          const { data: v, error: vErr } = await supabase.from('product_variants').select('*').eq('id', kp.variant_id).single();
          if (!vErr) variant = v;
        }
        return {
          product_id: kp.product_id,
          product_name: kp.product?.name,
          product_code: kp.product?.product_code,
          variant_id: kp.variant_id,
          variant,
          is_microfiber: kp.product?.is_microfiber,
          quantity: kp.quantity
        };
      })
    );
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
      discount_percentage: kit.discount_percent ?? kit.discount_percentage ?? 0,
      quantity: cartItem.quantity,
      total_price: kit.price * cartItem.quantity,
      included_products: includedProducts,
      included_variants: []
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
    discountPercentage = coupon.discount_percent || coupon.value || 0;
    discount = coupon.discount || ((subtotal * discountPercentage) / 100);
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
