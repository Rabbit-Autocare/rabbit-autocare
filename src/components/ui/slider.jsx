"use client"

import { useState, useEffect, useRef } from "react"

export function Slider({ value, onValueChange, max, min, step, className = "" }) {
  const [isDragging, setIsDragging] = useState(null)
  const sliderRef = useRef(null)

  const getPercentage = (val) => ((val - min) / (max - min)) * 100

  const getValue = (percentage) => {
    const rawValue = min + (percentage / 100) * (max - min)
    return Math.round(rawValue / step) * step
  }

  const handleMouseDown = (index) => (e) => {
    e.preventDefault()
    setIsDragging(index)
  }

  const handleMouseMove = (e) => {
    if (isDragging === null || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const newValue = getValue(percentage)

    const newValues = [...value]
    newValues[isDragging] = newValue

    // Ensure min <= max
    if (isDragging === 0 && newValue > value[1]) {
      newValues[1] = newValue
    } else if (isDragging === 1 && newValue < value[0]) {
      newValues[0] = newValue
    }

    // Clamp values
    newValues[0] = Math.max(min, Math.min(max, newValues[0]))
    newValues[1] = Math.max(min, Math.min(max, newValues[1]))

    onValueChange(newValues)
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  useEffect(() => {
    if (isDragging !== null) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, value])

  const handleTrackClick = (e) => {
    if (!sliderRef.current || isDragging !== null) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = ((e.clientX - rect.left) / rect.width) * 100
    const newValue = getValue(percentage)

    // Determine which thumb is closer
    const distanceToMin = Math.abs(newValue - value[0])
    const distanceToMax = Math.abs(newValue - value[1])
    const closerIndex = distanceToMin <= distanceToMax ? 0 : 1

    const newValues = [...value]
    newValues[closerIndex] = newValue

    // Ensure min <= max
    if (newValues[0] > newValues[1]) {
      if (closerIndex === 0) {
        newValues[1] = newValues[0]
      } else {
        newValues[0] = newValues[1]
      }
    }

    onValueChange(newValues)
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div ref={sliderRef} className="relative h-2 bg-gray-200 rounded-full cursor-pointer" onClick={handleTrackClick}>
        {/* Track fill */}
        <div
          className="absolute h-2 bg-blue-500 rounded-full"
          style={{
            left: `${getPercentage(value[0])}%`,
            width: `${getPercentage(value[1]) - getPercentage(value[0])}%`,
          }}
        />

        {/* Min thumb */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 top-1/2 hover:scale-110 transition-transform"
          style={{ left: `${getPercentage(value[0])}%` }}
          onMouseDown={handleMouseDown(0)}
        />

        {/* Max thumb */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 top-1/2 hover:scale-110 transition-transform"
          style={{ left: `${getPercentage(value[1])}%` }}
          onMouseDown={handleMouseDown(1)}
        />
      </div>
    </div>
  )
}
