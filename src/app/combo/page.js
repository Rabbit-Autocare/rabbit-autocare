// Page showing all available product combos with discounts

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import '../../app/globals.css';
import RootLayout from '../../components/layouts/RootLayout';

export default function ComboListPage() {
  // State management for combo listing page
  const [combos, setCombos] = useState([]); // All available combos
  const [products, setProducts] = useState([]); // All products (for name lookup)
  const [userId, setUserId] = useState(null); // Current user ID
  const router = useRouter();

  // Effect to fetch all necessary data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      // Fetch all combos from database
      const { data: comboData, error: comboError } = await supabase
        .from('combos')
        .select('*');
      if (comboError) console.error('Combo Error:', comboError);
      setCombos(comboData || []);

      // Fetch all products to lookup product names in combos
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*');
      if (productError) console.error('Product Error:', productError);
      setProducts(productData || []);

      // Get current user for cart operations
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) setUserId(userData.user.id);
    };

    fetchData();
  }, []);

  // Helper function to get product name by ID
  const getProductNameById = (id) => {
    const product = products.find((p) => p.id === id);
    return product ? product.name : 'Unknown Product';
  };

  // Function to add combo to cart
  const addToComboCart = async (comboId) => {
    // Validation checks
    if (!userId) {
      alert('Please log in first!');
      return;
    }

    const combo = combos.find((c) => c.id === comboId);
    if (!combo) {
      alert('Combo not found!');
      return;
    }
    const comboPrice = combo.price;

    // Check if combo already exists in user's cart
    const { data: existing, error: fetchError } = await supabase
      .from('combo_cart')
      .select('*')
      .eq('user_id', userId)
      .eq('combo_id', comboId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Ignore "No rows found" error (PGRST116 means no rows found)
      console.error('Error fetching combo cart:', fetchError);
      alert('Failed to add combo to cart');
      return;
    }

    if (existing) {
      // If combo already in cart, increase quantity
      const { error: updateError } = await supabase
        .from('combo_cart')
        .update({
          quantity: existing.quantity + 1,
          price: comboPrice,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating combo cart:', updateError);
        alert('Failed to update combo in cart');
        return;
      }
    } else {
      // If combo not in cart, add new entry
      const { error: insertError } = await supabase.from('combo_cart').insert([
        {
          user_id: userId,
          combo_id: comboId,
          quantity: 1,
          price: comboPrice,
        },
      ]);

      if (insertError) {
        console.error('Error inserting combo cart:', insertError);
        alert('Failed to add combo to cart');
        return;
      }
    }

    alert('✅ Combo added to cart!');
    router.push('/cart'); // Navigate to cart page
  };

  return (
    <RootLayout>
      <div className='p-6 min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100'>
        <h2 className='text-3xl font-bold mb-6'>🎁 Available Combos</h2>

        {/* Grid of combo cards */}
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {combos.map((combo) => (
            <div
              key={combo.id}
              className='border dark:border-gray-700 rounded-xl p-4 shadow-md bg-gray-100 dark:bg-gray-800'
            >
              {/* Combo Image */}
              {combo.image_url && (
                <Image
                  src={combo.image_url}
                  alt={combo.name}
                  width={400}
                  height={200}
                  className='w-full h-48 object-cover rounded-md mb-3'
                />
              )}

              {/* Combo Information */}
              <h3 className='text-xl font-semibold'>{combo.name}</h3>
              <p className='text-sm text-gray-600 dark:text-gray-300 mb-2'>
                {combo.description}
              </p>

              {/* List of products included in combo */}
              <div className='text-sm mb-2'>
                <strong>Includes:</strong>
                <ul className='list-disc list-inside'>
                  {combo.products?.map((item, index) => (
                    <li key={index}>
                      {getProductNameById(item.product_id)} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing Information */}
              <div className='bg-white dark:bg-gray-700 rounded p-3 mt-2 border dark:border-gray-600'>
                <p>🧾 Original: ₹{combo.original_price}</p>
                <p>💸 Discount: {combo.discount_percent}%</p>
                <p className='text-green-600 dark:text-green-300 font-bold'>
                  ✅ Final Price: ₹{combo.price}
                </p>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => router.push(`/combo/${combo.id}`)} // Navigate to combo detail page
                className='flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition'
              >
                👁️ View Combo Offer
              </button>
            </div>
          ))}
        </div>
      </div>
    </RootLayout>
  );
}