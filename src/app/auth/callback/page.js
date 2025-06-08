// app/auth/callback/page.jsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
	const router = useRouter();

	useEffect(() => {
		const handleAuthCallback = async () => {
			try {
				// Wait for Supabase to process the OAuth callback
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();

				if (error) throw error;
				if (!session) throw new Error("No session found");

				console.log("Session details:", session);

				// Check if user is admin from auth_users table
				const { data: userData, error: userError } = await supabase
					.from("auth_users")
					.select("*")
					.eq("id", session.user.id)
					.single();

				if (userError) {
					console.error("Error fetching user data:", userError);
					window.location.href = "/";
					return;
				}

				console.log("User details from database:", userData);

				// Check if user is banned
				if (userData?.is_banned === true) {
					console.error("User is banned");
					router.push("/login?error=user_banned");
					return;
				}

				// Redirect based on is_admin status
				if (userData?.is_admin === true) {
					window.location.href = "/admin";
				} else {
					window.location.href = "/";
				}
			} catch (error) {
				console.error("Auth callback error:", error);
				router.push("/login?error=auth_failed");
			}
		};

		handleAuthCallback();
	}, [router]);

	return (
		<div className="flex justify-center items-center h-screen">
			<div className="text-center">
				<h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
				<p>Please wait while we log you in.</p>
			</div>
		</div>
	);
}
