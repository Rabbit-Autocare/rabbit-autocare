"use client"

import { useEffect, useState } from "react"

const ShippingAndReturnsPage = () => {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Shipment, Refund, Return and Exchange Policy</h1>
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
              The following clauses shall govern the shipment, refund, return and exchange policy of{" "}
              <a href="https://www.rabbitautocare.com">www.rabbitautocare.com</a>,{" "}
              <a href="https://www.rabbitautocare.shop">www.rabbitautocare.shop</a> and{" "}
              <a href="https://www.rabbitautocare.in">www.rabbitautocare.in</a>{" "}
              (We/us/website/platform), which shall also form a part of the <a href="/terms-and-conditions">'Terms of use'</a> of this website.
            </p>

            <div className="space-y-4">
              <p>
                <span className="font-semibold">1.</span> The term 'refund' used herein shall include the refund amount or the balance amount in case of exchanged products, whether the balance amount is towards the user or us. The term 'user' shall include the person who has confirmed the order through the website or any other person who has confirmed the order on behalf of the user through his account or any other person for whom the user has ordered the product(s). In case of any order made for a third party by the user or an order made by some person on behalf of the person having the account on the website, the website shall only be contracting with the user on whose account the order has been made.
              </p>

              <p>
                <span className="font-semibold">2.</span> The price of any product listed on the website may change from time to time at our discretion. The final price subject to any coupons, discounts shall be calculated at the time of checkout. The displayed prices shall include the taxes.
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">SHIPMENT AND LOGISTICS:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">3.</span> In a prepaid order, we usually ship the product within 1-2 days of receiving the confirmation of order. In a COD (cash on delivery) order, the shipment may take 2-3 days after confirmation of the order.
                </p>
                <p>
                  <span className="font-semibold">4.</span> The shipment shall generally be carried out by our courier partner 'Shiprocket'. The package can be tracked on the website of 'Shiprocket'.
                </p>
                <p>
                  <span className="font-semibold">5.</span> The website may also ship the order through any other courier partner. We only ship through trusted courier partners. The order may be tracked on the website of the concerned courier partner.
                </p>
                <p>
                  <span className="font-semibold">6.</span> The logistics and shipment policy of the concerned partner shall be applicable on the order.
                </p>
                <p>
                  <span className="font-semibold">7.</span> The delivery timings and charge may vary from package to package and pincode and shall be calculated at the checkout. The timing displayed or checked may however reasonably vary with the timing of actual delivery of the product.
                </p>
                <p>
                  <span className="font-semibold">8.</span> The product shall be sent to the address as provided at the time of checkout and confirmation of the order by the user. No changes could be entertained regarding change of address after shipping of the order, however the same may be entertained, at our sole discretion, after the order is placed and before shipping of the same.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">CANCELLATION:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">9.</span> The website reserves the exclusive right of cancellation of any order in any case whatsoever, subject to refund of the amount in case of prepaid order.
                </p>
                <p>
                  <span className="font-semibold">10.</span> The user may be allowed to cancel the order before shipment and he would be entitled to the refund in case of a prepaid order.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">RETURN, EXCHANGE AND REFUND:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">11.</span> The return and exchange period of the product shall be individually mentioned in the description page of the product and every such period shall be computed as per the period mentioned in the description of that product. The return and exchange period shall start from the day of receipt of order.
                </p>
                <p>
                  <span className="font-semibold">12.</span> For example, if two products are ordered and received at once, their return and exchange period shall be individually calculated as per their description. The timeline for picking up the return in case it is picked by our partner shall be upto 7 working days and in case of self shipment, it shall be upto 3 working days post the confirmation of the return.
                </p>
                <p>
                  <span className="font-semibold">13.</span> There may be products which are non-returnable or non-exchangeable and there may also be products which may only be exchangeable and non-returnable. The description of each product shall however be mentioned on the page of the product and the terms of the present policy shall be governed by the description mentioned.
                </p>
                <p>
                  <span className="font-semibold">14.</span> Microfibers shall be strictly non returnable and non exchangable.
                </p>
                <p>
                  <span className="font-semibold">15.</span> The returnable/exchangeable products shall only be done so only if the 'VOID' sticker on the product is intact and not tampered or opened with.
                </p>
                <p>
                  <span className="font-semibold">16.</span> The user shall provide the reason for returning the product. It shall be the duty of the user to return the same product for which he has placed the return request.
                </p>
                <p>
                  <span className="font-semibold">17.</span> The product shall only be returnable if sealed. The product with open seal shall be strictly non-returnable and non-exchangeable, except under any express consent by the website.
                </p>
                <p>
                  <span className="font-semibold">18.</span> The user may be required to share the image and/or the videography of the product with the agent of the website before return or exchange, as the case may be.
                </p>
                <p>
                  <span className="font-semibold">19.</span> The courier partner may decline to accept the product for return or exchange, if he has reasons to believe that the seal of the product is broken, or the product is used or tampered with. In such a case, the request for return or exchange may be made alongwith photographs of product with the website through its official communication channels. The ultimate call to return or exchange the product and refund the amount shall be made by us at our discretion.
                </p>
                <p>
                  <span className="font-semibold">20.</span> The cost of return including the carrier and courier charges shall be borne by the user, which shall be calculated at the time of placing the return or exchange. In case, we are not able to provide any pick up service, the user may also send the product for return or exchange by himself ("self-shipment") at his own charges. The product shall be sent at RBTX Nexus Pvt. Ltd. at Indira Colony, Thanesar, Kurukshetra - 136118 to and thereafter, the return shall be issued as per the terms of clauses 15 to 18.
                </p>
                <p>
                  <span className="font-semibold">21.</span> The refund shall only be issued after the product is received by us. The amount to be refunded shall only include the cost of product at the time of confirmation of the order and nothing else, unless any other term is expressly mentioned in the product description.
                </p>
                <p>
                  <span className="font-semibold">22.</span> The amount to be reflected in the user's provided amount may take 5-7 working days.
                </p>
                <p>
                  <span className="font-semibold">23.</span> The refund amount shall be transferred to the original mode of transfer of the user or to any other mode as confirmed by the user during confirmation of return.
                </p>
                <p>
                  <span className="font-semibold">24.</span> In case of a COD order, the refund shall be made to the bank account provided by the user.
                </p>
                <p>
                  <span className="font-semibold">25.</span> The user may also choose to convert their refund amount into non-convertible credit points of the same value, if eligible and offered to do so.
                </p>
                <p>
                  <span className="font-semibold">26.</span> The website may also issue any exchange of product with the returned back if only agreed by both the user and the website, through official communication channels.
                </p>
                <p>
                  <span className="font-semibold">27.</span> In case of exchange of any product, it may happen that the product to be exchanged does not have the same value/price of the product with which the product is exchanged. In such a situation, if the product to be exchanged has a higher value from the product with which it is exchanged, we shall refund the balance amount to the user after deducting the courier and platform charges. In case, the exchanged product has a value more than the product which is returned for exchange, the user shall pay the balance amount at the time of confirmation of the order or at the time of exchange in case of a COD order.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">VARIATIONS OR MODIFICATION OF TERMS:</h2>
              <div className="pl-6">
                <p>
                  <span className="font-semibold">28.</span> The website reserves the right to change or vary or modify the shipment, refund, return and exchange policy or the policy regarding any of their products without any prior intimation.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">ENTIRE AGREEMENT:</h2>
              <div className="pl-6">
                <p>
                  <span className="font-semibold">29.</span> This policy shall be the entire policy regarding the shipment, return, refund or exchange of any product or order placed on the website.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">SEVERABILITY:</h2>
              <div className="pl-6">
                <p>
                  <span className="font-semibold">30.</span> In case any part of this document is found to be void or unenforceable or unlawful, it shall have no effect on the rest of the document unaffected by it.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">WAIVER:</h2>
              <div className="pl-6">
                <p>
                  <span className="font-semibold">31.</span> The failure to enforce or exercise any term or clause of this document shall not be construed as waiver of such term or right or clause.
                </p>
              </div>
            </div>

            <hr className="my-8" />

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Contact Information</h2>
              <p>If you have any questions about this policy, please contact us:</p>
              <p>Email: <a href="mailto:help@rabbitautocare.com">help@rabbitautocare.com</a></p>
              <p>Address: RBTX Nexus Pvt. Ltd., Indira Colony, Thanesar, Kurukshetra - 136118</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShippingAndReturnsPage
