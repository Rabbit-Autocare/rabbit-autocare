'use client';
import '../../app/globals.css';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminPage() {
  const [view, setView] = useState('users');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    if (view === 'users') fetchUsers();
    if (view === 'products') fetchProducts();
  }, [view]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error.message);
    } else {
      setUsers(data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Error fetching products:', error.message);
    } else {
      setProducts(data);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchProducts();
  };

  const handleUpdate = async () => {
    const { id, name, price } = editProduct;
    const { error } = await supabase
      .from('products')
      .update({ name, price })
      .eq('id', id);

    if (!error) {
      setEditProduct(null);
      fetchProducts();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar setView={setView} />

      {/* Main Content */}
      <main className="flex-1 p-8 ml-60">
        {view === 'users' && (
          <section>
            <h2 className="text-xl font-bold mb-4">All Users ({users.length})</h2>
            <ul className="space-y-2">
              {users.map((user) => (
                <li key={user.id} className="p-4 border rounded">
                  <strong>{user.name || 'No Name'}</strong>
                  <br />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {view === 'products' && (
          <section>
            <h2 className="text-xl font-bold mb-4">All Products</h2>
            <ul className="space-y-4">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="p-4 border rounded flex justify-between items-center"
                >
                  {editProduct?.id === product.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editProduct.name}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, name: e.target.value })
                        }
                        className="border px-2 py-1"
                      />
                      <input
                        type="number"
                        value={editProduct.price}
                        onChange={(e) =>
                          setEditProduct({ ...editProduct, price: Number(e.target.value) })
                        }
                        className="border px-2 py-1 w-24"
                      />
                      <button
                        onClick={handleUpdate}
                        className="bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditProduct(null)}
                        className="bg-gray-400 px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <strong>{product.name}</strong> — ₹{product.price}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditProduct(product)}
                          className="bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
