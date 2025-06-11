"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Drawer({
	isOpen,
	onClose,
	children,
	position = "right",
	className = "",
}) {
	const drawerRef = useRef(null);

	// Handle click outside to close
	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (drawerRef.current && !drawerRef.current.contains(event.target)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleOutsideClick);
			// Prevent body scroll when drawer is open
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onClose]);

	// Handle ESC key to close
	useEffect(() => {
		const handleEscape = (event) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen, onClose]);

	const positionClasses = {
		right: "right-0 inset-y-0",
		left: "left-0 inset-y-0",
		top: "top-0 inset-x-0",
		bottom: "bottom-0 inset-x-0",
	};

	const transitionProps = {
		right: { x: "100%" },
		left: { x: "-100%" },
		top: { y: "-100%" },
		bottom: { y: "100%" },
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop overlay with animation */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="fixed inset-0 bg-black/50 z-[9998]"
						onClick={onClose}
					/>

					{/* Drawer panel with animation */}
					<motion.div
						ref={drawerRef}
						initial={transitionProps[position]}
						animate={{ x: 0, y: 0 }}
						exit={transitionProps[position]}
						transition={{
							type: "spring",
							damping: 25,
							stiffness: 200,
							duration: 0.3,
						}}
						className={`fixed ${positionClasses[position]} bg-white z-[9999] shadow-xl ${className}`}
						style={{
							height:
								position === "right" || position === "left" ? "100vh" : "auto",
							height:
								position === "right" || position === "left" ? "100dvh" : "auto", // Dynamic viewport height for mobile
							width:
								position === "top" || position === "bottom" ? "100vw" : "auto",
						}}
						// Prevent clicks inside the drawer from bubbling to the backdrop or outside click listener
						onClick={(e) => e.stopPropagation()}
					>
						{children}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
