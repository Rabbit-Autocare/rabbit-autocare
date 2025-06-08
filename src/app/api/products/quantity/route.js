import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (quantity): ${message}`)
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  try {
    const { data, error } = await supabase.from("quantity").select("*").order("quantity")

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Unexpected error in quantity API:", error)
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function POST(request) {
  try {
    const { quantity, unit } = await request.json()

    if (!quantity) return errorResponse("Quantity value is required", 400)
    if (!unit) return errorResponse("Unit is required", 400)

    const { data, error } = await supabase.from("quantity").insert([{ quantity, unit }]).select()

    if (error) return errorResponse(error.message)

    return NextResponse.json({ data: data[0] }, { status: 201 })
  } catch (error) {
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function PUT(request) {
  try {
    const { id, quantity, unit } = await request.json()

    if (!id) return errorResponse("ID is required", 400)
    if (!quantity) return errorResponse("Quantity value is required", 400)
    if (!unit) return errorResponse("Unit is required", 400)

    const { data, error } = await supabase.from("quantity").update({ quantity, unit }).eq("id", id).select()

    if (error) return errorResponse(error.message)

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) return errorResponse("ID is required", 400)

    const { error } = await supabase.from("quantity").delete().eq("id", id)

    if (error) return errorResponse(error.message)

    return NextResponse.json({ success: true, message: "Quantity value deleted" })
  } catch (error) {
    return errorResponse(error.message || "An unexpected error occurred")
  }
}
