"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Search, ChevronDown, HelpCircle, DollarSign, Package, Truck, Shield, Users, Globe, TrendingUp, CheckCircle, AlertTriangle, Phone, MessageSquare, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

// Define interfaces for type safety
interface FAQItem {
  q: string;
  a: string;
  example: string;
  icon: string;
}

interface FAQData {
  [key: string]: FAQItem[];
}

interface Section {
  id: string;
  label: string;
  icon: any;
  color: string;
}

export default function FAQPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("basics");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const sections: Section[] = [
    { id: "basics", label: "Basics", icon: HelpCircle, color: "bg-blue-500" },
    { id: "orders", label: "Orders", icon: Package, color: "bg-green-500" },
    { id: "payments", label: "Payments", icon: DollarSign, color: "bg-purple-500" },
    { id: "shipping", label: "Shipping", icon: Truck, color: "bg-orange-500" },
    { id: "profit", label: "Profit", icon: TrendingUp, color: "bg-red-500" },
    { id: "safety", label: "Safety", icon: Shield, color: "bg-indigo-500" },
  ];

  const faqData: FAQData = {
    basics: [
      {
        q: "What exactly is MOQHUBS?",
        a: "MOQHUBS is a group importation platform. Example: Factory says 'Buy 100 pieces minimum.' Instead of one person struggling, 10 people combine orders to buy 10 pieces each. Everyone gets factory price.",
        example: "Example: Buy iPhone cases from China. Factory price: ₦500/piece. Jumia sells same: ₦2,500. You save ₦2,000 per case.",
        icon: "🏭"
      },
      {
        q: "Is this for beginners or experts?",
        a: "Perfect for beginners. No import knowledge needed. We handle everything: factory contact, shipping, customs. Just select product, pay, wait for delivery.",
        example: "Example: Chinedu in Lagos started with ₦15,000, now imports 500 phone cases monthly.",
        icon: "👶"
      },
      {
        q: "How much do I need to start?",
        a: "As low as ₦5,000. Most deals start from ₦5,000-₦50,000 depending on product.",
        example: "Example: Wireless earbuds factory price: ₦2,500/piece. Buy 2 pieces: ₦5,000. Sell in Nigeria: ₦8,000 each. Profit: ₦11,000.",
        icon: "💰"
      },
      {
        q: "What products can I import?",
        a: "Electronics, fashion items, kitchen tools, beauty products, home goods - same products you see on Jiji/Jumia but at factory prices.",
        example: "Example: Smart watches, ladies bags, phone accessories, kitchen blenders, perfumes.",
        icon: "📦"
      }
    ],
    orders: [
      {
        q: "How do group orders work?",
        a: "You join a group buying the same product. When enough people join to reach factory minimum (MOQ), the order proceeds.",
        example: "Example: Factory MOQ = 100 pieces. 20 people join, each buying 5 pieces. Order proceeds when MOQ reached.",
        icon: "👥"
      },
      {
        q: "What happens if group doesn't fill?",
        a: "100% refund. Your money stays in escrow and is returned if group doesn't reach MOQ within 7 days.",
        example: "Example: 50 pieces needed, only 30 pieces ordered in 7 days. All orders cancelled, money returned.",
        icon: "↩️"
      },
      {
        q: "Can I cancel my order?",
        a: "Yes, within 24 hours for full refund. After 24 hours, 10% cancellation fee applies.",
        example: "Example: Order ₦20,000 goods, cancel within 24 hours: get ₦20,000 back. Cancel after 48 hours: get ₦18,000 back.",
        icon: "❌"
      },
      {
        q: "How long to wait for group to fill?",
        a: "Popular products: 1-3 days. Less popular: 3-7 days. If not filled in 7 days, auto refund.",
        example: "Example: iPhone cases usually fill in 1 day. Specialized tools may take 5 days.",
        icon: "⏱️"
      }
    ],
    payments: [
      {
        q: "What is escrow?",
        a: "Your payment is held securely until goods arrive. We don't release money to factory until you confirm delivery.",
        example: "Example: Pay ₦50,000. Money stays safe. Only when goods reach Nigeria and you confirm, factory gets paid.",
        icon: "🔒"
      },
      {
        q: "What payment methods?",
        a: "Wallet system only. Add money to wallet via bank transfer, card, or USSD. Then use wallet to join orders.",
        example: "Example: Transfer ₦30,000 to wallet. Use ₦15,000 for one order, ₦15,000 stays for next order.",
        icon: "💳"
      },
      {
        q: "Any hidden charges?",
        a: "No. 3% platform fee included in price shown. That's all. No extra customs, no port charges.",
        example: "Example: Product shows ₦10,000 total. That's exactly what you pay. No surprises.",
        icon: "📊"
      },
      {
        q: "How fast are refunds?",
        a: "Processed within 24 hours, in your bank in 3-5 working days.",
        example: "Example: Cancel order Monday 10am. Refund processed by Tuesday 10am. Money in bank by Friday.",
        icon: "💸"
      }
    ],
    shipping: [
      {
        q: "How long does delivery take?",
        a: "Sea freight: 35-45 days. Air freight: 15-25 days. Starts counting AFTER group reaches MOQ.",
        example: "Example: Group fills Jan 1. Sea shipping: goods arrive Feb 10-20. Air shipping: goods arrive Jan 20-30.",
        icon: "📅"
      },
      {
        q: "Where are goods delivered?",
        a: "Lagos or Port Harcourt ports/airports. Doorstep delivery available at extra cost.",
        example: "Example: Goods land in Lagos. Pick up from our warehouse or pay ₦1,500 for home delivery.",
        icon: "📍"
      },
      {
        q: "Who handles customs?",
        a: "We handle everything. No need to deal with customs officers or pay extra at port.",
        example: "Example: Just pick up goods from our warehouse. No 'Oga at port' stories.",
        icon: "🏛️"
      },
      {
        q: "What if goods damaged?",
        a: "Report within 24 hours with photos. We replace or refund based on situation.",
        example: "Example: Receive 10 pieces, 1 damaged. Send photo within 24 hours. We replace damaged piece.",
        icon: "⚠️"
      }
    ],
    profit: [
      {
        q: "How is profit calculated?",
        a: "Factory price + shipping + customs + 3% fee = Your cost. Nigerian market price - your cost = Your profit.",
        example: "Example: Factory: ₦2,000 + Shipping: ₦500 + Customs: ₦300 + Fee: ₦84 = ₦2,884 cost. Sell at ₦8,000 = ₦5,116 profit.",
        icon: "🧮"
      },
      {
        q: "Are profits guaranteed?",
        a: "No guarantee. But we show current Nigerian prices so you can estimate realistically.",
        example: "Example: We show Jumia sells same product for ₦12,000. You import at ₦4,000. Potential profit: ₦8,000.",
        icon: "📈"
      },
      {
        q: "Where to sell imported goods?",
        a: "Jiji, Jumia, Instagram, WhatsApp, physical shop, market stall - anywhere.",
        example: "Example: Aisha sells on Instagram to her 2,000 followers. Emeka sells in Onitsha market.",
        icon: "🛍️"
      },
      {
        q: "Can I build my own brand?",
        a: "Yes. Import same product repeatedly, add your logo/package, build customer base.",
        example: "Example: Blessing imports perfumes monthly, creates 'Blessing Scents' brand, sells to repeat customers.",
        icon: "🏷️"
      }
    ],
    safety: [
      {
        q: "Is MOQHUBS a scam?",
        a: "No. Escrow protects your money. Money only released after delivery. Hundreds of successful orders.",
        example: "Example: Check our success stories - real Nigerians with real delivery photos.",
        icon: "✅"
      },
      {
        q: "How are factories verified?",
        a: "We check factory ratings, reviews, transaction history on 1688.com/Alibaba before listing.",
        example: "Example: Factory must have 4+ star rating, 1000+ transactions, verified supplier status.",
        icon: "🔍"
      },
      {
        q: "What if factory fails?",
        a: "Money still in escrow. We cancel order, refund everyone, find alternative supplier.",
        example: "Example: Factory goes out of business. We refund your ₦50,000 immediately.",
        icon: "🏭"
      },
      {
        q: "How transparent is the process?",
        a: "Track every stage: Group filling → Order placed → Shipped → Cleared → Ready for pickup.",
        example: "Example: See real-time updates in your dashboard. Know exactly where your goods are.",
        icon: "👁️"
      }
    ]
  };

  const toggleItem = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filterFAQs = (): FAQData => {
    if (!searchQuery) return faqData;
    
    const filtered: FAQData = {};
    
    Object.entries(faqData).forEach(([sectionId, items]) => {
      const filteredItems = items.filter(item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (filteredItems.length > 0) {
        filtered[sectionId] = filteredItems;
      }
    });
    
    return filtered;
  };

  const displayData = filterFAQs();

  const popularQuestions = [
    { q: "How much profit can I make?", section: "profit" },
    { q: "Is my money safe?", section: "safety" },
    { q: "How long for delivery?", section: "shipping" },
    { q: "What if group doesn't fill?", section: "orders" },
    { q: "Minimum amount to start?", section: "basics" },
    { q: "How to sell imported goods?", section: "profit" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-300 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-gray-100 rounded-lg active:scale-95"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">FAQ - Frequently Asked Questions</h1>
            <p className="text-xs text-gray-600">Get answers to common questions</p>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search questions (e.g., 'profit', 'delivery', 'money safe')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Popular Questions Quick Links */}
      {!searchQuery && (
        <div className="px-4 pt-4">
          <h2 className="text-sm font-bold text-gray-900 mb-2">🔥 Popular Questions</h2>
          <div className="flex flex-wrap gap-2">
            {popularQuestions.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveSection(item.section);
                  setTimeout(() => {
                    const element = document.getElementById(item.section);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 active:scale-95"
                type="button"
              >
                {item.q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="px-4 py-3">
        <div className="flex overflow-x-auto gap-1 scrollbar-hide pb-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                id={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap flex-shrink-0 transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
                type="button"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Content */}
      <div className="px-4 pb-24">
        {Object.entries(displayData).map(([sectionId, items]) => (
          <div key={sectionId} className="mb-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className={`w-6 h-6 rounded flex items-center justify-center ${
                sections.find(s => s.id === sectionId)?.color || "bg-gray-500"
              } text-white`}>
                {(() => {
                  const section = sections.find(s => s.id === sectionId);
                  if (section?.icon) {
                    const IconComponent = section.icon;
                    return <IconComponent className="w-3 h-3" />;
                  }
                  return null;
                })()}
              </div>
              {sections.find(s => s.id === sectionId)?.label || sectionId}
            </h2>
            
            <div className="space-y-2">
              {items.map((item, index) => {
                const itemId = `${sectionId}-${index}`;
                const isExpanded = expandedItems.includes(itemId);
                
                return (
                  <div
                    key={itemId}
                    className="bg-white border border-gray-300 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(itemId)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left"
                      type="button"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-lg flex-shrink-0">{item.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-gray-900 pr-2">{item.q}</h3>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 border-t border-gray-200">
                        <div className="pl-8">
                          <p className="text-sm text-gray-700 mb-3">{item.a}</p>
                          
                          {item.example && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                              <div className="text-xs font-bold text-blue-800 mb-1">📌 Example:</div>
                              <p className="text-xs text-blue-700">{item.example}</p>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mt-2">
                            <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
                            Based on real MOQHUBS transactions
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* No Results */}
        {searchQuery && Object.keys(displayData).length === 0 && (
          <div className="text-center py-10">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No results found for &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-orange-600 text-sm font-medium"
              type="button"
            >
              Clear search
            </button>
          </div>
        )}

        {/* How Escrow Works - Visual */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-300">
          <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            How Escrow Protects Your Money
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-green-600">1</span>
              </div>
              <div>
                <div className="text-sm font-medium text-green-900">You Pay</div>
                <div className="text-xs text-green-700">Money goes to secure escrow account</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-green-600">2</span>
              </div>
              <div>
                <div className="text-sm font-medium text-green-900">Group Reaches MOQ</div>
                <div className="text-xs text-green-700">Order placed with factory</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-green-600">3</span>
              </div>
              <div>
                <div className="text-sm font-medium text-green-900">Goods Arrive Nigeria</div>
                <div className="text-xs text-green-700">You confirm delivery</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-green-600">4</span>
              </div>
              <div>
                <div className="text-sm font-medium text-green-900">Factory Gets Paid</div>
                <div className="text-xs text-green-700">Only after you confirm goods received</div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-green-700">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            If goods don&apos;t arrive, money stays in escrow. 100% refund.
          </div>
        </div>

        {/* Still Have Questions */}
        <div className="mt-8 bg-white rounded-2xl p-4 border border-gray-300">
          <h3 className="font-bold text-gray-900 mb-3">Still have questions?</h3>
          <div className="space-y-2">
            <a
              href="https://wa.me/2349012345678"
              className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageSquare className="w-5 h-5" />
              <div>
                <div className="text-sm font-medium">Chat on WhatsApp</div>
                <div className="text-xs">Fast response within minutes</div>
              </div>
            </a>
            
            <a
              href="mailto:support@moqhubs.com"
              className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800"
            >
              <Mail className="w-5 h-5" />
              <div>
                <div className="text-sm font-medium">Email Support</div>
                <div className="text-xs">support@moqhubs.com</div>
              </div>
            </a>
            
            <a
              href="tel:+2349012345678"
              className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800"
            >
              <Phone className="w-5 h-5" />
              <div>
                <div className="text-sm font-medium">Call Us</div>
                <div className="text-xs">09168623026 (9am-6pm)</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-4 shadow-xl">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-2">
            <div className="text-xs text-gray-600">Ready to start importing?</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/bulky-cards")}
              className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-lg text-sm active:scale-95"
              type="button"
            >
              Browse Deals
            </button>
            <button
              onClick={() => router.push("/auth?tab=register")}
              className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-lg text-sm active:scale-95"
              type="button"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}