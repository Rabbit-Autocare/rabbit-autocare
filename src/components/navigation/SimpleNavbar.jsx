"use client"

import Link from "next/link"

const navItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
]

export default function SimpleNavbar() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: "black",
        color: "white",
        padding: "16px 24px",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <div style={{ fontSize: "20px", fontWeight: "bold" }}>
          <Link href="/" style={{ color: "white", textDecoration: "none" }}>
            LOGO
          </Link>
        </div>

        {/* Navigation Items */}
        <ul
          style={{
            display: "flex",
            gap: "32px",
            margin: 0,
            padding: 0,
            listStyle: "none",
          }}
        >
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                style={{
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}