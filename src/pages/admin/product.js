'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminSidebar from '../../components/AdminSidebar';
import "../../app/globals.css";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (!error) setProducts(data);
  };

  const handleDelete = async (id) => {
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const handleEdit = async (id, newData) => {
    await supabase.from('products').update(newData).eq('id', id);
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-60 p-6 min-h-screen bg-gray-50 w-full">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Product Management</h1>

        <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-700">All Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={() => handleDelete(product.id)}
              onSave={(newData) => handleEdit(product.id, newData)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Product Card Component with Image
function ProductCard({ product, onDelete, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState(product);

  const handleChange = (e) => {
    setTempData({ ...tempData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border hover:shadow-lg transition flex flex-col">
      {/* Image on top */}
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-40 object-cover rounded mb-4"
        />
      )}

      {editMode ? (
        <>
          <input
            name="name"
            value={tempData.name}
            onChange={handleChange}
            placeholder="Product Name"
            className="border p-2 w-full rounded mb-2"
          />
          <input
            name="price"
            value={tempData.price}
            type="number"
            onChange={handleChange}
            placeholder="Price"
            className="border p-2 w-full rounded mb-2"
          />
          <textarea
            name="description"
            value={tempData.description}
            onChange={handleChange}
            placeholder="Description"
            className="border p-2 w-full rounded mb-3"
          />
          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => {
                onSave(tempData);
                setEditMode(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          <p className="text-green-700 font-medium">₹{product.price}</p>
          <p className="text-gray-600 mt-1 mb-3">{product.description}</p>
          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => setEditMode(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

