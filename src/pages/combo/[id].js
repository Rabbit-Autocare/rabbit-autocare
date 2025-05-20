'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import "../../app/globals.css";

export default function ComboDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [combo, setCombo] = useState(null);
  const [products, setProducts] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: comboData, error: comboError } = await supabase
        .from('combos')
        .select('*')
        .eq('id', id)
        .single();

      if (comboError) {
        console.error('Combo fetch error:', comboError);
        return;
      }
      setCombo(comboData);

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*');

      if (productError) {
        console.error('Product fetch error:', productError);
        return;
      }
      setProducts(productData);

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) setUserId(userData.user.id);
    };

    fetchData();
  }, [id]);

  const getProductName = (pid) => {
    const product = products.find((p) => p.id === pid);
    return product ? product.name : 'Unknown Product';
  };

  const buynow = async () => {
    if (!userId) {
      alert('Please log in to proceed.');
      return;
    }
    router.push(`/checkout?combo_id=${id}`);
  };

  const addToCart = async () => {
    if (!userId) {
      alert('Please log in to add to cart.');
      return;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('combo_cart')
      .select('*')
      .eq('user_id', userId)
      .eq('combo_id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      alert('Error adding to cart');
      return;
    }

    if (existing) {
      await supabase
        .from('combo_cart')
        .update({ quantity: existing.quantity + 1, price: combo.price })
        .eq('id', existing.id);
    } else {
      await supabase.from('combo_cart').insert([
        {
          user_id: userId,
          combo_id: id,
          quantity: 1,
          price: combo.price,
        },
      ]);
    }

    alert('✅ Combo added to cart!');
  };

  if (!combo) return <p className="p-6">Loading combo details...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">{combo.name}</h1>

      {combo.image_url && (
        <Image
          src={combo.image_url}
          alt={combo.name}
          width={800}
          height={400}
          className="w-full h-64 object-cover rounded-md mb-6"
        />
      )}

      <p className="text-gray-700 text-lg mb-4">{combo.description}</p>

      <div className="bg-gray-50 border p-4 rounded-md mb-4">
        <h2 className="text-xl font-semibold mb-2">🧾 Pricing</h2>
        <p>Original Price: ₹{combo.original_price}</p>
        <p>Discount: {combo.discount_percent}%</p>
        <p className="text-green-600 font-bold">Final Price: ₹{combo.price}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">📦 Products Included</h2>
        <ul className="list-disc list-inside text-gray-800">
          {combo.products?.map((item, index) => (
            <li key={index}>
              {getProductName(item.product_id)} × {item.quantity}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={addToCart}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg text-lg"
        >
          🛒 Add Combo to Cart
        </button>
        <button
          onClick={buynow}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg text-lg"
        >
          ⚡ Buy Now
        </button>
      </div>
    </div>
  );
}
