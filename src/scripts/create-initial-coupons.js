// File: src/scripts/create-initial-coupons.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createInitialCoupons() {
  console.log('Creating initial coupons...');

  // Calculate expiry date (November 30, 2025)
  const expiryDate = '2025-11-30T23:59:59';

  // Launch coupons (valid until November)
  const launchCoupons = [
    {
      code: 'LAUNCH799',
      description: '5% off on orders above ₹799',
      discount_percent: 5,
      min_order_amount: 799,
      expiry_date: expiryDate,
      is_permanent: false,
      is_active: true,
    },
    {
      code: 'LAUNCH999',
      description: '10% off on orders above ₹999',
      discount_percent: 10,
      min_order_amount: 999,
      expiry_date: expiryDate,
      is_permanent: false,
      is_active: true,
    },
    {
      code: 'LAUNCH1299',
      description: '15% off on orders above ₹1299',
      discount_percent: 15,
      min_order_amount: 1299,
      expiry_date: expiryDate,
      is_permanent: false,
      is_active: true,
    },
  ];

  // Permanent welcome coupons
  const permanentCoupons = [
    {
      code: 'WELCOME500',
      description: '₹100 off on your first order above ₹500',
      discount_percent: 20, // Equivalent to ₹100 off a ₹500 order
      min_order_amount: 500,
      is_permanent: true,
      is_active: true,
    },
    {
      code: 'WELCOME1000',
      description: '₹200 off on your first order above ₹1000',
      discount_percent: 20, // Equivalent to ₹200 off a ₹1000 order
      min_order_amount: 1000,
      is_permanent: true,
      is_active: true,
    },
  ];

  const allCoupons = [...launchCoupons, ...permanentCoupons];

  // Check if we already have coupons
  const { data: existingCoupons } = await supabase
    .from('coupons')
    .select('code');

  const existingCodes = new Set(existingCoupons?.map((c) => c.code) || []);

  // Filter out coupons that already exist
  const newCoupons = allCoupons.filter((c) => !existingCodes.has(c.code));

  if (newCoupons.length === 0) {
    console.log('All coupons already exist.');
    return;
  }

  // Insert new coupons
  const { data, error } = await supabase.from('coupons').insert(newCoupons);

  if (error) {
    console.error('Error creating coupons:', error);
  } else {
    console.log(`Created ${newCoupons.length} coupons successfully.`);
  }
}

createInitialCoupons()
  .catch(console.error)
  .finally(() => process.exit());
