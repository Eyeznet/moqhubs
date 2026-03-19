"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Users, Shield, Truck, Package, DollarSign, CheckCircle, Globe, TrendingUp, Lock, Target, Heart, Zap, Award, Crown, Star, ThumbsUp, MessageSquare, ShoppingBag, Factory, Percent, BarChart } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AboutUsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("what-we-are");
  const [stats, setStats] = useState({
    dealsCompleted: 1247,
    usersJoined: 5432,
    totalSaved: 89250000,
    successRate: 96
  });

  // Animate stats on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        dealsCompleted: 1321,
        usersJoined: 5897,
        totalSaved: 124300000,
        successRate: 97
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const sections = [
    { id: "what-we-are", label: "What We Are", icon: Users, color: "from-orange-500 to-red-500" },
    { id: "how-it-works", label: "How It Works", icon: Zap, color: "from-blue-500 to-cyan-500" },
    { id: "real-stories", label: "Success Stories", icon: Star, color: "from-green-500 to-emerald-500" },
    { id: "our-difference", label: "Why Choose Us", icon: Crown, color: "from-purple-500 to-pink-500" },
    { id: "start-now", label: "Start Now", icon: RocketLaunch, color: "from-yellow-500 to-orange-500" },
  ];

  const whatWeAre = {
    title: "moqhubs - Your Direct Bridge to Factory Prices",
    tagline: "No Middlemen. No Guessing. Just Real Factory Prices.",
    description: "moqhubs is Nigeria's FIRST group importation platform that breaks down factory minimum orders so you can import directly from China like the big traders, even with small capital.",
    keyPoints: [
      { icon: Factory, text: "Direct factory access (1688.com, Alibaba)" },
      { icon: Users, text: "Group buying to meet factory MOQ" },
      { icon: DollarSign, text: "Start with as low as ₦5,000" },
      { icon: Shield, text: "Escrow-protected payments" },
      { icon: Truck, text: "Doorstep delivery in Nigeria" },
    ]
  };

  const problemSolution = {
    problem: {
      title: "🇳🇬 The Nigerian Importation Struggle",
      points: [
        "📦 Factory says: 'Buy 100 pieces minimum'",
        "💰 You think: 'I only have money for 10 pieces'",
        "🛒 You buy from: Jiji/Jumia at 3x the price",
        "😤 Middlemen profit while you struggle"
      ]
    },
    solution: {
      title: "🎯 moqhubs Solution",
      points: [
        "👥 10 people join money for 100 pieces",
        "🏭 We order directly from factory",
        "📦 Each person gets their 10 pieces",
        "💰 Everyone saves 60-70% on cost"
      ]
    }
  };

  const howItWorks = [
    {
      step: "1",
      title: "Find Hot Products",
      description: "Browse trending deals with verified factory links",
      visual: "📱",
      details: "See actual 1688.com factory price vs Nigerian retail price. Know your profit before buying.",
      color: "bg-blue-100 border-blue-300"
    },
    {
      step: "2",
      title: "Join Group Order",
      description: "Combine with others to meet MOQ",
      visual: "👥",
      details: "Buy just 1-5 pieces. Join others until factory minimum is reached. No rejection!",
      color: "bg-green-100 border-green-300"
    },
    {
      step: "3",
      title: "Pay Securely",
      description: "Escrow-protected payment",
      visual: "🔒",
      details: "Your money stays safe until goods arrive. 100% refund if group fails.",
      color: "bg-purple-100 border-purple-300"
    },
    {
      step: "4",
      title: "We Import for You",
      description: "We handle everything from China",
      visual: "🚢",
      details: "Shipping, customs, clearing - we handle it all. No 'oga at the port' stories.",
      color: "bg-orange-100 border-orange-300"
    },
    {
      step: "5",
      title: "Receive & Sell",
      description: "Get goods, make profit",
      visual: "💰",
      details: "Receive at your doorstep. Sell immediately at market price. Repeat!",
      color: "bg-emerald-100 border-emerald-300"
    }
  ];

  const successStories = [
    {
      name: "Chinedu, Lagos",
      role: "Phone Accessories Seller",
      story: "Started with ₦15,000, now imports 500 pieces monthly",
      profit: "Makes ₦120,000 profit monthly",
      image: "📱",
      color: "from-blue-400 to-cyan-500"
    },
    {
      name: "Aisha, Kano",
      role: "Stay-at-home Mom",
      story: "Started small with kitchen items",
      profit: "Now earns ₦80,000/month from home",
      image: "👩‍🍳",
      color: "from-pink-400 to-rose-500"
    },
    {
      name: "Emeka, Onitsha",
      role: "Market Trader",
      story: "Used to buy from wholesalers at high prices",
      profit: "Now saves ₦200,000 monthly on cost",
      image: "🛍️",
      color: "from-green-400 to-emerald-500"
    },
    {
      name: "Blessing, Abuja",
      role: "Student Entrepreneur",
      story: "Funds education through part-time importing",
      profit: "Makes ₦45,000 profit weekly",
      image: "🎓",
      color: "from-purple-400 to-violet-500"
    }
  ];

  const whyChooseUs = [
    {
      icon: DollarSign,
      title: "Price Transparency",
      description: "See EXACT factory price, shipping, customs. No hidden charges.",
      highlight: "Know your landed cost before paying"
    },
    {
      icon: BarChart,
      title: "Profit Calculator",
      description: "We show you exactly how much profit you'll make before ordering.",
      highlight: "No guesswork, just real numbers"
    },
    {
      icon: Globe,
      title: "Market Comparison",
      description: "Compare with Jiji, Jumia, Konga prices. See the price gap.",
      highlight: "Know you're getting the best deal"
    },
    {
      icon: Shield,
      title: "100% Protection",
      description: "Escrow protection + delivery guarantee. Your money is safe.",
      highlight: "0 risk of losing your money"
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Join WhatsApp groups with other buyers. Learn and grow together.",
      highlight: "Network with successful importers"
    },
    {
      icon: TrendingUp,
      title: "Build Your Brand",
      description: "Start small, grow steadily, build your own product line.",
      highlight: "From reseller to brand owner"
    }
  ];

  const popularProducts = [
    { name: "Wireless Earbuds", factoryPrice: "₦2,500", nigeriaPrice: "₦8,000", profit: "₦5,500" },
    { name: "Smart Watches", factoryPrice: "₦4,000", nigeriaPrice: "₦12,000", profit: "₦8,000" },
    { name: "Kitchen Blenders", factoryPrice: "₦7,000", nigeriaPrice: "₦18,000", profit: "₦11,000" },
    { name: "Ladies Bags", factoryPrice: "₦3,000", nigeriaPrice: "₦9,000", profit: "₦6,000" },
    { name: "Phone Cases", factoryPrice: "₦800", nigeriaPrice: "₦2,500", profit: "₦1,700" },
    { name: "Perfumes", factoryPrice: "₦2,000", nigeriaPrice: "₦6,000", profit: "₦4,000" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-300 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">About moqhubs</h1>
            <p className="text-xs text-gray-600">Group Importation Made Simple</p>
          </div>
          <Link 
            href="/bulky-cards"
            className="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-all"
          >
            Browse Deals
          </Link>
        </div>
      </header>

      {/* Hero Section with Stats */}
      <div className="relative px-4 py-10 text-center bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-4">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Nigeria's #1 Group Import Platform</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Import Directly From China<br />
            <span className="text-yellow-300">Even With Small Capital</span>
          </h1>
          
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of Nigerians who are saving 60-70% by importing in groups. 
            No middlemen. No high minimums. Just real factory prices.
          </p>

          {/* Animated Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.dealsCompleted.toLocaleString()}+</div>
              <div className="text-sm opacity-90">Deals Completed</div>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.usersJoined.toLocaleString()}+</div>
              <div className="text-sm opacity-90">Nigerians Joined</div>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-bold">₦{(stats.totalSaved / 1000000).toFixed(1)}M+</div>
              <div className="text-sm opacity-90">Total Saved</div>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <div className="text-sm opacity-90">Success Rate</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/bulky-cards"
              className="px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              See Live Deals Now
            </Link>
            <Link
              href="/auth?tab=register"
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-[72px] z-40 bg-white border-b border-gray-300 px-4 py-2 shadow-sm">
        <div className="flex overflow-x-auto gap-2 scrollbar-hide max-w-6xl mx-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                  activeSection === section.id
                    ? `bg-gradient-to-r ${section.color} text-white shadow-md`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 space-y-12 max-w-6xl mx-auto">
        {/* What We Are */}
        <section id="what-we-are" className="scroll-mt-32">
          <div className="bg-white rounded-3xl p-8 border border-gray-300 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              <div className="lg:w-2/3">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{whatWeAre.title}</h2>
                <p className="text-gray-700 text-lg mb-6">{whatWeAre.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {whatWeAre.keyPoints.map((point, index) => {
                    const Icon = point.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Icon className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="font-medium text-gray-800">{point.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="lg:w-1/3">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white text-center">
                  <div className="text-5xl mb-4">🏭</div>
                  <h3 className="text-xl font-bold mb-2">Direct Factory Access</h3>
                  <p className="opacity-90 mb-4">Cut out all middlemen and buy at actual factory prices</p>
                  <div className="text-3xl font-bold">Save 60-70%</div>
                  <div className="text-sm opacity-90">Compared to buying in Nigeria</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem vs Solution */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white">
              <div className="text-4xl mb-4">😤</div>
              <h3 className="text-xl font-bold mb-4">{problemSolution.problem.title}</h3>
              <div className="space-y-3">
                {problemSolution.problem.points.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/10 rounded-xl">
                    <span className="text-lg">{point.split(' ')[0]}</span>
                    <span>{point.slice(point.indexOf(' ') + 1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 text-white">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-4">{problemSolution.solution.title}</h3>
              <div className="space-y-3">
                {problemSolution.solution.points.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/10 rounded-xl">
                    <span className="text-lg">{point.split(' ')[0]}</span>
                    <span>{point.slice(point.indexOf(' ') + 1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Visual Timeline */}
        <section id="how-it-works" className="scroll-mt-32">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5 Simple Steps to Start Importing</h2>
            <p className="text-gray-600">From browsing to profit in 30-45 days</p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-500 to-green-500 hidden lg:block"></div>
            
            <div className="space-y-8">
              {howItWorks.map((step, index) => (
                <div 
                  key={step.step} 
                  className={`relative flex flex-col lg:flex-row items-center lg:items-start gap-6 ${
                    index % 2 === 0 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Step Content */}
                  <div className={`lg:w-1/2 ${index % 2 === 0 ? 'lg:text-right lg:pr-8' : 'lg:pl-8'}`}>
                    <div className={`p-6 rounded-2xl border ${step.color} shadow-sm`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">{step.visual}</div>
                        <div>
                          <div className="text-sm font-bold text-gray-500">STEP {step.step}</div>
                          <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-700 font-medium mb-2">{step.description}</p>
                      <p className="text-gray-600 text-sm">{step.details}</p>
                    </div>
                  </div>

                  {/* Step Number */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10 w-12 h-12 bg-white border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      {step.step}
                    </div>
                  </div>

                  {/* Spacer for desktop */}
                  <div className="lg:w-1/2 hidden lg:block"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section id="real-stories" className="scroll-mt-32">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Real People, Real Profits</h2>
            <p className="text-gray-600">See how Nigerians are changing their lives with moqhubs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {successStories.map((story, index) => (
              <div 
                key={index} 
                className={`bg-gradient-to-br ${story.color} rounded-2xl p-6 text-white transform hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="text-4xl mb-4">{story.image}</div>
                <h3 className="font-bold text-lg mb-1">{story.name}</h3>
                <p className="text-sm opacity-90 mb-3">{story.role}</p>
                <p className="text-sm mb-4">{story.story}</p>
                <div className="bg-white/20 p-3 rounded-xl">
                  <div className="text-sm font-medium">Monthly Profit:</div>
                  <div className="text-xl font-bold">{story.profit}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section id="our-difference" className="scroll-mt-32">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Why moqhubs is Different</h2>
              <p className="text-gray-600">We built this platform to solve real Nigerian importation problems</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyChooseUs.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-white p-6 rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-gray-900">{feature.title}</h3>
                    </div>
                    <p className="text-gray-700 mb-3">{feature.description}</p>
                    <div className="text-sm font-medium text-purple-600">{feature.highlight}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular Products Comparison */}
        <section>
          <div className="bg-white rounded-3xl p-8 border border-gray-300 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">See The Price Difference</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-left font-bold text-gray-900">Product</th>
                    <th className="p-4 text-center font-bold text-gray-900">Factory Price</th>
                    <th className="p-4 text-center font-bold text-gray-900">Nigeria Price</th>
                    <th className="p-4 text-center font-bold text-green-600">Your Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {popularProducts.map((product, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{product.name}</td>
                      <td className="p-4 text-center text-red-600 font-bold">{product.factoryPrice}</td>
                      <td className="p-4 text-center text-gray-700">{product.nigeriaPrice}</td>
                      <td className="p-4 text-center text-green-600 font-bold">+{product.profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 text-center text-sm text-gray-600">
              *Based on actual prices from 1688.com vs Nigerian retail prices
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="start-now" className="scroll-mt-32">
          <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-10 text-center text-white shadow-xl">
            <div className="max-w-2xl mx-auto">
              <div className="text-5xl mb-6">🚀</div>
              <h2 className="text-3xl font-bold mb-4">Ready to Start Your Import Business?</h2>
              <p className="text-lg opacity-90 mb-6">
                Join thousands of Nigerians who have discovered the secret to profitable importation.
                Start small, grow steadily, build your brand.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold">₦5K</div>
                  <div className="text-sm">Minimum Start</div>
                </div>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold">30-45 Days</div>
                  <div className="text-sm">Delivery Time</div>
                </div>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold">60-70%</div>
                  <div className="text-sm">Average Savings</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/bulky-cards"
                  className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg text-lg flex items-center justify-center gap-3"
                >
                  <ShoppingBag className="w-6 h-6" />
                  Browse Available Deals
                </Link>
                <Link
                  href="/auth?tab=register"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all text-lg"
                >
                  Create Free Account
                </Link>
              </div>
              
              <div className="mt-8 text-sm opacity-80">
                No commitment. Browse deals for free. Only pay when you join a group.
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Footer */}
        <section>
          <div className="bg-gray-900 rounded-3xl p-8 text-white text-center">
            <h3 className="text-xl font-bold mb-4">Join Nigeria's Import Revolution</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              moqhubs isn't just a platform - it's a movement to empower every Nigerian with 
              direct access to global factories. Control your supply chain. Build your brand. 
              Create generational wealth.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span>Active WhatsApp Community</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5" />
                <span>97% Satisfaction Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span>Verified Factory Partners</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-4 shadow-2xl z-50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-gray-900">Start Importing Today</div>
            <div className="text-sm text-gray-600">No middlemen. Direct factory prices.</div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/bulky-cards"
              className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-all"
            >
              See Deals
            </Link>
            <Link
              href="/auth?tab=register"
              className="px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-all"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}

// Custom icon component
function RocketLaunch(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}