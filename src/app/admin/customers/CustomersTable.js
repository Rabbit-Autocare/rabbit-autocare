'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Search, ChevronDown, UserPlus, AlertCircle } from 'lucide-react';

export default function CustomersTable({ initialUsers, initialError }) {
  const [users, setUsers] = useState(initialUsers || []);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(initialError);
  const usersPerPage = 10;

  const supabase = createSupabaseBrowserClient();

  // Fetch users on mount and poll every 60s
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.from('auth_users').select('*');
        if (error) throw error;
        setUsers(data || []);
      } catch {
        setError('Failed to fetch users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    const interval = setInterval(fetchUsers, 60000);
    return () => clearInterval(interval);
  }, [supabase]);

  const toggleBanStatus = async (user) => {
    if (updating) return;
    setUpdating(true);
    try {
      const newStatus = !user.is_banned;
      const { error } = await supabase
        .from('auth_users')
        .update({ is_banned: newStatus })
        .eq('id', user.id);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_banned: newStatus } : u))
      );
    } catch {
      alert('Failed to update user status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone_number || '').includes(searchTerm)
  );
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const displayUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // if (loading) {
  //   return (
  //     <div className='p-6 max-w-7xl mx-auto'>
  //       <div className="flex items-center justify-center h-64">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
  //           <p className="text-gray-600">Loading customers...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Page Header */}
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Customers</h1>
        <button className='bg-gray-200 hover:bg-[#601E8D] hover:text-white text-black px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2'>
          <UserPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
          <div className='flex items-center gap-2'>
            <AlertCircle className='text-red-500' size={20} />
            <span className='text-red-700'>{error.message || error}</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className='mb-6'>
        <div className='relative w-full'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#777777] w-4 h-4' />
          <input
            type='text'
            placeholder='Search customers by name, email, or phone'
            value={searchTerm}
            onChange={handleSearch}
            className='w-full text-black placeholder-[#777777] bg-gray-100 pl-10 pr-4 py-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white'
          />
        </div>
      </div>

      {/* Filter Buttons with Dropdowns (static, for UI only) */}
      <div className='flex gap-4 mb-4'>
        {['Order Count', 'Region', 'Date'].map((filter) => (
          <div className='relative' key={filter}>
            <button
              type='button'
              className='text-sm text-black bg-gray-100 px-4 py-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors'
              disabled
            >
              {filter}
              <ChevronDown className='w-4 h-4' />
            </button>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className='bg-white rounded-lg border border-[#E0DBE3] overflow-hidden'>
        <table className='min-w-full'>
          <thead className='text-black border-b border-[#E0DBE3] bg-gray-50'>
            <tr className='h-12'>
              <th className='px-5 py-4 text-left text-sm font-medium'>Name</th>
              <th className='px-5 py-4 text-left text-sm font-medium'>Email</th>
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
                Status
              </th>
              <th className='px-5 py-4 text-left text-sm font-medium'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-[#E0DBE3]'>
            {displayUsers.length === 0 ? (
              <tr>
                <td colSpan='7' className='px-5 py-8 text-center'>
                  <div className='text-gray-500'>
                    <UserPlus
                      size={48}
                      className='mx-auto mb-4 text-gray-300'
                    />
                    <p className='text-lg font-medium mb-2'>
                      {searchTerm ? 'No customers found' : 'No customers yet'}
                    </p>
                    <p className='text-sm'>
                      {searchTerm
                        ? 'Try adjusting your search terms.'
                        : 'Customers will appear here once they register.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayUsers.map((user) => (
                <tr
                  key={user.id}
                  className='hover:bg-gray-50 h-12 transition-colors'
                >
                  <td className='px-5 py-3 text-black text-sm font-medium'>
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
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_banned
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {user.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className='px-5 py-3'>
                    <button
                      onClick={() => toggleBanStatus(user)}
                      disabled={updating}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        user.is_banned
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {user.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex justify-center mt-6'>
          <nav className='flex items-center gap-2'>
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              className='px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 flex items-center justify-center text-sm rounded-md transition-colors ${
                  page === currentPage
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                handlePageChange(Math.min(currentPage + 1, totalPages))
              }
              className='px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
