import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { StockService } from '@/lib/service/stockService';

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { orderId, paymentDetails, items } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Fetch order items if not provided in request
    let orderItems = items;
    if (!orderItems) {
      // Try to fetch from DB (assuming 'items' is a JSONB column in 'orders')
      const { data: orderRecord, error: fetchError } = await supabase
        .from('orders')
        .select('items')
        .eq('id', orderId)
        .single();
      if (fetchError || !orderRecord) {
        return NextResponse.json({ error: "Failed to fetch order items for stock deduction" }, { status: 500 });
      }
      orderItems = orderRecord.items;
    }

    // Deduct stock for each item in the order
    try {
      await StockService.updateStockOnCheckout(orderItems);
    } catch (stockError) {
      console.error("Stock deduction error:", stockError);
      return NextResponse.json({ error: "Failed to deduct stock: " + stockError.message }, { status: 500 });
    }

    // Update order status to completed
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed", // changed from 'completed' to 'confirmed'
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      orderId: updatedOrder?.id || orderId,
    });
  } catch (error) {
    console.error("Error completing order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
