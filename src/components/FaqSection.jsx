import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import faqsData from "../data/faqs.json";

const FaqSection = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
    <hr className="border-gray-200 my-8" />
    <section className="w-full  mt-6 mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our products and services
          </p>
        </div>

        <div className="space-y-3">
          {faqsData.faqs.map((faq, index) => (
            <div
              key={faq.id || index}
              className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-4 md:px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:bg-gray-50"
                aria-expanded={openFaq === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-medium text-gray-900 pr-4 leading-relaxed">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ${
                    openFaq === index ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>

              <div
                id={`faq-answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openFaq === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-4 md:px-6 pb-4 text-gray-600 border-t border-gray-100 bg-gray-50/50">
                  <div className="pt-4">
                    <p className="leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Optional: Load more button if you have many FAQs */}
        {faqsData.faqs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No FAQs available at the moment.</p>
          </div>
        )}
      </div>
    </section>
    </>
  );
};

export default FaqSection;
