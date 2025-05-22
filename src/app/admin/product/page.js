'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import AdminLayout from '../../../components/layouts/AdminLayout';
import '../../../app/globals.css';
import Image from 'next/image';

/**
 * Product Management Component
 * Allows admins to view, create, edit and delete products
 */
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);

  /**
   * Fetches all products from database
   */
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (!error) setProducts(data);
  };

  /**
   * Deletes a product from database
   *
   * @param {string} id - Product ID to delete
   */
  const handleDelete = async (id) => {
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  /**
   * Updates product data in database
   *
   * @param {string} id - Product ID to update
   * @param {Object} newData - Updated product data
   */
  const handleEdit = async (id, newData) => {
    await supabase.from('products').update(newData).eq('id', id);
    fetchProducts();
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-wide">
          Product Management
        </h1>

        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                >
                  Image
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                >
                  Variants (Price, Size, Stock)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product, idx) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onDelete={() => handleDelete(product.id)}
                  onSave={(newData) => handleEdit(product.id, newData)}
                  onView={() => setModalProduct(product)}
                  isOdd={idx % 2 !== 0}
                />
              ))}
            </tbody>
          </table>
        </div>

        {modalProduct && (
          <Modal onClose={() => setModalProduct(null)}>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              {modalProduct.name} - Full Details
            </h2>
            {modalProduct.image && (
              <div className="relative w-full h-64 mb-4 rounded overflow-hidden border border-gray-300">
                <Image
                  src={modalProduct.image}
                  alt={modalProduct.name}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
            )}
            <p className="text-gray-700 mb-2">
              <strong>Category:</strong> {modalProduct.category || 'N/A'}
            </p>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">
              <strong>Description:</strong> {modalProduct.description || 'No description'}
            </p>
            <div className="text-gray-700">
              <strong>Variants:</strong>
              {modalProduct.variants && modalProduct.variants.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 mt-1">
                  {modalProduct.variants.map((v, i) => (
                    <li key={i}>
                      Price: ₹{v.price}, Size: {v.size}, Stock: {v.stock}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No variants available</p>
              )}
            </div>
            <button
              onClick={() => setModalProduct(null)}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Close
            </button>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}

function ProductRow({ product, onDelete, onSave, onView, isOdd }) {
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({
    name: product.name || '',
    category: product.category || '',
    description: product.description || '',
    variants: Array.isArray(product.variants) ? product.variants : [],
  });

  const handleChange = (e) => {
    setTempData({ ...tempData, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...tempData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setTempData({ ...tempData, variants: updatedVariants });
  };

  const addVariant = () => {
    setTempData({
      ...tempData,
      variants: [...tempData.variants, { price: '', size: '', stock: '' }],
    });
  };

  const removeVariant = (index) => {
    const updatedVariants = [...tempData.variants];
    updatedVariants.splice(index, 1);
    setTempData({ ...tempData, variants: updatedVariants });
  };

  const saveChanges = () => {
    const variants = tempData.variants.map((v) => ({
      price: Number(v.price) || 0,
      size: v.size,
      stock: Number(v.stock) || 0,
    }));
    onSave({ ...tempData, variants });
    setEditMode(false);
  };

  return (
    <tr
      className={`${
        isOdd ? 'bg-white' : 'bg-gray-50'
      } hover:bg-indigo-50 transition-colors duration-150 ease-in-out`}
    >
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 text-center">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={80}
            height={60}
            className="rounded-lg shadow-sm"
          />
        ) : (
          <span className="text-gray-400 italic">No Image</span>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
        {editMode ? (
          <input
            name="name"
            value={tempData.name}
            onChange={handleChange}
            className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        ) : (
          <span className="font-medium text-gray-900">{product.name}</span>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
        {editMode ? (
          <input
            name="category"
            value={tempData.category}
            onChange={handleChange}
            className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        ) : (
          <span className="text-gray-700">{product.category || '-'}</span>
        )}
      </td>

      <td className="px-6 py-4 max-w-xs whitespace-normal border-r border-gray-200">
        {editMode ? (
          <textarea
            name="description"
            value={tempData.description}
            onChange={handleChange}
            rows={2}
            className="border rounded-md p-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        ) : (
          <p className="text-gray-700 line-clamp-3">{product.description || '-'}</p>
        )}
      </td>

      <td className="px-6 py-4 max-w-sm whitespace-normal border-r border-gray-200">
        {editMode ? (
          <>
            {tempData.variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) => handleVariantChange(i, 'price', e.target.value)}
                  className="border rounded-md p-1 w-20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  min="0"
                />
                <input
                  type="text"
                  placeholder="Size"
                  value={v.size}
                  onChange={(e) => handleVariantChange(i, 'size', e.target.value)}
                  className="border rounded-md p-1 w-20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => handleVariantChange(i, 'stock', e.target.value)}
                  className="border rounded-md p-1 w-20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  min="0"
                />
                <button
                  onClick={() => removeVariant(i)}
                  className="text-red-600 hover:text-red-800 font-bold px-2"
                  title="Remove Variant"
                  type="button"
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              onClick={addVariant}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition"
              type="button"
            >
              + Add Variant
            </button>
          </>
        ) : product.variants && product.variants.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {product.variants.map((v, i) => (
              <li key={i}>
                ₹{v.price} | Size: {v.size} | Stock: {v.stock}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-gray-400 italic">-</span>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
        {editMode ? (
          <>
            <button
              onClick={saveChanges}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md transition"
              type="button"
            >
              Save
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1 rounded-md transition"
              type="button"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md transition"
              type="button"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md transition"
              type="button"
            >
              Delete
            </button>
            <button
              onClick={onView}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1 rounded-md transition"
              type="button"
            >
              View
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
