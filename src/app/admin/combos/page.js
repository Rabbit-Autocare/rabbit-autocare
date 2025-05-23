'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import "../../../app/globals.css";
export default function ComboManagementPage() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCombo, setSelectedCombo] = useState(null);

  useEffect(() => {
    fetchCombos();
  }, []);

  async function fetchCombos() {
    setLoading(true);
    const { data, error } = await supabase.from('combos').select('*');
    if (error) console.error('Fetch error:', error);
    else setCombos(data);
    setLoading(false);
  }

  async function deleteCombo(id) {
    const { error } = await supabase.from('combos').delete().eq('id', id);
    if (!error) {
      setCombos(combos.filter(combo => combo.id !== id));
    } else {
      alert('Error deleting combo');
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Combo Management</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Image</th>
                <th className="p-2">Name</th>
                <th className="p-2">Original Price</th>
                <th className="p-2">Price</th>
                <th className="p-2">Discount %</th>
                <th className="p-2">Created At</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {combos.map(combo => (
                <tr key={combo.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <img src={combo.image_url} alt={combo.name} className="w-16 h-16 object-cover rounded" />
                  </td>
                  <td className="p-2 font-medium">{combo.name}</td>
                  <td className="p-2">₹{combo.original_price}</td>
                  <td className="p-2 text-green-600">₹{combo.price}</td>
                  <td className="p-2">{combo.discount_percent}%</td>
                  <td className="p-2 text-sm text-gray-500">{new Date(combo.created_at).toLocaleDateString()}</td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => setSelectedCombo(combo)}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteCombo(combo.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full Combo Detail View */}
      {selectedCombo && (
        <div className="mt-6 bg-white p-4 border rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{selectedCombo.name} Details</h2>
            <button
              onClick={() => setSelectedCombo(null)}
              className="text-sm text-gray-600 hover:text-black"
            >
              Close
            </button>
          </div>

          <p className="mb-2"><strong>Description:</strong> {selectedCombo.description}</p>
          <p className="mb-2"><strong>Price:</strong> ₹{selectedCombo.price} (Original: ₹{selectedCombo.original_price})</p>
          <p className="mb-2"><strong>Discount:</strong> {selectedCombo.discount_percent}%</p>

          <h3 className="font-medium mt-4">Products in Combo:</h3>
          <ul className="list-disc ml-6 mt-2">
            {selectedCombo.products.map((prod, index) => (
              <li key={index}>
                Product ID: {prod.product_id}, Quantity: {prod.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
