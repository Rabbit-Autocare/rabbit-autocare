'use client';
import React from 'react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className='mx-auto px-4 md:px-10 lg:px-[100px] py-12'>
      <nav className='text-sm text-gray-500 mb-6'>
        <span className='text-gray-400'>Home</span> &gt;{' '}
        <span>Get In Touch</span>
      </nav>

      <div className='grid md:grid-cols-2 gap-12'>
        {/* LEFT SIDE - TEXT INFO */}
        <div>
          <h1 className='text-4xl font-semibold my-8 lg:pt-14'>Let&apos;s Talk</h1>
          <p className='text-gray-700 mb-10 leading-relaxed max-w-lg text-md'>
            Have some big idea or brand to develop and need help? Then reach
            out, we&apos;d love to hear about your project and provide help
          </p>

          <div className='mb-8'>
            <h2 className='text-2xl font-medium mb-5 pt-4'>Email</h2>
            <p className='text-gray-800'>beebs@gmail.com</p>
          </div>

          <div>
            <h2 className='text-lg font-medium mb-5 pt-4'>Socials</h2>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='https://instagram.com'
                  className='text-blue-600 underline'
                >
                  Instagram
                </Link>
              </li>
              <li>
                <Link
                  href='https://twitter.com'
                  className='text-blue-600 underline'
                >
                  Twitter
                </Link>
              </li>
              <li>
                <Link
                  href='https://facebook.com'
                  className='text-blue-600 underline'
                >
                  Facebook
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <form className='space-y-5'>
          <div>
            <label className='block mb-1 text-sm font-medium'>Name</label>
            <input
              type='text'
              className='w-full bg-[#EFEFEF] rounded px-3 py-2 focus:outline-none'
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>Email</label>
            <input
              type='email'
              className='w-full bg-[#EFEFEF] rounded px-3 py-2 focus:outline-none'
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>
              Phone Number
            </label>
            <input
              type='tel'
              className='w-full bg-[#EFEFEF] rounded px-3 py-2 focus:outline-none'
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>Subject</label>
            <input
              type='text'
              className='w-full bg-[#EFEFEF] rounded px-3 py-2 focus:outline-none'
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>Message</label>
            <textarea className='w-full bg-[#EFEFEF] rounded px-3 py-2 h-32 resize-none' />
          </div>
          <button
            type='submit'
            className='w-full bg-black text-white py-2 rounded hover:bg-[#601E8D] transition'
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
