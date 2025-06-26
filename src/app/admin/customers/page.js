'use client';
import '../../../app/globals.css';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Search, ChevronDown, UserPlus, AlertCircle } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [error, setError] = useState(null);
  const usersPerPage = 10;

  const totalPages = Math.ceil(users.length / usersPerPage);
  const paginatedUsers = users.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('auth_users').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      // Update local state immediately for better UX
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, is_banned: newStatus } : u
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number?.includes(searchTerm)
  );

  const displayUsers = searchTerm ? filteredUsers : paginatedUsers;

  if (loading) {
    return (
      <AdminLayout>
        <div className='p-6 max-w-7xl mx-auto'>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='p-6 max-w-7xl mx-auto'>
        {/* Page Header */}
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-semibold text-gray-900'>Customers</h1>
          <button
            onClick={() => console.log('Add customer')}
            className='bg-gray-200 hover:bg-[#601E8D] hover:text-white text-black px-4 py-2 rounded-lg transition text-xs text-sm font-medium flex items-center gap-2'
          >
            <UserPlus size={16} />
            Add Customer
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-red-700">{error}</span>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full text-black placeholder-[#777777] bg-gray-100 pl-10 pr-4 py-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white'
            />
          </div>
        </div>

        {/* Filter Buttons with Dropdowns */}
        <div className='flex gap-4 mb-4'>
          {['Order Count', 'Region', 'Date'].map((filter) => (
            <div className='relative' key={filter}>
              <button
                className='text-sm text-black bg-gray-100 px-4 py-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors'
                onClick={() =>
                  setActiveDropdown(activeDropdown === filter ? null : filter)
                }
              >
                {filter}
                <ChevronDown className='w-4 h-4' />
              </button>
              {activeDropdown === filter && (
                <div className='absolute mt-1 bg-white shadow-md rounded-md p-2 z-10 min-w-32'>
                  <button className='block text-sm text-gray-700 hover:text-black px-2 py-1 w-full text-left'>
                    Option 1
                  </button>
                  <button className='block text-sm text-gray-700 hover:text-black px-2 py-1 w-full text-left'>
                    Option 2
                  </button>
                  <button className='block text-sm text-gray-700 hover:text-black px-2 py-1 w-full text-left'>
                    Option 3
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className='bg-white rounded-lg border border-[#E0DBE3] overflow-hidden'>
          <table className='min-w-full'>
            <thead className='text-black border-b border-[#E0DBE3] bg-gray-50'>
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
                  <td colSpan="7" className="px-5 py-8 text-center">
                    <div className="text-gray-500">
                      <UserPlus size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">
                        {searchTerm ? 'No customers found' : 'No customers yet'}
                      </p>
                      <p className="text-sm">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Customers will appear here once they register.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayUsers.map((user) => (
                  <tr key={user.id} className='hover:bg-gray-50 h-12 transition-colors'>
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_banned
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className='px-5 py-3'>
                      <button
                        onClick={() => toggleBanStatus(user)}
                        disabled={updating}
                        className={`text-sm px-4 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.is_banned
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {updating ? 'Updating...' : (user.is_banned ? 'Unban' : 'Ban')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (only when needed and not searching) */}
        {!searchTerm && users.length > usersPerPage && (
          <div className='flex justify-center mt-6'>
            <nav className='flex items-center gap-2'>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className='px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center text-sm rounded-md transition-colors ${
                      page === currentPage
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
                className='px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
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
