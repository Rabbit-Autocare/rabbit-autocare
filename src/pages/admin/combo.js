'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'
import "../../app/globals.css"
import Image from 'next/image';

export default function ComboMakerPage() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [comboName, setComboName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (data) setProducts(data);
      if (error) console.error(error);
    };
    fetchProducts();
  }, []);

 const handleProductSelect = (productId) => {
  const selectedCount = Object.keys(selectedProducts).length;
  const isAlreadySelected = !!selectedProducts[productId];

  if (!isAlreadySelected && selectedCount >= 3) {
    alert('You can only select 2 to 3 products for a combo.');
    return;
  }

  setSelectedProducts((prev) => {
    const updated = { ...prev };
    if (isAlreadySelected) {
      delete updated[productId];
    } else {
      updated[productId] = 1;
    }
    return updated;
  });
};


  const handleQuantityChange = (productId, qty) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: parseInt(qty),
    }));
  };

  const selectedProductDetails = products.filter((p) => selectedProducts[p.id]);

  const originalPrice = selectedProductDetails.reduce(
    (acc, p) => acc + p.price * selectedProducts[p.id],
    0
  );

  const discountAmount = Math.round((originalPrice * discountPercent) / 100);
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const handleCreateCombo = async () => {
    if (!comboName || selectedProductDetails.length === 0) {
      alert('Please enter combo name and select products');
      return;
    }

    const productsJson = selectedProductDetails.map((p) => ({
      product_id: p.id,
      quantity: selectedProducts[p.id],
    }));

    const { data, error } = await supabase.from('combos').insert([
      {
        name: comboName,
        description,
        image_url: imageUrl,
        original_price: originalPrice,
        price: finalPrice,
        discount_percent: discountPercent,
        products: productsJson,
      },
    ]);

    if (error) {
      alert('Error creating combo');
      console.error(error);
    } else {
      alert('Combo created!');
      setComboName('');
      setDescription('');
      setImageUrl('');
      setSelectedProducts({});
      setDiscountPercent(0);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-white dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100">
      {/* Left Panel - Products */}
      <div className="w-full lg:w-1/2 border dark:border-gray-700 rounded-lg p-4 shadow-md bg-gray-100 dark:bg-gray-800 overflow-y-auto max-h-[85vh]">
        <h2 className="text-2xl font-bold mb-4">🛒 Select Products</h2>
        {products.map((product) => (
          <div
            key={product.id}
            className={`flex items-center gap-4 p-3 mb-3 border rounded-lg transition-all ${
              selectedProducts[product.id]
                ? 'border-green-500 bg-green-100 dark:bg-green-900'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <input
              type="checkbox"
              checked={!!selectedProducts[product.id]}
              onChange={() => handleProductSelect(product.id)}
              className="w-5 h-5 accent-blue-500"
            />
            <Image
              src={product.image_url}
              alt={product.name}
              width={60}
              height={60}
              className="rounded-md object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">₹{product.price}</p>
              {selectedProducts[product.id] && (
                <input
                  type="number"
                  min={1}
                  value={selectedProducts[product.id]}
                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                  className="mt-1 w-20 border px-2 py-1 rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Right Panel - Combo Builder */}
      <div className="w-full lg:w-1/2 border dark:border-gray-700 rounded-lg p-6 shadow-md bg-gray-100 dark:bg-gray-800 space-y-4">
        <h2 className="text-2xl font-bold">🎁 Create Combo</h2>

        <input
          type="text"
          placeholder="Combo Name"
          value={comboName}
          onChange={(e) => setComboName(e.target.value)}
          className="w-full px-4 py-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700"
        />

        <textarea
          placeholder="Combo Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700"
        />

        <input
          type="text"
          placeholder="Combo Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full px-4 py-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700"
        />

        <input
          type="number"
          placeholder="Discount % (e.g. 15)"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
          className="w-full px-4 py-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700"
        />

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600 space-y-1">
          <p><strong>🧾 Original Price:</strong> ₹{originalPrice}</p>
          <p><strong>💸 Discount:</strong> {discountPercent}% (₹{discountAmount})</p>
          <p><strong>✅ Final Combo Price:</strong> ₹{finalPrice}</p>
        </div>

        <button
          onClick={handleCreateCombo}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          🚀 Create Combo
        </button>
      </div>
    </div>
  );
}
