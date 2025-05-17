import React from 'react';
import RootLayout from '../../components/layouts/RootLayout';

export default function AboutPage() {
  return (
    <RootLayout>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-6'>About Us</h1>
        <div className='bg-white shadow-md rounded-lg p-6'>
          <p className='mb-4'>
            Welcome to Car AutoCare - your trusted partner in automobile
            maintenance and repair.
          </p>
          <p className='mb-4'>
            Founded in 2020, we&apos;ve been providing high-quality auto parts
            and services to car enthusiasts and professionals alike.
          </p>
          <p className='mb-4'>
            Our mission is to make car maintenance accessible, affordable, and
            convenient for everyone.
          </p>
          {/* Add more content here */}
        </div>
      </div>
    </RootLayout>
  );
}
