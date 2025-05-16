'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import UserSidebar from '../../../components/UserSidebar';
import { useRouter } from 'next/navigation';
import "../../../app/globals.css";
export default function UserCartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
const router = useRouter();
  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) fetchCart();
  }, [userId]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  const fetchCart = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, quantity, product_id, products (id, name, price, image)')
      .eq('user_id', userId);

    if (!error) setCartItems(data);
    setLoading(false);
  };

  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', itemId);

    fetchCart();
  };

  const removeItem = async (itemId) => {
    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    fetchCart();
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.quantity * item.products.price,
      0
    );
  };

  const placeOrder = async () => {
    if (!userId || cartItems.length === 0) return;

    const orderItems = cartItems.map(item => ({
      product_id: item.product_id,
      name: item.products.name,
      price: item.products.price,
      quantity: item.quantity
    }));

    const { error } = await supabase.from('orders').insert([
      {
        user_id: userId,
        items: orderItems,
        total: calculateTotal(),
      }
    ]);

    if (!error) {
      await supabase.from('cart_items').delete().eq('user_id', userId);
      fetchCart();
      alert('Order placed successfully!');
      router.push(`/user/checkout`);
    } else {
      alert('Failed to place order.');
    }
  };

  if (loading) return <div className="p-6">Loading cart...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <UserSidebar />

      <main className="flex-1 ml-0 md:ml-60 p-6">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

        {cartItems.length === 0 ? (
          <p>No items in cart.</p>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white shadow p-4 rounded flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {item.products.image && (
                    <img
                      src={item.products.image}
                      alt={item.products.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-semibold">{item.products.name}</h2>
                    <p className="text-green-600">₹{item.products.price} each</p>
                    <p className="text-gray-600">
                      Total: ₹{item.quantity * item.products.price}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.id, parseInt(e.target.value))
                    }
                    className="w-16 border px-2 py-1 rounded"
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-white shadow p-4 rounded text-right text-xl font-bold">
              Grand Total: ₹{calculateTotal()}
            </div>

            <div className="text-right">
              <button
                onClick={placeOrder}
                className="bg-blue-600 text-white px-6 py-3 mt-4 rounded hover:bg-blue-700"
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
