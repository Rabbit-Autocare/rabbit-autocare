"use client"

import { useEffect, useState } from "react"

const PrivacyPolicyPage = () => {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">PRIVACY POLICY FOR WWW.RABBITAUTOCARE.COM</h1>
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
            <div className="space-y-4">
              <p>
                <span className="font-semibold">1.</span> This Privacy Policy shall explain how 'We' (<a href="https://www.rabbitautocare.com">www.rabbitautocare.com</a>, <a href="https://www.rabbitautocare.shop">www.rabbitautocare.shop</a> and <a href="https://www.rabbitautocare.in">www.rabbitautocare.in</a>, hereinafter 'Rabbitautocare')' collect, use, share, process, store and protect your data etc. when you browse, visit and/or make a purchase through our website. This website is owned and managed by our company 'RBTX NEXUS Pvt. Ltd.'. When the user is consenting to our privacy policy, he is contracting with our company aforementioned.
              </p>
              <p>
                <span className="font-semibold">2.</span> The terminology 'he/they' hereinafter used in this privacy policy shall include the user, any entity or organisation, he/she interchangeably who browse, visit or use the website as a user.
              </p>
              <p>
                <span className="font-semibold">3.</span> This Privacy Policy shall constitute an electronic record between 'rabbitautocare' and the user of the website and does not require any physical, electronic or digital signature.
              </p>
              <p>
                <span className="font-semibold">4.</span> This policy applies to all users who browse, visit our website and/or share information with us.
              </p>
              <p>
                <span className="font-semibold">5.</span> The website is not directed towards minors. However, if unknowingly or unintentionally, any information about a minor is collected by us, then it shall be brought to our notice immediately by the user or their guardian, as the case may be and the information shall be deleted within a period of seven working days. We shall not be liable for any damage or injury suffered, if the website is used by a minor.
              </p>
              <p>
                <span className="font-semibold">6.</span> When the user visits our website and/or makes a purchase through our website, he is expressly accepting and agreeing to the terms of the present privacy policy and giving his free consent to collect and proceed with his data as described above and hereunder, without any coercion or undue influence, mistake or misrepresentation. In case the user does agree with our privacy policy, he is humbly requested not to visit or use the website.
              </p>
              <p>
                <span className="font-semibold">7.</span> This privacy policy is limited to only this website and Rabbitautocare shall not be liable or responsible for the privacy policy of any other website, when you access any other website by using any link on our website or any advertisement on our website. In such a case, you will be subject to the terms of privacy policy of that website and not the privacy policy of this website.
              </p>
              <p>
                <span className="font-semibold">8.</span> Rabbitautocare will share the information with any other business entity in case of any merger, acquisition, re-structuring of our website or company.
              </p>
              <p>
                <span className="font-semibold">9.</span> GoogleAdSense ______________
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">WHAT INFORMATION DO WE COLLECT:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">10.</span> The information mentioned in the privacy policy includes personal and non personal information, unless specifically mentioned otherwise.
                </p>
                <p>
                  <span className="font-semibold">11.</span> When the user visits our website, he may be sharing his personal and non-personal information which is distinguished as under:
                </p>
                <p>
                  <strong>Personal Information</strong> includes the user's name, email address, phone number, whatsapp number, shipping address, location of shipping, billing address, bank details, card details, UPI number/code and any other sensitive data or information relating to the user. The user may also share the aforesaid details of any other person whom he wants to deliver any product purchased on the website, which shall also be stored and used etc., subject to the terms of this policy. Rabbitautocare shall strictly not be responsible if the user shares the information of any other person or impersonates him without taking consent from him. Personal information shall also include the information collected by us when the user uses google sign in to access our website. It shall further be collected during any feedback or comment or review on any product or any other part of the website.
                </p>
                <p>
                  <strong>Non personal information</strong> includes IP address, geographical location, operating system of user's device, type of browser, number of visits, items viewed by the user, items placed in cart, tracking the status of the order and previous orders. Such information is used to customise our website, enhance user experience and keep track of our users requirements and demands.
                </p>
                <p>
                  <span className="font-semibold">12.</span> The personal information of the user restricted to the user's name, email address, phone number, location, shipping and billing address is retained, stored and used etc. by us.
                </p>
                <p>
                  <span className="font-semibold">13.</span> However, the other personal information i.e. the financial information such as bank details, card details, saved card, UPI id or any other payment instrument details relating to processing your orders by the website are collected by third party payment gateway providers such as Razorpay etc., who process the same are not collected by us. Such financial information shall be subject to the privacy policy of the third party payment gateway provider and we shall not be liable for the same in any case. We shall also not be obligated to mediate between the user and the third party payment gateway provider in case of any breach, loss, theft or fraud of your financial information.
                </p>
                <p>
                  <span className="font-semibold">14.</span> The non-personal information is automatically stored with the website when a user visits the website. However, such information does not specifically identify the user but is merely restricted to geographical location, IP address, browser information and other such non-identifiable information.
                </p>
                <p>
                  <span className="font-semibold">15.</span> When the user subscribes to our newsletter or consents to any other marketing communication, his email address would be shared and collected with us.
                </p>
                <p>
                  <span className="font-semibold">16.</span> If the user calls us at our phone number in case of any grievance, complaint, query relating to the website , the information collected by us at that time is also stored in our database and shall be complied with the terms of this privacy policy.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">PURPOSE OF COLLECTING INFORMATION:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">17.</span> The personal information is collected for processing the user's orders and for completion of any transaction. It is also used for assisting the logistic and/or courier partners to fulfill their orders.
                </p>
                <p>
                  <span className="font-semibold">18.</span> The non personal information is collected to enhance and personalise user experience, improve our services, products and for promotional and advertisement purposes, track browsing behaviour etc.
                </p>
                <p>
                  <span className="font-semibold">19.</span> Rabbitautocare uses the user's email id and phone number to send promotional and discount offers, newsletters, delivery and order status, security alerts, marketing communications and in order to reply to the user's queries and resolve the disputes. The user can always opt out of receiving the same.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">HOW MUCH INFORMATION IS SHARED:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">20.</span> Rabbitautocare does not believe in sharing is caring when it comes to privacy policy. We share information only on a need to know basis subject to the conditions and circumstances provided hereunder.
                </p>
                <p>
                  <span className="font-semibold">21.</span> Personal and non personal information shared with us is restricted to be used only by specific members of our team within the company and the website, assigned and designated for this purpose, unless it is required to be shared with others members for any reasonable purpose.
                </p>
                <p>
                  <span className="font-semibold">22.</span> Personal information including name, phone number, location, billing and shipping address is shared with the logistic and/or courier partners and payment gateway providers, limited to the extent they require to process the transaction and deliver or return the package. We also have a non-disclosure agreement in place with our logistics and/or courier partners to keep the user's personal information secure.
                </p>
                <p>
                  <span className="font-semibold">23.</span> User's information is shared with the government bodies or the Courts empowered in this behalf, in compliance with any laws for the time being in force, only upon a written request received on this behalf.
                </p>
                <p>
                  <span className="font-semibold">24.</span> In case of any breach, fraud or theft of information, the information will be shared to any third party investigator, statutory body, or any other entity engaged in this behalf with whom we would enquire or investigate the issue. No separate information will be given to the user on this behalf.
                </p>
                <p>
                  <span className="font-semibold">25.</span> The information mentioned in clause 24 shall however be strictly only for the purpose of enquiry and investigation and on the assurance and acceptance that it would not in any case be misused in any manner.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">COOKIES:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">26.</span> Rabbitautocare uses cookies to enable the browser to remember specific information about the user and to identify information targeted to the interests of the user. The information however is not personally identifiable.
                </p>
                <p>
                  <span className="font-semibold">27.</span> The user may or may not accept all or specific cookies, as per their wish. Users would be free to decline cookies.
                </p>
                <p>
                  <span className="font-semibold">28.</span> Rabbitautocare shall not be liable or responsible for any third party cookies.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">SAFEGUARDS FOR PROTECTION OF INFORMATION:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">29.</span> Information stored in our website or database is protected and secured from any kind of unauthorised access and shared only on a need to know basis as detailed above.
                </p>
                <p>
                  <span className="font-semibold">30.</span> Rabbitautocare uses modern encryption techniques to safeguard and protect user's information compliant with required standards.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">DURATION FOR WHICH INFORMATION IS RETAINED:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">31.</span> Information collected and shared by the user with the website is retained and used by us unless specifically asked to be withdrawn by the user.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">CHANGES OR MODIFICATION:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">32.</span> We reserve the right to make changes, variations and modifications in our privacy policy at any point of time.
                </p>
                <p>
                  <span className="font-semibold">33.</span> No separate intimation would necessarily be given about any change, variation or modification in the privacy policy.
                </p>
                <p>
                  <span className="font-semibold">34.</span> Users are advised and required to keep track of privacy policy.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">WITHDRAWAL OF PERSONAL INFORMATION:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">35.</span> Notwithstanding anything mentioned in any clause of this privacy policy except clause no. 23 and 24 of this privacy policy.
                </p>
                <p>
                  <span className="font-semibold">36.</span> We respect user's privacy more than anything else. Therefore, in case, the user wants to update, modify or withdraw their consent to using personal or non-personal information, he can write to us at help@rabbitautocare.com. The information is updated, modified or removed, as the case may be, within a maximum period of seven days from the receipt of request. It is to be noted however that if the user withdraws his consent, he will not be able to use or access the service corresponding to which the withdrawal is done. The information collected and shared before the withdrawal shall remain as it was, but will not be used any further for any means.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">GRIEVANCE REDRESSAL:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">37.</span> If you have any queries, questions or complaints with respect to our privacy policy or your information shared with us, you can write to us at our email <a href="mailto:help@rabbitautocare.com">help@rabbitautocare.com</a>. Our team will get back to you within seven working days.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">COPYRIGHT:</h2>
              <div className="space-y-4 pl-6">
                <p>
                  <span className="font-semibold">38.</span> This privacy policy is the intellectual property of RBTX NEXUS Pvt. Ltd. and our website <a href="http://www.rabbitautocare.com">www.rabbitautocare.com</a> and we have copyright over the same. Any unauthorised use of this policy or any extract thereof will lead to legal action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
