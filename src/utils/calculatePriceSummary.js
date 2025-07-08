// lib/utils/calculatePriceSummary.ts
export function calculatePriceSummary(items, coupon) {
  const GST_RATE = 18;

  let subtotal = 0;
  let subtotalExGST = 0;

  items.forEach((item) => {
    const qty = item.quantity || 1;

    if (item.kit_id && item.kit_price) {
      const priceIncl = Number(item.kit_price);
      const priceExcl = item.kit_price_excluding_gst ?? priceIncl / 1.18;
      subtotal += priceIncl * qty;
      subtotalExGST += priceExcl * qty;
    } else if (item.combo_id && item.combo_price) {
      const priceIncl = Number(item.combo_price);
      const priceExcl = item.combo_price_excluding_gst ?? priceIncl / 1.18;
      subtotal += priceIncl * qty;
      subtotalExGST += priceExcl * qty;
    } else if (Array.isArray(item.variant)) {
      item.variant.forEach((v) => {
        const priceIncl = Number(v.base_price ?? v.price) || 0;
        const priceExcl = v.base_price_excluding_gst ?? priceIncl / 1.18;
        subtotal += priceIncl * (v.quantity || 1);
        subtotalExGST += priceExcl * (v.quantity || 1);
      });
    } else {
      const v = item.variant || {};
      const priceIncl = Number(v.base_price ?? v.price) || 0;
      const priceExcl = v.base_price_excluding_gst ?? priceIncl / 1.18;
      subtotal += priceIncl * qty;
      subtotalExGST += priceExcl * qty;
    }
  });

  let discountExGST = 0;
  let discount = 0;
  if (coupon) {
    if (coupon.percent) {
      discountExGST = subtotalExGST * (Number(coupon.percent) / 100);
    } else if (coupon.discount) {
      discountExGST = Number(coupon.discount);
    }
    discount = discountExGST * 1.18;
  }

  const discountedExGST = subtotalExGST - discountExGST;
  const totalGST = discountedExGST * (GST_RATE / 100);
  const finalTotal = discountedExGST + totalGST;
  const youSaved = subtotal - finalTotal;

  return {
    subtotal,
    subtotalExGST,
    discount,
    discountExGST,
    discountedExGST,
    totalGST,
    finalTotal,
    youSaved,
  };
}
