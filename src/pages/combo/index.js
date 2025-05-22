'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import MainNavbar from '../../components/MainNavbar';
import '../../app/globals.css';

export default function ComboListPage() {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: comboData, error: comboError } = await supabase.from('combos').select('*');
      if (comboError) console.error('Combo Error:', comboError);
      setCombos(comboData || []);

      const { data: productData, error: productError } = await supabase.from('products').select('*');
      if (productError) console.error('Product Error:', productError);
      setProducts(productData || []);

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) setUserId(userData.user.id);
    };

    fetchData();
  }, []);

  const getProductNameById = (id) => {
    const product = products.find((p) => p.id === id);
    return product ? product.name : 'Unknown Product';
  };

  const addToComboCart = async (comboId) => {
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

    const { data: existing, error: fetchError } = await supabase
      .from('combo_cart')
      .select('*')
      .eq('user_id', userId)
      .eq('combo_id', comboId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching combo cart:', fetchError);
      alert('Failed to add combo to cart');
      return;
    }

    if (existing) {
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
    router.push('/cart');
  };

  return (
    <>
      <MainNavbar />
      <div className="p-8 min-h-screen bg-gradient-to-br from-white to-gray-100 text-gray-800">
        <h2 className="text-4xl font-bold mb-8 text-center">🔥 Hot Combo Offers</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition duration-300"
            >
              {combo.image_url && (
                <Image
                  src={combo.image_url}
                  alt={combo.name}
                  width={400}
                  height={200}
                  className="w-full h-56 object-cover"
                />
              )}

              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">{combo.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{combo.description}</p>

                <div className="mb-4">
                  <p className="font-medium mb-1">📦 Includes:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {combo.products?.map((item, index) => (
                      <li key={index}>
                        {getProductNameById(item.product_id)} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span>🧾 Original</span>
                    <span className="line-through">₹{combo.original_price}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>💸 Discount</span>
                    <span>{combo.discount_percent}%</span>
                  </div>
                  <div className="flex justify-between font-semibold text-green-600 text-base">
                    <span>Final Price</span>
                    <span>₹{combo.price}</span>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => router.push(`/combo/${combo.id}`)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
                  >
                    👁️ View Offer
                  </button>
                  <button
                    onClick={() => addToComboCart(combo.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
                  >
                    ➕ Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
