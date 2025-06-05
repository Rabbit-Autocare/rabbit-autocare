import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
  console.error(`API Error (colors): ${message}`)
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  try {
    const { data, error } = await supabase.from("colors").select("*").order("color")

    if (error) {
      console.error("Supabase error:", error)
      return errorResponse(error.message)
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Unexpected error in colors API:", error)
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json()
    if (!name) return errorResponse("Name is required", 400)

    const { data, error } = await supabase.from("colors").insert([{ color: name }]).select()
    if (error) return errorResponse(error.message)

    return NextResponse.json({ data: data[0] }, { status: 201 })
  } catch (error) {
    return errorResponse(error.message || "An unexpected error occurred")
  }
}

export async function PUT(request) {
  try {
    const { id, name } = await request.json()
    if (!id) return errorResponse("ID is required", 400)
    if (!name) return errorResponse("Name is required", 400)

    const { data, error } = await supabase.from("colors").update({ color: name }).eq("id", id).select()
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

    const { error } = await supabase.from("colors").delete().eq("id", id)
    if (error) return errorResponse(error.message)

    return NextResponse.json({ success: true, message: "Color deleted" })
  } catch (error) {
    return errorResponse(error.message || "An unexpected error occurred")
  }
}
