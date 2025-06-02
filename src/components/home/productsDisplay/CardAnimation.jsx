"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ProjectBlock from "./ProductsBlock";

// Individual sticky section component
function StickySection({ children, index, isLast }) {
	const ref = useRef(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start start", "end start"],
	});

	// Calculate when this section should start sticking and when it should unstick
	const y = useTransform(
		scrollYProgress,
		[0, 1],
		["0%", isLast ? "0%" : "-100%"],
	);
	const scale = useTransform(
		scrollYProgress,
		[0, 0.1, 0.9, 1],
		[1, 0.98, 0.98, isLast ? 1 : 0.95],
	);

	if (isLast) {
		// Last section doesn't need sticky behavior
		return (
			<motion.div ref={ref} className="relative z-10">
				{children}
			</motion.div>
		);
	}

	return (
		<motion.div
			ref={ref}
			className="sticky top-0 h-screen flex items-start"
			style={{
				zIndex: 50 - index,
			}}
		>
			<motion.div
				className="w-full"
				style={{
					y,
					scale,
				}}
			>
				{children}
			</motion.div>
		</motion.div>
	);
}

// Separator component with sticky behavior
function StickySeparator({ index }) {
	const ref = useRef(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start start", "end start"],
	});

	const opacity = useTransform(scrollYProgress, [0.8, 1], [1, 0]);

	return (
		<motion.div
			ref={ref}
			className="sticky top-0 w-full border-t border-dotted bg-secondary h-1"
			style={{
				zIndex: 49 - index,
				opacity,
			}}
		/>
	);
}

export default function CardAnimation({ projects = [], darkMode }) {
	// Early return if projects is empty or undefined
	if (!projects || projects.length === 0) {
		return (
			<div className="relative w-full p-8 text-center">
				<p>No projects to display</p>
			</div>
		);
	}

	return (
		<div className="relative w-full">
			{projects.map((proj, idx) => (
				<div key={idx} className="relative">
					{/* Each section gets its own sticky container */}
					<StickySection index={idx} isLast={idx === projects.length - 1}>
						<div
							style={{
								minHeight: idx === projects.length - 1 ? "auto" : "150vh",
							}}
						>
							<ProjectBlock
								title={proj.title}
								description={proj.description}
								technologies={proj.technologies}
								image={proj.image}
								link={proj.link}
								isLast={idx === projects.length - 1}
								darkMode={darkMode}
							/>
						</div>
					</StickySection>

					{/* Render separator border between blocks */}
					{idx < projects.length - 1 && <StickySeparator index={idx} />}
				</div>
			))}
		</div>
	);
}
