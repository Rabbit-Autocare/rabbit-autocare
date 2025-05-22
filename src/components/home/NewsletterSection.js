'use client';

export default function NewsletterSection() {
  return (
    <section className='py-16 bg-blue-600 text-white'>
      <div className='max-w-7xl mx-auto px-4 text-center'>
        <h2 className='text-3xl font-bold mb-4'>
          Subscribe to Our Newsletter
        </h2>
        <p className='mb-8 max-w-2xl mx-auto'>
          Stay updated with our latest products, deals, and automotive tips.
        </p>
        <form className='max-w-md mx-auto flex gap-4'>
          <input
            type='email'
            placeholder='Enter your email'
            className='flex-1 px-4 py-2 rounded-lg text-gray-900'
          />
          <button
            type='submit'
            className='bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition'
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
