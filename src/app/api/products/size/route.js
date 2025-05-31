import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (sizes): ${message}`)
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  try {
    const { data, error } = await supabase.from("sizes").select("*").order("size_cm")

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Unexpected error in sizes API:", error)
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    if (!body.size_cm) return errorResponse("size_cm is required", 400)

    const { data, error } = await supabase
      .from("sizes")
      .insert([{ size_cm: body.size_cm }])
      .select()
    if (error) return errorResponse(error.message)

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function PUT(request) {
  try {
    const { id, size_cm } = await request.json()
    if (!id) return errorResponse("ID is required", 400)
    if (!size_cm) return errorResponse("size_cm is required", 400)

    const { data, error } = await supabase.from("sizes").update({ size_cm }).eq("id", id).select()
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

    const { error } = await supabase.from("sizes").delete().eq("id", id)
    if (error) return errorResponse(error.message)

    return NextResponse.json({ success: true, message: "Size deleted" })
  } catch (error) {
    return errorResponse(error.message || "An unexpected error occurred")
  }
}
