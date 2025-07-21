'use client';
// import { supabase } from '@/lib/supabase/browser-client';
import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext.jsx';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { WishlistService } from '@/lib/service/wishlistService';
// import { FaShoppingCart } from 'react-icons/fa';
import ProductRating from '@/components/ui/ProductRating';
import { useToast } from '@/components/ui/CustomToast.jsx';
// ...existing imports...
console.log('FeaturedProductCard loaded!');
export default function FeaturedProductCard({
  product,
  className = '',
  isLastCard = false,
}) {
  // Only use user from useCart context
  const { addToCart, openCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [imageSlideMap, setImageSlideMap] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState({});
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  // const [selectedColor, setSelectedColor] = useState(null); // REMOVE for microfiber
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedPackSize, setSelectedPackSize] = useState(null);
  const [uniqueColorsAndSizes, setUniqueColorsAndSizes] = useState({
    colors: [],
    sizes: [],
  });
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const showToast = useToast();

  // console.log('[FeaturedProductCard] user from useCart:', user);

  // Deterministic pseudo-random generator based on a string seed
  function seededRandom(seed) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += h << 13; h ^= h >>> 7;
      h += h << 3; h ^= h >>> 17;
      h += h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
  }

  // Generate deterministic ratings array for a product
  function generateDeterministicRatings(product) {
    const seed = String(product.product_code || product.id || product.name || 'default');
    const rand = seededRandom(seed);
    const avg = Math.round((rand() * 0.6 + 4) * 10) / 10; // 4.0 to 4.6
    const ratings = Array(13).fill(0).map(() => 4 + Math.round(rand() * 2)); // 4, 5, or 6
    // Adjust to get close to target avg
    let currentAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    let i = 0;
    while (Math.abs(currentAvg - avg) > 0.05 && i < 100) {
      const idx = Math.floor(rand() * ratings.length);
      if (currentAvg > avg && ratings[idx] > 4) ratings[idx]--;
      if (currentAvg < avg && ratings[idx] < 5) ratings[idx]++;
      currentAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      i++;
    }
    return ratings;
  }

  const ratings = generateDeterministicRatings(product);

  // Debug: Log product data to check stock values
  // useEffect(() => {
  //   if (product?.product_type === 'microfiber') {
  //     console.log('🧽 Microfiber Product Debug:', {
  //       name: product.name,
  //       variants: product.variants?.map((v) => ({
  //         id: v.id,
  //         color: v.color,
  //         size: v.size,
  //         stock: v.stock,
  //         base_price: v.base_price,
  //       })),
  //     });
  //   }
  // }, [product]);

  // Check if product is microfiber category
  const isMicrofiber = useMemo(() => {
    return product?.product_type === 'microfiber';
  }, [product]);

  // Check if current product variant is in wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user || !product) return;
      try {
        let wishlistItem = null;
        if (product.combo_id) {
          const { data } = await WishlistService.getWishlist();
          wishlistItem = data?.find(item => item.combo_id === product.combo_id);
        } else if (product.kit_id) {
          const { data } = await WishlistService.getWishlist();
          wishlistItem = data?.find(item => item.kit_id === product.kit_id);
        } else {
          const { data } = await WishlistService.getWishlist();
          wishlistItem = data?.find(item => {
            if (item.product_id !== product.id) return false;
            // Compare variants
            const normalizeVariant = (v) => {
              if (!v) return null;
              const normalized = {};
              if (v.id) normalized.id = v.id;
              if (v.size) normalized.size = v.size;
              if (v.color) normalized.color = v.color;
              if (v.quantity_value) normalized.quantity_value = v.quantity_value;
              if (v.unit) normalized.unit = v.unit;
              if (v.gsm) normalized.gsm = v.gsm;
              if (v.is_package !== undefined) normalized.is_package = v.is_package;
              if (v.package_quantity) normalized.package_quantity = v.package_quantity;
              return normalized;
            };
            const currentVariant = isMicrofiber
              ? getVariantForCombination(selectedSize, selectedPackSize)
              : selectedVariant;
            const normalizedItemVariant = normalizeVariant(item.variant);
            const normalizedCurrentVariant = normalizeVariant(currentVariant);
            return JSON.stringify(normalizedItemVariant) === JSON.stringify(normalizedCurrentVariant);
          });
        }
        if (wishlistItem) {
          setIsWishlisted(true);
          setWishlistItemId(wishlistItem.id);
        } else {
          setIsWishlisted(false);
          setWishlistItemId(null);
        }
      } catch (error) {
        setIsWishlisted(false);
        setWishlistItemId(null);
      }
    };
    checkWishlistStatus();
  }, [user, product, selectedVariant, selectedSize, selectedPackSize, isMicrofiber]);

  // Get color for display (could be hex, color name, etc.)
  const getColorStyle = (color) => {
    // If it's a hex color, use it directly
    if (color?.startsWith('#')) {
      return { backgroundColor: color };
    }

    // Find the variant with this color to get its hex code
    const variant = product.variants?.find((v) => {
      if (Array.isArray(v.color)) {
        return v.color.includes(color);
      }
      return v.color === color;
    });

    if (variant?.color_hex) {
      let hexCode = variant.color_hex;
      if (Array.isArray(hexCode)) {
        hexCode = hexCode[0]; // Use first hex code
      }
      return { backgroundColor: hexCode };
    }

    // Color mapping for common color names to hex codes
    const colorMap = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#22c55e',
      yellow: '#eab308',
      purple: '#a855f7',
      pink: '#ec4899',
      orange: '#f97316',
      gray: '#6b7280',
      grey: '#6b7280',
      black: '#000000',
      white: '#ffffff',
      brown: '#a78bfa',
      navy: '#1e40af',
      teal: '#14b8a6',
      lime: '#84cc16',
      cyan: '#06b6d4',
      indigo: '#6366f1',
      emerald: '#10b981',
      rose: '#f43f5e',
      amber: '#f59e0b',
      violet: '#8b5cf6',
      sky: '#0ea5e9',
      slate: '#64748b',
    };

    // If it's a named color, use the mapping
    const lowerColor = color?.toLowerCase();
    if (colorMap[lowerColor]) {
      return { backgroundColor: colorMap[lowerColor] };
    }

    // Fallback to a default gray
    return { backgroundColor: '#6b7280' };
  };

  // Get unique colors and sizes for all products
  useEffect(() => {
    if (!product?.variants) {
      setUniqueColorsAndSizes({ colors: [], sizes: [] });
      return;
    }

    // Get unique colors with their hex codes
    const colorMap = new Map();
    product.variants.forEach((variant) => {
      // Handle both string and array color formats
      let colors = [];
      if (Array.isArray(variant.color)) {
        colors = variant.color;
      } else if (variant.color) {
        colors = [variant.color];
      }

      colors.forEach((color) => {
        if (color && !colorMap.has(color)) {
          // Handle both string and array color_hex formats
          let colorHex = null;
          if (Array.isArray(variant.color_hex)) {
            colorHex = variant.color_hex[0]; // Use first hex code
          } else if (variant.color_hex) {
            colorHex = variant.color_hex;
          }
          colorMap.set(color, colorHex);
        }
      });
    });
    const colors = Array.from(colorMap.keys());

    const sizes = [
      ...new Set(product.variants.map((v) => v.size).filter(Boolean)),
    ];

    setUniqueColorsAndSizes({ colors, sizes });
  }, [product?.variants]);

  const { colors, sizes } = uniqueColorsAndSizes;

  // Get all available variants (for non-microfiber products)
  const allVariants = useMemo(() => {
    if (!product.variants) return [];
    return product.variants;
  }, [product?.variants]);

  // Initialize with the highest-priced variant
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      // Find the highest-priced variant
      const highestPricedVariant = product.variants.reduce(
        (highest, current) => {
          const currentPrice =
            current.base_price || current.price || current.mrp || 0;
          const highestPrice =
            highest.base_price || highest.price || highest.mrp || 0;
          return currentPrice > highestPrice ? current : highest;
        }
      );
      setSelectedVariant(highestPricedVariant);
      if (isMicrofiber) {
        // For microfiber, set color, size, and default pack size
        if (highestPricedVariant.color) {
          // setSelectedColor(highestPricedVariant.color); // REMOVE for microfiber
        }
        if (highestPricedVariant.size) {
          setSelectedSize(highestPricedVariant.size);
        }
        const availablePackSizes = product.variants
          .filter((v) => {
            // const hasColor = Array.isArray(v.color) // REMOVE for microfiber
            //   ? v.color.includes(highestPricedVariant.color)
            //   : v.color === highestPricedVariant.color;
            return v.size === highestPricedVariant.size;
          })
          .map((v) => v.variant_code || v.code || v.id)
          .map((code) => code ? extractPackSize(code) : null)
          .filter((x) => x !== null && x !== undefined);
        if (availablePackSizes.length > 0) {
          setSelectedPackSize(availablePackSizes[0]);
        }
      }
    }
  }, [product, isMicrofiber]);

  // Get product images - prioritize thumbnails, fallback to images array, then main image
  const getProductImages = () => {
    if (product.thumbnails && product.thumbnails.length > 0) {
      return product.thumbnails;
    }
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    if (product.main_image_url) {
      return [product.main_image_url];
    }
    return ['/placeholder.svg?height=400&width=400'];
  };

  const thumbnails = getProductImages();
  const activeIndex = activeImageIndex[product.id] || 0;
  const activeSrc = thumbnails[activeIndex] || thumbnails[0];
  const slideData = imageSlideMap[product.id];
  const prevIndex = slideData?.from;
  const nextIndex = slideData?.to;
  const dir = slideData?.direction;

  // Get current price based on selected variant
  const getCurrentPrice = () => {
    if (selectedVariant) {
      return (
        selectedVariant.base_price ||
        selectedVariant.price ||
        selectedVariant.mrp ||
        0
      );
    }
    return product.base_price || product.price || product.mrp || 0;
  };

  // Helper to extract pack size from variant code (e.g., RX-MF-20A-1X => 1, RX-MF-20A-5X => 5)
  const extractPackSize = (variantCode) => {
    const match =
      typeof variantCode === 'string' ? variantCode.match(/-(\d+)X$/i) : null;
    return match ? parseInt(match[1], 10) : 1;
  };

  // Extract unique pack sizes for microfiber products
  const packSizes = useMemo(() => {
    if (!isMicrofiber || !product?.variants) return [];
    const sizes = product.variants
      .map((v) => {
        const code = v.variant_code || v.code || v.id;
        return code ? extractPackSize(code) : null;
      })
      .filter((x) => x !== null && x !== undefined);
    return Array.from(new Set(sizes)).sort((a, b) => a - b);
  }, [isMicrofiber, product?.variants]);

  // Get unique sizes for microfiber (no duplicates)
  const microfiberSizes = useMemo(() => {
    if (!isMicrofiber || !product?.variants) return [];
    return Array.from(new Set(product.variants.map(v => v.size).filter(Boolean)));
  }, [isMicrofiber, product?.variants]);

  // Debug: Log product data to check pack_size values
  useEffect(() => {
    if (product?.product_type === 'microfiber') {
      console.log('🧽 Microfiber Product Debug:', {
        name: product.name,
        variants: product.variants?.map((v) => ({
          id: v.id,
          size: v.size,
          pack_size: v.pack_size,
          stock: v.stock,
          base_price: v.base_price,
        })),
        selectedSize,
        selectedPackSize,
      });
    }
  }, [product, selectedSize, selectedPackSize]);

  // Get available pack sizes for the selected size (from pack_size field, sorted numerically)
  const availablePackSizesForSelectedSize = useMemo(() => {
    if (!isMicrofiber || !selectedSize || !product?.variants) return [];

    // Find all variants with the selected size
    const variantsForSize = product.variants.filter(v => v.size === selectedSize);
    console.log('🔍 Variants for size', selectedSize, ':', variantsForSize);

    // Extract pack sizes from their pack_size field or fallback to variant_code
    const packSizes = variantsForSize
      .map(v => {
        let packSize = null;

        // First try to use pack_size field
        if (v.pack_size !== null && v.pack_size !== undefined) {
          packSize = Number(v.pack_size);
          console.log('📦 Variant', v.id, 'using pack_size field:', v.pack_size, 'parsed:', packSize);
        } else {
          // Fallback to extracting from variant_code
          const code = v.variant_code || v.code || v.id;
          packSize = extractPackSize(code);
          console.log('📦 Variant', v.id, 'using variant_code fallback:', code, 'extracted:', packSize);
        }

        return packSize;
      })
      .filter(x => !isNaN(x) && x > 0);

    console.log('📦 Available pack sizes for', selectedSize, ':', packSizes);

    // Unique and sorted
    return Array.from(new Set(packSizes)).sort((a, b) => a - b);
  }, [isMicrofiber, selectedSize, product?.variants]);

  // Debug: Log pack sizes when they change
  useEffect(() => {
    if (isMicrofiber && selectedSize) {
      console.log('📦 Pack sizes updated for', selectedSize, ':', availablePackSizesForSelectedSize);
    }
  }, [isMicrofiber, selectedSize, availablePackSizesForSelectedSize]);

  // On load, select the first available size and its first available pack size
  useEffect(() => {
    if (isMicrofiber && microfiberSizes.length > 0 && !selectedSize) {
      console.log('🎯 Setting initial size to:', microfiberSizes[0]);
      setSelectedSize(microfiberSizes[0]);
    }
  }, [isMicrofiber, microfiberSizes, selectedSize]);

  useEffect(() => {
    if (isMicrofiber && selectedSize && availablePackSizesForSelectedSize.length > 0 && !selectedPackSize) {
      console.log('🎯 Setting initial pack size to:', availablePackSizesForSelectedSize[0]);
      setSelectedPackSize(availablePackSizesForSelectedSize[0]);
    }
  }, [isMicrofiber, selectedSize, availablePackSizesForSelectedSize, selectedPackSize]);

  // Find the variant for the selected size and pack size
  const getVariantForCombination = (size, packSize) => {
    if (!isMicrofiber || !size || !packSize) return null;

    const variant = product.variants?.find((v) => {
      const sizeMatch = v.size === size;

      // Try to match pack size from pack_size field first, then fallback to variant_code
      let packSizeMatch = false;
      if (v.pack_size !== null && v.pack_size !== undefined) {
        packSizeMatch = Number(v.pack_size) === Number(packSize);
      } else {
        // Fallback to extracting from variant_code
        const code = v.variant_code || v.code || v.id;
        const extractedPackSize = extractPackSize(code);
        packSizeMatch = extractedPackSize === Number(packSize);
      }

      console.log('🔍 Checking variant', v.id, 'size:', v.size, 'pack_size:', v.pack_size, 'matches:', sizeMatch && packSizeMatch);
      return sizeMatch && packSizeMatch;
    });

    console.log('✅ Found variant for', size, 'pack', packSize, ':', variant);
    return variant || null;
  };

  // Update isCurrentSelectionAvailable to ignore color for microfiber
  const isCurrentSelectionAvailable = () => {
    if (!isMicrofiber) {
      return selectedVariant && selectedVariant.stock > 0;
    }
    if (!selectedSize || !selectedPackSize) return false;
    const variant = getVariantForCombination(selectedSize, selectedPackSize);
    return variant && variant.stock > 0;
  };

  // Get variant display text (size only for microfiber, quantity for others)
  const getVariantDisplayText = (variant) => {
    if (isMicrofiber) {
      let size = variant.size || 'Size';
      size = size
        .replace(/(ml|ltr|l|gm|g|kg|pcs?|pieces?)$/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!/cm$/i.test(size)) {
        size = size + ' cm';
      }
      return size;
    } else {
      const quantity = variant.quantity || variant.size || '';
      const unit = variant.unit || '';
      return `${quantity}${unit}` || 'Variant';
    }
  };

  // Check if a color has any variants in stock
  const isColorAvailable = (color) => {
    return (
      product.variants?.some((v) => {
        const hasColor = Array.isArray(v.color)
          ? v.color.includes(color)
          : v.color === color;
        return hasColor && v.stock > 0;
      }) || false
    );
  };

  // Check if a size has any variants in stock
  const isSizeAvailable = (size) => {
    return (
      product.variants?.some((v) => v.size === size && v.stock > 0) || false
    );
  };

  const handleImageSwipe = (direction) => {
    const currentIndex = activeImageIndex[product.id] || 0;
    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % thumbnails.length
        : (currentIndex - 1 + thumbnails.length) % thumbnails.length;

    setImageSlideMap((prev) => ({
      ...prev,
      [product.id]: {
        from: currentIndex,
        to: nextIndex,
        direction,
      },
    }));

    // Update active index after animation
    setTimeout(() => {
      setActiveImageIndex((prev) => ({ ...prev, [product.id]: nextIndex }));
      setImageSlideMap((prev) => ({ ...prev, [product.id]: null }));
    }, 300);
  };

  const handleVariantSelect = (variant) => {
    // For non-microfiber products
    if (!isMicrofiber) {
      setSelectedVariant(variant);
      return;
    }

    // For microfiber products, this shouldn't be called directly
    // Colors and sizes should be handled separately
  };

  const handleColorSelect = (color) => {
    // setSelectedColor(color); // REMOVE for microfiber
    // Try to keep current size and pack size if possible
    if (selectedSize && selectedPackSize) {
      const variant = getVariantForCombination(null, selectedPackSize); // REMOVE color
      if (variant) setSelectedVariant(variant);
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (selectedPackSize) {
      const variant = getVariantForCombination(size, selectedPackSize); // REMOVE color
      if (variant) setSelectedVariant(variant);
    }
  };

  const handlePackSizeSelect = (packSize) => {
    setSelectedPackSize(packSize);
    if (selectedSize) {
      const variant = getVariantForCombination(selectedSize, packSize); // REMOVE color
      if (variant) setSelectedVariant(variant);
    }
  };

  const handleAddToCart = async () => {
    if (!isMicrofiber && !selectedVariant) {
      showToast('Please select a variant.', { type: 'error' });
      return;
    }
    if (isMicrofiber && (!selectedSize || !selectedPackSize)) {
      showToast('Please select a size and pack size.', { type: 'error' });
      return;
    }

    const variantToAdd = isMicrofiber
      ? getVariantForCombination(selectedSize, selectedPackSize)
      : selectedVariant;

    if (!variantToAdd) {
      showToast('Selected combination not available.', { type: 'error' });
      return;
    }

    if (variantToAdd.stock <= 0) {
      showToast('This item is currently out of stock.', { type: 'error' });
      return;
    }

    setIsAddingToCart(true);
    try {
      const success = await addToCart(product, variantToAdd, 1);
      if (success) {
        showToast('Item added to cart!', { type: 'success' });
      } else {
        showToast('Failed to add item to cart.', { type: 'error' });
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, { type: 'error' });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isCurrentSelectionAvailable()) {
      alert('Please select available variant.');
      return;
    }
    setIsAddingToCart(true);
    try {
      const itemToAdd = {
        productId: product.id,
        quantity: 1,
        price: getCurrentPrice(),
        productName: product.name,
        productImage:
          product.main_image_url ||
          product.image_url ||
          product.images?.[0] ||
          '',
      };
      if (isMicrofiber) {
        const variant = getVariantForCombination(selectedSize, selectedPackSize); // REMOVE color
        if (!variant) {
          throw new Error('Selected combination not available.');
        }
        itemToAdd.variant = {
          ...variant,
          // color: selectedColor, // REMOVE for microfiber
          size: selectedSize,
          packSize: selectedPackSize,
          displayText: `${selectedSize} | Pack of ${selectedPackSize}`,
          variant_code: variant.variant_code || variant.code || '',
        };
      } else if (selectedVariant) {
        itemToAdd.variant = {
          ...selectedVariant,
          displayText: getVariantDisplayText(selectedVariant),
          variant_code: selectedVariant.variant_code || selectedVariant.code || '',
        };
      } else {
        itemToAdd.variant = {
          id: 'default',
          price: product.base_price || product.price || product.mrp,
          displayText: 'Default',
        };
      }
      const success = await addToCart(product, itemToAdd.variant, 1);
      if (success) {
        router.push('/checkout');
      } else {
        alert('Failed to add item to cart for direct purchase.');
      }
    } catch (error) {
      alert(`Failed to complete purchase: ${error.message}`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      alert('Please login to add items to wishlist.');
      return;
    }
    try {
      let variantToSave = null;
      if (isMicrofiber && selectedSize && selectedPackSize) {
        const variant = getVariantForCombination(selectedSize, selectedPackSize); // REMOVE color
        if (!variant) {
          alert('Please select a valid size and pack size combination.');
          return;
        }
        variantToSave = {
          ...variant,
          // color: selectedColor, // REMOVE for microfiber
          size: selectedSize,
          packSize: selectedPackSize,
          displayText: `${selectedSize} | Pack of ${selectedPackSize}`,
          variant_code: variant.variant_code || variant.code || '',
        };
      } else if (selectedVariant) {
        variantToSave = {
          ...selectedVariant,
          displayText: getVariantDisplayText(selectedVariant),
          variant_code: selectedVariant.variant_code || selectedVariant.code || '',
        };
      } else {
        variantToSave = {
          id: 'default',
          price: product.base_price || product.price || product.mrp,
          displayText: 'Default',
        };
      }
      if (isWishlisted && wishlistItemId) {
        await WishlistService.removeFromWishlist(wishlistItemId);
        setIsWishlisted(false);
        setWishlistItemId(null);
      } else {
        const { success, wishlistItem } = await WishlistService.addToWishlistSmart(product, variantToSave);
        if (success) {
          setIsWishlisted(true);
          setWishlistItemId(wishlistItem?.id);
        }
      }
    } catch (err) {
      alert('Could not update wishlist.');
    }
  };

  const handleWishlistButtonClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please login to use wishlist', { type: 'error' });
      return;
    }
    setWishlistLoading(true);
    try {
      if (!isWishlisted) {
        // Check if already in wishlist before adding
        const { success, wishlistItem, existing } = await WishlistService.addToWishlistSmart(product, selectedVariant);
        if (existing) {
          showToast('Item already exists in your wishlist.', { type: 'info' });
        } else if (success) {
          setIsWishlisted(true);
          setWishlistItemId(wishlistItem?.id);
          showToast('Added to wishlist!', { type: 'success' });
        }
      } else if (wishlistItemId) {
        await WishlistService.removeFromWishlist(wishlistItemId);
        setIsWishlisted(false);
        setWishlistItemId(null);
        showToast('Removed from wishlist', { type: 'info' });
      }
    } catch (error) {
      showToast('Wishlist action failed', { type: 'error' });
    }
    setWishlistLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!product) return null;

  return (
    <div
      className={`w-full pt-0 overflow-visible bg-white featured-product-section ${className}`}
    >
      <div
        className={`flex flex-col lg:flex-row gap-4 sm:gap-6 px-4 md:px-[30px] lg:px-4 pt-6 md:pt-16 lg:pt-[30px] items-center ${
          isLastCard
            ? 'pb-[0px] xs:pb-[0px] sm:pb-[0px] md:pb-[0px] lg:pb-[0px] xl:pb-[50px]'
            : 'pb-[0px] sm:pb-[160px] md:pb-[180px] lg:pb-[80px] xl:pb-[80px]'
        }`}
      >
        {/* Image Section */}
        <div className='flex w-full lg:w-1/2 items-start justify-center sm:gap-4'>
          {/* Thumbnail Navigation */}
          <div className='flex-col space-y-2 items-start hidden md:block mt-2'>
            {thumbnails.map((thumb, i) => (
              <Image
                key={i}
                src={thumb || '/placeholder.svg'}
                alt={`${product.name} thumbnail ${i + 1}`}
                width={68}
                height={55}
                onClick={() =>
                  setActiveImageIndex((prev) => ({ ...prev, [product.id]: i }))
                }
                className={`w-[50px] h-[40px] xl:w-[68px] xl:h-[55px] cursor-pointer transition-all duration-200 ease-in-out ring-2 object-cover ${
                  activeIndex === i
                    ? 'ring-black opacity-100'
                    : 'ring-transparent opacity-50'
                }`}
              />
            ))}
          </div>

          {/* Main Image Display */}
          <div className='relative w-full h-[250px] xs:w-[350px] xs:h-[280px] sm:w-[500px] sm:h-[350px] md:w-[500px] md:h-[320px] lg:w-[500px] lg:h-[500px] xl:w-[600px] xl:h-[600px] flex items-center justify-center overflow-hidden'>
            {/* Left Navigation Button */}
            {thumbnails.length > 1 && (
              <button
                onClick={() => handleImageSwipe('prev')}
                className='absolute z-20 left-0 cursor-pointer bg-transparent p-1 sm:p-2 transition'
              >
                <ChevronLeft className='w-8 h-8 sm:w-12 sm:h-12 xl:h-[600px] text-black cursor-pointer' />
              </button>
            )}

            {/* Image Slide Content */}
            <div className='w-full h-full relative z-10 overflow-hidden'>
              {slideData ? (
                <>
                  <Image
                    key={`prev-${prevIndex}`}
                    src={thumbnails[prevIndex] || '/placeholder.svg'}
                    alt={`${product.name} - previous`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`absolute w-full h-full object-contain transition-all duration-300 ease-in-out ${
                      dir === 'next' ? '-translate-x-full' : 'translate-x-full'
                    }`}
                  />
                  <Image
                    key={`next-${nextIndex}`}
                    src={thumbnails[nextIndex] || '/placeholder.svg'}
                    alt={`${product.name} - next`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`absolute w-full h-full object-contain transition-all duration-300 ease-in-out ${
                      dir === 'next' ? 'translate-x-0' : 'translate-x-0'
                    }`}
                  />
                </>
              ) : (
                <Image
                  key={`active-${activeIndex}`}
                  src={activeSrc || '/placeholder.svg'}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className='w-full h-full object-contain transition-all duration-300'
                />
              )}
            </div>

            {/* Right Navigation Button */}
            {thumbnails.length > 1 && (
              <button
                onClick={() => handleImageSwipe('next')}
                className='absolute right-0 cursor-pointer bg-transparent z-20 p-1 sm:p-2 transition'
              >
                <ChevronRight className='w-8 h-8 sm:w-12 sm:h-12 xl:h-[600px] text-black cursor-pointer' />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Thumbnails */}
        <div className='flex flex-row justify-start space-x-2 md:hidden overflow-x-auto w-full'>
          {thumbnails.map((thumb, i) => (
            <Image
              key={i}
              src={thumb || '/placeholder.svg'}
              alt={`${product.name} thumbnail ${i + 1}`}
              width={68}
              height={55}
              onClick={() =>
                setActiveImageIndex((prev) => ({ ...prev, [product.id]: i }))
              }
              className={`w-[50px] h-[40px] xl:w-[68px] xl:h-[55px] cursor-pointer transition-all duration-200 ease-in-out ring-2 object-cover ${
                activeIndex === i
                  ? 'ring-black opacity-100'
                  : 'ring-transparent opacity-50'
              }`}
            />
          ))}
        </div>

        {/* Product Details */}
        <div className='w-full md:w-[585px] lg:w-[685px] xl:w-1/2 space-y-2 md:space-y-3 lg:space-y-2 xl:space-y-4 flex flex-col'>
          {/* Product Title and Rating */}
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl line-clamp-2 flex-1">{product.name}</h2>
            <ProductRating ratings={ratings} size={18} showCount={true} />
          </div>

          {/* Price */}
          <div className='text-[18px] xs:text-[20px] sm:text-[28px] md:text-[32px] font-medium tracking-wide'>
            <span className='font-extralight'>MRP:</span>
            <span> {formatPrice(getCurrentPrice())}</span>
          </div>

          {/* Description */}
          <div className='xl:flex-grow'>
            <p className='text-[13px] xs:text-[14px] sm:text-[15px] xl:text-[16px] text-black font-light tracking-wider whitespace-pre-line line-clamp-2 xs:line-clamp-2 sm:line-clamp-3 md:line-clamp-4 lg:line-clamp-4 xl:line-clamp-none'>
              {product.description}
            </p>
            {/* Only show taglines below description */}
            {product.taglines && product.taglines.length > 0 && (
              <div className='mt-3'>
                <ul className='list-disc pl-5 text-[13px] sm:text-[14px] xl:text-[15px] text-gray-700'>
                  {product.taglines.map((tag, i) => (
                    <li key={i}>{tag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Variant Selection (separate logic for microfiber and regular) */}
          {isMicrofiber && microfiberSizes.length > 0 && (
            <div className='space-y-2 sm:space-y-3'>
              <h4 className='font-medium text-xs xs:text-sm'>Choose Size:</h4>
              <div className='flex flex-wrap gap-1 xs:gap-2'>
                {microfiberSizes.map((size, index) => {
                  const isSelected = selectedSize === size;
                  // Check if any variant with this size is in stock
                  const isOutOfStock = !product.variants.some(v => v.size === size && v.stock > 0);
                  return (
                    <div key={size || index} className='relative group'>
                      <button
                        onClick={() => setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className={
                          `px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 text-xs xs:text-sm font-medium transition-all duration-200 rounded-full ` +
                          (isSelected
                            ? 'bg-white text-black border-2 border-black'
                            : isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent')
                        }
                      >
                        <div className='flex flex-col items-center leading-tight'>
                          <span className='font-semibold'>{size}</span>
                        </div>
                      </button>
                      {isOutOfStock && (
                        <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none'>
                          <div className='bg-red-500 text-white rounded-full p-1'>
                            <X className='w-2 h-2 xs:w-3 xs:h-3' />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {isMicrofiber && selectedSize && (
            <div className='space-y-2 sm:space-y-3'>
              <h4 className='font-medium text-xs xs:text-sm'>Choose Pack Size:</h4>
              {console.log('🎨 Rendering pack sizes section for size:', selectedSize, 'available:', availablePackSizesForSelectedSize)}
              {availablePackSizesForSelectedSize.length > 0 ? (
                <div className='flex flex-wrap gap-1 xs:gap-2'>
                  {availablePackSizesForSelectedSize.map((packSize) => {
                    const variant = getVariantForCombination(selectedSize, packSize);
                    const isOutOfStock = !variant || variant.stock === 0;
                    const isSelected = selectedPackSize === packSize;
                    console.log('🎨 Pack size button:', packSize, 'variant:', variant, 'selected:', isSelected, 'outOfStock:', isOutOfStock);
                    return (
                      <button
                        key={packSize}
                        onClick={() => handlePackSizeSelect(packSize)}
                        disabled={isOutOfStock}
                        className={`px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 text-xs xs:text-sm font-medium rounded-full transition-all duration-200 ${
                          isSelected
                            ? 'bg-white text-black border-2 border-black'
                            : isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                        }`}
                      >
                        Pack of {packSize}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className='text-xs text-gray-500 italic'>
                  No pack sizes available for this size. Please check product data.
                </div>
              )}
            </div>
          )}
          {isMicrofiber && selectedSize && selectedPackSize && (
            <div className='text-xs text-gray-600'>
              {(() => {
                const variant = getVariantForCombination(selectedSize, selectedPackSize); // REMOVE color
                if (variant && variant.stock > 0) {
                  return (
                    <span className='text-green-600'>
                      {variant.stock} in stock
                    </span>
                  );
                } else {
                  return <span className='text-red-600'>Out of stock</span>;
                }
              })()}
            </div>
          )}

          {/* Stock indicator for non-microfiber selected variant */}
          {!isMicrofiber && allVariants.length > 0 && (
            <div className='space-y-2 sm:space-y-3'>
              <h4 className='font-medium text-xs xs:text-sm'>Choose Quantity:</h4>
              <div className='flex flex-wrap gap-1 xs:gap-2'>
                {allVariants.map((variant, index) => {
                  const isOutOfStock = variant.stock === 0;
                  const isSelected = selectedVariant?.id === variant.id;
                  const quantity = variant.quantity || variant.size || '';
                  const unit = variant.unit || '';
                  return (
                    <div key={variant.id || index} className='relative group'>
                      <button
                        onClick={() => handleVariantSelect(variant)}
                        disabled={isOutOfStock}
                        className={`
                          px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 text-xs xs:text-sm font-medium transition-all duration-200 rounded-full
                          ${
                            isSelected
                              ? 'bg-white text-black border-2 border-black'
                              : isOutOfStock
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                          }
                        `}
                      >
                        <span>{`${quantity}${unit}`}</span>
                      </button>
                      {isOutOfStock && (
                        <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none'>
                          <div className='bg-red-500 text-white rounded-full p-1'>
                            <X className='w-2 h-2 xs:w-3 xs:h-3' />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!isMicrofiber && selectedVariant && (
            <div className='text-xs text-gray-600'>
              {selectedVariant.stock > 0 ? (
                <span className='text-green-600'>
                  {selectedVariant.stock} in stock
                </span>
              ) : (
                <span className='text-red-600'>Out of stock</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className='space-y-2 xl:space-y-4 relative z-10 mt-4 sm:mt-6'>
            <div className='flex items-center w-full'>
              <div
                className={`border-1 px-2 py-2 xs:px-3 xs:py-2 sm:px-4 sm:py-2 mr-1 rounded-[4px] transition-all duration-200 ${
                  isWishlisted
                    ? 'bg-gradient-to-br from-[#601E8D] to-[#3a0c59]' // Diagonal gradient, no border
                    : wishlistLoading
                      ? 'border-gray-300 bg-gray-100 opacity-60'
                      : 'border-black hover:border-[#601E8D]'
                }`}
              >
                <div className='relative w-4 h-6 xs:w-5 xs:h-5 cursor-pointer'>
                  <button
                    type='button'
                    onClick={handleWishlistButtonClick}
                    disabled={isAddingToCart || wishlistLoading}
                    className={`text-[16px] transition-all duration-200 flex items-center justify-center ${
                      isWishlisted
                        ? 'text-[#601E8D]'
                        : 'text-black hover:text-[#601E8D]'
                    } ${isAddingToCart || wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={
                      !user
                        ? 'Login to add to wishlist'
                        : isWishlisted
                        ? 'Remove from wishlist'
                        : 'Add to wishlist'
                    }
                  >
                    {wishlistLoading ? (
                      <span className="w-6 h-6 xs:w-5 xs:h-5 border-2 border-[#601E8D] border-t-transparent rounded-full animate-spin inline-block" />
                    ) : isWishlisted ? (
                      <div className='relative -left-1 w-6 h-6 xs:w-5 xs:h-5'>
                        <Image
                          src='/assets/star-filled-white.svg'
                          alt='wishlisted'
                          fill
                          className='object-contain animate-pulse'
                        />
                      </div>
                    ) : (
                      <div className='relative -left-1  w-6 h-6 xs:w-5 xs:h-5'>
                        <Image
                          src='/assets/shine.svg'
                          alt='add to wishlist'
                          fill
                          className='object-contain opacity-60 hover:opacity-100 transition-opacity duration-200'
                        />
                      </div>
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !isCurrentSelectionAvailable()}
                className='text-[16px] xs:text-sm text-black font-semibold border-1 px-2 py-2 xs:px-3 xs:py-2 sm:px-4 sm:py-2 w-full rounded-[4px] border-black cursor-pointer flex items-center justify-center gap-1 xs:gap-2 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100'
              >
                {isAddingToCart ? (
                  <>
                    <div className='w-3 h-3 xs:w-4 xs:h-4 border-2 border-black border-t-transparent rounded-full animate-spin' />
                    <span className='hidden xs:inline'>Adding...</span>
                    <span className='xs:hidden'>...</span>
                  </>
                ) : !isCurrentSelectionAvailable() ? (
                  'Out of Stock'
                ) : (
                  <>
                    Add to Cart
                    <ShoppingCart className='w-4 h-4 xs:w-5 xs:h-5' />
                  </>
                )}
              </button>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={!isCurrentSelectionAvailable()}
              className='bg-black cursor-pointer rounded-[4px] text-white w-full px-2 py-2 xs:px-3 xs:py-3 sm:px-4 sm:py-3 flex items-center justify-center gap-1 xs:gap-2 hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600 text-[16px] xs:text-sm'
            >
              {!isCurrentSelectionAvailable() ? 'Out of Stock' : 'Buy Now'}
              <div className='relative w-6 h-6 xs:w-5 xs:h-5'>
                <Image
                  src='/assets/featured/buynowsvg.svg'
                  alt='buy-now'
                  fill
                  className='object-contain'
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
