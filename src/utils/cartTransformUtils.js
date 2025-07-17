// 📁 src/utils/cartCalculations.js
export function calculateCartTotals(cartItems, coupon) {
  const GST_RATE = 18;
  let subtotal = 0;
  let gstRemoved = 0;
  let basePrice = 0;

  cartItems.forEach(item => {
    const qty = item.quantity || 1;
    const getPrice = (incl, excl) => {
      const priceIncl = Number(incl) || 0;
      const priceExcl = excl ?? priceIncl / 1.18;
      return [priceIncl * qty, priceExcl * qty];
    };

    if (item.kit_id && item.kit_price) {
      const [incl, excl] = getPrice(item.kit_price, item.kit_price_excluding_gst);
      subtotal += incl;
      basePrice += excl;
    } else if (item.combo_id && item.combo_price) {
      const [incl, excl] = getPrice(item.combo_price, item.combo_price_excluding_gst);
      subtotal += incl;
      basePrice += excl;
    } else if (Array.isArray(item.variant)) {
      item.variant.forEach(v => {
        const [incl, excl] = getPrice(v.base_price, v.base_price_excluding_gst);
        subtotal += incl;
        basePrice += excl;
      });
    } else {
      const v = item.variant || {};
      const [incl, excl] = getPrice(v.base_price, v.base_price_excluding_gst);
      subtotal += incl;
      basePrice += excl;
    }
  });

  gstRemoved = subtotal - basePrice;

  let discount = 0;
  if (coupon?.percent) {
    discount = Math.round(basePrice * (coupon.percent / 100));
  } else if (coupon?.discount) {
    discount = Math.round(Number(coupon.discount) / 1.18);
  }

  const discountedBase = basePrice - discount;
  const finalTotal = discountedBase + gstRemoved;
  const youSaved = subtotal - finalTotal;

  return {
    subtotal,
    basePrice,
    gstRemoved,
    discount,
    discountedBase,
    finalTotal,
    youSaved,
  };
}
