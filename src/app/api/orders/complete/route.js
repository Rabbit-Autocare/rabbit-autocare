import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { orderId, paymentDetails } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Update order status to completed
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "completed",
        payment_details: paymentDetails,
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
    });
  } catch (error) {
    console.error("Error completing order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}