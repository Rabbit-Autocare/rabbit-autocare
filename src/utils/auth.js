import { supabase } from "@/lib/supabaseClient";

// Handle user redirect after auth
export async function handlePostLogin(user) {
	const { email, id } = user;

	try {
		// Check user in auth_users table
		const { data: userData, error: userError } = await supabase
			.from("auth_users")
			.select("*")
			.eq("email", email)
			.single();

		console.log("User data from database:", userData);

		if (userError && userError.code !== "PGRST116") {
			console.error("Error fetching user data:", userError);
			return "/error";
		}

		// If user doesn't exist, create new user
		if (!userData) {
			const username =
				email.split("@")[0].replace(/[^a-zA-Z]/g, "") ||
				`user${Math.floor(Math.random() * 9000 + 1000)}`;

			const { data: newUser, error: createError } = await supabase
				.from("auth_users")
				.insert({
					id,
					email,
					name: username,
					is_admin: false,
					is_banned: false,
					phone_number: null
				})
				.select()
				.single();

			if (createError) {
				console.error("Error creating user:", createError);
				return "/error";
			}

			console.log("New user created:", newUser);
			return "/";
		}

		// Check if user is banned
		if (userData.is_banned === true) {
			console.error("User is banned");
			return "/login?error=user_banned";
		}

		// Redirect based on is_admin status
		return userData.is_admin ? "/admin" : "/";
	} catch (error) {
		console.error("Post-login error:", error);
		return "/error";
	}
}

// Get current session
export async function getCurrentSession() {
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();

	if (error) throw error;

	console.log("Current session:", session);
	return session;
}
