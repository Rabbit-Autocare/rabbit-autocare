import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (gsm): ${message}`)
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  try {
    const { data, error } = await supabase.from("gsm").select("*").order("gsm")

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Unexpected error in gsm API:", error)
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function POST(request) {
  try {
    const { gsm } = await request.json()

    if (!gsm) return errorResponse("GSM value is required", 400)

    const { data, error } = await supabase.from("gsm").insert([{ gsm }]).select()

    if (error) return errorResponse(error.message)

    return NextResponse.json({ data: data[0] }, { status: 201 })
  } catch (error) {
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function PUT(request) {
  try {
    const { id, gsm } = await request.json()

    if (!id) return errorResponse("ID is required", 400)
    if (!gsm) return errorResponse("GSM value is required", 400)

    const { data, error } = await supabase.from("gsm").update({ gsm }).eq("id", id).select()

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

    const { error } = await supabase.from("gsm").delete().eq("id", id)

    if (error) return errorResponse(error.message)

    return NextResponse.json({ success: true, message: "GSM value deleted" })
  } catch (error) {
    return errorResponse(error.message || "An unexpected error occurred")
  }
}
