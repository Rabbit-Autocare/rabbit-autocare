// app/client-layout.js
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Footer from "@/components/navigation/Footer";
import { CartProvider } from "@/contexts/CartContext";
import MainNavbar from "@/components/navigation/MainNavbar";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function ClientLayout({ children }) {
	const router = useRouter();
	const pathname = usePathname();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check initial session
		const checkSession = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setUser(user);
			setLoading(false);
		};

		checkSession();

		// Set up auth state listener
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			const currentUser = session?.user ?? null;
			setUser(currentUser);

			if (event === "SIGNED_OUT") {
				router.push("/login");
			} else if (
				event === "SIGNED_IN" &&
				!pathname.includes("/auth/callback")
			) {
				router.refresh();
			}
		});

		return () => subscription?.unsubscribe();
	}, [router, pathname]);

	if (loading) {
		return <div>Loading session...</div>;
	}



	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<CartProvider>
				<MainNavbar user={user} />
				{children}
				<Footer />
			</CartProvider>
		</ThemeProvider>
	);
}
