"use client"

import { useEffect, useState } from "react"

const TermsOfUsePage = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">TERMS OF USE</h1>
            <p className="text-gray-600 text-center">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-blue-300 [&_a:hover]:text-blue-800 [&_a:hover]:decoration-blue-500 space-y-6">
            <p>
              <a href="https://www.rabbitautocare.com">www.rabbitautocare.com</a>, <a href="https://www.rabbitautocare.shop">www.rabbitautocare.shop</a>, <a href="https://www.rabbitautocare.in">www.rabbitautocare.in</a> (“We/ Website”) is owned by RBTX Nexus Private Limited having its registered office at Indira Colony, Thanesar, Kurukshetra, Haryana - 136118. We are incorporated under the Companies Act, 2019 and also under the MSMED Act, 2006.
            </p>
            <p>
              By using the website, you are either impliedly or expressly accepting and agreeing to the terms of use of this website along with all other policies, as amended from time to time at your own risk and with your own free will. Your use of the website shall be governed by the terms and conditions mentioned hereunder. By using the website, you shall be contracting with RBTX Nexus Private Limited. Further, this document constitutes an electronic record between the user and the website.
            </p>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">TERMINOLOGIES:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">1.</span> The term ‘User’ herein includes any person who is above 18 years of age and engages on this website by making a purchase. This website is not directed towards ‘minors’.
                </p>
                <p>
                  <span className="font-semibold">2.</span> The terms “You” hereinafter is referred to the user and “website/us/We/our/platform” is referred to the <a href="https://www.rabbitautocare.com">www.rabbitautocare.com</a>, <a href="https://www.rabbitautocare.shop">www.rabbitautocare.shop</a> and <a href="https://www.rabbitautocare.in">www.rabbitautocare.in</a>.
                </p>
                <p>
                  <span className="font-semibold">3.</span> ‘Products’ refer to the items listed for sale on the website.
                </p>
                <p>
                  <span className="font-semibold">4.</span> ‘Document’ refers to the present terms of use.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">LIMITATIONS:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">5.</span> This contract shall only be limited to the user of the website and does not create any contract between any person with whom the product is further shared or sold or gifted by the user.
                </p>
                <p>
                  <span className="font-semibold">6.</span> The products on the website are inedible and hence, strictly not consumable. Further, it is advisable to keep them away from children. The products are made of various chemicals and hence, may also cause skin allergy and therefore, it is advisable to strictly avoid any kind of skin contact. We are under no obligation if any injury or loss or any other kind of allergy etc., is caused due to usage of the products. Further, we shall not be responsible for any discoloration or if it affects the shine or paint of the vehicle or damage it in any other manner.
                </p>
              </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">SERVICES OFFERED:</h2>
                <div className="space-y-4 pl-6">
                    <p><span className="font-semibold">7.</span> We deal in the sale of car accessories. The products include car, shampoo, interior and exterior polishes, car wax and paint compounds, car cleaners, gas cleaners, windshield washer, ac cleaner, car dressers, microfibres, detailing kits and products and many more related products.</p>
                    <p><span className="font-semibold">8.</span> The website offers purchasing of car accessories and other vehicle accessories through the platform. We sell on this website exclusively and no other platform.</p>
                    <p><span className="font-semibold">9.</span> We offer only the sale of our products and do not offer any other mechanical or functional services.</p>
                    <p><span className="font-semibold">10.</span> We are available from 10 a.m. to 5 p.m. from Monday to Friday, Saturday and Sunday shall however be non-working. The user can write to us at <a href="mailto:help@rabbitautocare.com">help@rabbitautocare.com</a> or he can chat his way through the chatbox available on the website, in case of any query relating to the product or transaction or the usage of the website. We usually take 1-5 working days to reply.</p>
                    <p><span className="font-semibold">11.</span> We offer our products to commercial and non-commercial users i.e. business to business or direct to user.</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">CONTENT ON THE WEBSITE:</h2>
                <div className="space-y-4 pl-6">
                    <p><span className="font-semibold">12.</span> We use photographs, description, usage, audio and video of the products along with its pricing, guarantee and warranty period, refund and exchange period, delivery time etc. The quantity of products intended to be purchased can also be adjusted by the user.</p>
                    <p><span className="font-semibold">13.</span> The photographs/images can be for descriptive purposes only and the actual product may not look the same.</p>
                    <p><span className="font-semibold">14.</span> There may be third party links or advertisements on the website. We are strictly not liable or responsible for their services, products, policies or their contents or accuracy or any other transaction done on their platform.</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">PERSONAL AND OTHER INFORMATION:</h2>
                <div className="space-y-4 pl-6">
                    <p><span className="font-semibold">15.</span> When the user makes a purchase on the website, you shall be mandatorily sharing your data and information including your full name, correspondence and shipping address, phone and whatsapp number, billing address, email address besides the non-personal information.</p>
                    <p><span className="font-semibold">16.</span> The information shared with us is regulated by our privacy policy which can be accessed <a href="/privacy-policy">here</a>.</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">TRANSACTION POLICY:</h2>
                <div className="space-y-4 pl-6">
                    <p><span className="font-semibold">17.</span> We reserve the exclusive right to decide and reserve our pricing, discounts, returns, exchange, guarantees, warranties and offers and change it without any notice. The actual selling price of the products shall be computed at the time of placing the order, which shall include the taxes, delivery charges, platform fees and discounts. It may also include any other optional charge visible at the time of computation.</p>
                    <p><span className="font-semibold">18.</span> The purchase shall be governed by cancellation policy, return policy, exchange policy etc., which can be accessed <a href="/shipping-and-returns">here</a>.</p>
                    <p><span className="font-semibold">19.</span> The products on the website can be purchased through payment gateway ‘Razorpay’.</p>
                    <p><span className="font-semibold">20.</span> The payment transactions shall be routed through and governed by the policies of Razorpay and we shall not be liable in any case to any failure, delay, decline, lack of authorisation, or any other issue arising out of the financial transaction etc.. All the payment transactions on the website shall be in Indian rupees. We would not be constrained to act as mediator between the user and the payment gateway platform ‘Razorpay’ in case of any financial dispute.</p>
                    <p><span className="font-semibold">21.</span> The user shall furnish a copy of his PAN card within 3 business days to the website in case of a transaction of more than two lakh INR, only post which their order will be dispatched. The money will be refunded as per the refund policy in case of non-compliance. The PAN card shall reflect the same details as provided by the user to the website and is required to be submitted only once per user.</p>
                    <p><span className="font-semibold">22.</span> We may offer discounts on one or more of our products. The discounts may also be available if multiple products are purchased at one time or on specific value of the order. The discounts and coupons shall be checked and used at the time of placing the order. The discount shall be available only if applied by the user. The discounts and coupons and their value shall be at our sole discretion. The discount and coupon price shall be computed without the taxes applicable.</p>
                </div>
            </div>

            {/* ... other sections ... */}

          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfUsePage
