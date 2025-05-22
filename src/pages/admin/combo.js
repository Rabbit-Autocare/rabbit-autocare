'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import AdminSidebar from '../../components/admin/AdminSidebar';
import "../../app/globals.css"
export default function ComboMakerPage() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [comboName, setComboName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (data) setProducts(data);
      if (error) console.error(error);
    };
    fetchProducts();
  }, []);

  const handleSelectProduct = (productId) => {
    const isSelected = selectedProducts.includes(productId);
    if (isSelected) {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    } else {
      if (selectedProducts.length >= 5) {
        alert('You can select a maximum of 5 products.');
        return;
      }
      setSelectedProducts((prev) => [...prev, productId]);
    }
  };

  const handleVariantSelect = (productId, variant) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
  };

  const selectedDetails = products
    .filter((p) => selectedProducts.includes(p.id))
    .map((p) => {
      const variant = selectedVariants[p.id];
      const price = variant ? variant.price : 0;
      return { ...p, selectedVariant: variant, price };
    });

  const originalPrice = selectedDetails.reduce(
    (acc, p) => acc + (p.price || 0),
    0
  );

  const discountAmount = Math.round((originalPrice * discountPercent) / 100);
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const handleCreateCombo = async () => {
    if (!comboName || selectedDetails.length < 2) {
      alert('Please enter combo name and select at least 2 products.');
      return;
    }

    const productsJson = selectedDetails.map((p) => ({
      product_id: p.id,
      variant: p.selectedVariant,
    }));

    const { error } = await supabase.from('combos').insert([
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
      setSelectedProducts([]);
      setDiscountPercent(0);
      setSelectedVariants({});
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h2 className="text-3xl font-bold mb-6">🎁 Combo Maker</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Products */}
          <div className="bg-white p-4 rounded shadow border">
            <h3 className="text-xl font-semibold mb-4">🛒 Select Products</h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {products.map((product) => (
                <div key={product.id} className={`border p-3 rounded ${selectedProducts.includes(product.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="accent-blue-500"
                    />
                    <Image src={product.image_url} alt={product.name} width={60} height={60} className="rounded object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.variants?.map((variant, i) => (
                          <button
                            key={i}
                            className={`px-2 py-1 border rounded text-sm ${selectedVariants[product.id]?.size === variant.size ? 'bg-blue-600 text-white' : 'bg-white'}`}
                            onClick={() => handleVariantSelect(product.id, variant)}
                          >
                            {variant.size} - ₹{variant.price}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Combo Builder */}
          <div className="bg-white p-6 rounded shadow border space-y-4">
            <input
              type="text"
              placeholder="Combo Name"
              value={comboName}
              onChange={(e) => setComboName(e.target.value)}
              className="w-full border px-4 py-2 rounded"
            />
            <textarea
              placeholder="Combo Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border px-4 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border px-4 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Discount %"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
              className="w-full border px-4 py-2 rounded"
            />

            <div className="border rounded p-4 bg-gray-50">
              <p><strong>Original Price:</strong> ₹{originalPrice}</p>
              <p><strong>Discount:</strong> {discountPercent}% (₹{discountAmount})</p>
              <p><strong>Final Price:</strong> ₹{finalPrice}</p>
            </div>

            <button
              onClick={handleCreateCombo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              🚀 Create Combo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
