'use client';

import { useRouter } from 'next/navigation';
import UserLayout from '@/components/layouts/UserLayout';
import '@/app/globals.css';
import Image from 'next/image';

export default function UserOrdersClient({ initialOrders }) {
  const router = useRouter();

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <UserLayout>
      <div className='p-4 space-y-6'>
        <h1 className='text-2xl font-bold'>Order History</h1>

        {initialOrders.length === 0 ? (
          <div className='bg-white rounded-lg shadow border p-8 text-center'>
            <svg className="mx-auto mb-4 w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className='text-xl font-medium text-gray-600 mb-2'>No Orders Yet</h3>
            <p className='text-gray-500 mb-6'>You haven't placed any orders yet. Start shopping to see your order history here.</p>
            <button
              onClick={() => router.push('/shop')}
              className='bg-[#601e8d] hover:bg-[#4a1a6f] text-white px-6 py-3 rounded-lg font-medium transition-colors'
            >
              Start Shopping
            </button>
          </div>
        ) : (
          initialOrders.map((order) => (
            <div
              key={order.id}
              className='bg-white rounded-lg shadow border overflow-hidden hover:shadow-lg transition-shadow duration-300'
            >
              <div className='flex justify-between items-start p-4 border-b'>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      order.status === 'delivered'
                        ? 'text-green-600'
                        : order.status === 'shipped'
                        ? 'text-purple-600'
                        : 'text-red-600'
                    }`}
                  >
                    {order.status || 'Processing'}
                  </p>
                  <p className='text-sm text-gray-500 mt-1'>
                    {formatDate(order.created_at)}
                  </p>
                  {order.order_id && (
                    <p className='text-xs text-gray-400 mt-1'>Order ID: {order.order_id}</p>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/user/orders/${order.id}`)}
                  className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                >
                  <span className='text-xl text-gray-400'>&#x276F;</span>
                </button>
              </div>
              {order.items?.slice(0, 1).map((item, idx) => (
                <div
                  key={idx}
                  className='flex items-center gap-4 p-4 border-b last:border-none'
                >
                  <div className='w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0'>
                    <Image
                      src={item.main_image_url || item.images?.[0] || '/placeholder.jpg'}
                      alt={item.name}
                      width={64}
                      height={64}
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-gray-900 truncate'>{item.name}</h4>
                    <p className='text-sm text-gray-500'>Qty: {item.quantity}</p>
                    <p className='text-sm font-semibold text-gray-900'>₹{item.price}</p>
                  </div>
                </div>
              ))}
              {order.items && order.items.length > 1 && (
                <div className='px-4 py-2 bg-gray-50 text-sm text-gray-600'>
                  +{order.items.length - 1} more item{order.items.length - 1 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </UserLayout>
  );
}
