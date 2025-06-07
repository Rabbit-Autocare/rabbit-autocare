"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ShopPage() {
	const router = useRouter();
	const [products, setProducts] = useState([]);

	const fetchProducts = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from('products')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) throw error;
			setProducts(data);
		} catch (error) {
			console.error('Error fetching products:', error);
		}
	}, []);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	// Redirect to the "all" category
	useEffect(() => {
		router.push("/shop/all");
	}, [router]);

	// Return a simple loading state while redirecting
	return (
		<div className="p-8 text-center">
			<p>Redirecting to all products...</p>
		</div>
	);
}
