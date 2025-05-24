// app/login/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
	const router = useRouter();
	const [user, setUser] = useState(null);
	const [userData, setUserData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkUser();
	}, []);

	const checkUser = async () => {
		try {
			const { data: { session }, error } = await supabase.auth.getSession();

			if (error) throw error;

			if (session?.user) {
				setUser(session.user);

				// Fetch user data from auth_users table
				const { data: userInfo, error: userError } = await supabase
					.from("auth_users")
					.select("*")
					.eq("id", session.user.id)
					.single();

				if (userError) throw userError;

				setUserData(userInfo);

				// Console log user details with highlighted fields
				console.log("User Details:", {
					"Email": userInfo.email,
					"Admin Status": userInfo.is_admin ? "Admin User" : "Regular User",
					"Full User Data": userInfo
				});
			}
		} catch (error) {
			console.error("Error checking user:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			setUser(null);
			setUserData(null);
			router.push("/login");
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Loading...</h1>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				{user ? (
					<div className="bg-white p-8 rounded-lg shadow-md">
						<h2 className="text-2xl font-bold text-center mb-6">User Information</h2>
						<div className="space-y-4">
							<div className="border-b pb-4">
								<p className="text-sm font-medium text-gray-500">Email</p>
								<p className="mt-1 text-lg">{userData?.email}</p>
							</div>
							<div className="border-b pb-4">
								<p className="text-sm font-medium text-gray-500">Name</p>
								<p className="mt-1 text-lg">{userData?.name || "Not set"}</p>
							</div>
							<div className="border-b pb-4">
								<p className="text-sm font-medium text-gray-500">Admin Status</p>
								<p className="mt-1 text-lg">
									{userData?.is_admin ? (
										<span className="text-green-600 font-semibold">Admin User</span>
									) : (
										<span className="text-gray-600">Regular User</span>
									)}
								</p>
							</div>
							<div className="border-b pb-4">
								<p className="text-sm font-medium text-gray-500">Account Status</p>
								<p className="mt-1 text-lg">
									{userData?.is_banned ? (
										<span className="text-red-600 font-semibold">Banned</span>
									) : (
										<span className="text-green-600">Active</span>
									)}
								</p>
							</div>
							<button
								onClick={handleLogout}
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
							>
								Logout
							</button>
						</div>
					</div>
				) : (
					<div className="bg-white p-8 rounded-lg shadow-md">
						<h2 className="text-2xl font-bold text-center mb-6">Sign in to your account</h2>
						<button
							onClick={() => supabase.auth.signInWithOAuth({
								provider: 'google',
								options: {
									redirectTo: `${window.location.origin}/auth/callback`
								}
							})}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							Sign in with Google
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
