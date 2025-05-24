"use client"

import Link from "next/link"
import Image from "next/image"

export default function MiddleNavbar() {
  return (
    <div className="border-b py-4">
      <div className="container mx-auto flex justify-center">
        <Link href="/" className="text-4xl font-bold">
          <Image src="/assets/Main Logo.png" alt="logo" width={200} height={200} />
        </Link>
      </div>
    </div>
  )
}
