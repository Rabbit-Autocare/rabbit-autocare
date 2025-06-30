'use client';

import UserLayout from '@/components/layouts/UserLayout';
import Image from 'next/image';
import Link from 'next/link';

export default function UserOrderDetailsClient({ order }) {
  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  if (!order) {
    return (
      <UserLayout>
        <div className='p-6 text-center'>
          <h1 className='text-xl font-semibold mb-4'>Order Not Found</h1>
          <p className='text-gray-600 mb-6'>
            We couldn't find the order you're looking for. It might have been moved or deleted.
          </p>
          <Link href="/user/orders">
            <a className='bg-[#601e8d] hover:bg-[#4a1a6f] text-white px-6 py-3 rounded-lg font-medium transition-colors'>
              Back to My Orders
            </a>
          </Link>
        </div>
      </UserLayout>
    );
  }

  const items = order.items || [];
  const shipping = order.user_info || {};

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Product Details */}
        {items.map((item, i) => {
          const image = item?.main_image_url || item?.images?.[0] || '/placeholder.jpg';
          return (
            <div className="text-center" key={i}>
              <div className="w-24 h-24 mx-auto mb-3">
                <Image
                  src={image}
                  alt={item?.name}
                  width={96}
                  height={96}
                  className="object-contain w-full h-full"
                />
              </div>
              <h2 className="text-lg font-semibold">{item?.name}</h2>
              <p className="text-sm text-gray-600">
                Quantity: {item?.quantity} &nbsp;&nbsp; Price: ₹{item?.price}
              </p>
              <p className="text-sm text-gray-500">
                Order Placed On: {formatDate(order.created_at)}
              </p>
            </div>
          );
        })}

        {/* Status */}
        <div className="bg-gray-100 rounded-md p-4 text-sm">
          <span
            className={`font-semibold ${
              order.status === 'delivered'
                ? 'text-green-600'
                : order.status === 'shipped'
                ? 'text-purple-600'
                : 'text-red-600'
            }`}
          >
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </span>
          <p className="text-gray-500">
            {order.status === 'delivered'
              ? 'On ' + formatDate(order.completed_at || order.created_at)
              : order.status === 'shipped'
              ? 'Expected by ' + formatDate(order.estimated_delivery || order.created_at)
              : 'Updated on ' + formatDate(order.updated_at || order.created_at)}
          </p>
        </div>

        {/* Delivery Info */}
        <div>
          <h3 className="font-semibold mb-1 text-gray-700">Delivery Information</h3>
          <div className="border rounded-lg p-4 text-sm space-y-1">
            <p className="font-medium">Work</p>
            <p>{shipping.name}</p>
            <p>{shipping.address}</p>
            <p>Phone Number: {shipping.phone}</p>
            <p>Email: {shipping.email}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div>
          <h3 className="font-semibold mb-1 text-gray-700">Payment Information</h3>
          <div className="border rounded-lg p-4 text-sm">
            Paid by {order.payment_method || 'Debit Card'}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
