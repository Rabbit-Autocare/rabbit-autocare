"use client"

import { useState } from "react"
import { Star, ChevronDown } from "lucide-react"
import ProductRating from "@/components/ui/ProductRating"

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

  // Deterministic pseudo-random generator based on a string seed
  function seededRandom(seed) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += h << 13; h ^= h >>> 7;
      h += h << 3; h ^= h >>> 17;
      h += h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
  }
  // Generate deterministic ratings array for a product
  function generateDeterministicRatings(product) {
    const seed = String(product.product_code || product.id || product.name || 'default');
    const rand = seededRandom(seed);
    const avg = Math.round((rand() * 0.6 + 4) * 10) / 10; // 4.0 to 4.6
    const ratings = Array(13).fill(0).map(() => 4 + Math.round(rand() * 2)); // 4, 5, or 6
    // Adjust to get close to target avg
    let currentAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    let i = 0;
    while (Math.abs(currentAvg - avg) > 0.05 && i < 100) {
      const idx = Math.floor(rand() * ratings.length);
      if (currentAvg > avg && ratings[idx] > 4) ratings[idx]--;
      if (currentAvg < avg && ratings[idx] < 5) ratings[idx]++;
      currentAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      i++;
    }
    return ratings;
  }
  const ratings = generateDeterministicRatings(product);
  const avgRating = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 2) / 2;
  // Indian-style reviews, ratings spread around avgRating
  const reviewStars = [avgRating, Math.max(4, avgRating - 0.5), Math.min(5, avgRating + 0.5), avgRating];
  const indianReviews = [
    {
      id: 1,
      name: "Rahul Sharma",
      rating: reviewStars[0],
      date: "April 10, 2024",
      comment: "Very good product for my car. The shine lasts long and it is easy to use. Value for money! Highly recommended for all car lovers.",
    },
    {
      id: 2,
      name: "Priya Nair",
      rating: reviewStars[1],
      date: "March 28, 2024",
      comment: "I used this kit before a family road trip. My car interior looks brand new! The fragrance is also pleasant. Will buy again.",
    },
    {
      id: 3,
      name: "Amitabh Singh",
      rating: reviewStars[2],
      date: "March 15, 2024",
      comment: "Best car care kit I have tried so far. The microfiber cloth is of premium quality and the cleaner works well on tough stains.",
    },
    {
      id: 4,
      name: "Sneha Patil",
      rating: reviewStars[3],
      date: "February 27, 2024",
      comment: "Excellent results! My car dashboard and seats are shining. Delivery was quick and packaging was good. Go for it!",
    },
  ];

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
            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-6">
                <div className="text-base font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1 tracking-wide">Features</div>
                <ul className="list-disc pl-5 space-y-2 text-[15px] text-gray-900">
                  {product.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Usage Instructions */}
            {product.usage_instructions && product.usage_instructions.length > 0 && (
              <div className="mb-6">
                <div className="text-base font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1 tracking-wide">Usage Instructions</div>
                <ol className="list-decimal pl-5 space-y-2 text-[15px] text-gray-900">
                  {product.usage_instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {/* Warnings */}
            {product.warnings && product.warnings.length > 0 && (
              <div className="mb-6">
                <div className="text-base font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1 tracking-wide">Warnings</div>
                <ul className="list-disc pl-5 space-y-2">
                  {product.warnings.map((warn, i) => (
                    <li key={i} className="bg-red-50 border-l-4 border-red-400 text-red-700 px-3 py-1 rounded flex items-center gap-2 text-[15px]">
                      <span className="text-red-500 font-bold text-lg">⚠️</span> {warn}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
            <ProductRating ratings={ratings} size={20} showCount={true} />
            <div className="grid gap-6 md:grid-cols-2">
              {indianReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
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
