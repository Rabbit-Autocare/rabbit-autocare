// app/layout.js (final version)
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "AutoCare - Quality Auto Parts",
	description: "Your trusted source for quality auto parts and accessories.",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className} suppressHydrationWarning>
				<ClientLayout>{children}</ClientLayout>
			</body>
		</html>
	);
}
