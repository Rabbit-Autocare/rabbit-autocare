'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import FaqSection from '@/components/FaqSection';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } else {
      setStatus('error');
    }
  };

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
            <p className='text-gray-800'>support@rabbitautocare.com</p>
          </div>

          <div>
            <h2 className='text-lg font-medium mb-5 pt-4'>Socials</h2>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='https://www.instagram.com/rabbitautocare'
                  className='text-blue-600 underline'
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </Link>
              </li>
              <li>
                <Link
                  href='https://x.com/rabbitautocare'
                  className='text-blue-600 underline'
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter (X)
                </Link>
              </li>
              <li>
                <Link
                  href='https://www.facebook.com/rabbitautocare'
                  className='text-blue-600 underline'
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </Link>
              </li>
              <li>
                <Link
                  href='https://www.linkedin.com/company/rabbitautocare'
                  className='text-blue-600 underline'
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <form className='space-y-5' onSubmit={handleSubmit}>
          <div>
            <label className='block mb-1 text-sm font-medium'>Name</label>
            <input
              type='text'
              name='name'
              value={form.name}
              onChange={handleChange}
              className='w-full bg-[#EFEFEF] rounded px-3 py-2 focus:outline-none'
              required
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>Email</label>
            <input
              type='email'
              name='email'
              value={form.email}
              onChange={handleChange}
              className='w-full bg-[#EFEFEF] rounded px-3 py-2 focus:outline-none'
              required
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>Phone Number</label>
            <input
              type='tel'
              name='phone'
              value={form.phone}
              onChange={handleChange}
              className='w-full bg-[#EFEFEF] rounded px-3 py-2 focus:outline-none'
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>Subject</label>
            <input
              type='text'
              name='subject'
              value={form.subject}
              onChange={handleChange}
              className='w-full bg-[#EFEFEF] rounded px-3 py-2 focus:outline-none'
              required
            />
          </div>
          <div>
            <label className='block mb-1 text-sm font-medium'>Message</label>
            <textarea
              name='message'
              value={form.message}
              onChange={handleChange}
              className='w-full bg-[#EFEFEF] rounded px-3 py-2 h-32 resize-none focus:outline-none'
              required
            />
          </div>
          <button
            type='submit'
            className='w-full bg-black text-white py-2 rounded hover:bg-[#601E8D] transition'
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Sending...' : 'Submit'}
          </button>
          {status === 'success' && <p className='text-green-600'>Message sent!</p>}
          {status === 'error' && <p className='text-red-600'>Failed to send. Try again.</p>}
        </form>
      </div>

      <FaqSection />
    </div>
  );
}
