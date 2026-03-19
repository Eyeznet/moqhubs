"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle, AlertTriangle, Shield, FileText, Lock, Users, DollarSign, Truck, Package } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [activeSection, setActiveSection] = useState("escrow");

  const sections = [
    { id: "escrow", label: "Escrow", icon: Shield },
    { id: "orders", label: "Orders", icon: Package },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "group", label: "Group Rules", icon: Users },
  ];

  const terms = {
    escrow: [
      {
        title: "What is Escrow?",
        content: "Your payment is held securely until you confirm goods delivery. MOQHUBS doesn't touch your money until goods reach Nigeria."
      },
      {
        title: "When is money released?",
        content: "Funds are released to seller ONLY after you confirm delivery of goods in Nigeria. If goods don't arrive, 100% refund."
      },
      {
        title: "Escrow Fees",
        content: "No extra escrow fees. The 3% platform fee includes escrow protection."
      }
    ],
    orders: [
      {
        title: "Order Confirmation",
        content: "Your order is confirmed only when you receive order confirmation email/SMS."
      },
      {
        title: "MOQ Requirement",
        content: "Order will proceed only when group reaches factory minimum quantity. If not reached within 7 days, auto refund."
      },
      {
        title: "Order Cancellation",
        content: "You can cancel within 24 hours of order for full refund. After 24 hours, 10% cancellation fee applies."
      },
      {
        title: "Quantity Changes",
        content: "Cannot change quantity after order is confirmed. For changes, cancel and re-order."
      }
    ],
    payments: [
      {
        title: "Payment Methods",
        content: "Wallet balance only. Add money to wallet from bank transfer, card, or USSD."
      },
      {
        title: "Payment Protection",
        content: "All payments are SSL encrypted. We never store your card/bank details."
      },
      {
        title: "Refund Time",
        content: "Refunds processed within 24 hours, reach your account in 3-5 working days."
      },
      {
        title: "Failed Payments",
        content: "If payment fails but money is deducted, contact support immediately."
      }
    ],
    shipping: [
      {
        title: "Delivery Time",
        content: "Sea freight: 35-45 days. Air freight: 15-25 days. Starts after MOQ reached."
      },
      {
        title: "Delivery Location",
        content: "Delivery to Lagos/Port Harcourt airports/ports. Doorstep delivery available at extra cost."
      },
      {
        title: "Customs & Duties",
        content: "All customs and port charges included in price shown. No extra charges."
      },
      {
        title: "Damaged Goods",
        content: "Report damaged goods within 24 hours of delivery with photos for replacement/refund."
      }
    ],
    group: [
      {
        title: "Group Formation",
        content: "Groups formed automatically by system. No manual group selection."
      },
      {
        title: "Group Chat",
        content: "WhatsApp group created automatically when MOQ reached. Be respectful in group chats."
      },
      {
        title: "Group Failure",
        content: "If group fails to reach MOQ after 7 days, automatic 100% refund to all members."
      },
      {
        title: "Multiple Orders",
        content: "You can join multiple groups simultaneously. No limit."
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-300 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">Terms & Conditions</h1>
            <p className="text-xs text-gray-600">Last updated: Today</p>
          </div>
        </div>
      </header>

      {/* Warning Banner */}
      <div className="px-4 pt-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-yellow-800">Important:</p>
            <p className="text-yellow-700">Read these terms carefully before using MOQHUBS. By using our platform, you agree to these terms.</p>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-3 rounded-xl border border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Money Protection</div>
            <div className="text-sm font-bold text-green-700">Escrow Guaranteed</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Refund Policy</div>
            <div className="text-sm font-bold text-green-700">100% if Failed</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Delivery Time</div>
            <div className="text-sm font-bold text-blue-700">35-45 Days</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Platform Fee</div>
            <div className="text-sm font-bold text-orange-700">3% Only</div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="px-4 py-2">
        <div className="flex overflow-x-auto gap-1 scrollbar-hide">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap flex-shrink-0 ${
                  activeSection === section.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="text-xs font-medium">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Terms Content */}
      <div className="px-4 py-2">
        <div className="bg-white rounded-xl border border-gray-300 p-4">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {sections.find(s => s.id === activeSection)?.label} Terms
          </h2>
          
          <div className="space-y-4">
            {terms[activeSection as keyof typeof terms]?.map((term, index) => (
              <div key={index} className="pb-3 border-b border-gray-200 last:border-0">
                <div className="flex items-start gap-2 mb-1">
                  <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3 h-3 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{term.title}</h3>
                </div>
                <p className="text-xs text-gray-700 pl-7">{term.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="px-4 py-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Important Notes
          </h3>
          <ul className="space-y-1 text-xs text-red-700">
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>MOQHUBS is a platform, not a seller. We connect you to verified factories.</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Product quality is factory responsibility. We verify suppliers but don't manufacture.</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Shipping delays may occur due to customs, weather, or factory issues.</span>
            </li>
            <li className="flex items-start gap-1">
              <span>•</span>
              <span>Always check product details and factory ratings before ordering.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Acceptance Section */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-xl border border-gray-300 p-4">
          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5"
            />
            <div>
              <label htmlFor="acceptTerms" className="text-sm font-bold text-gray-900 block mb-1">
                I Accept All Terms & Conditions
              </label>
              <p className="text-xs text-gray-600">
                By checking this, you confirm you've read and agree to all terms above.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (accepted) {
                router.push("/");
              } else {
                alert("Please accept terms to continue");
              }
            }}
            className={`w-full py-3 rounded-xl font-bold text-sm ${
              accepted
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue to MOQHUBS
          </button>
        </div>
      </div>

      {/* Contact Support */}
      <div className="px-4 py-3">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Questions about our terms?</p>
          <div className="flex items-center justify-center gap-4">
            <a href="mailto:support@moqhubs.com" className="text-xs text-blue-600 font-medium">
              Email Support
            </a>
            <span className="text-gray-400">•</span>
            <a href="tel:+2349012345678" className="text-xs text-blue-600 font-medium">
              Call: 09012345678
            </a>
            <span className="text-gray-400">•</span>
            <a href="https://wa.me/2349012345678" className="text-xs text-green-600 font-medium">
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Quick Links Footer */}
      <div className="px-4 py-4 border-t border-gray-300 bg-white fixed bottom-0 left-0 right-0">
        <div className="flex justify-between text-xs">
          <button
            onClick={() => router.push("/privacy")}
            className="px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => router.push("/faq")}
            className="px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            FAQ
          </button>
          <button
            onClick={() => router.push("/about")}
            className="px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            About Us
          </button>
          <button
            onClick={() => router.push("/contact")}
            className="px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            Contact
          </button>
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