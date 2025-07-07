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
    return `Valid till ${day}/${month}/${year}`  // fixed format: DD/MM/YYYY
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
      className="relative w-full h-[150px] md:h-[100px] cursor-pointer group"
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

      <div className="absolute left-17 md:left-11 inset-0 flex">
        <div className="flex-1 flex flex-col justify-center text-white">
          <div className="text-2xl md:text-xl font-bold mb-1 tracking-wider">{code}</div>
          <div className="text-sm md:text-xs opacity-80">
            {copied ? "Copied!" : "Click to copy"}
          </div>
          <div className="text-xl md:text-xs opacity-70 mt-1">
            {formatDate(validUpto)}
          </div>
        </div>

        <div className="w-24 flex flex-col items-center justify-center mr-5 md:mr-1">
          <div className="transform -rotate-90 text-center">
            <div className="text-purple-600 text-4xl md:text-2xl font-bold leading-none mb-1">
              {discount}
            </div>
            <div className="text-purple-600 text-sm font-semibold">OFF</div>
          </div>
        </div>
      </div>
    </div>
  )
}
