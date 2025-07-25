"use client"

import Image from "next/image"
import { useState } from "react"

export default function CouponCard({ code, discount, validUpto }) {
  const [copied, setCopied] = useState(false)

  const formatDate = (dateStr) => {
    if (!dateStr) return "Permanent"
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `Valid till ${day}/${month}/${year}`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (err) {
      // fallback or error handling
    }
  }

  return (
    <div
      className="relative w-full h-24 cursor-pointer group" // Fixed height, no responsive sizing
      onClick={handleCopy}
      title="Click to copy coupon code"
    >
      <Image
        src="/assets/adminsvgs/couponsvg.svg"
        alt="Coupon"
        fill
        style={{ objectFit: "cover" }}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
      />

      <div className="absolute left-8 inset-0 flex"> {/* Fixed left positioning */}
        <div className="flex-1 flex flex-col justify-center text-white">
          <div className="text-base font-bold mb-1 tracking-wider break-all"> {/* Fixed text size */}
            {code}
          </div>
          <div className="text-xs opacity-80">
            {copied ? "Copied!" : "Click to copy"}
          </div>
          <div className="text-xs opacity-70 mt-1">
            {formatDate(validUpto)}
          </div>
        </div>

        <div className="w-20 flex flex-col items-center justify-center mr-4"> {/* Fixed width and margin */}
          <div className="transform -rotate-90 text-center">
            <div className="text-purple-600 text-2xl font-bold leading-none mb-1"> {/* Fixed text size */}
              {discount}
            </div>
            <div className="text-purple-600 text-xs font-semibold">OFF</div>
          </div>
        </div>
      </div>
    </div>
  )
}
