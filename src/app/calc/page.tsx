"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Package, 
  Truck, 
  Ship, 
  Plane, 
  Shield, 
  Download, 
  Share2, 
  BarChart, 
  PieChart,
  RefreshCw,
  Save,
  Clock,
  Globe,
  Users,
  Home,
  User,
  ShoppingBag,
  Menu,
  LogIn,
  LogOut,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Shipping cost constants (Naira per kg)
const SHIPPING_RATES = {
  sea: {
    freight: 1550,
    customs: 650,
    description: "Sea Shipping (4-8 weeks)",
    icon: <Ship className="w-5 h-5" />
  },
  air: {
    freight: 10586.5,
    customs: 1250,
    description: "Air Freight (1-3 weeks)",
    icon: <Plane className="w-5 h-5" />
  }
};

interface ProductExample {
  id: number;
  name: string;
  category: string;
  source: string;
  buyingPrice: number;
  retailPrice: number;
  weight: number;
  moq: number;
  description: string;
  url: string;
}

interface CalculatorState {
  buyingPrice: number;
  retailPrice: number;
  quantity: number;
  weightPerUnit: number;
  shippingMethod: 'sea' | 'air';
  platformFee: number;
  localDelivery: number;
  nairaToYuan: number;
}

export default function CalculatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const [calculator, setCalculator] = useState<CalculatorState>({
    buyingPrice: 5000,
    retailPrice: 10000,
    quantity: 10,
    weightPerUnit: 0.5,
    shippingMethod: 'air',
    platformFee: 3,
    localDelivery: 1500,
    nairaToYuan: 210
  });

  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'calculator' | 'examples' | 'breakdown'>('calculator');
  const [showExplanation, setShowExplanation] = useState(true);

  const productExamples: ProductExample[] = [
    {
      id: 1,
      name: "Wireless Bluetooth Earbuds",
      category: "Electronics",
      source: "1688.com",
      buyingPrice: 35,
      retailPrice: 8500,
      weight: 0.08,
      moq: 50,
      description: "TWS Earbuds with charging case, 20hr battery life",
      url: "https://www.1688.com"
    },
    {
      id: 2,
      name: "Smart Watch Series 7",
      category: "Electronics",
      source: "Alibaba.com",
      buyingPrice: 120,
      retailPrice: 25000,
      weight: 0.12,
      moq: 20,
      description: "AMOLED display, heart rate monitor, waterproof",
      url: "https://www.alibaba.com"
    },
    {
      id: 3,
      name: "Designer T-Shirts",
      category: "Fashion",
      source: "1688.com",
      buyingPrice: 25,
      retailPrice: 6000,
      weight: 0.3,
      moq: 100,
      description: "100% Cotton, multiple designs available",
      url: "https://www.1688.com"
    },
    {
      id: 4,
      name: "Solar Power Bank",
      category: "Electronics",
      source: "Alibaba.com",
      buyingPrice: 85,
      retailPrice: 18000,
      weight: 0.45,
      moq: 30,
      description: "30000mAh with solar charging panel",
      url: "https://www.alibaba.com"
    },
    {
      id: 5,
      name: "LED Ring Light",
      category: "Photography",
      source: "1688.com",
      buyingPrice: 45,
      retailPrice: 9500,
      weight: 1.2,
      moq: 25,
      description: "18-inch ring light with tripod stand",
      url: "https://www.1688.com"
    }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('moqhubs_calculations');
    if (saved) {
      try {
        setSavedCalculations(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved calculations:", e);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        });
      } else {
        setUser(null);
      }
    });

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowMobileMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const calculateMetrics = useCallback(() => {
    const rates = SHIPPING_RATES[calculator.shippingMethod];
    
    const productCost = calculator.buyingPrice * calculator.quantity;
    const totalWeight = calculator.weightPerUnit * calculator.quantity;
    const freightCost = rates.freight * totalWeight;
    const customsCost = rates.customs * totalWeight;
    const totalShippingCost = freightCost + customsCost;
    const totalRevenue = calculator.retailPrice * calculator.quantity;
    const platformFeeAmount = (totalRevenue * calculator.platformFee) / 100;
    const localDeliveryCost = calculator.localDelivery * calculator.quantity;
    const totalCost = productCost + totalShippingCost + platformFeeAmount + localDeliveryCost;
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    const unitCost = calculator.quantity > 0 ? totalCost / calculator.quantity : 0;
    const unitProfit = calculator.quantity > 0 ? netProfit / calculator.quantity : 0;
    const unitShipping = calculator.quantity > 0 ? totalShippingCost / calculator.quantity : 0;
    const breakevenQuantity = calculator.retailPrice > 0 ? 
      Math.ceil(totalCost / calculator.retailPrice) : 0;
    
    return {
      productCost: Math.round(productCost),
      freightCost: Math.round(freightCost),
      customsCost: Math.round(customsCost),
      totalShippingCost: Math.round(totalShippingCost),
      platformFeeAmount: Math.round(platformFeeAmount),
      localDeliveryCost: Math.round(localDeliveryCost),
      totalCost: Math.round(totalCost),
      totalRevenue: Math.round(totalRevenue),
      netProfit: Math.round(netProfit),
      profitMargin: profitMargin.toFixed(2),
      roi: roi.toFixed(2),
      unitCost: Math.round(unitCost),
      unitProfit: Math.round(unitProfit),
      unitShipping: Math.round(unitShipping),
      breakevenQuantity,
      totalWeight: totalWeight.toFixed(2),
      shippingMethod: calculator.shippingMethod,
      shippingRate: rates,
      weightPerUnit: calculator.weightPerUnit
    };
  }, [calculator]);

  const metrics = calculateMetrics();

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const calculateExample = useCallback((example: ProductExample) => {
    const buyingPriceNGN = example.buyingPrice * calculator.nairaToYuan;
    const totalWeight = example.weight * example.moq;
    const rates = SHIPPING_RATES[calculator.shippingMethod];
    
    const productCost = buyingPriceNGN * example.moq;
    const freightCost = rates.freight * totalWeight;
    const customsCost = rates.customs * totalWeight;
    const totalShippingCost = freightCost + customsCost;
    const platformFeeAmount = (productCost * calculator.platformFee) / 100;
    const localDeliveryCost = calculator.localDelivery * example.moq;
    const totalCost = productCost + totalShippingCost + platformFeeAmount + localDeliveryCost;
    
    const multiplier = example.id === 1 ? 3 :
                     example.id === 2 ? 3.5 :
                     example.id === 3 ? 2.5 :
                     example.id === 4 ? 3 :
                     3.2;
    
    const retailPricePerUnit = Math.round((totalCost / example.moq) * multiplier);
    const totalRevenue = retailPricePerUnit * example.moq;
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0;
    
    return {
      buyingPriceNGN: Math.round(buyingPriceNGN),
      retailPricePerUnit: Math.round(retailPricePerUnit),
      productCost: Math.round(productCost),
      freightCost: Math.round(freightCost),
      customsCost: Math.round(customsCost),
      totalShippingCost: Math.round(totalShippingCost),
      platformFeeAmount: Math.round(platformFeeAmount),
      localDeliveryCost: Math.round(localDeliveryCost),
      totalCost: Math.round(totalCost),
      totalRevenue: Math.round(totalRevenue),
      netProfit: Math.round(netProfit),
      profitMargin: profitMargin.toFixed(2),
      totalWeight: totalWeight.toFixed(2),
      importCostPerUnit: Math.round(totalCost / example.moq),
      multiplier: multiplier
    };
  }, [calculator]);

  const saveCalculation = () => {
    const calculation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      inputs: { ...calculator },
      results: { ...metrics },
      name: `Calculation ${savedCalculations.length + 1}`
    };
    
    const updated = [calculation, ...savedCalculations.slice(0, 4)];
    setSavedCalculations(updated);
    localStorage.setItem('moqhubs_calculations', JSON.stringify(updated));
  };

  const loadCalculation = (calc: any) => {
    setCalculator(calc.inputs);
  };

  const deleteCalculation = (id: number) => {
    const updated = savedCalculations.filter(calc => calc.id !== id);
    setSavedCalculations(updated);
    localStorage.setItem('moqhubs_calculations', JSON.stringify(updated));
  };

  const resetCalculator = () => {
    setCalculator({
      buyingPrice: 5000,
      retailPrice: 10000,
      quantity: 10,
      weightPerUnit: 0.5,
      shippingMethod: 'air',
      platformFee: 3,
      localDelivery: 1500,
      nairaToYuan: 210
    });
  };

  const shareCalculation = () => {
    const text = `MOQHUBS Import Profit Calculation:
    
Product Details:
Buying Price: ${formatCurrency(calculator.buyingPrice)} per unit
Retail Price: ${formatCurrency(calculator.retailPrice)} per unit
Quantity: ${calculator.quantity} units
Weight: ${calculator.weightPerUnit} kg per unit

Shipping Method: ${calculator.shippingMethod === 'sea' ? 'Sea Shipping' : 'Air Freight'}
Shipping Cost: ${formatCurrency(metrics.freightCost)} (Freight) + ${formatCurrency(metrics.customsCost)} (Customs)

Total Costs: ${formatCurrency(metrics.totalCost)}
Total Revenue: ${formatCurrency(metrics.totalRevenue)}
Platform Fee: ${formatCurrency(metrics.platformFeeAmount)}
Local Delivery: ${formatCurrency(metrics.localDeliveryCost)}

💰 NET PROFIT: ${formatCurrency(metrics.netProfit)}
📈 Profit Margin: ${metrics.profitMargin}%

Try the calculator at MOQHUBS!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'MOQHUBS Import Profit Calculator',
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Calculation copied to clipboard!');
    }
  };

  const applyExample = (example: ProductExample) => {
    const buyingPriceNGN = example.buyingPrice * calculator.nairaToYuan;
    
    setCalculator(prev => ({
      ...prev,
      buyingPrice: Math.round(buyingPriceNGN),
      retailPrice: example.retailPrice,
      quantity: example.moq,
      weightPerUnit: example.weight
    }));
  };

  const mobileMenuLinks = [
    { href: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
    { href: "/bulky-deals", label: "Deals", icon: <ShoppingBag className="w-5 h-5" /> },
    { href: "/about", label: "About", icon: <Users className="w-5 h-5" /> },
    { href: "/terms", label: "Terms", icon: <Shield className="w-5 h-5" /> },
    { href: "/auth", label: user ? "Dashboard" : "Login", icon: user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans pb-20 safe-area-bottom">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">MOQHUBS</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/auth"
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              aria-label={user ? "Dashboard" : "Login"}
            >
              {user ? (
                <>
                  <User className="w-5 h-5 text-gray-600" />
                  {!isMobile && <span className="text-sm font-medium">Dashboard</span>}
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 text-gray-600" />
                  {!isMobile && <span className="text-sm font-medium">Login</span>}
                </>
              )}
            </Link>
            
            <Link href="/" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
        </div>

        {showMobileMenu && isMobile && (
          <div 
            ref={mobileMenuRef}
            className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 mt-2 p-4"
          >
            <div className="space-y-2">
              {mobileMenuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-gray-700"
                >
                  {link.icon}
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              
              {user && (
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-gray-700 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">🇨🇳 → 🇳🇬 Import Calculator</h2>
          <p className="text-gray-600 mt-1">Accurate China-to-Nigeria profit calculations</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {showExplanation && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-blue-800 mb-1">How This Calculator Works</h3>
                  <p className="text-blue-700 text-sm">
                    This calculator uses <strong>real shipping rates</strong> from China to Nigeria:
                    <br />
                    • <strong>Sea Shipping:</strong> ₦1,550/kg (Freight) + ₦650/kg (Customs) = ₦2,200/kg total
                    <br />
                    • <strong>Air Freight:</strong> ₦10,586.5/kg (Freight) + ₦1,250/kg (Customs) = ₦11,836.5/kg total
                    <br />
                    • All calculations include platform fees and local Nigerian delivery costs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExplanation(false)}
                className="p-1 hover:bg-blue-200 rounded-lg"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        )}

        <div className="flex overflow-x-auto mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'calculator' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calculator className="w-5 h-5" />
            Calculator
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'examples' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            Real Examples
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'breakdown' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PieChart className="w-5 h-5" />
            Cost Breakdown
          </button>
        </div>

        {activeTab === 'calculator' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Package className="w-6 h-6 text-orange-500" />
                  Product Details
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buying Price per Unit (₦)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₦</span>
                        <input
                          type="number"
                          value={calculator.buyingPrice}
                          onChange={(e) => setCalculator({...calculator, buyingPrice: Number(e.target.value)})}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Retail Price per Unit (₦)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₦</span>
                        <input
                          type="number"
                          value={calculator.retailPrice}
                          onChange={(e) => setCalculator({...calculator, retailPrice: Number(e.target.value)})}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity (Units)
                      </label>
                      <input
                        type="number"
                        value={calculator.quantity}
                        onChange={(e) => setCalculator({...calculator, quantity: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight per Unit (kg)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={calculator.weightPerUnit}
                          onChange={(e) => setCalculator({...calculator, weightPerUnit: Number(e.target.value)})}
                          className="w-full px-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          min="0.01"
                          step="0.01"
                        />
                        <div className="absolute right-3 top-3 text-gray-500">kg</div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Total Weight: {metrics.totalWeight} kg
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Method
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setCalculator({...calculator, shippingMethod: 'sea'})}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                            calculator.shippingMethod === 'sea'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          <Ship className="w-5 h-5" />
                          Sea
                        </button>
                        <button
                          onClick={() => setCalculator({...calculator, shippingMethod: 'air'})}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                            calculator.shippingMethod === 'air'
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                          }`}
                        >
                          <Plane className="w-5 h-5" />
                          Air
                        </button>
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {calculator.shippingMethod === 'sea' 
                          ? '₦1,550/kg freight + ₦650/kg customs = ₦2,200/kg total'
                          : '₦10,586.5/kg freight + ₦1,250/kg customs = ₦11,836.5/kg total'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                  Additional Costs
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Fee (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={calculator.platformFee}
                        onChange={(e) => setCalculator({...calculator, platformFee: Number(e.target.value)})}
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <div className="absolute right-3 top-3 text-gray-500">%</div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatCurrency(metrics.platformFeeAmount)} total
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local Delivery (₦/unit)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">₦</span>
                      <input
                        type="number"
                        value={calculator.localDelivery}
                        onChange={(e) => setCalculator({...calculator, localDelivery: Number(e.target.value)})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        min="0"
                      />
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatCurrency(metrics.localDeliveryCost)} total
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exchange Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">₦</span>
                      <input
                        type="number"
                        value={calculator.nairaToYuan}
                        onChange={(e) => setCalculator({...calculator, nairaToYuan: Number(e.target.value)})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        min="1"
                        step="1"
                      />
                      <div className="absolute right-3 top-3 text-gray-500">= 1 CNY</div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Current: ₦{calculator.nairaToYuan} = ¥1
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-xl font-bold mb-6">Profit Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-white/90">Net Profit</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{formatCurrency(metrics.netProfit)}</div>
                      <div className="text-sm text-white/80">{metrics.profitMargin}% margin</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/90">ROI</span>
                    <div className="text-2xl font-bold">{metrics.roi}%</div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/90">Break-even</span>
                    <div className="text-xl font-bold">{metrics.breakevenQuantity} units</div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/90">Unit Profit</span>
                    <div className="text-xl font-bold">{formatCurrency(metrics.unitProfit)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Breakdown</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Factory Cost</span>
                    <span className="font-bold">{formatCurrency(metrics.productCost)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping Freight</span>
                    <span className="font-bold text-blue-600">{formatCurrency(metrics.freightCost)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Customs Clearance</span>
                    <span className="font-bold text-blue-600">{formatCurrency(metrics.customsCost)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Total Shipping</span>
                    <span className="font-bold text-blue-600">{formatCurrency(metrics.totalShippingCost)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-bold text-purple-600">{formatCurrency(metrics.platformFeeAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Local Delivery</span>
                    <span className="font-bold text-green-600">{formatCurrency(metrics.localDeliveryCost)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 font-bold text-lg">
                    <span className="text-gray-900">Total Cost</span>
                    <span className="text-gray-900">{formatCurrency(metrics.totalCost)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={saveCalculation}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                  >
                    <Save className="w-5 h-5" />
                    Save
                  </button>
                  <button
                    onClick={resetCalculator}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all shadow-md"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reset
                  </button>
                  <button
                    onClick={shareCalculation}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-md col-span-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Share Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-green-500" />
                Real Products from China (1688/Alibaba)
              </h3>
              
              <div className="space-y-4">
                {productExamples.map((example) => {
                  const calculation = calculateExample(example);
                  
                  return (
                    <div key={example.id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg text-gray-900">{example.name}</h4>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              {example.category}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{example.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">Source: {example.source}</span>
                            <span className="text-gray-500">MOQ: {example.moq} units</span>
                          </div>
                        </div>
                        <button
                          onClick={() => applyExample(example)}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold hover:from-orange-600 hover:to-orange-700 transition-all"
                        >
                          Use This
                        </button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-xl p-4">
                          <div className="text-sm text-blue-600 font-medium mb-1">China Price (CNY)</div>
                          <div className="text-xl font-bold text-blue-700">¥{example.buyingPrice}</div>
                          <div className="text-sm text-blue-500 mt-1">
                            ≈ {formatCurrency(calculation.buyingPriceNGN)} NGN
                          </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-xl p-4">
                          <div className="text-sm text-green-600 font-medium mb-1">Nigeria Price (NGN)</div>
                          <div className="text-xl font-bold text-green-700">{formatCurrency(example.retailPrice)}</div>
                          <div className="text-sm text-green-500 mt-1">Per unit retail price</div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center">
                            <div className="text-sm text-gray-500">Total Profit</div>
                            <div className={`text-lg font-bold ${calculation.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(calculation.netProfit)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-500">Margin</div>
                            <div className="text-lg font-bold">{calculation.profitMargin}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-500">Shipping Cost</div>
                            <div className="text-lg font-bold">{formatCurrency(calculation.totalShippingCost)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-500">Total Weight</div>
                            <div className="text-lg font-bold">{calculation.totalWeight} kg</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-500 mb-2">Cost Breakdown for {example.moq} units:</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-gray-100 p-2 rounded">
                            <div>Products: {formatCurrency(calculation.productCost)}</div>
                          </div>
                          <div className="bg-blue-100 p-2 rounded">
                            <div>Shipping: {formatCurrency(calculation.freightCost)}</div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded">
                            <div>Customs: {formatCurrency(calculation.customsCost)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Ship className="w-6 h-6" />
                Shipping Cost Comparison
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Ship className="w-8 h-8" />
                    <div>
                      <h4 className="font-bold text-lg">Sea Shipping</h4>
                      <div className="text-white/80">4-8 weeks delivery</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Freight Cost:</span>
                      <span className="font-bold">₦1,550/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customs Clearance:</span>
                      <span className="font-bold">₦650/kg</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/30">
                      <span>Total per kg:</span>
                      <span className="font-bold text-xl">₦2,200/kg</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-white/80">
                    Best for: Heavy items, non-urgent shipments, large quantities
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Plane className="w-8 h-8" />
                    <div>
                      <h4 className="font-bold text-lg">Air Freight</h4>
                      <div className="text-white/80">1-3 weeks delivery</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Freight Cost:</span>
                      <span className="font-bold">₦10,586.5/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customs Clearance:</span>
                      <span className="font-bold">₦1,250/kg</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/30">
                      <span>Total per kg:</span>
                      <span className="font-bold text-xl">₦11,836.5/kg</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-white/80">
                    Best for: Light items, urgent shipments, high-value goods
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <div className="font-bold">Important Note:</div>
                </div>
                <p className="text-white/90 text-sm">
                  These are <strong>real shipping rates</strong> from China to Nigeria as of 2024. 
                  Sea shipping is 5.4x cheaper per kg than air freight. Always consider the 
                  weight-to-value ratio when choosing shipping method.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="space-y-6">
            {savedCalculations.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-500" />
                  Saved Calculations
                </h3>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCalculations.map((calc, index) => (
                    <div key={calc.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-gray-900">{calc.name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(calc.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {calc.inputs.quantity} units × {calc.inputs.weightPerUnit}kg
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCalculation(calc.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Profit</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(calc.results.netProfit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Margin</span>
                          <span className="font-bold">{calc.results.profitMargin}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Shipping</span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(calc.results.totalShippingCost)}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => loadCalculation(calc)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg font-bold hover:from-orange-600 hover:to-orange-700 transition-all"
                      >
                        Load This
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-purple-500" />
                Step-by-Step Calculation Guide
              </h3>
              
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-blue-600">1</span>
                    </div>
                    <h4 className="font-bold text-blue-800">Calculate Product Cost</h4>
                  </div>
                  <div className="ml-11">
                    <p className="text-blue-700 mb-2">
                      <strong>Formula:</strong> Buying Price × Quantity
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <code className="text-blue-600">
                        ₦{calculator.buyingPrice} × {calculator.quantity} = {formatCurrency(metrics.productCost)}
                      </code>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-green-600">2</span>
                    </div>
                    <h4 className="font-bold text-green-800">Calculate Shipping Cost</h4>
                  </div>
                  <div className="ml-11">
                    <p className="text-green-700 mb-2">
                      <strong>Formula:</strong> (Freight Rate + Customs Rate) × Total Weight
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <code className="text-green-600">
                        ({SHIPPING_RATES[calculator.shippingMethod].freight} + {SHIPPING_RATES[calculator.shippingMethod].customs}) × 
                        ({calculator.weightPerUnit} × {calculator.quantity}) = 
                        {formatCurrency(metrics.totalShippingCost)}
                      </code>
                      <div className="text-sm text-green-500 mt-1">
                        Freight: {formatCurrency(metrics.freightCost)} + Customs: {formatCurrency(metrics.customsCost)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-purple-600">3</span>
                    </div>
                    <h4 className="font-bold text-purple-800">Calculate Additional Costs</h4>
                  </div>
                  <div className="ml-11">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="text-sm text-purple-600 font-medium">Platform Fee</div>
                        <code className="text-purple-600">
                          {calculator.platformFee}% × {formatCurrency(metrics.totalRevenue)} = {formatCurrency(metrics.platformFeeAmount)}
                        </code>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="text-sm text-purple-600 font-medium">Local Delivery</div>
                        <code className="text-purple-600">
                          ₦{calculator.localDelivery} × {calculator.quantity} = {formatCurrency(metrics.localDeliveryCost)}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-orange-600">4</span>
                    </div>
                    <h4 className="font-bold text-orange-800">Calculate Final Profit</h4>
                  </div>
                  <div className="ml-11">
                    <p className="text-orange-700 mb-2">
                      <strong>Formula:</strong> Total Revenue - Total Costs
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                      <code className="text-orange-600">
                        {formatCurrency(metrics.totalRevenue)} - {formatCurrency(metrics.totalCost)} = {formatCurrency(metrics.netProfit)}
                      </code>
                    </div>
                    <div className="mt-2 text-sm text-orange-600">
                      Profit Margin: ({formatCurrency(metrics.netProfit)} ÷ {formatCurrency(metrics.totalCost)}) × 100 = {metrics.profitMargin}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Pro Import Tips
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Weight Optimization</h4>
                      <p className="text-white/90 text-sm">
                        Reduce packaging weight. Every 0.1kg saved on 100 units saves ₦11,837 on air freight.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Sea vs Air Decision</h4>
                      <p className="text-white/90 text-sm">
                        Use sea for items where shipping cost is {'>'} 30% of product value. 
                        Use air for high-margin or urgent items.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Bulk Purchasing</h4>
                      <p className="text-white/90 text-sm">
                        Negotiate better prices at higher MOQs. The price per unit often drops 
                        significantly at quantity breakpoints.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Group Buying</h4>
                      <p className="text-white/90 text-sm">
                        Use MOQHUBS to join forces with others. Meet MOQs and share shipping 
                        costs to maximize profits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around py-3 safe-area-bottom shadow-lg z-50 backdrop-blur-lg bg-white/95">
        <Link href="/" className="flex flex-col items-center text-gray-600 hover:text-orange-600 transition-colors">
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium mt-1">Home</span>
        </Link>
        <Link href="/bulky-deals" className="flex flex-col items-center text-gray-600 hover:text-orange-600 transition-colors">
          <ShoppingBag className="w-6 h-6" />
          <span className="text-xs font-medium mt-1">Deals</span>
        </Link>
        <div className="flex flex-col items-center text-orange-600">
          <Calculator className="w-6 h-6" />
          <span className="text-xs font-bold mt-1">Calc</span>
        </div>
        <Link href="/auth" className="flex flex-col items-center text-gray-600 hover:text-orange-600 transition-colors">
          <User className="w-6 h-6" />
          <span className="text-xs font-medium mt-1">{user ? "Dashboard" : "Login"}</span>
        </Link>
      </nav>
    </div>
  );
}