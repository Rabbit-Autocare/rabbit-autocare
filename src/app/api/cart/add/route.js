import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
	try {
		console.log("POST /api/cart/add: Attempting to create Supabase client with awaited cookies...");
		// Get Supabase client
		const cookieStore = await cookies(); // Await cookies()
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore }); // Pass as a function

		console.log("POST /api/cart/add: Attempting to get user session...");
		const { data: { user }, error: userError } = await supabase.auth.getUser();

		console.log("POST /api/cart/add: Supabase getUser result:", { user, userError });

		// Check if user is authenticated
		if (userError || !user) {
			console.warn("POST /api/cart/add: Unauthorized access attempt.", userError);
			return NextResponse.json(
				{ error: "Unauthorized - Please log in to add items to cart" },
				{ status: 401 }
			);
		}

		console.log(`POST /api/cart/add: User ${user.id} authenticated.`);

		const { productId, quantity, price, variantId, productName, productImage, variant } = await request.json();

		console.log("POST /api/cart/add: Received item details:", { productId, quantity, price, variantId, productName, productImage, variant });

		if (!productId || !quantity || !price) {
			console.warn("POST /api/cart/add: Missing required fields.", { productId, quantity, price });
			return NextResponse.json(
				{ error: "Missing required fields: productId, quantity, and price are required" },
				{ status: 400 }
			);
		}

		// Check if item already exists in cart
		console.log("POST /api/cart/add: Checking if item already exists...");
		const { data: existingItems, error: fetchError } = await supabase
			.from('cart_items')
			.select('id, quantity')
			.eq('user_id', user.id)
			.eq('product_id', productId)
			.eq('variant_size', variant || 'default'); // Use variant_size column

		console.log("POST /api/cart/add: Existing item check result:", { existingItems, fetchError });

		if (fetchError) {
			console.error("POST /api/cart/add: Error checking for existing item:", fetchError);
			return NextResponse.json(
				{ error: "Failed to check for existing cart item" },
				{ status: 500 }
			);
		}

		let cartItem;
		let insertError;
		let updateError;

		if (existingItems && existingItems.length > 0) {
			// Item exists, update quantity
			const existingItem = existingItems[0];
			const newQuantity = existingItem.quantity + quantity;
			console.log(`POST /api/cart/add: Item exists (ID: ${existingItem.id}), updating quantity to ${newQuantity}.`);

			const { data, error } = await supabase
				.from('cart_items')
				.update({ quantity: newQuantity, updated_at: new Date().toISOString() })
				.eq('id', existingItem.id)
				.select()
				.single();

			cartItem = data;
			updateError = error;
			console.log("POST /api/cart/add: Update result:", { cartItem, updateError });

		} else {
			// Item does not exist, insert new item
			console.log("POST /api/cart/add: Item does not exist, inserting new item.");
			const { data, error } = await supabase
				.from('cart_items')
				.insert([
					{
						user_id: user.id,
						product_id: productId,
						quantity: quantity,
						name: productName, // Include denormalized data
						price: price, // Include denormalized data
						image: productImage, // Include denormalized data
						variant_size: variant || 'default', // Use variant_size column
						// Consider adding variant_color, variant_gsm if needed based on schema
					},
				])
				.select()
				.single();

			cartItem = data;
			insertError = error;
			 console.log("POST /api/cart/add: Insert result:", { cartItem, insertError });
		}

		if (insertError || updateError) {
			const dbError = insertError || updateError;
			console.error("POST /api/cart/add: Database operation failed:", dbError);
			return NextResponse.json(
				{ error: "Failed to add or update cart item in database" },
				{ status: 500 }
			);
		}

		console.log("POST /api/cart/add: Database operation successful.", cartItem);
		return NextResponse.json({ success: true, cartItem });

	} catch (error) {
		console.error("POST /api/cart/add: Uncaught error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
