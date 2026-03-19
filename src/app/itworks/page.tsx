"use client";

import Link from "next/link";
import { 
  Shield, CheckCircle, Users, Globe, Package, Truck, 
  Clock, DollarSign, TrendingUp, ArrowRight, Home,
  ShoppingCart, User, BarChart, Lock, Target, Zap,
  Calculator, MapPin, Star, ShieldCheck, ChevronRight,
  ArrowUpRight, Shield as ShieldIcon, BadgeCheck,
  Box, CheckCircle2, Briefcase
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HowItWorksPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // FAQ Data
  const faqData = [
    {
      question: "Who can use MOQHubs?",
      answer: "MOQHubs is designed exclusively for resellers, wholesalers, online vendors, small business owners, and entrepreneurs who want to import products for resale. It's not for personal retail buyers."
    },
    {
      question: "How does the escrow system work?",
      answer: "Your payment is held securely in escrow until the Minimum Order Quantity (MOQ) is fully reached. Only then is the order placed with the supplier. If the MOQ isn't reached, you get a 100% refund."
    },
    {
      question: "What shipping methods are available?",
      answer: "We offer both Air Freight (approximately 14 days) and Sea Freight (approximately 50-60 days). The shipping method for each deal is clearly stated on the product page."
    },
    {
      question: "Are customs and duties included in the price?",
      answer: "Yes! Every product page shows the complete breakdown including shipping fees, customs duties, clearing charges, and the final total amount you'll pay. No hidden fees."
    },
    {
      question: "How do I receive my goods?",
      answer: "When the shipment arrives in Nigeria, we sort items according to each buyer's quantity and notify you for pickup or arrange delivery to your specified location."
    },
    {
      question: "Can I join with a very small amount?",
      answer: "Yes! You can join deals with as little as ₦5,000. The platform is designed to make wholesale importing accessible to businesses with small capital."
    }
  ];

  // Steps data
  const steps = [
    {
      number: 1,
      icon: <Globe className="w-6 h-6" />,
      title: "Browse Verified Wholesale Deals",
      description: "Explore products from trusted global platforms like Alibaba, 1688, Taobao, and verified manufacturers.",
      details: [
        "See clear pricing with all fees included",
        "View required minimum quantity (MOQ)",
        "Track units already joined by others",
        "Know shipping fees, customs, and clearing charges",
        "Get estimated delivery timeline",
        "See final total amount before committing"
      ]
    },
    {
      number: 2,
      icon: <Users className="w-6 h-6" />,
      title: "Join a Deal with Small Capital",
      description: "Select your variant, choose quantity, and pay your exact total cost shown on the product page.",
      details: [
        "Choose color, size, model variations",
        "Select your desired quantity",
        "Pay only for your share",
        "Payment held securely in escrow",
        "Join with as little as ₦5,000",
        "No large capital required"
      ]
    },
    {
      number: 3,
      icon: <CheckCircle className="w-6 h-6" />,
      title: "MOQ Reached → Order Processing",
      description: "Once enough wholesalers join, we place the bulk order and handle everything for you.",
      details: [
        "Supplier order confirmed and paid",
        "We handle international shipping",
        "Customs clearance managed by us",
        "Goods tracked from factory to Nigeria",
        "No supplier scam worries",
        "Professional import management"
      ]
    },
    {
      number: 4,
      icon: <Clock className="w-6 h-6" />,
      title: "Shipping & Timeline",
      description: "Your goods are shipped using the method specified for the deal with clear timelines.",
      details: [
        "Air Freight: ~14 days delivery",
        "Sea Freight: ~50-60 days delivery",
        "Shipping method clearly stated",
        "Real-time tracking updates",
        "Clear delivery timeline",
        "Professional logistics handling"
      ]
    },
    {
      number: 5,
      icon: <Package className="w-6 h-6" />,
      title: "Goods Arrival & Distribution",
      description: "When shipment arrives, we sort and distribute to each buyer for immediate resale.",
      details: [
        "Items sorted by buyer quantity",
        "Delivery notifications sent",
        "Safe goods distribution",
        "Ready for immediate resale",
        "Original imported products",
        "Lower total cost achieved"
      ]
    }
  ];

  // Safety features
  const safetyFeatures = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Escrow Payment Protection",
      description: "Your money is held securely until MOQ is completed and order confirmed"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Full Cost Transparency",
      description: "See all fees upfront: shipping, customs, duties, and final total amount"
    },
    {
      icon: <BadgeCheck className="w-5 h-5" />,
      title: "Verified Suppliers Only",
      description: "Work with trusted manufacturers, reliable exporters, and quality-checked products"
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "No Hidden Charges",
      description: "Everything is included in the price shown before you join any deal"
    }
  ];

  // User types
  const userTypes = [
    "Resellers",
    "Wholesalers",
    "Online Vendors",
    "Small Business Owners",
    "Entrepreneurs with Low Capital",
    "Those wanting to buy cheap and resell for profit"
  ];

  // Example comparison
  const comparison = {
    without: [
      "Supplier MOQ: 100 pairs",
      "Total cost: ₦1,000,000",
      "Cannot afford alone",
      "No business opportunity"
    ],
    with: [
      "Many resellers join together",
      "Each pays small affordable amount",
      "MOQ reached → Bulk order placed",
      "Goods arrive → Everyone receives share"
    ],
    benefits: [
      "Start selling immediately",
      "Make profit with small capital",
      "Grow into bigger wholesaler",
      "Access global markets easily"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-sans pb-20 safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-[15px] font-bold text-gray-900">MOQHUBS</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
              href="/bulky-cards"
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              Browse Deals
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              href="/auth"
              className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <User className="w-5 h-5 text-gray-600" />
              {!isMobile && <span className="text-sm">Account</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-8 md:py-12 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm">
            <ShieldIcon className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">For Resellers & Wholesalers</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            How <span className="text-yellow-300">MOQHubs</span> Works
          </h1>
          
          <p className="text-lg md:text-xl text-orange-100 mb-6 max-w-2xl mx-auto">
            Buy original products from global suppliers at wholesale prices — even with small capital.
            Join other resellers to reach minimum order quantities together.
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="#start-now"
              className="px-6 py-3 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              Start Importing Now
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/bulky-cards"
              className="px-6 py-3 bg-orange-700 text-white font-bold rounded-lg hover:bg-orange-800 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              Browse Active Deals
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Quick Navigation */}
      <nav className="sticky top-[73px] z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex overflow-x-auto gap-2 hide-scrollbar">
          {[
            { id: "overview", label: "Overview" },
            { id: "steps", label: "Step-by-Step" },
            { id: "safety", label: "Safety" },
            { id: "example", label: "Real Example" },
            { id: "faq", label: "FAQ" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                setActiveSection(item.id);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Overview Section */}
        <section id="overview" className="mb-12 scroll-mt-32">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">How MOQHubs Works</h2>
                <p className="text-gray-600">For Resellers & Wholesalers Only</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                MOQHubs helps you <span className="font-semibold text-orange-600">buy original products from global suppliers at very low prices</span> — even if you don't have enough money to meet the supplier's Minimum Order Quantity (MOQ).
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 font-medium">
                  Instead of buying alone, you <span className="font-bold">join other resellers and wholesalers</span> to place one big bulk order together. This makes the price cheaper, the shipping lower, and the process safer.
                </p>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-orange-800 font-semibold">
                    Important: MOQHubs is designed only for resellers and wholesalers, not for personal retail buyers.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <h3 className="font-bold text-green-800 mb-2">For Resellers</h3>
                  <ul className="space-y-1 text-green-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Access wholesale prices</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Small capital requirement</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Immediate profit potential</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-bold text-blue-800 mb-2">Key Benefits</h3>
                  <ul className="space-y-1 text-blue-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>No hidden fees</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Escrow protection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Full import handling</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step-by-Step Guide */}
        <section id="steps" className="mb-12 scroll-mt-32">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Step-by-Step Guide</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to start importing profitable products with small capital
            </p>
          </div>
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Step Number & Icon */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl">
                          {step.number}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-orange-500 rounded-full flex items-center justify-center">
                          <div className="text-orange-500">
                            {step.icon}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-700 mb-4">{step.description}</p>
                      
                      <div className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{detail}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Example for step 1 */}
                      {step.number === 1 && (
                        <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Example:</h4>
                          <p className="text-gray-700">
                            A supplier requires <span className="font-bold">50 handbags</span> before selling. 
                            You may only want <span className="font-bold">3 handbags</span>. 
                            With MOQHubs, you simply <span className="font-bold text-orange-600">join with 3 units</span>, 
                            while other wholesalers join until the total reaches <span className="font-bold">50 units</span>.
                          </p>
                        </div>
                      )}
                      
                      {/* Example for step 2 */}
                      {step.number === 2 && (
                        <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Example:</h4>
                          <div className="space-y-2 text-gray-700">
                            <p>• Total bulk order: <span className="font-bold">₦500,000</span></p>
                            <p>• 50 resellers join with <span className="font-bold">₦10,000 each</span></p>
                            <p>• MOQ completed → MOQHubs places the order with the supplier</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Section */}
        <section id="safety" className="mb-12 scroll-mt-32">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-4">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="text-blue-600 font-semibold">100% Safe & Transparent</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Why MOQHubs Is Safe</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Your security and transparency are our top priorities
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safetyFeatures.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="text-blue-600">
                        {feature.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-700 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Cost Transparency Example */}
            <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Full Cost Transparency Example</h3>
              <div className="space-y-3">
                {[
                  { label: "Product Unit Price", value: "₦5,000" },
                  { label: "Shipping Fee", value: "₦1,500" },
                  { label: "Customs & Duties", value: "₦800" },
                  { label: "Clearing Charges", value: "₦200" },
                  { label: "Platform Fee (3%)", value: "₦225" },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                  <span className="text-gray-900 font-bold">Final Total Amount</span>
                  <span className="text-lg font-bold text-green-600">₦7,725</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-4">
                This is the exact amount you'll see and pay before joining any deal — no surprises!
              </p>
            </div>
          </div>
        </section>

        {/* Real-Life Example */}
        <section id="example" className="mb-12 scroll-mt-32">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Real-Life Business Scenario</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                See the difference MOQHubs makes for your wholesale business
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Without MOQHubs */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-red-800">Without MOQHubs</h3>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-700">You want to import shoes:</h4>
                  <ul className="space-y-2">
                    {comparison.without.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                          <Minus className="w-3 h-3 text-red-600" />
                        </div>
                        <span className="text-red-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300">
                    <p className="text-red-800 font-semibold text-center">
                      Result: No business opportunity
                    </p>
                  </div>
                </div>
              </div>
              
              {/* With MOQHubs */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800">With MOQHubs</h3>
                </div>
                
                <div className="space-y-3">
                  <ul className="space-y-2">
                    {comparison.with.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-green-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold text-green-700 mb-2">Now you can:</h4>
                    <ul className="space-y-2">
                      {comparison.benefits.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Should Use MOQHubs */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 md:p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Who Should Use MOQHubs?</h2>
              <p className="text-gray-700 max-w-2xl mx-auto">
                MOQHubs is strictly for business owners who want to buy cheap and resell for profit
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {userTypes.map((type, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-orange-200 hover:border-orange-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-medium text-gray-900">{type}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <div className="inline-block bg-white px-4 py-2 rounded-full border border-orange-300">
                <p className="text-orange-700 font-semibold">
                  If your goal is to buy cheap and resell for profit, then MOQHubs is built for you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section id="start-now" className="mb-12">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 md:p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Getting Started Is Simple</h2>
            <p className="text-orange-100 text-lg mb-6 max-w-2xl mx-auto">
              Join thousands of resellers who are already making profits with small capital
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { number: 1, title: "Create Account", desc: "Free signup in minutes" },
                { number: 2, title: "Fund Wallet", desc: "Add money securely" },
                { number: 3, title: "Join Deals", desc: "Start with as low as ₦5,000" },
                { number: 4, title: "Receive Goods", desc: "Get imported products" },
                { number: 5, title: "Resell & Profit", desc: "Grow your business" },
              ].map((step) => (
                <div key={step.number} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="w-10 h-10 bg-white text-orange-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-orange-100 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/auth"
                className="px-8 py-3 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 active:scale-95 transition-all inline-flex items-center gap-2 text-lg"
              >
                Start Free Account
                <ArrowUpRight className="w-5 h-5" />
              </Link>
              <Link
                href="/bulky-cards"
                className="px-8 py-3 bg-orange-800 text-white font-bold rounded-lg hover:bg-orange-900 active:scale-95 transition-all inline-flex items-center gap-2 text-lg"
              >
                Browse Live Deals
                <TrendingUp className="w-5 h-5" />
              </Link>
            </div>
            
            <p className="text-white/80 mt-6">
              MOQHubs makes global wholesale importing simple, safe, and affordable.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mb-12 scroll-mt-32">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about using MOQHubs
              </p>
            </div>
            
            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <div 
                  key={index}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
                >
                  <details className="group">
                    <summary className="flex items-center justify-between p-4 md:p-6 cursor-pointer list-none">
                      <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-open:rotate-90 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2 border-t border-gray-200">
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-3">
                Still have questions? We're here to help!
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700"
              >
                Contact Support
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around py-2 safe-area-bottom shadow-lg z-50">
        <Link href="/" className="flex flex-col items-center text-orange-600">
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium mt-0.5">Home</span>
        </Link>
        <Link href="/bulky-cards" className="flex flex-col items-center text-gray-600 hover:text-orange-600">
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs font-medium mt-0.5">Deals</span>
        </Link>
        <Link href="/how-it-works" className="flex flex-col items-center text-gray-600 hover:text-orange-600">
          <BarChart className="w-5 h-5" />
          <span className="text-xs font-medium mt-0.5">How it Works</span>
        </Link>
        <Link href="/auth" className="flex flex-col items-center text-gray-600 hover:text-orange-600">
          <User className="w-5 h-5" />
          <span className="text-xs font-medium mt-0.5">Account</span>
        </Link>
      </nav>

      {/* Missing Icons Components */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .safe-area-bottom {
          padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 20px);
        }
        .scroll-mt-32 {
          scroll-margin-top: 8rem;
        }
      `}</style>
    </div>
  );
}

// Missing Icons
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Minus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);