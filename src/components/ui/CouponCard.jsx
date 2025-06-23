"use client"

import Image from "next/image"
import { useState } from "react"

export default function CouponCard({ code, discount, validUpto }) {
  const [copied, setCopied] = useState(false)

  // console.log("CouponCard props:", { code, discount, validUpto })

  // Format expiry date or show permanent
  const getExpiryText = () => {
    if (validUpto) {
      return `Valid till ${new Date(validUpto).toLocaleDateString()}`
    }
    return "Permanent"
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
      {/* Background SVG */}
      <Image
        src="/assets/adminsvgs/couponsvg.svg"
        alt="Coupon"
        fill
        style={{ objectFit: "cover" }}
        className="absolute top-0 left-0 w-full h-full rounded-lg "
      />

      {/* Content Overlay */}
      <div className="absolute left-17 md:left-11 inset-0 flex">
        {/* Left Purple Section - Main Coupon Info */}
        <div className="flex-1 flex flex-col justify-center  text-white">
          {/* <div className="text-sm font-medium mb-1 opacity-90">Coupon</div> */}
          <div className="text-2xl md:text-xl font-bold mb-1 tracking-wider">{code}</div>
          <div className="text-sm md:text-xs opacity-80">
            {copied ? "Copied!" : "Click to copy"}
          </div>
          <div className="text-xl md:text-xs opacity-70 mt-1">
            {getExpiryText()}
          </div>
        </div>

        {/* Right White Section - Discount Display */}
        <div className="w-24 flex flex-col items-center justify-center mr-5 md:mr-1  ">
          {/* Rotated Discount Text */}
          <div className="transform -rotate-90 text-center">
            <div className="text-purple-600 text-4xl md:text-2xl font-bold leading-none mb-1">
              {discount}
            </div>
            <div className="text-purple-600 text-sm font-semibold">
              OFF
            </div>
          </div>
        </div>
      </div>

      {/* Perforation Line Effect (Optional) */}
      {/* <div className="absolute right-21 top-0 bottom-0 w-px bg-gray-300 opacity-50"></div> */}
    </div>
  )
}
