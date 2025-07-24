"use client"

import { useState } from "react"
import { Star, ChevronDown } from "lucide-react"
import ProductRating from "@/components/ui/ProductRating"
import testimonialsData from '@/data/testimonials.json'
import productSpecificFaqsData from '@/data/product-faqs.json'

const { testimonials } = testimonialsData;
const { productFaqs } = productSpecificFaqsData;

export default function ProductTabs({ product, reviews = [], faqs = [] }) {
  const [activeTab, setActiveTab] = useState("details")
  const [openFaq, setOpenFaq] = useState(null)

  // Function to get FAQs for the current product
  const getProductFaqs = () => {
    // If FAQs are passed as props, use them first
    if (faqs.length > 0) {
      return faqs;
    }

    // Try to find product-specific FAQs using product ID
    const productId = product.id || product.product_code;
    const specificFaqs = productFaqs?.filter(faq =>
      faq.product_id === productId ||
      faq.product_ids?.includes(productId)
    ) || [];

    // Return specific FAQs or empty array if none found
    return specificFaqs;
  };

  const displayFaqs = getProductFaqs();

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

  // Generate deterministic dates between July 24-27, 2025
  const generateDeterministicDate = (seed, index) => {
    const rand = seededRandom(seed + index);
    const dates = [
      "July 24, 2025",
      "July 25, 2025",
      "July 26, 2025",
      "July 27, 2025"
    ];
    return dates[Math.floor(rand() * dates.length)];
  };

  // Shuffle testimonials deterministically based on product
  const shuffleTestimonials = (product) => {
    const seed = String(product.product_code || product.id || product.name || 'default');
    const rand = seededRandom(seed);
    const shuffled = [...testimonials];

    // Fisher-Yates shuffle with deterministic random
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  };

  // Convert testimonials to reviews format for the reviews tab
  const convertTestimonialsToReviews = () => {
    const shuffledTestimonials = shuffleTestimonials(product);
    const productSeed = String(product.product_code || product.id || product.name || 'default');

    return shuffledTestimonials.slice(0, 4).map((testimonial, index) => {
      const rand = seededRandom(productSeed + testimonial.id);
      return {
        id: testimonial.id,
        name: testimonial.name,
        rating: Math.floor(rand() * 2) + 4, // Random rating between 4-5
        date: generateDeterministicDate(productSeed, index),
        comment: testimonial.text
      };
    });
  };

  // Use provided reviews or convert testimonials
  const displayReviews = reviews.length > 0 ? reviews.slice(0, 4) : convertTestimonialsToReviews();

  const tabs = [
    { id: "details", label: "Product Details" },
    { id: "reviews", label: "Ratings & Reviews" },
    { id: "faqs", label: "FAQs" },
  ]

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
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

            {/* Included Products for Kits/Combos */}
            {(product.kit_products?.length > 0 || product.combo_products?.length > 0) && (
              <div className="mb-6">
                <div className="text-base font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1 tracking-wide">Included Products</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Features</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {(product.kit_products || product.combo_products).map((item, idx) => {
                        const included = item.product || item;
                        const includedRatings = generateDeterministicRatings(included);
                        return (
                          <tr key={included.id || idx}>
                            <td className="px-4 py-2 font-medium text-gray-900">{included.name}</td>
                            <td className="px-4 py-2 text-gray-700">
                              {included.features && included.features.length > 0 ? (
                                <ul className="list-disc pl-4">
                                  {included.features.map((f, i) => <li key={i}>{f}</li>)}
                                </ul>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <ProductRating ratings={includedRatings} size={16} showCount={false} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

            {/* Warnings - Updated to match image style */}
            {product.warnings && product.warnings.length > 0 && (
              <div className="mb-6">
                <div className="text-base font-bold text-gray-800 mb-3 border-b border-gray-200 pb-1 tracking-wide">Warnings</div>
                <div className="bg-rose-50 border-l-4 border-red-400 p-4 space-y-3">
                  {product.warnings.map((warn, i) => (
                    <p key={i} className="text-red-800 text-[15px] leading-relaxed">
                      {warn}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
            <ProductRating ratings={ratings} size={20} showCount={true} />
            <div className="grid gap-6 md:grid-cols-2">
              {displayReviews.map((review) => (
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
                <div key={faq.id || index} className="border border-gray-200 rounded-lg">
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
