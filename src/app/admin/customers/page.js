'use client';
import '../../../app/globals.css';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Search, ChevronDown } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const usersPerPage = 10;

  const totalPages = Math.ceil(users.length / usersPerPage);
  const paginatedUsers = users.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    setUsers(data || []);
  };

  const toggleBanStatus = async (user) => {
    const newStatus = !user.is_banned;
    await supabase
      .from('users')
      .update({ is_banned: newStatus })
      .eq('id', user.id);
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AdminLayout>
      <div className='p-6 max-w-7xl mx-auto'>
        {/* Page Header */}
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-semibold text-gray-900'>Customers</h1>
          <button
            onClick={() => console.log('Add customer')}
            className='bg-gray-200 hover:bg-[#601E8D] hover:text-white text-black px-4 py-2 rounded-lg transit4on text-xs text-sm font-medium flex items-center gap-2'
          >
            Add Customer
          </button>
        </div>

        {/* Search Bar */}
        <div className='mb-6'>
          <div className='relative w-full'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#777777] w-4 h-4' />
            <input
              type='text'
              placeholder='Search customers'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full text-black placeholder-[#777777] bg-gray-100 pl-10 pr-4 py-2 rounded-lg outline-none text-sm'
            />
          </div>
        </div>

        {/* Filter Buttons with Dropdowns */}
        <div className='flex gap-4 mb-4'>
          {['Order Count', 'Region', 'Date'].map((filter) => (
            <div className='relative' key={filter}>
              <button
                className='text-sm text-black bg-gray-100 px-4 py-1.5 rounded-lg flex items-center gap-2'
                onClick={() =>
                  setActiveDropdown(activeDropdown === filter ? null : filter)
                }
              >
                {filter}
                <ChevronDown className='w-4 h-4' />
              </button>
              {activeDropdown === filter && (
                <div className='absolute mt-1 bg-white shadow-md rounded-md p-2 z-10'>
                  <button className='block text-sm text-gray-700 hover:text-black px-2 py-1'>
                    Option 1
                  </button>
                  <button className='block text-sm text-gray-700 hover:text-black px-2 py-1'>
                    Option 2
                  </button>
                  <button className='block text-sm text-gray-700 hover:text-black px-2 py-1'>
                    Option 3
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className='bg-white rounded-lg border border-[#E0DBE3]'>
          <table className='min-w-full'>
            <thead className='text-black border-b border-[#E0DBE3]'>
              <tr className='h-12'>
                <th className='px-5 py-4 text-left text-sm font-medium'>
                  Name
                </th>
                <th className='px-5 py-4 text-left text-sm font-medium'>
                  Email
                </th>
                <th className='px-5 py-4 text-left text-sm font-medium'>
                  Phone Number
                </th>
                <th className='px-5 py-4 text-left text-sm font-medium'>
                  Location
                </th>
                <th className='px-5 py-4 text-left text-sm font-medium'>
                  Total Orders
                </th>
                <th className='px-5 py-4 text-left text-sm font-medium'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E0DBE3]'>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50 h-12'>
                  <td className='px-5 py-34text-black text-sm font-medium'>
                    {user.name || 'Unnamed'}
                  </td>
                  <td className='px-5 py-3 text-gray-700'>{user.email}</td>
                  <td className='px-5 py-3 text-gray-700'>
                    {user.phone_number || '—'}
                  </td>
                  <td className='px-5 py-3 text-gray-700'>
                    {user.location || '—'}
                  </td>
                  <td className='px-5 py-3 text-gray-700'>
                    {user.total_orders ?? 0}
                  </td>
                  <td className='px-5 py-3'>
                    <button
                      onClick={() => toggleBanStatus(user)}
                      className={`text-sm px-4 py-1.54rounded-md text-sm font-medium transition ${
                        user.is_banned
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {user.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination (only when needed) */}
        {users.length > usersPerPage && (
          <div className='flex justify-center mt-6'>
            <nav className='flex items-center gap-2'>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-40'
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center text-sm rounded ${
                      page === currentPage
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className='px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-40'
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
