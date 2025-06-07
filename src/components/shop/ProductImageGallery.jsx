"use client"

import { useState } from "react"
import Image from "next/image"

export default function ProductImageGallery({ images, alt }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Default to first image or placeholder if no images
  const imageList = images && images.length > 0 ? images : ["/placeholder.svg"]

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index)
  }

  return (
    <div className="flex w-full xl:w-1/2 h-full items-center justify-center sm:gap-4">
      {/* Desktop Thumbnails */}
      <div className="flex-col space-y-2 items-center hidden md:block">
        {imageList.map((image, i) => {
          const isActive = currentImageIndex === i;

          return (
            <div className="relative w-full h-full">
              <Image
                src={image || "/placeholder.svg"}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className={`
                  object-cover
                  ring-2 ${isActive ? 'ring-black opacity-100' : 'ring-transparent opacity-50'}
                `}
              />
            </div>
          );
        })}
      </div>

      {/* Main Image */}
      <div
        className="
          w-[460px] h-[200px]
          sm:w-[500px] sm:h-[350px]
          md:w-[500px] md:h-[320px]
          lg:w-[600px] lg:h-[300px]
          xl:w-[600px] xl:h-[600px]
          flex items-center justify-center
        "
      >
        <div className="relative w-full h-full">
          <Image
            src={imageList[currentImageIndex] || "/placeholder.svg"}
            alt={alt}
            fill
            className="
              featured-product-image
              object-contain w-full h-full transition-all duration-300
            "
          />
        </div>
      </div>

      {/* Mobile Thumbnails - positioned below main image */}
      <div className="flex flex-row space-x-3 items-start md:hidden absolute bottom-[-70px] left-0 w-full pl-4">
        {imageList.map((image, i) => {
          const isActive = currentImageIndex === i;

          return (
            <div className="relative w-20 h-20">
              <Image
                key={i}
                src={image || "/placeholder.svg"}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className={`
                  object-cover
                  ring-2 ${isActive ? 'ring-black opacity-100' : 'ring-transparent opacity-50'}
                `}
                onClick={() => handleThumbnailClick(i)}
              />
            </div>
          );
        })}
      </div>
    </div>
  )
}
