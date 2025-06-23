"use client"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"

import "@/app/globals.css"

import AddressSection from "@/components/Address/AddressSection"
import OrderSummary from "@/components/checkout-order/OrderSummary"
import { transformCartForCheckout, calculateOrderTotals } from "@/lib/utils/cartTransformUtils"

const getVariantIdsFromItem = async (item) => {
  if (item.type === "product" && item.variant_id) {
    return [{ variant_id: item.variant_id, quantity: item.quantity }]
  }

  if (item.type === "kit" || item.type === "combo") {
    const sourceTable = item.type === "kit" ? "kit_products" : "combo_products"
    const sourceIdColumn = item.type === "kit" ? "kit_id" : "combo_id"
    const sourceId = item.type === "kit" ? item.kit_id : item.combo_id

    const { data: relatedItems, error } = await supabase
      .from(sourceTable)
      .select("variant_id, quantity")
      .eq(sourceIdColumn, sourceId)

    if (error) {
      console.error(`Error fetching related items for ${item.type}:`, error)
      return []
    }

    return relatedItems.map((related) => ({
      variant_id: related.variant_id,
      quantity: related.quantity * item.quantity,
    }))
  }
  return []
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { cartItems, coupon, loading: cartLoading, clearCoupon } = useCart()
  const { user } = useAuth()

  const id = searchParams.get("id")
  const productId = searchParams.get("id")
  const comboId = searchParams.get("combo_id")
  const qtyParam = Number.parseInt(searchParams.get("qty")) || 1

  const [userId, setUserId] = useState(null)
  const [product, setProduct] = useState(null)
  const [combo, setCombo] = useState(null)
  const [transformedItems, setTransformedItems] = useState([])
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState(null)
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState(null)
  const [useSameAddress, setUseSameAddress] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [orderTotals, setOrderTotals] = useState({
    subtotal: 0,
    discount: 0,
    discountPercentage: 0,
    grandTotal: 0,
    itemCount: 0,
    totalQuantity: 0,
  })

  useEffect(() => {
    if (user) {
      setUserId(user.id)
    }
  }, [user])

  useEffect(() => {
    if (userId) {
      if (productId) fetchSingleProduct()
      else if (comboId) fetchSingleCombo()
      else transformCartData()
    }
  }, [userId, cartItems])

  // Recalculate totals when coupon changes
  useEffect(() => {
    if (transformedItems.length > 0) {
      const totals = calculateOrderTotals(transformedItems, coupon)
      setOrderTotals(totals)
    }
  }, [transformedItems, coupon])

  const getUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data?.user) setUserId(data.user.id)
  }

  const fetchSingleProduct = async () => {
    try {
      const { data } = await supabase.from("products").select("*").eq("id", productId).single()

      if (data) {
        const transformedProduct = {
          id: `direct-${data.id}`,
          type: "product",
          product_id: data.id,
          product_code: data.product_code,
          name: data.name,
          description: data.description,
          main_image_url: data.main_image_url,
          images: data.images,
          variant: null,
          variant_display_text: "Default",
          price: data.price,
          quantity: qtyParam,
          total_price: data.price * qtyParam,
          is_microfiber: data.is_microfiber,
          key_features: data.key_features,
          taglines: data.taglines,
          category_name: data.category_name,
        }

        setTransformedItems([transformedProduct])
      }
    } catch (error) {
      console.error("Error fetching single product:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSingleCombo = async () => {
    try {
      const { data: combo } = await supabase.from("combos").select("*").eq("id", comboId).single()

      if (combo) {
        setCombo(combo)
        // Fetch combo products
        const { data: comboProducts } = await supabase
          .from("combo_products")
          .select(`
						*,
						product:products(*)
					`)
          .eq("combo_id", combo.id)

        const transformedCombo = {
          id: `direct-${combo.id}`,
          type: "combo",
          combo_id: combo.id,
          name: combo.name,
          description: combo.description,
          main_image_url: combo.main_image_url,
          images: combo.images,
          price: combo.price,
          original_price: combo.original_price,
          discount_percentage: combo.discount_percentage,
          quantity: 1,
          total_price: combo.price,
          included_products:
            comboProducts?.map((cp) => ({
              product_id: cp.product_id,
              product_name: cp.product?.name,
              product_code: cp.product?.product_code,
              variant_id: cp.variant_id,
              quantity: cp.quantity,
            })) || [],
          included_variants: [],
        }

        setTransformedItems([transformedCombo])
      }
    } catch (error) {
      console.error("Error fetching single combo:", error)
    } finally {
      setLoading(false)
    }
  }

  const transformCartData = async () => {
    if (!cartItems || cartItems.length === 0) {
      setTransformedItems([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const transformed = await transformCartForCheckout(cartItems, userId)
      setTransformedItems(transformed)
    } catch (error) {
      console.error("Error transforming cart data:", error)
      setTransformedItems([])
    } finally {
      setLoading(false)
    }
  }

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return

    setTransformedItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity, total_price: item.price * newQuantity } : item,
      ),
    )
  }

  const placeOrder = async () => {
    if (!selectedShippingAddressId || (!useSameAddress && !selectedBillingAddressId) || transformedItems.length === 0) {
      alert("Please select both shipping and billing addresses and ensure you have items in your cart.")
      return
    }

    setLoading(true)

    try {
      console.log("Starting order creation process...")

      // Get shipping address details
      const { data: shippingAddress, error: shippingError } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", selectedShippingAddressId)
        .single()
      if (shippingError) throw shippingError
      console.log("Shipping address fetched:", shippingAddress)

      // Get billing address details if different from shipping
      const billingAddressId = useSameAddress ? selectedShippingAddressId : selectedBillingAddressId
      const { data: billingAddress, error: billingError } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", billingAddressId)
        .single()
      if (billingError) throw billingError
      console.log("Billing address fetched:", billingAddress)

      // Get user details from auth context instead of profiles table
      if (!user) throw new Error("User not authenticated")
      const userData = {
        id: user.id,
        email: user.email
      }

      // Generate order number (YYYYMMDD-XXXX format)
      const date = new Date()
      const orderNumber = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`

      // Prepare order data
      const orderData = {
        order_number: orderNumber,
        user_id: userId,
        shipping_address_id: selectedShippingAddressId,
        billing_address_id: billingAddressId,
        user_info: {
          email: user.email,
          shipping_address: shippingAddress,
          billing_address: billingAddress
        },
        items: transformedItems,
        subtotal: orderTotals.subtotal,
        discount_amount: orderTotals.discount || 0,
        total: orderTotals.grandTotal,
        coupon_id: coupon?.id || null,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString()
      }

      // Start a Supabase transaction
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError
      console.log("Order created:", order)

      // Create sales records and deduct stock for each item
      for (const item of transformedItems) {
        try {
          console.log("Processing item:", item)
          if (item.type === "product") {
            // Handle single product
            if (item.variant?.id) {
              // Deduct stock for the variant
              const { error: stockError } = await supabase.rpc('adjust_variant_stock', {
                variant_id_input: item.variant.id,
                quantity_input: item.quantity,
                operation: 'subtract'
              })
              if (stockError) throw stockError
            }

            // Create sales record
            await supabase.from("sales_records").insert({
              order_id: order.id,
              order_number: orderNumber,
              product_name: item.name,
              product_code: item.product_code || '',
              variant_details: item.variant_display_text || null,
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.total_price,
              sale_type: 'direct',
              category_name: item.category_name || null,
              sale_date: new Date().toISOString().split('T')[0]
            })
          } else if (item.type === "kit" || item.type === "combo") {
            // Create parent sales record
            const { data: parentSale } = await supabase.from("sales_records").insert({
              order_id: order.id,
              order_number: orderNumber,
              product_name: item.name,
              product_code: item.type === "kit" ? `KIT-${item.kit_id}` : `COMBO-${item.combo_id}`,
              variant_details: null,
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.total_price,
              sale_type: item.type,
              category_name: null,
              sale_date: new Date().toISOString().split('T')[0]
            }).select().single()

            // Handle included products
            for (const includedProduct of item.included_products) {
              if (includedProduct.variant_id) {
                // Deduct stock for each variant
                const totalQuantity = includedProduct.quantity * item.quantity
                const { error: stockError } = await supabase.rpc('adjust_variant_stock', {
                  variant_id_input: includedProduct.variant_id,
                  quantity_input: totalQuantity,
                  operation: 'subtract'
                })
                if (stockError) throw stockError

                // Create child sales record
                await supabase.from("sales_records").insert({
                  order_id: order.id,
                  order_number: orderNumber,
                  product_name: includedProduct.product_name,
                  product_code: includedProduct.product_code || '',
                  variant_details: includedProduct.variant ? JSON.stringify(includedProduct.variant) : null,
                  quantity: totalQuantity,
                  unit_price: 0, // Part of kit/combo
                  total_price: 0, // Part of kit/combo
                  sale_type: item.type,
                  parent_item_name: item.name,
                  category_name: null,
                  sale_date: new Date().toISOString().split('T')[0]
                })
              }
            }
          }
        } catch (itemError) {
          console.error(`Error processing item ${item.id}:`, itemError)
          throw itemError
        }
      }

      // Clear cart and coupon after successful order
      await supabase.from("cart_items").delete().eq("user_id", userId)
      if (coupon) clearCoupon()

      // Redirect to user orders page
      router.push('/user/orders')

    } catch (error) {
      console.error("Error creating order:", error)
      alert("There was an error creating your order. Please try again.")
      setLoading(false)
    }
  }

  if (cartLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-[#601E8D] rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[#601E8D] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-black mb-2">Loading Checkout</h2>
              <p className="text-gray-600">Preparing your order details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-black border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-white">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <span className="text-2xl">🛒</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">
                  Checkout
                </h1>
              </div>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Complete your purchase securely
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={() => router.push("/shop")}
              className="hover:text-[#601E8D] transition-colors"
            >
              Shop
            </button>
            <span className="text-gray-400">→</span>
            <button
              onClick={() => router.push("/cart")}
              className="hover:text-[#601E8D] transition-colors"
            >
              Cart
            </button>
            <span className="text-gray-400">→</span>
            <span className="text-[#601E8D] font-medium">Checkout</span>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-12">
          {transformedItems.length === 0 ? (
            <div className="max-w-2xl mx-auto mt-12">
              <div className="bg-white rounded-[4px] shadow-sm p-12 text-center border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
                  <span className="text-4xl">🛒</span>
                </div>
                <h2 className="text-3xl font-bold text-black mb-4">Your Cart is Empty</h2>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  Looks like you haven't added any items to your cart yet.
                  Discover our amazing products and start shopping!
                </p>
                <button
                  onClick={() => router.push("/shop")}
                  className="bg-[#601E8D] hover:bg-[#4a1770] text-white px-8 py-4 rounded-[4px] font-semibold text-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                <span className="flex items-center gap-3">
                  <span>🛍️</span>
                  <span>Continue Shopping</span>
                </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* Progress Indicator */}
              <div className="mb-8 mt-8">
                <div className="bg-white rounded-[4px] p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#601E8D] rounded-full flex items-center justify-center text-white font-bold">
                        ✓
                      </div>
                      <span className="font-medium text-gray-700">Cart Review</span>
                    </div>
                    <div className="w-16 h-1 bg-[#601E8D] rounded-full"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#601E8D] rounded-full flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <span className="font-medium text-[#601E8D]">Checkout</span>
                    </div>
                    <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                        3
                      </div>
                      <span className="font-medium text-gray-500">Confirmation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Checkout Content */}
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Address Section - Left Side */}
                <div className="lg:col-span-3">
                  {/* Shipping Address Section */}
                  <div className="bg-white rounded-[4px] shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="bg-black p-6 text-white border-b border-gray-200">
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        Shipping Address
                      </h2>
                      <p className="text-gray-300 mt-2">Where should we deliver your order?</p>
                    </div>
                    <div className="p-6">
                      <AddressSection
                        userId={userId}
                        selectedAddressId={selectedShippingAddressId}
                        setSelectedAddressId={setSelectedShippingAddressId}
                      />
                    </div>
                  </div>

                  {/* Same as Shipping Checkbox */}
                  <div className="bg-white rounded-[4px] shadow-sm border border-gray-200 p-4 mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSameAddress}
                        onChange={(e) => setUseSameAddress(e.target.checked)}
                        className="w-5 h-5 text-[#601E8D] border-gray-300 rounded-[4px] focus:ring-[#601E8D]"
                      />
                      <span className="text-gray-700 font-medium">Billing address is same as shipping address</span>
                    </label>
                  </div>

                  {/* Billing Address Section */}
                  {!useSameAddress && (
                    <div className="bg-white rounded-[4px] shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-black p-6 text-white border-b border-gray-200">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                          <span className="text-2xl">📝</span>
                          Billing Address
                        </h2>
                        <p className="text-gray-300 mt-2">Where should we send the invoice?</p>
                      </div>
                      <div className="p-6">
                        <AddressSection
                          userId={userId}
                          selectedAddressId={selectedBillingAddressId}
                          setSelectedAddressId={setSelectedBillingAddressId}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary - Right Side */}
                <div className="lg:col-span-2">
                  <div className="sticky top-6">
                    <OrderSummary
                      items={transformedItems}
                      updateItemQuantity={updateItemQuantity}
                      coupon={coupon}
                      orderTotals={orderTotals}
                      loading={loading}
                      onPlaceOrder={() => setShowConfirmModal(true)}
                    />

                    {/* Security Badges */}
                    <div className="mt-6 bg-white rounded-[4px] p-4 shadow-sm border border-gray-200">
                      <div className="text-center">
                        <h3 className="font-semibold text-black mb-3">Secure Checkout</h3>
                        <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="text-[#601E8D]">🔒</span>
                            <span>SSL Encrypted</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#601E8D]">🛡️</span>
                            <span>Safe & Secure</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[4px] shadow-xl max-w-md w-full p-8 border border-gray-200">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-[#601E8D] rounded-full flex items-center justify-center">
                  <span className="text-3xl text-white">🛒</span>
                </div>
                <h3 className="text-2xl font-bold text-black mb-4">Confirm Your Order</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Are you sure you want to place this order? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-[4px] font-semibold transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={placeOrder}
                    disabled={loading}
                    className="flex-1 bg-[#601E8D] hover:bg-[#4a1770] text-white py-3 px-6 rounded-[4px] font-semibold disabled:opacity-50 transition-all duration-300"
                  >
                    {loading ? "Processing..." : "Confirm Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
