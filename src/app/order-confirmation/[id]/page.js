'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
const supabase = createSupabaseBrowserClient();
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function OrderConfirmationPage({ params }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    async function fetchOrder() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-pulse flex flex-col items-center'>
          <div className='w-20 h-20 bg-gray-200 rounded-full'></div>
          <div className='h-6 w-48 bg-gray-200 rounded-md mt-6'></div>
          <div className='h-4 w-64 bg-gray-200 rounded-md mt-4'></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center max-w-md px-4'>
          <div className='text-5xl mb-6'>😕</div>
          <h1 className='text-2xl font-bold text-gray-800 mb-3'>
            Order Not Found
          </h1>
          <p className='text-gray-600 mb-6'>
            We couldn&apos;t find the order you&apos;re looking for.
          </p>
          <Link
            href='/user/orders'
            className='bg-[#601E8D] text-white px-6 py-3 rounded-md font-semibold'
          >
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden'>
        {isSuccess ? (
          <div className='bg-green-600 text-white p-6 text-center'>
            <div className='w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-4'>
              <span className='text-green-600 text-3xl'>✓</span>
            </div>
            <h1 className='text-3xl font-bold'>Order Confirmed!</h1>
            <p className='mt-2 opacity-90'>Thank you for your purchase</p>
          </div>
        ) : (
          <div className='bg-[#601E8D] text-white p-6 text-center'>
            <h1 className='text-3xl font-bold'>Order Details</h1>
            <p className='mt-2 opacity-90'>
              Review your order information below
            </p>
          </div>
        )}

        <div className='p-6 md:p-8'>
          <div className='grid md:grid-cols-2 gap-6 mb-8'>
            <div>
              <h2 className='text-lg font-semibold mb-2'>Order Information</h2>
              <p>
                <span className='font-medium'>Order Number:</span>{' '}
                {order.order_number}
              </p>
              <p>
                <span className='font-medium'>Date:</span>{' '}
                {new Date(order.created_at).toLocaleDateString()}
              </p>
              <p>
                <span className='font-medium'>Status:</span>{' '}
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </p>
              <p>
                <span className='font-medium'>Payment Status:</span>{' '}
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${getPaymentStatusColor(
                    order.payment_status
                  )}`}
                >
                  {order.payment_status}
                </span>
              </p>
            </div>

            <div>
              <h2 className='text-lg font-semibold mb-2'>
                Shipping Information
              </h2>
              <p>
                <span className='font-medium'>Address:</span>{' '}
                {order.user_info?.shipping_address?.street}
              </p>
              <p>
                {order.user_info?.shipping_address?.city},{' '}
                {order.user_info?.shipping_address?.state} -{' '}
                {order.user_info?.shipping_address?.pincode}
              </p>
              <p>
                <span className='font-medium'>Phone:</span>{' '}
                {order.user_info?.shipping_address?.phone}
              </p>
            </div>
          </div>

          <h2 className='text-lg font-semibold mb-4 border-b pb-2'>
            Order Summary
          </h2>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='text-left border-b'>
                  <th className='py-2'>Item</th>
                  <th className='py-2'>Qty</th>
                  <th className='py-2 text-right'>Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className='border-b'>
                    <td className='py-3'>
                      <div className='flex items-center'>
                        {item.main_image_url && (
                          <div className='w-12 h-12 mr-3 bg-gray-100 rounded flex-shrink-0'>
                            <Image
                              src={item.main_image_url}
                              alt={item.name}
                              width={48}
                              height={48}
                              className='object-contain w-full h-full'
                            />
                          </div>
                        )}
                        <div>
                          <div className='font-medium'>{item.name}</div>
                          {item.variant_display_text && (
                            <div className='text-xs text-gray-500'>
                              {item.variant_display_text}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='py-3'>{item.quantity}</td>
                    <td className='py-3 text-right'>₹{item.total_price}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className='text-gray-600'>
                  <td colSpan='2' className='py-2 text-right font-medium'>
                    Subtotal:
                  </td>
                  <td className='py-2 text-right'>₹{order.subtotal}</td>
                </tr>
                {order.discount_amount > 0 && (
                  <tr className='text-green-600'>
                    <td colSpan='2' className='py-2 text-right font-medium'>
                      Discount:
                    </td>
                    <td className='py-2 text-right'>
                      - ₹{order.discount_amount}
                    </td>
                  </tr>
                )}
                <tr className='font-semibold'>
                  <td colSpan='2' className='py-2 text-right'>
                    Total:
                  </td>
                  <td className='py-2 text-right'>₹{order.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className='mt-8 flex flex-wrap gap-4 justify-center'>
            <Link
              href='/user/orders'
              className='bg-[#601E8D] text-white px-6 py-3 rounded-md font-semibold'
            >
              View All Orders
            </Link>
            <Link
              href='/shop'
              className='border border-[#601E8D] text-[#601E8D] px-6 py-3 rounded-md font-semibold'
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'payment_failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPaymentStatusColor(status) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
