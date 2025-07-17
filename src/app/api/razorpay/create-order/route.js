import Razorpay from 'razorpay';

export async function POST(req) {
  try {
    const { amount, currency = 'INR', receipt, order_id } = await req.json();

    if (!amount || amount <= 0) {
      console.error('Invalid amount for Razorpay order', { amount });
      return Response.json(
        {
          error: 'Invalid amount',
          success: false,
        },
        { status: 400 } 
      );
    }

    if (!receipt) {
      console.error('Missing receipt/order number for Razorpay order');
      return Response.json(
        {
          error: 'Missing order reference',
          success: false,
        },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log(
      `Creating Razorpay order for amount: ${amount}, reference: ${receipt}`
    );

    const options = {
      amount: Math.round(amount * 100), // amount in paisa, ensure it's an integer
      currency,
      receipt: receipt,
      notes: {
        supabase_order_id: order_id || '',
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);
    console.log(`Razorpay order created successfully: ${razorpayOrder.id}`);

    return Response.json(
      {
        ...razorpayOrder,
        success: true,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Failed to create Razorpay order:', err);
    return Response.json(
      {
        error: 'Failed to create payment order',
        details: err.message,
        success: false,
      },
      { status: 500 }
    );
  }
}