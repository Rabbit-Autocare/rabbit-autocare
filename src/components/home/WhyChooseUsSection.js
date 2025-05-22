'use client';

export default function WhyChooseUsSection() {
  const features = [
    {
      title: 'Quality Products',
      description: 'We only stock the highest quality auto parts from trusted manufacturers.',
      icon: '🔧',
    },
    {
      title: 'Fast Shipping',
      description: 'Get your parts delivered quickly with our efficient shipping service.',
      icon: '🚚',
    },
    {
      title: 'Expert Support',
      description: 'Our team of experts is always ready to help you find the right parts.',
      icon: '👨‍🔧',
    },
    {
      title: 'Best Prices',
      description: 'Competitive prices and regular deals to help you save.',
      icon: '💰',
    },
  ];

  return (
    <section className='py-16 bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4'>
        <h2 className='text-3xl font-bold text-center mb-12'>
          Why Choose Us
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {features.map((feature) => (
            <div
              key={feature.title}
              className='text-center p-6 bg-white rounded-lg shadow-md'
            >
              <div className='text-4xl mb-4'>{feature.icon}</div>
              <h3 className='text-xl font-semibold mb-2'>{feature.title}</h3>
              <p className='text-gray-600'>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
