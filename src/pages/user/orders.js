'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import UserLayout from '../../components/layouts/UserLayout';
import '../../app/globals.css';
import Image from 'next/image';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) fetchOrders();
  }, [userId]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUserId(data.user.id);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data);
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  if (loading)
    return (
      <UserLayout>
        <div className='p-6 flex items-center justify-center'>
          <div className='bg-white p-8 rounded-lg shadow-md'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto'></div>
            <p className='text-center mt-4'>Loading orders...</p>
          </div>
        </div>
      </UserLayout>
    );

  return (
    <UserLayout>
      <div className='pb-6'>
        <h1 className='text-3xl font-bold mb-6'>Order History</h1>

        {selectedOrder ? (
          <div className='bg-white shadow-md rounded-lg p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold'>
                Order Details #{selectedOrder.id.slice(0, 8)}
              </h2>
              <button
                onClick={closeOrderDetails}
                className='text-gray-500 hover:text-gray-700'
              >
                &times; Close
              </button>
            </div>

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <h3 className='font-medium text-lg mb-2'>Order Information</h3>
                <p>
                  <span className='font-medium'>Date:</span>{' '}
                  {formatDate(selectedOrder.created_at)}
                </p>
                <p>
                  <span className='font-medium'>Status:</span>{' '}
                  {selectedOrder.status || 'Completed'}
                </p>
                <p>
                  <span className='font-medium'>Total:</span> ₹
                  {selectedOrder.total}
                </p>
              </div>

              {selectedOrder.shipping_info && (
                <div>
                  <h3 className='font-medium text-lg mb-2'>
                    Shipping Information
                  </h3>
                  <p>
                    <span className='font-medium'>Name:</span>{' '}
                    {selectedOrder.shipping_info.name}
                  </p>
                  <p>
                    <span className='font-medium'>Address:</span>{' '}
                    {selectedOrder.shipping_info.address}
                  </p>
                  <p>
                    <span className='font-medium'>City:</span>{' '}
                    {selectedOrder.shipping_info.city},{' '}
                    {selectedOrder.shipping_info.state}{' '}
                    {selectedOrder.shipping_info.postalCode}
                  </p>
                  <p>
                    <span className='font-medium'>Phone:</span>{' '}
                    {selectedOrder.shipping_info.phone}
                  </p>
                </div>
              )}
            </div>

            <h3 className='font-medium text-lg mt-6 mb-3'>Items Ordered</h3>
            <div className='overflow-x-auto'>
              <table className='min-w-full bg-white'>
                <thead>
                  <tr className='bg-gray-100 text-left'>
                    <th className='py-2 px-4'>Item</th>
                    <th className='py-2 px-4'>Price</th>
                    <th className='py-2 px-4'>Quantity</th>
                    <th className='py-2 px-4'>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index} className='border-t'>
                      <td className='py-2 px-4'>{item.name}</td>
                      <td className='py-2 px-4'>₹{item.price}</td>
                      <td className='py-2 px-4'>{item.quantity}</td>
                      <td className='py-2 px-4'>
                        ₹{item.price * item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className='border-t'>
                  <tr>
                    <td className='py-2 px-4 font-medium' colSpan={3}>
                      Total
                    </td>
                    <td className='py-2 px-4 font-medium'>
                      ₹{selectedOrder.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className='mt-6 flex justify-end'>
              <button
                className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                onClick={() => window.print()}
              >
                Print Invoice
              </button>
            </div>
          </div>
        ) : (
          <>
            {orders.length === 0 ? (
              <div className='bg-white p-8 text-center rounded-lg shadow-md'>
                <svg
                  className='w-16 h-16 mx-auto text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                <p className='mt-4 text-lg'>No orders found.</p>
                <p className='text-gray-500 mt-2'>
                  Once you place an order, it will appear here.
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className='bg-white shadow-md rounded-lg p-5 hover:shadow-lg transition'
                  >
                    <div className='flex flex-wrap justify-between items-start'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <h3 className='text-lg font-medium'>
                            Order #{order.id.slice(0, 8)}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.status || 'Processing'}
                          </span>
                        </div>
                        <p className='text-gray-500 text-sm'>
                          {formatDate(order.created_at)}
                        </p>
                        <p className='font-medium mt-2'>₹{order.total}</p>
                      </div>

                      <div className='mt-2 sm:mt-0'>
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    <div className='mt-4 flex flex-nowrap gap-3 overflow-x-auto py-2'>
                      {order.items &&
                        order.items.slice(0, 4).map((item, index) => (
                          <div key={index} className='flex-none'>
                            <div className='bg-gray-100 rounded w-16 h-16 flex items-center justify-center text-xs text-gray-500'>
                              {item.name.charAt(0)}
                            </div>
                            <p className='text-xs mt-1 w-16 truncate'>
                              {item.name}
                            </p>
                          </div>
                        ))}
                      {order.items && order.items.length > 4 && (
                        <div className='flex-none'>
                          <div className='bg-gray-100 rounded w-16 h-16 flex items-center justify-center text-xs font-medium'>
                            +{order.items.length - 4} more
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
