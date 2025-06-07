"use client"

import { useState } from "react"
import { Star, ChevronDown } from "lucide-react"

export default function ProductTabs({ product, reviews = [], faqs = [] }) {
  const [activeTab, setActiveTab] = useState("details")
  const [openFaq, setOpenFaq] = useState(null)

  // Generate sample FAQs if none provided
  const displayFaqs =
    faqs.length > 0
      ? faqs
      : [
          {
            question: "What is return policy?",
            answer:
              "We offer a 30-day return policy on all our products. If you're not satisfied, you can return the item for a full refund.",
          },
          {
            question: "How is your shipping policy?",
            answer:
              "We offer free shipping on all orders above ₹500. Orders are typically processed within 1-2 business days.",
          },
          {
            question: "What is the warranty period?",
            answer: "All our products come with a standard 1-year warranty against manufacturing defects.",
          },
          {
            question: "Are your products eco-friendly?",
            answer:
              "Yes, we strive to make our products as eco-friendly as possible, using sustainable materials and manufacturing processes.",
          },
        ]

  // Generate sample reviews if none provided
  const displayReviews =
    reviews.length > 0
      ? reviews
      : [
          {
            id: "1",
            name: "John D.",
            rating: 5,
            date: "August 15, 2023",
            comment: "I'm really happy with this product. It works exactly as described and the quality is excellent.",
          },
          {
            id: "2",
            name: "Sarah M.",
            rating: 4,
            date: "July 28, 2023",
            comment: "Good product overall. Shipping was fast and the product works well. Would recommend.",
          },
          {
            id: "3",
            name: "Michael T.",
            rating: 5,
            date: "June 12, 2023",
            comment: "Excellent quality and great value for money. Will definitely purchase again.",
          },
          {
            id: "4",
            name: "Emily R.",
            rating: 4,
            date: "May 30, 2023",
            comment: "Very satisfied with my purchase. The product is durable and works as expected.",
          },
        ]

  const tabs = [
    { id: "details", label: "Product Details" },
    { id: "reviews", label: "Ratings & Reviews" },
    { id: "faqs", label: "FAQs" },
  ]

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="mt-12">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "details" && (
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>

            {product.key_features && product.key_features.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-4">Key Features</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {product.key_features.map((feature, index) => (
                    <li key={index} className="text-gray-700">
                      {feature}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>

            <div className="grid gap-6 md:grid-cols-2">
              {displayReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <p className="font-medium">{review.name}</p>
                  <p className="text-gray-600 mt-2">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "faqs" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>

            <div className="space-y-2">
              {displayFaqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === index && (
                    <div className="px-4 pb-3 text-gray-600 border-t border-gray-200">
                      <p className="pt-3">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
