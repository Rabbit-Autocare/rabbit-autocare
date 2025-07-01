'use client';

import React, { useState } from 'react';
import {
  Search,
  AlertCircle,
  Package,
  Calendar,
  DollarSign,
} from 'lucide-react';

export default function OrdersTable({ initialOrders = [], initialError = null }) {
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState(initialError);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    // Use a fixed locale to avoid hydration mismatch
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_failed':
        return 'bg-red-100 text-red-800';
      case 'payment_abandoned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'abandoned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_info?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className='pb-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>All Orders</h1>
        <div className='flex gap-4'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Search orders...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
            />
          </div>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
          >
            <option value='all'>All Status</option>
            <option value='pending'>Pending</option>
            <option value='confirmed'>Confirmed</option>
            <option value='payment_failed'>Payment Failed</option>
            <option value='payment_abandoned'>Payment Abandoned</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
          <div className='flex items-center gap-2'>
            <AlertCircle className='text-red-500' size={20} />
            <span className='text-red-700'>{error}</span>
          </div>
        </div>
      )}

      {selectedOrder ? (
        <div className='bg-white shadow-md rounded-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              Order Details #{selectedOrder.order_number}
            </h2>
            <button
              onClick={closeOrderDetails}
              className='text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              &times; Close
            </button>
          </div>
          <div className='grid md:grid-cols-2 gap-6'>
            <div>
              <h3 className='font-medium text-lg mb-2'>Order Information</h3>
              <div className='space-y-2'>
                <p>
                  <span className='font-medium'>Order Number:</span>{' '}
                  {selectedOrder.order_number}
                </p>
                <p>
                  <span className='font-medium'>Date:</span>{' '}
                  {formatDate(selectedOrder.created_at)}
                </p>
                <p>
                  <span className='font-medium'>Status:</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </p>
                <p>
                  <span className='font-medium'>Payment Status:</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                      selectedOrder.payment_status
                    )}`}
                  >
                    {selectedOrder.payment_status}
                  </span>
                </p>
                <p>
                  <span className='font-medium'>Total:</span> ₹
                  {selectedOrder.total}
                </p>
                <p>
                  <span className='font-medium'>Subtotal:</span> ₹
                  {selectedOrder.subtotal}
                </p>
                {selectedOrder.discount_amount > 0 && (
                  <p>
                    <span className='font-medium'>Discount:</span> ₹
                    {selectedOrder.discount_amount}
                  </p>
                )}
                {selectedOrder.coupon_id && (
                  <p>
                    <span className='font-medium'>Coupon ID:</span>{' '}
                    {selectedOrder.coupon_id}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className='font-medium text-lg mb-2'>User Information</h3>
              <div className='space-y-2'>
                <p>
                  <span className='font-medium'>User ID:</span>{' '}
                  {selectedOrder.user_id}
                </p>
                <p>
                  <span className='font-medium'>Email:</span>{' '}
                  {selectedOrder.user_info?.email}
                </p>
              </div>

              <h3 className='font-medium text-lg mt-4 mb-2'>
                Shipping Address
              </h3>
              <div className='bg-gray-50 rounded p-3 text-sm'>
                <pre className='whitespace-pre-wrap'>
                  {JSON.stringify(
                    selectedOrder.user_info?.shipping_address,
                    null,
                    2
                  )}
                </pre>
              </div>

              <h3 className='font-medium text-lg mt-4 mb-2'>
                Billing Address
              </h3>
              <div className='bg-gray-50 rounded p-3 text-sm'>
                <pre className='whitespace-pre-wrap'>
                  {JSON.stringify(
                    selectedOrder.user_info?.billing_address,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
          <h3 className='font-medium text-lg mt-6 mb-3'>Items Ordered</h3>
          <div className='overflow-x-auto'>
            <table className='min-w-full bg-white'>
              <thead>
                <tr className='bg-gray-100 text-left'>
                  <th className='py-2 px-4'>Item</th>
                  <th className='py-2 px-4'>Type</th>
                  <th className='py-2 px-4'>Price</th>
                  <th className='py-2 px-4'>Quantity</th>
                  <th className='py-2 px-4'>Subtotal</th>
                  <th className='py-2 px-4'>Details</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, idx) => (
                  <tr key={idx} className='border-t align-top'>
                    <td className='py-2 px-4 font-medium'>{item.name}</td>
                    <td className='py-2 px-4'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'product'
                            ? 'bg-blue-100 text-blue-800'
                            : item.type === 'kit'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className='py-2 px-4'>₹{item.price}</td>
                    <td className='py-2 px-4'>{item.quantity}</td>
                    <td className='py-2 px-4'>₹{item.total_price}</td>
                    <td className='py-2 px-4'>
                      {item.type === 'product' && (
                        <div>
                          <div className='text-xs text-gray-600'>
                            Code: {item.product_code}
                          </div>
                          {item.variant_display_text && (
                            <div className='text-xs text-purple-700'>
                              {item.variant_display_text}
                            </div>
                          )}
                        </div>
                      )}
                      {(item.type === 'kit' || item.type === 'combo') && (
                        <div>
                          <div className='text-xs text-gray-600 mb-1'>
                            {item.type === 'kit'
                              ? `Kit ID: ${item.kit_id}`
                              : `Combo ID: ${item.combo_id}`}
                          </div>
                          <div className='text-xs text-gray-600 mb-1'>
                            Included Products:
                          </div>
                          <ul className='pl-4 list-disc'>
                            {item.included_products?.map((inc, i) => (
                              <li key={i} className='mb-1'>
                                <span className='font-medium'>
                                  {inc.product_name}
                                </span>{' '}
                                (x{inc.quantity})<br />
                                <span className='text-xs text-gray-500'>
                                  Code: {inc.product_code}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className='border-t'>
                <tr>
                  <td className='py-2 px-4 font-medium' colSpan={4}>
                    Total
                  </td>
                  <td className='py-2 px-4 font-medium'>
                    ₹{selectedOrder.total}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className='mt-6 flex justify-end'>
            <button
              className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors'
              onClick={() => window.print()}
            >
              Print Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredOrders.length === 0 ? (
            <div className='bg-white p-8 text-center rounded-lg shadow-md'>
              <Package className='w-16 h-16 mx-auto text-gray-400 mb-4' />
              <p className='text-lg font-medium text-gray-900 mb-2'>
                {searchTerm || statusFilter !== 'all'
                  ? 'No orders found'
                  : 'No orders yet'}
              </p>
              <p className='text-gray-500'>
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Orders will appear here as they are placed.'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className='bg-white shadow-md rounded-lg p-5 hover:shadow-lg transition-shadow cursor-pointer'
                onClick={() => viewOrderDetails(order)}
              >
                <div className='flex flex-wrap justify-between items-start'>
                  <div>
                    <div className='flex items-center gap-2 mb-2'>
                      <h3 className='text-lg font-medium'>
                        Order #{order.order_number}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status}
                      </span>
                    </div>
                    <div className='flex items-center gap-4 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <Calendar size={14} />
                        {formatDate(order.created_at)}
                      </div>
                      <div className='flex items-center gap-1'>
                        <DollarSign size={14} />₹{order.total}
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-gray-600'>
                      {order.user_info?.email}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {order.items?.length || 0} items
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}