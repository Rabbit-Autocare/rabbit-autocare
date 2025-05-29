import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ProjectBlock({
	title,
	description,
	image,
	link,
	technologies,
	isLast,
}) {
	const ref = useRef(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start center", "end start"],
	});

	// Parallax effect for image (subtle movement)
	const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "0%"]);

	return (
		<motion.div
			ref={ref}
			className="project-block relative bg-secondary text-default w-full md:min-h-[400px] lg:min-h-[430px] xl:min-h-[500px]"
		>
			{/* Content Block */}
			<div className="project-content h-full px-4 md:px-8 py-10 lg:pt-5 lg:py-0 flex items-center justify-center w-full">
				<div className="xl:max-w-[1200px] w-full flex flex-col md:flex-row items-center md:items-start justify-between">
					{/* Left side */}
					<div className="content-left md:sticky top-8 z-20">
						<h2 className="text-3xl md:text-[27px] lg:text-[35px] xl:text-[45px] font-bold mb-6 tracking-wide md:w-[400px] lg:w-[500px] xl:w-[650px]">
							{title}
						</h2>
						<p className="text-lg md:text-[18px] lg:text-[20px] xl:text-2xl mb-4 md:w-[350px] lg:w-[400px] xl:w-[550px]">
							{description}
						</p>

						{/* Technologies Tags */}
						<div className="flex flex-wrap gap-2 mb-6">
							{technologies?.map((tech, index) => (
								<span
									key={index}
									className="tech-tag px-4 py-1 rounded-md text-sm font-medium"
									style={{
										backgroundColor: "var(--secondary-color)",
										color: "#ffffff",
										transition: "all 0.3s ease",
									}}
								>
									{tech}
								</span>
							))}
						</div>

						<motion.a
							href={link}
							target="_blank"
							rel="noreferrer"
							className="inline-block px-6 py-3 font-semibold rounded transition-all duration-300"
							style={{
								backgroundColor: "var(--primary-color)",
								color: "#000000",
								border: "1px solid transparent",
							}}
							whileHover={{
								y: -2,
								boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
							}}
							transition={{ duration: 0.3 }}
						>
							Learn More
						</motion.a>
					</div>

					{/* Right side — Rectangle Image */}
					<div className="project-image-container flex items-center justify-center px-1 mt-12 md:mt-6 lg:mt-9 xl:mt-1 md:px-0 md:sticky top-0 z-10">
						<motion.img
							src={image}
							alt={title}
							className="w-[400px] h-[200px] md:w-[400px] md:h-[200px] lg:w-[500px] lg:h-[300px] xl:w-[550px] xl:h-[350px] p-0 object-cover rounded-lg project-image"
							style={{ y: imageY }}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
