"use client";

import TopNavbar from "./TopNavbar";
import MiddleNavbar from "./MiddleNavbar";
import BottomNavbar from "./BottomNavbar";

export default function MainNavbar() {
  return (
    <header className="w-full relative">
      <TopNavbar />
      <MiddleNavbar />
      <BottomNavbar />
    </header>
  );
}
