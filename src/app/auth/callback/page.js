// app/auth/callback/page.jsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthCallbackPage() {
	const router = useRouter();
	// Get user and session status from the central AuthContext
	const { user, isAdmin, sessionChecked } = useAuth();

	useEffect(() => {
		console.log("[AuthCallback] Page effect triggered. sessionChecked:", sessionChecked, "User exists:", !!user);

		// Wait until the AuthContext has finished its initial session check
		if (!sessionChecked) {
			console.log("[AuthCallback] Waiting for session to be checked by AuthContext...");
			return; // Do nothing until the session is checked
		}

		console.log("[AuthCallback] Session has been checked by AuthContext.");

		if (user) {
			// The user object from useAuth now includes the is_admin flag from our checkUserRole function
			console.log(`[AuthCallback] User is authenticated. isAdmin: ${isAdmin}. Redirecting...`);
			if (isAdmin) {
				router.replace("/admin");
			} else {
				router.replace("/");
			}
		} else {
			// If the session is checked and there's still no user, it means login failed.
			console.error("[AuthCallback] Authentication failed. Redirecting to login.");
			router.replace("/login?error=auth_failed");
		}

	}, [user, isAdmin, sessionChecked, router]);

	return (
		<div className="flex justify-center items-center h-screen bg-gray-50">
			<div className="text-center p-8 bg-white shadow-md rounded-lg">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
				<h1 className="text-2xl font-bold mb-2 text-gray-800">Finalizing Login...</h1>
				<p className="text-gray-600">Please wait, we&apos;re confirming your details.</p>
			</div>
		</div>
	);
}
