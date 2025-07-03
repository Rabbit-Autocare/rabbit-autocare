'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Search, ChevronDown, UserPlus, AlertCircle, Users, Shield, RefreshCw, Filter, ShoppingBag } from 'lucide-react';

// Utility function to format dates consistently for SSR
const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (error) {
    return '—';
  }
};

export default function EnhancedCustomersTable({ initialUsers, initialError }) {
  const [users, setUsers] = useState(initialUsers || []);
  const [loading, setLoading] = useState(!initialUsers);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(initialError);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [ordersCount, setOrdersCount] = useState({});
  const usersPerPage = 10;

  const supabase = createSupabaseBrowserClient();

  // Fetch users
  const fetchUsers = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [supabase]);

  // Fetch order counts for all users
  const fetchOrdersCount = useCallback(async (userIds) => {
    if (!userIds.length) return;
    // Fetch all orders for these users
    const { data, error } = await supabase
      .from('orders')
      .select('user_id')
      .in('user_id', userIds);

    if (error) return;

    // Count orders per user in JS
    const map = {};
    data.forEach((row) => {
      if (!row.user_id) return;
      map[row.user_id] = (map[row.user_id] || 0) + 1;
    });
    setOrdersCount(map);
  }, [supabase]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!initialUsers || initialUsers.length === 0) {
      fetchUsers(true);
    }
    const interval = setInterval(() => fetchUsers(false), 60000);
    return () => clearInterval(interval);
  }, [fetchUsers, initialUsers]);

  // Fetch order counts when users change
  useEffect(() => {
    if (users.length) {
      fetchOrdersCount(users.map(u => u.id));
    }
  }, [users, fetchOrdersCount]);

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers(false);
    setRefreshing(false);
  };

  // Filtering logic
  const filteredUsers = users.filter((user) => {
    if (!user) return false;
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone_number || '').includes(searchTerm);

    const matchesUserType =
      userTypeFilter === 'all' ||
      (userTypeFilter === 'admin' && Boolean(user.is_admin)) ||
      (userTypeFilter === 'user' && !Boolean(user.is_admin));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !Boolean(user.is_banned)) ||
      (statusFilter === 'banned' && Boolean(user.is_banned));

    return matchesSearch && matchesUserType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const sortedUsers = [...filteredUsers].sort((a, b) => (ordersCount[b.id] ?? 0) - (ordersCount[a.id] ?? 0));
  const displayUsers = sortedUsers.slice(
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

  useEffect(() => {
    setCurrentPage(1);
  }, [userTypeFilter, statusFilter]);

  const stats = {
    total: users.length,
    admins: users.filter(u => u && Boolean(u.is_admin)).length,
    regularUsers: users.filter(u => u && !Boolean(u.is_admin)).length,
    banned: users.filter(u => u && Boolean(u.is_banned)).length,
    active: users.filter(u => u && !Boolean(u.is_banned)).length
  };

  if (loading) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <RefreshCw className='animate-spin mx-auto mb-4 text-purple-600' size={32} />
            <p className='text-gray-600'>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  // After fetching ordersCount, find the max:
  const maxOrders = Math.max(...Object.values(ordersCount));

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Page Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>User Management</h1>
          <div className='flex items-center gap-4 text-sm text-gray-600'>
            <span className='flex items-center gap-1'>
              <Users size={16} />
              <span className="font-semibold">{stats.total}</span> Total
            </span>
            <span className='flex items-center gap-1'>
              <Shield size={16} />
              <span className="font-semibold">{stats.admins}</span> Admins
            </span>
            <span><span className="font-semibold">{stats.regularUsers}</span> Users</span>
            <span className="text-green-700"><span className="font-semibold">{stats.active}</span> Active</span>
            <span className="text-red-700"><span className="font-semibold">{stats.banned}</span> Banned</span>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className='bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2'
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          
        </div>
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

      {/* Search and Filter Section */}
      <div className='mb-6 space-y-4'>
        <div className='relative w-full'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <input
            type='text'
            placeholder='Search users by name, email, or phone'
            value={searchTerm}
            onChange={handleSearch}
            className='w-full text-black placeholder-gray-400 bg-white border border-gray-300 pl-10 pr-4 py-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
          />
        </div>

        {/* Filter Controls */}
        <div className='flex flex-wrap items-center gap-4'>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* User Type Filter */}
          <div className='relative'>
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className='appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
            >
              <option value='all'>All Users</option>
              <option value='admin'>Admins Only</option>
              <option value='user'>Regular Users</option>
            </select>
            <ChevronDown size={16} className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none' />
          </div>

          {/* Status Filter */}
          <div className='relative'>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
            >
              <option value='all'>All Status</option>
              <option value='active'>Active Only</option>
              <option value='banned'>Banned Only</option>
            </select>
            <ChevronDown size={16} className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none' />
          </div>

          {/* Active Filter Tags */}
          {(userTypeFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-500'>Active filters:</span>
              {userTypeFilter !== 'all' && (
                <span className='inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs'>
                  {userTypeFilter === 'admin' ? 'Admins' : 'Regular Users'}
                  <button
                    onClick={() => setUserTypeFilter('all')}
                    className='hover:bg-purple-200 rounded-full p-0.5'
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs'>
                  {statusFilter === 'active' ? 'Active' : 'Banned'}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className='hover:bg-blue-200 rounded-full p-0.5'
                  >
                    ×
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className='inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs'>
                  Search:"{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className='hover:bg-green-200 rounded-full p-0.5'
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                User
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Contact
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Role
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Orders
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Joined
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {displayUsers.length === 0 ? (
              <tr>
                <td colSpan='6' className='px-6 py-12 text-center'>
                  <div className='text-gray-500'>
                    <Users size={48} className='mx-auto mb-4 text-gray-300' />
                    <p className='text-lg font-medium mb-2'>
                      {searchTerm || userTypeFilter !== 'all' || statusFilter !== 'all'
                        ? 'No users found'
                        : 'No users yet'}
                    </p>
                    <p className='text-sm'>
                      {searchTerm || userTypeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters.'
                        : 'Users will appear here once they register.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayUsers.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50 transition-colors'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0 h-10 w-10'>
                        <div className='h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center'>
                          <span className='text-sm font-bold text-purple-800'>
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()
                          }</span>
                        </div>
                      </div>
                      <div className='ml-4'>
                        <div className='text-sm font-semibold text-gray-900'>
                          {user.name || 'Unnamed User'}
                        </div>
                        <div className='text-xs text-gray-500'>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>{user.phone_number || '—'}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      Boolean(user.is_admin)
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {Boolean(user.is_admin) ? (
                        <>
                          <Shield size={12} className='mr-1' />
                          Admin
                        </>
                      ) : (
                        <>
                          <Users size={12} className='mr-1' />
                          User
                        </>
                      )}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      Boolean(user.is_banned)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {Boolean(user.is_banned) ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-center'>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs">
                      <ShoppingBag size={14} className="mr-1" />
                      {ordersCount[user.id] ?? 0}
                      {ordersCount[user.id] === maxOrders && maxOrders > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">Top Buyer</span>
                      )}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex justify-between items-center mt-6'>
          <div className='text-sm text-gray-700'>
            Showing {Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length)} to{' '}
            {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <nav className='flex items-center gap-2'>
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              className='px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              className='px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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