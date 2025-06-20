"use client"

import Image from "next/image"

export default function CouponCard({ code, discount, validUpto }) {
  console.log("CouponCard props:", { code, discount, validUpto })
  return (
    <div className="relative w-full h-[100px]">
      {/* Background SVG */}
      <Image
        src="/assets/adminsvgs/coupenCard.svg"
        alt="Coupon"
        fill
        style={{ objectFit: "cover" }}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
      />
      {/* Content */}
      <div className="absolute inset-0 flex items-center px-0">
        {/* Left side - Code, Apply text and Validity */}
        <div className="w-[60%] pl-6 flex flex-col justify-center">
          <div className="text-white text-sm font-medium mb-1 opacity-90">Coupon</div>
          <div className="text-white text-xl font-bold mb-1 tracking-wider">{code}</div>
          <div className="text-white text-xs opacity-80 cursor-pointer">Click to APPLY</div>
          {validUpto && (
            <div className="text-white text-xs opacity-70 mt-1">
              Valid till {new Date(validUpto).toLocaleDateString()}
            </div>
          )}
        </div>
        {/* Right side - Discount */}
        <div className="w-[40%] flex items-center justify-center pr-4">
          <div className="text-center">
            <div className="text-white text-3xl font-bold drop-shadow leading-none">{discount}%</div>
            <div className="text-white text-lg font-semibold drop-shadow">OFF</div>
          </div>
        </div>
      </div>
    </div>
  )
}
