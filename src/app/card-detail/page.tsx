"use client";

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingCart, Users, Shield, FileText, Truck,
  Calendar, Clock, CheckCircle, AlertCircle, Star, Share2,
  Heart, ExternalLink, Timer, TrendingUp, DollarSign, Ship,
  Target, UsersRound, CircleDollarSign, AlertTriangle, Verified,
  Camera, ChevronUp, ChevronDown, MessageSquare, Lock, Zap,
  Package, Percent, BarChart, Eye, HelpCircle, ShoppingBag,
  Globe, MapPin, CreditCard, FileCheck, Info, ChevronRight,
  Wallet, LogIn, User, Link, Globe as GlobeIcon, Tag, TrendingDown,
  DollarSign as Dollar, PackageCheck, ChevronLeft, Loader2,
  Check, Box, Zap as Bolt, ShieldCheck, Truck as TruckIcon,
  Briefcase, Store, BadgeCheck, Gift,
  Layers, TrendingUp as TrendingUpIcon, ShoppingBag as Bag,
  Truck as TruckFast, Shield as ShieldIcon, CreditCard as Card,
  Globe as GlobeEarth, FileText as File, Users as UsersIcon,
  BarChart as Chart, HelpCircle as Help, Info as InfoIcon,
  Award, Crown,
  Target as TargetIcon, PieChart, Percent as PercentIcon,
  Package as PackageIcon, AlertOctagon, Star as StarIcon,
  Hash, Download, Upload, RefreshCw, RotateCcw,
  Calendar as CalendarIcon, Clock as ClockIcon, Map,
  Cloud, Database, Server, Code, Terminal,
  Coffee, Home, Building, Factory,
  Car, Bike, Plane, Train, Ship as ShipIcon,
  Music, Film, Book, Newspaper,
  ShoppingCart as Cart, CreditCard as CreditCardIcon,
  Banknote, Coins, Bitcoin, WalletCards, Receipt,
  Ticket, Tag as TagIcon, PercentCircle, TrendingDown as TrendingDownIcon
} from "lucide-react";
import {
  doc, getDoc, updateDoc, increment, runTransaction, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import Image from "next/image";

// ==================== OPTIMIZED COMPONENTS ====================

function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white animate-pulse">
      <div className="p-4">
        <div className="h-12 bg-gray-200 rounded-xl mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-xl mb-4"></div>
        <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-20 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

function AuthPrompt({ onLogin, onClose }: { onLogin: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Join Bulk Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sign in to join this bulk order and access exclusive wholesale pricing
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
            >
              <LogIn className="w-5 h-5" />
              Sign In to Continue
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-600 mb-2">Benefits of signing in:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  <span>Join bulk orders</span>
                </div>
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  <span>Access wallet</span>
                </div>
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  <span>Track orders</span>
                </div>
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  <span>Save favorites</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-800 font-bold rounded-lg hover:bg-gray-50"
            >
              Continue Browsing
            </button>
            <button
              onClick={() => window.location.href = '/auth?tab=register'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  currentBalance,
  isProcessing
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalAmount: number;
  currentBalance: number;
  isProcessing: boolean;
}) {
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const insufficientAmount = totalAmount - currentBalance;

  useEffect(() => {
    setShowInsufficientFunds(currentBalance < totalAmount);
  }, [currentBalance, totalAmount]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-orange-600" />
            Wallet Payment
          </h3>

          <div className="bg-gray-100 p-4 rounded-xl mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-700">Your Balance</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(currentBalance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Required Amount</span>
              <span className="text-lg font-bold text-orange-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {showInsufficientFunds && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800">Insufficient Balance</p>
                  <p className="text-sm text-red-700 mt-1">
                    You need additional {formatCurrency(insufficientAmount)} to complete this order.
                  </p>
                  <button
                    onClick={() => window.location.href = '/auth'}
                    className="mt-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Add Funds to Wallet
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Order Amount</span>
              <span className="font-bold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Payment Method</span>
              <span className="font-bold text-green-600">Wallet Balance</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-700">New Balance After Payment</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(Math.max(0, currentBalance - totalAmount))}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-800 font-bold rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={showInsufficientFunds || isProcessing}
              className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all ${
                showInsufficientFunds || isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                'Confirm Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VariationQuantityInput({
  variant,
  quantity,
  onChange,
  disabled = false
}: {
  variant: ProductVariant;
  quantity: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, quantity - 1))}
        disabled={quantity <= 0 || disabled}
        className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-lg font-bold text-gray-800">-</span>
      </button>
      
      <div className="w-16 text-center">
        <input
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          disabled={disabled}
          className="w-full text-center bg-white border border-gray-300 rounded-lg py-1.5 text-sm font-bold"
        />
        <div className="text-xs text-gray-600 mt-0.5">units</div>
      </div>
      
      <button
        onClick={() => onChange(quantity + 1)}
        disabled={disabled}
        className="w-8 h-8 flex items-center justify-center bg-orange-100 border border-orange-300 rounded-lg hover:bg-orange-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-lg font-bold text-orange-800">+</span>
      </button>
    </div>
  );
}

function QuickFacts({ title, value, icon: Icon, color, description }: {
  title: string;
  value: string;
  icon: any;
  color: string;
  description?: string;
}) {
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-300 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-600">{title}</div>
          <div className="text-sm font-bold text-gray-900">{value}</div>
          {description && (
            <div className="text-xs text-gray-500 mt-0.5">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketPriceCard({ market }: { market: ExternalMarketPrice }) {
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  return (
    <a
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white hover:bg-gray-50 p-3 rounded-xl border border-gray-300 transition-all active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-900">{market.platform}</span>
            {market.verified && (
              <span className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                <Verified className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-700">
            {market.rating && (
              <>
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{market.rating}/5</span>
              </>
            )}
            {market.reviews && market.reviews > 0 && (
              <>
                <span className="text-gray-500">•</span>
                <span>{market.reviews} reviews</span>
              </>
            )}
            {market.shipping && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-green-700 font-medium">{market.shipping}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-red-600">{formatCurrency(market.price)}</div>
          <div className="flex items-center gap-1 text-xs text-blue-700 justify-end font-medium">
            <ExternalLink className="w-3 h-3" />
            <span>View</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function ProgressIndicator({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="text-white">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-bold">{percentage.toFixed(0)}%</span>
      </div>

      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs mt-1 opacity-90">
        <span>{current} units</span>
        <span>{total} units required</span>
      </div>
    </div>
  );
}

// ==================== INTERFACES ====================

interface ExternalMarketPrice {
  platform: string;
  price: number;
  rating?: number;
  reviews?: number;
  url: string;
  verified?: boolean;
  shipping?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface Timeline {
  stage: string;
  days: string;
  icon: string;
}

interface TrustBadge {
  icon: string;
  text: string;
  color: string;
}

interface Update {
  title: string;
  description: string;
  date: string;
}

interface Specifications {
  batteryCapacity?: string;
  bladeSize?: string;
  chargingTime?: string;
  heightAdjustment?: string;
  ledDisplay?: string;
  material?: string;
  remoteControl?: string;
  runTime?: string;
  speeds?: string;
  warranty?: string;
  [key: string]: string | undefined;
}

interface ProductVariant {
  id: string;
  type: string;
  name: string;
  sku?: string;
  buyingPrice?: number;
  buyingPriceYuan?: number;
  buyingPriceUSD?: number;
  weight?: number;
  images?: string[];
  specifications?: Record<string, string>;
}

interface VariantType {
  name: string;
  options: string[];
  required: boolean;
}

interface BulkDeal {
  id: string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  origin: string;
  targetMarket: string;
  status: string;
  published: boolean;
  approved: boolean;
  verified: boolean;
  trending: boolean;
  urgency: boolean;
  daysLeft: number;
  buyingPrice: number;
  retailPrice: number;
  recommendedPrice: number;
  marketPriceRange: string;
  estimatedProfitPerUnit: number;
  profitMargin: number;
  landedCostPerUnit: number;
  logisticsPerUnit: number;
  platformFee: number;
  escrowAmount: number;
  escrowParticipants: number;
  commitmentFeeAmount: number;
  commitmentFeePaid: boolean;
  buyingPriceYuan?: number;
  buyingPriceUSD?: number;
  exchangeRateYuanToNaira?: number;
  exchangeRateUSDToNaira?: number;
  productSourceUrl?: string;
  whatsappGroupLink?: string;
  shippingMethod: string;
  shipping: string;
  shippingCost: number;
  estimatedShippingDays: number;
  weightPerUnit: number;
  airFreightPerKg?: number;
  seaFreightPerKg: number;
  landFreightPerKg?: number;
  customsPerKg: number;
  estimatedProcurementDate?: string;
  estimatedNigeriaArrivalDate?: string;
  moq: number;
  currentOrders: number;
  hasVariants?: boolean;
  variantTypes?: VariantType[];
  variants?: ProductVariant[];
  images: string[];
  demoImages?: string[];
  externalMarketPrices: ExternalMarketPrice[];
  features: string[];
  specifications: Specifications;
  faqs: FAQ[];
  timeline: Timeline[];
  trustBadges: TrustBadge[];
  updates: Update[];
  favorites: number;
  shares: number;
  views: number;
  uploaderName: string;
  uploaderCompany?: string;
  uploaderEmail?: string;
  uploaderPhone?: string;
  uploaderWhatsApp?: string;
  uploaderJoinDate: string;
  uploaderCompletedDeals: number;
  uploaderSuccessRate: number;
  supplier: string;
  supplierRating: number;
  supplierReviews: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface UserData {
  uid: string;
  fullName: string;
  businessName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  role: string;
  status: string;
  accountBalance: number;
  totalAmountInvested: number;
  totalDealsJoined: number;
  successRate: number;
  preferences: {
    categories: string[];
    minInvestment: number;
    maxInvestment: number;
  };
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VariantQuantity {
  [variantId: string]: number;
}

// ==================== CURRENCY UTILS ====================

const useCurrencyFormatters = () => {
  const formatYuan = useCallback((amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) return "¥0.00";
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  const formatUSD = useCallback((amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  return { formatYuan, formatUSD, formatCurrency };
};

// ==================== MAIN COMPONENT ====================

function CardDetailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cardId = searchParams.get("id");

  // ALL HOOKS AT THE TOP - NO CONDITIONAL HOOKS
  const [card, setCard] = useState<BulkDeal | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const touchStartX = useRef(0);
  const [showFAQ, setShowFAQ] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [variantQuantities, setVariantQuantities] = useState<VariantQuantity>({});
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pricing' | 'overview' | 'market' | 'shipping' | 'supplier' | 'variants' | 'updates' | 'faq'>('pricing');

  // Currency formatters - MOVE THESE BEFORE ANY CONDITIONAL LOGIC
  const { formatYuan, formatUSD, formatCurrency } = useCurrencyFormatters();

  // ==================== USE EFFECTS ====================

  // Check authentication
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = {
              uid: firebaseUser.uid,
              ...userDoc.data()
            } as UserData;
            setUser(userData);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch card data
  useEffect(() => {
    const fetchCard = async () => {
      if (!cardId) {
        router.push('/');
        return;
      }

      try {
        const docRef = doc(db, "bulk_deals", cardId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const bulkDeal = {
            id: docSnap.id,
            ...data
          } as BulkDeal;
          setCard(bulkDeal);

          // Initialize variant quantities
          if (bulkDeal.hasVariants && bulkDeal.variants && bulkDeal.variants.length > 0) {
            const initialQuantities: VariantQuantity = {};
            bulkDeal.variants.forEach(variant => {
              initialQuantities[variant.id] = 0;
            });
            setVariantQuantities(initialQuantities);
            
            if (bulkDeal.variants.length > 0) {
              setSelectedVariants([bulkDeal.variants[0].id]);
              setVariantQuantities(prev => ({
                ...prev,
                [bulkDeal.variants![0].id]: 1
              }));
            }
          }

          // Increment view count
          await updateDoc(docRef, {
            views: increment(1)
          });
        } else {
          router.push('/bulky-cards');
        }
      } catch (err) {
        console.error('Error fetching card:', err);
        setError('Failed to load deal. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [cardId, router]);

  // ==================== CALCULATIONS ====================

  // Calculate freight cost
  const calculateFreightCost = useCallback(() => {
    if (!card) return 0;
    if (card.shippingMethod === 'air' && card.airFreightPerKg) {
      return card.weightPerUnit * card.airFreightPerKg;
    } else if (card.shippingMethod === 'sea') {
      return card.weightPerUnit * card.seaFreightPerKg;
    } else if (card.shippingMethod === 'land' && card.landFreightPerKg) {
      return card.weightPerUnit * card.landFreightPerKg;
    }
    return 0;
  }, [card]);

  // Calculate customs cost
  const calculateCustomsCost = useCallback(() => {
    if (!card) return 0;
    return card.weightPerUnit * card.customsPerKg;
  }, [card]);

  // Get freight rate
  const getFreightRate = useCallback(() => {
    if (card?.shippingMethod === 'air' && card.airFreightPerKg) {
      return card.airFreightPerKg;
    } else if (card?.shippingMethod === 'sea') {
      return card.seaFreightPerKg;
    } else if (card?.shippingMethod === 'land' && card.landFreightPerKg) {
      return card.landFreightPerKg;
    }
    return 0;
  }, [card]);

  // Calculate external market stats - FIXED: moved before any conditional returns
  const calculateExternalMarketStats = useCallback(() => {
    if (!card?.externalMarketPrices || card.externalMarketPrices.length === 0) {
      return { cheapest: 0, highest: 0, average: 0 };
    }
    const validPrices = card.externalMarketPrices.filter(p => p.price > 0);
    if (validPrices.length === 0) return { cheapest: 0, highest: 0, average: 0 };
    const prices = validPrices.map(p => p.price);
    return {
      cheapest: Math.min(...prices),
      highest: Math.max(...prices),
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    };
  }, [card]);

  // Calculate price verification
  const calculatePriceVerification = useCallback(() => {
    if (card?.buyingPriceYuan && card.exchangeRateYuanToNaira) {
      const calculatedNaira = card.buyingPriceYuan * card.exchangeRateYuanToNaira;
      const difference = Math.abs(card.buyingPrice - calculatedNaira);
      const percentageDiff = (difference / card.buyingPrice) * 100;
      return {
        originalYuan: card.buyingPriceYuan,
        calculatedNaira,
        difference,
        percentageDiff,
        isAccurate: percentageDiff < 5
      };
    }
    return null;
  }, [card]);

  // ==================== MEMOIZED VALUES ====================

  const freightCost = useMemo(() => calculateFreightCost(), [calculateFreightCost]);
  const customsCost = useMemo(() => calculateCustomsCost(), [calculateCustomsCost]);
  const totalLogisticsPerUnit = useMemo(() => freightCost + customsCost, [freightCost, customsCost]);
  
  const totalQuantity = useMemo(() => card?.hasVariants 
    ? Object.values(variantQuantities).reduce((sum, qty) => sum + qty, 0)
    : 0, [card?.hasVariants, variantQuantities]);

  const isMOQReached = useMemo(() => card ? card.currentOrders >= card.moq : false, [card]);
  const isMOQFull = useMemo(() => card ? card.currentOrders >= card.moq : false, [card]);
  const progressPercentage = useMemo(() => card ? Math.min((card.currentOrders / card.moq) * 100, 100) : 0, [card]);
  const ordersNeeded = useMemo(() => card ? Math.max(0, card.moq - card.currentOrders) : 0, [card]);

  const getTotalProductCost = useCallback(() => {
    if (!card) return 0;
    if (card.hasVariants && card.variants) {
      return card.variants.reduce((total, variant) => {
        const variantPrice = card.buyingPrice || (variant.buyingPrice || 0);
        const variantQuantity = variantQuantities[variant.id] || 0; 
        return total + (variantPrice * variantQuantity);
      }, 0);
    }
    return 0;
  }, [card, variantQuantities]);

  const getSelectedVariantPrice = useCallback(() => {
    if (!card?.variants || selectedVariants.length === 0) {
      return card?.buyingPrice || 0;
    }
    const selectedVariantPrices = selectedVariants.map(variantId => {
      const variant = card.variants?.find(v => v.id === variantId);
      return variant?.buyingPrice || card.buyingPrice;
    });
    return selectedVariantPrices.reduce((sum, price) => sum + price, 0) / selectedVariantPrices.length;
  }, [card, selectedVariants]);

  const getFirstSelectedVariant = useCallback(() => {
    if (!card?.variants || selectedVariants.length === 0) return null;
    return card.variants.find(v => v.id === selectedVariants[0]);
  }, [card?.variants, selectedVariants]);

  const calculateFinalLandedCostPerUnit = useCallback(() => {
    if (!card) return 0;
    if (card.hasVariants && card.variants) {
      if (selectedVariants.length === 0) {
        const firstVariant = card.variants[0];
        if (firstVariant) {
          const unitProductCost = firstVariant.buyingPrice || card.buyingPrice;
          const unitLogisticsCost = totalLogisticsPerUnit;
          const unitPlatformFee = (unitProductCost + unitLogisticsCost) * (card.platformFee || 0.03) / 100;
          return unitProductCost + unitLogisticsCost + unitPlatformFee;
        }
      }
      const selectedVariant = getFirstSelectedVariant();
      if (selectedVariant) {
        const unitProductCost = selectedVariant.buyingPrice || card.buyingPrice;
        const unitLogisticsCost = totalLogisticsPerUnit;
        const unitPlatformFee = (unitProductCost + unitLogisticsCost) * (card.platformFee || 0.03) / 100;
        return unitProductCost + unitLogisticsCost + unitPlatformFee;
      }
    }
    const unitProductCost = card.buyingPrice;
    const unitLogisticsCost = totalLogisticsPerUnit;
    const unitPlatformFee = (unitProductCost + unitLogisticsCost) * (card.platformFee || 0.03) / 100;
    return unitProductCost + unitLogisticsCost + unitPlatformFee;
  }, [card, totalLogisticsPerUnit, getFirstSelectedVariant, selectedVariants]);

  const finalLandedCostPerUnit = useMemo(() => calculateFinalLandedCostPerUnit(), [calculateFinalLandedCostPerUnit]);
  const productCost = useMemo(() => getTotalProductCost(), [getTotalProductCost]);
  const logisticsCost = useMemo(() => totalLogisticsPerUnit * totalQuantity, [totalLogisticsPerUnit, totalQuantity]);
  const subtotal = useMemo(() => productCost + logisticsCost, [productCost, logisticsCost]);
  const platformFeeAmount = useMemo(() => subtotal * (card?.platformFee || 0.03) / 100, [subtotal, card?.platformFee]);
  const totalPayable = useMemo(() => subtotal + platformFeeAmount, [subtotal, platformFeeAmount]);
  const estimatedRevenue = useMemo(() => card ? (card.recommendedPrice * totalQuantity) : 0, [card, totalQuantity]);
  const estimatedProfit = useMemo(() => estimatedRevenue - totalPayable, [estimatedRevenue, totalPayable]);
  const profitMarginPercentage = useMemo(() => totalPayable > 0 ? ((estimatedProfit / totalPayable) * 100).toFixed(1) : "0", [estimatedProfit, totalPayable]);
  const hasSufficientBalance = useMemo(() => user ? user.accountBalance >= totalPayable : false, [user, totalPayable]);
  const hasVariantQuantities = useMemo(() => card?.hasVariants 
    ? Object.values(variantQuantities).some(qty => qty > 0)
    : false, [card?.hasVariants, variantQuantities]);
  const meetsMinimumQuantity = useMemo(() => totalQuantity >= 3, [totalQuantity]);
  const hasSelectedVariant = useMemo(() => selectedVariants.length > 0, [selectedVariants]);
  
  // Calculate stats that depend on card
  const externalStats = useMemo(() => calculateExternalMarketStats(), [calculateExternalMarketStats]);
  const priceVerification = useMemo(() => calculatePriceVerification(), [calculatePriceVerification]);
  const actualLandedCost = useMemo(() => card?.landedCostPerUnit || (getSelectedVariantPrice() + totalLogisticsPerUnit), [card?.landedCostPerUnit, getSelectedVariantPrice, totalLogisticsPerUnit]);

  // ==================== EVENT HANDLERS ====================

  const updateVariantQuantity = useCallback((variantId: string, quantity: number) => {
    setVariantQuantities(prev => ({
      ...prev,
      [variantId]: quantity
    }));
    if (quantity === 0) {
      setSelectedVariants(prev => prev.filter(id => id !== variantId));
    } else if (quantity > 0 && !selectedVariants.includes(variantId)) {
      setSelectedVariants(prev => [...prev, variantId]);
    }
  }, [selectedVariants]);

  const toggleVariantSelection = useCallback((variantId: string) => {
    setSelectedVariants(prev => {
      if (prev.includes(variantId)) {
        setVariantQuantities(prevQty => ({
          ...prevQty,
          [variantId]: 0
        }));
        return prev.filter(id => id !== variantId);
      } else {
        setVariantQuantities(prevQty => ({
          ...prevQty,
          [variantId]: 1
        }));
        return [...prev, variantId];
      }
    });
  }, []);

  const processPaymentAndJoinOrder = useCallback(async () => {
    if (!card || !user) return;

    if (isMOQFull) {
      alert("⚠️ This deal is now closed! MOQ has been reached. Join the waitlist for next batch.");
      return;
    }

    if (card.hasVariants) {
      if (!hasSelectedVariant) {
        alert("Please select at least one variant before proceeding.");
        return;
      }
      if (!hasVariantQuantities) {
        alert("Please select quantities for at least one variant before proceeding.");
        return;
      }
      if (!meetsMinimumQuantity) {
        alert("Minimum order is 3 units total for bulk purchases. Increase quantity.");
        return;
      }
    } else {
      if (totalQuantity < 3) {
        alert("Minimum order is 3 units for bulk purchases. Increase quantity.");
        return;
      }
    }

    if (!hasSufficientBalance) {
      setShowPaymentModal(true);
      return;
    }

    setPaymentProcessing(true);

    try {
      await runTransaction(db, async (transaction) => {
        const dealRef = doc(db, "bulk_deals", card.id);
        const userRef = doc(db, "users", user.uid);

        const dealDoc = await transaction.get(dealRef);
        const userDoc = await transaction.get(userRef);

        if (!dealDoc.exists() || !userDoc.exists()) {
          throw new Error("Document not found");
        }

        const currentUserData = userDoc.data() as UserData;
        const currentDealData = dealDoc.data() as BulkDeal;

        if (currentDealData.currentOrders >= currentDealData.moq) {
          throw new Error("Deal is now closed! MOQ has been reached. Join the waitlist for next batch.");
        }

        if (currentUserData.accountBalance < totalPayable) {
          throw new Error("Insufficient balance");
        }

        transaction.update(userRef, {
          accountBalance: currentUserData.accountBalance - totalPayable,
          totalAmountInvested: (currentUserData.totalAmountInvested || 0) + totalPayable,
          totalDealsJoined: (currentUserData.totalDealsJoined || 0) + 1,
          updatedAt: serverTimestamp()
        });

        const newOrders = currentDealData.currentOrders + totalQuantity;
        const isNowFull = newOrders >= currentDealData.moq;
        
        transaction.update(dealRef, {
          currentOrders: newOrders,
          escrowParticipants: currentDealData.escrowParticipants + 1,
          status: isNowFull ? "moq_reached" : "active",
          updatedAt: serverTimestamp()
        });

        const orderRef = doc(db, "orders", `${user.uid}_${card.id}_${Date.now()}`);
        const variantDetails = card.hasVariants && card.variants ? 
          card.variants.map(variant => ({
            variantId: variant.id,
            variantName: variant.name,
            variantType: variant.type,
            quantity: variantQuantities[variant.id] || 0,
            unitPrice: variant.buyingPrice || card.buyingPrice,
            total: (variant.buyingPrice || card.buyingPrice) * (variantQuantities[variant.id] || 0)
          })).filter(v => v.quantity > 0) : [];

        transaction.set(orderRef, {
          userId: user.uid,
          dealId: card.id,
          title: card.title,
          quantity: totalQuantity,
          unitPrice: getSelectedVariantPrice(),
          variantDetails: card.hasVariants ? variantDetails : undefined,
          totalPayable,
          logisticsCost: logisticsCost,
          platformFee: platformFeeAmount,
          status: isNowFull ? "moq_reached" : "pending",
          paymentMethod: 'wallet',
          paymentStatus: 'completed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          estimatedDelivery: card.estimatedNigeriaArrivalDate || new Date(Date.now() + (card.estimatedShippingDays * 24 * 60 * 60 * 1000)).toISOString(),
          moqStatus: isNowFull ? "reached" : "pending",
          moqProgress: newOrders,
          moqRequired: currentDealData.moq,
          hasWhatsAppAccess: true
        });

        const transactionRef = doc(db, "transactions", `${user.uid}_${Date.now()}`);
        transaction.set(transactionRef, {
          userId: user.uid,
          type: 'debit',
          amount: totalPayable,
          description: `Order for ${totalQuantity} units of ${card.title}`,
          reference: `ORDER_${card.id}_${Date.now()}`,
          status: 'completed',
          orderId: orderRef.id,
          createdAt: serverTimestamp(),
          metadata: {
            dealId: card.id,
            quantity: totalQuantity,
            unitPrice: getSelectedVariantPrice(),
            variantQuantities: card.hasVariants ? variantQuantities : undefined
          }
        });
      });

      setJoined(true);
      setJoining(false);

      setUser(prev => prev ? {
        ...prev,
        accountBalance: prev.accountBalance - totalPayable,
        totalAmountInvested: (prev.totalAmountInvested || 0) + totalPayable,
        totalDealsJoined: (prev.totalDealsJoined || 0) + 1
      } : null);

      if (isMOQFull) {
        alert(`🎉 CONGRATULATIONS! You joined the final order that reached MOQ!\nTotal: ${formatCurrency(totalPayable)} deducted from wallet.\nShipping will begin soon.\n\n✅ You now have access to the WhatsApp group for updates.`);
      } else {
        alert(`✅ ORDER CONFIRMED! ${totalQuantity} units reserved.\nTotal: ${formatCurrency(totalPayable)} deducted from wallet.\n${ordersNeeded - totalQuantity} units needed to reach MOQ.\n\n✅ You now have access to the WhatsApp group for updates.`);
      }

      setTimeout(() => {
        router.push('/orders');
      }, 2000);

    } catch (err: any) {
      console.error('Error processing payment:', err);
      alert(`Payment failed: ${err.message || 'Please try again.'}`);
    } finally {
      setPaymentProcessing(false);
      setShowPaymentModal(false);
    }
  }, [card, user, isMOQFull, hasSelectedVariant, hasVariantQuantities, meetsMinimumQuantity, totalQuantity, hasSufficientBalance, totalPayable, variantQuantities, getSelectedVariantPrice, logisticsCost, platformFeeAmount, ordersNeeded, router, formatCurrency]);

  const handleJoinOrder = useCallback(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (card?.hasVariants) {
      if (!hasSelectedVariant) {
        alert("Please select at least one variant before proceeding.");
        return;
      }
      if (!hasVariantQuantities) {
        alert("Please select quantities for at least one variant before proceeding.");
        return;
      }
      if (!meetsMinimumQuantity) {
        alert("Minimum order is 3 units total for bulk purchases. Increase quantity.");
        return;
      }
    }

    setShowPaymentModal(true);
  }, [user, card?.hasVariants, hasSelectedVariant, hasVariantQuantities, meetsMinimumQuantity]);

  const handleLoginRedirect = useCallback(() => {
    const currentUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectUrl', currentUrl);
    router.push('/auth');
  }, [router]);

  const handleFavorite = useCallback(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setFavorited(!favorited);
  }, [user, favorited]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const handleShare = useCallback(() => {
    if (!card) return;

    const shareData = {
      title: card.title || 'Bulk Deal',
      text: `Wholesale Deal: ${card.title} - Buy at ${formatCurrency(card.buyingPrice || 0)}/unit!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied! Share with other wholesalers.');
    }
  }, [card, formatCurrency]);

  // ==================== RENDER LOGIC ====================

  // Loading state - MUST BE AFTER ALL HOOKS
  if (loading) return <Loading />;

  // Error state - MUST BE AFTER ALL HOOKS
  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Deal Not Available</h2>
          <p className="text-sm text-gray-600 mb-4">This deal is no longer available.</p>
          <button
            onClick={() => router.push('/bulky-cards')}
            className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 text-sm"
          >
            Browse Other Deals
          </button>
        </div>
      </div>
    );
  }

  // ==================== MAIN RETURN ====================

  return (
    <main className="min-h-screen bg-white pb-40">
      {/* Wallet Balance Banner */}
      {user && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">Your Balance:</span>
            </div>
            <span className="text-lg font-bold">{formatCurrency(user.accountBalance)}</span>
          </div>
          {!hasSufficientBalance && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-300" />
              <span>Insufficient balance for this order</span>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-300 px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>

          <div className="flex items-center gap-3">
            {!user && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
              >
                <span className="flex items-center gap-1">
                  <LogIn className="w-3 h-3" />
                  Sign In
                </span>
              </button>
            )}
            <button
              onClick={handleFavorite}
              className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
            >
              <Heart className={`w-5 h-5 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-800'}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
            >
              <Share2 className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="px-4 py-4 space-y-4">
        {/* PRODUCT GALLERY */}
        <div className="bg-white rounded-lg p-2 border border-gray-300 relative">
          {card.images?.length > 1 && (
            <div className="relative mb-2">
              <div className="flex gap-1 overflow-x-auto overscroll-x-contain scroll-smooth no-scrollbar">
                {card.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border ${
                      index === selectedImage ? 'border-orange-500' : 'border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`thumb-${index}`}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                      priority={index === 0}
                    />
                    {index === selectedImage && (
                      <div className="absolute inset-0 ring-2 ring-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MAIN IMAGE */}
          <div
            className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
            onClick={() => setShowZoom(true)}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (diff > 50 && selectedImage < card.images.length - 1) {
                setSelectedImage(selectedImage + 1);
              } else if (diff < -50 && selectedImage > 0) {
                setSelectedImage(selectedImage - 1);
              }
            }}
          >
            {card.images?.[selectedImage] ? (
              <Image
                src={card.images[selectedImage]}
                alt={card.title}
                width={400}
                height={400}
                className="w-full h-full object-contain"
                loading="eager"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera className="w-10 h-10 text-gray-400" />
              </div>
            )}

            {/* FACTORY PRICE + CHECK SHIPPING */}
            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex flex-col items-center space-y-1">
              <div className="bg-orange-50 border border-orange-300 rounded-lg px-3 py-1 text-center shadow-md">
                <span className="text-xs text-gray-500 block">Factory Price</span>
                <span className="text-lg font-bold text-orange-600 block">
                  ₦{card.buyingPrice?.toLocaleString() || 0}
                </span>
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById('cost-breakdown');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/90 border border-orange-300 text-orange-600 text-xs font-semibold px-2 py-1 rounded-lg shadow-sm hover:bg-white transition-colors duration-200"
              >
                Check Shipping Price
              </button>
            </div>

            <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
              {selectedImage + 1}/{card.images?.length || 1}
            </div>

            {isMOQFull && (
              <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                MOQ REACHED!
              </div>
            )}

            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
              Tap to zoom
            </div>
          </div>

          {/* ZOOM MODAL */}
          {showZoom && (
            <div
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
              onClick={() => setShowZoom(false)}
            >
              <div
                className="relative w-full max-w-3xl h-full flex items-center justify-center overflow-hidden"
                onTouchStart={(e) => {
                  touchStartX.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  const diff = touchStartX.current - e.changedTouches[0].clientX;
                  if (diff > 50 && selectedImage < card.images.length - 1) {
                    setSelectedImage(selectedImage + 1);
                  } else if (diff < -50 && selectedImage > 0) {
                    setSelectedImage(selectedImage - 1);
                  }
                }}
              >
                <Image
                  src={card.images[selectedImage]}
                  alt={card.title}
                  width={800}
                  height={800}
                  className="max-h-full max-w-full object-contain"
                  priority
                />

                {selectedImage > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(selectedImage - 1);
                    }}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-3xl p-2 bg-black/30 rounded-full"
                  >
                    ‹
                  </button>
                )}
                {selectedImage < card.images.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(selectedImage + 1);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-3xl p-2 bg-black/30 rounded-full"
                  >
                    ›
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowZoom(false);
                  }}
                  className="absolute top-2 right-2 text-white text-2xl p-2 bg-black/30 rounded-full"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CLEAR PRICE & TITLE SECTION */}
        <div className="bg-white rounded-xl p-4 border border-gray-300 shadow-sm">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-bold">
              {card.category}
            </span>
            {card.subCategory && (
              <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs">
                {card.subCategory}
              </span>
            )}
            {card.verified && (
              <span className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs">
                <Verified className="w-3 h-3" />
                Verified
              </span>
            )}
            {card.urgency && (
              <span className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs">
                <Timer className="w-3 h-3" />
                Limited Time
              </span>
            )}
            {card.trending && (
              <span className="flex items-center gap-1 bg-orange-600 text-white px-2 py-1 rounded text-xs">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            )}
            {isMOQFull && (
              <span className="flex items-center gap-1 bg-red-700 text-white px-2 py-1 rounded text-xs">
                <CheckCircle className="w-3 h-3" />
                MOQ Reached
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 leading-tight mb-4">
            {card.title}
          </h1>

          {/* MOQ Full Warning */}
          {isMOQFull && (
            <div className="mb-4 bg-red-50 border border-red-300 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-800 text-sm">🚨 MOQ FULL - DEAL CLOSED!</h3>
                  <p className="text-xs text-red-700 mt-1">
                    This bulk order has reached its Minimum Order Quantity ({card.moq} units). 
                    No more orders can be placed. Join the waitlist for the next batch.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Final Landed Cost Display */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
            <div className="text-center">
              <div className="text-sm text-black-700 mb-1">
                Total Import Cost per Unit to Nigeria
              </div>

              <div className="text-3xl font-bold text-orange-600">
                {formatCurrency(finalLandedCostPerUnit)}
              </div>

              <div className="text-xs text-green-700 font-medium mt-1 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {card.hasVariants && hasSelectedVariant 
                  ? `Based on ${selectedVariants.length} selected variant(s)` 
                  : "Includes: Factory Price + Shipping + Customs + Platform Fee"} 
              </div>
              <p className="text-[10px]">
                Factory Price + Shipping + Customs + 3% Platform Fee inclusive
              </p>

              {card.hasVariants && !hasSelectedVariant && (
                <div className="mt-2 text-xs text-blue-700 font-medium">
                  ⚠️ Select at least one variant above to see accurate pricing
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp Group Link */}
          {card.whatsappGroupLink && (
            <div className={`mt-3 ${joined ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-300'} p-3 rounded-lg border`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className={`w-4 h-4 ${joined ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${joined ? 'text-green-800' : 'text-gray-600'}`}>
                    WhatsApp Group
                  </span>
                </div>
                {joined ? (
                  <a
                    href={card.whatsappGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-700 font-medium hover:text-green-900 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Join Now
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Join order to access
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 ${joined ? 'text-green-700' : 'text-gray-600'}`}>
                {joined 
                  ? "Get real-time updates & connect with other buyers" 
                  : "This group is only open to those who join the bulk order"}
              </p>
            </div>
          )}

          {/* Source Verification Badge */}
          {(card.productSourceUrl || card.buyingPriceYuan) && (
            <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GlobeIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Check Original Product on 1688/Alibaba</span>
                </div>
                <a
                  href={card.productSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-700 font-medium hover:text-blue-900 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Check on 1688
                </a>
              </div>
            </div>
          )}
        </div>

        {/* QUICK STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <QuickFacts
            title="MOQ Required"
            value={`${card.moq} units`}
            icon={Package}
            color="bg-blue-600"
            description={isMOQFull ? "MOQ reached ✓" : `${ordersNeeded} more needed`}
          />
          <QuickFacts
            title="Current Orders"
            value={`${card.currentOrders} units`}
            icon={ShoppingCart}
            color={isMOQFull ? "bg-red-600" : "bg-green-600"}
            description={isMOQFull ? "Deal closed" : `${progressPercentage.toFixed(0)}% progress`}
          />
          <QuickFacts
            title="Shipping Time"
            value={`${card.estimatedShippingDays} days`}
            icon={TruckIcon}
            color="bg-purple-600"
            description={card.shippingMethod === 'air' ? 'Air freight' : 'Sea freight'}
          />
          <QuickFacts
            title="Profit Margin"
            value={`${card.profitMargin}%`}
            icon={TrendingUp}
            color="bg-orange-600"
            description="Potential profit"
          />
        </div>

        {/* Estimated Dates */}
        {(card.estimatedProcurementDate || card.estimatedNigeriaArrivalDate) && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Estimated Timeline
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {card.estimatedProcurementDate && (
                <div className="bg-white p-2 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-700">Procurement Starts</p>
                  <p className="text-sm font-bold text-gray-900">{formatDate(card.estimatedProcurementDate)}</p>
                </div>
              )}
              {card.estimatedNigeriaArrivalDate && (
                <div className="bg-white p-2 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-700">Nigeria Arrival</p>
                  <p className="text-sm font-bold text-gray-900">{formatDate(card.estimatedNigeriaArrivalDate)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BULK PROGRESS BAR */}
        <div
          className={`rounded-xl p-4 shadow-lg text-white
          ${isMOQFull
            ? 'bg-gradient-to-r from-green-600 to-emerald-700'
            : 'bg-gradient-to-r from-orange-500 to-red-500'
          }`}
        >
          <div className="mb-3">
            <h3 className="text-lg font-bold mb-1">
              {isMOQFull ? '🎉 MOQ REACHED - DEAL CLOSED!' : 'Bulk Order Progress'}
            </h3>
            <p className="text-sm opacity-90">
              {isMOQFull
                ? 'This deal is now closed for new orders'
                : 'Group buying to unlock price'}
            </p>
          </div>

          <ProgressIndicator
            current={card.currentOrders}
            total={card.moq}
            label={isMOQFull ? 'MOQ Status' : 'Progress to MOQ'}
          />

          <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-center text-sm">
              {isMOQFull ? (
                <span className="font-bold">
                  🎊 Congratulations! MOQ reached with {card.escrowParticipants} buyers!
                </span>
              ) : (
                <span className="font-bold">
                  {card.escrowParticipants} buyers have joined this bulk order
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STICKY TAB BAR */}
        <div className="sticky top-[72px] z-40 bg-white px-1 py-1 border-b border-gray-200 shadow-sm">
          <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

          <div className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-1 pb-1">
            {[
              { id: 'pricing', label: 'Pricing', icon: Dollar, color: 'from-orange-500 to-red-500' },
              { id: 'overview', label: 'Overview', icon: InfoIcon, color: 'from-blue-500 to-cyan-500' },
              { id: 'market', label: 'Market', icon: BarChart, color: 'from-green-500 to-emerald-600' },
              { id: 'shipping', label: 'Shipping', icon: Truck, color: 'from-purple-500 to-violet-600' },
              { id: 'supplier', label: 'Supplier', icon: Users, color: 'from-indigo-500 to-blue-600' },
              { id: 'variants', label: 'Variants', icon: Layers, color: 'from-pink-500 to-rose-600' },
              { id: 'updates', label: 'Updates', icon: RefreshCw, color: 'from-amber-500 to-yellow-600' },
              { id: 'faq', label: 'FAQ', icon: HelpCircle, color: 'from-gray-600 to-gray-800' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`snap-start flex-shrink-0 min-w-[70px] px-2 py-2 rounded-lg flex flex-col items-center gap-0.5 transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-md scale-105 ring-1 ring-white/30`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <tab.icon
                  className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}
                />
                <span className="text-[9px] font-semibold whitespace-nowrap">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="w-5 h-0.5 rounded-full bg-white/90 mt-0.5 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <div className="text-center text-[9px] text-gray-500 mt-0.5 md:hidden">
            ← Swipe to see more →
          </div>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden">
          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <div className="p-4 space-y-6">
              {/* VARIANT QUANTITY SELECTION */}
              {card.hasVariants && card.variants && card.variants.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <h3 id="cost-breakdown" className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2 mt-6">
                    <Layers className="w-5 h-5 text-purple-600" />
                    Select Quantities by Variant
                  </h3>

                  <div className="mb-3">
                    <p className="text-sm text-blue-700 mb-2">
                      You must Choose quantities for atleast 3 units to see shipping & logistic cost.
                    </p>
                    <div className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
                      <strong>Important:</strong> At least one variant must be selected to calculate Final Landed Cost. The first variant is pre-selected for you.
                    </div>
                  </div>

                  <div className="space-y-3">
                    {card.variants.map((variant) => (
                      <div 
                        key={variant.id}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedVariants.includes(variant.id)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedVariants.includes(variant.id)}
                                onChange={() => toggleVariantSelection(variant.id)}
                                disabled={isMOQFull}
                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                              />
                              <h4 className="text-sm font-bold text-green-900">{variant.name}</h4>
                            </div>
                            <p className="text-xs text-green-600 mt-0.5">{variant.type}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-orange-600">
                              {formatCurrency(card.buyingPrice || (variant.buyingPrice ?? 0))}
                            </div>
                            <div className="text-xs text-blue-600">
                              {(variant.weight ?? card.weightPerUnit)}kg
                            </div>
                          </div>
                        </div>

                        {selectedVariants.includes(variant.id) && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-blue-700">Quantity:</span>
                              <span className="text-xs font-bold text-orange-700">
                                {variantQuantities[variant.id] || 0} units
                              </span>
                            </div>
                            <VariationQuantityInput
                              variant={variant}
                              quantity={variantQuantities[variant.id] || 0}
                              onChange={(qty) => updateVariantQuantity(variant.id, qty)}
                              disabled={isMOQFull}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total Quantity Summary */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-gray-900">Total Selected Units</div>
                        <div className="text-xs text-gray-600">Across all variants</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          meetsMinimumQuantity ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {totalQuantity} units
                        </div>
                        <div className="text-xs text-gray-600">
                          Minimum: 3 units
                          {!meetsMinimumQuantity && (
                            <span className="text-red-600 font-bold ml-2">❌</span>
                          )}
                          {meetsMinimumQuantity && (
                            <span className="text-green-600 font-bold ml-2">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Variant Selection Status */}
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">Variants Selected:</span>
                        <span className={`text-xs font-bold ${hasSelectedVariant ? 'text-green-700' : 'text-red-700'}`}>
                          {hasSelectedVariant ? `${selectedVariants.length} selected ✓` : 'No variant selected ❌'}
                        </span>
                      </div>
                      {!hasSelectedVariant && (
                        <div className="mt-1 text-xs text-red-600 bg-red-50 p-2 rounded">
                          ⚠️ Please select at least one variant to see accurate pricing
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Minimum Quantity Explanation */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Minimum Quantity Explained
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-green-800">
                    <span className="font-bold text-blue-700">Why 3 units minimum?</span> This is a wholesale deal designed for resellers. Ordering in bulk helps:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1 pl-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Reduce shipping costs</strong> - Shipping is cheaper per unit when combined</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Better pricing</strong> - Suppliers give better rates for bulk orders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Faster shipping</strong> - Bulk orders get priority processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Market advantage</strong> - You can sell competitively with lower unit cost</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* COST BREAKDOWN */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Step-by-Step Cost Breakdown</h3>
                <p className="text-sm text-gray-700 mb-4">Here's exactly how your total cost is calculated:</p>
                
                <div className="space-y-4">
                  {/* STEP 1: Factory Price */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 relative">
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-yellow-600" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Factory Price from {card.origin}
                            {card.hasVariants && ` (${totalQuantity} units)`}
                          </span>
                          <p className="text-xs text-gray-600">Direct supplier price before shipping</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-yellow-700">{formatCurrency(productCost)}</span>
                    </div>
                    {card.hasVariants && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                        <strong>Variant Breakdown:</strong>
                        {card.variants?.map(variant => {
                          const qty = variantQuantities[variant.id] || 0;
                          if (qty > 0) {
                            return (
                              <div key={variant.id} className="flex justify-between mt-1">
                                <span>{variant.name}: {qty} × {formatCurrency(card.buyingPrice || (variant.buyingPrice ?? 0))}</span>
                                <span className="font-medium">{formatCurrency((card.buyingPrice || (variant.buyingPrice ?? 0)) * qty)}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* STEP 2: Shipping */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 relative">
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            {card.shippingMethod === 'air' ? 'Air Freight from China' : 'Sea Freight from China'}
                          </span>
                          <p className="text-xs text-gray-600">Shipping to Lagos port ({totalQuantity} units)</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-blue-700">{formatCurrency(logisticsCost)}</span>
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      Calculated as: {totalQuantity} units × {card.weightPerUnit}kg × {formatCurrency(getFreightRate())} per kg = {formatCurrency(logisticsCost)}.
                      {card.shippingMethod === 'air' ? ' Air freight is faster but more expensive.' : ' Sea freight is economical for bulk goods.'}
                    </div>
                  </div>

                  {/* STEP 3: Customs & Duties */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 relative">
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Customs Clearance & Port Charges</span>
                          <p className="text-xs text-gray-600">Nigerian import duties & processing</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-purple-700">{formatCurrency(customsCost * totalQuantity)}</span>
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      Government duties calculated as: {totalQuantity} units × {card.weightPerUnit}kg × {formatCurrency(card.customsPerKg)} per kg = {formatCurrency(customsCost * totalQuantity)}.
                      This includes all port processing fees and legal import duties.
                    </div>
                  </div>

                  {/* STEP 4: Platform Fee */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 relative">
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-red-600" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Platform Service Fee</span>
                          <p className="text-xs text-gray-600">3% service charge for secure transaction</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-red-700">{formatCurrency(platformFeeAmount)}</span>
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      Calculated as: 3% of (Product Cost + Shipping + Customs) = 3% × {formatCurrency(subtotal)} = {formatCurrency(platformFeeAmount)}.
                      This fee covers payment processing, escrow services, and customer support.
                    </div>
                  </div>

                  {/* STEP 5: Total Landed Cost */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-300 relative">
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      5
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-green-900">Total Payable in Nigeria</div>
                        <div className="text-xs text-green-800">Total importation costs to Nigeria</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-900">{formatCurrency(totalPayable)}</div>
                        <div className="text-xs text-green-800">for {totalQuantity} units</div>
                      </div>
                    </div>
                    <div className="text-xs text-green-800 bg-green-100 p-2 rounded mt-2">
                      <strong>Formula:</strong> Factory Price ({formatCurrency(productCost)}) + Shipping ({formatCurrency(logisticsCost)}) + Customs ({formatCurrency(customsCost * totalQuantity)}) + Platform Fee ({formatCurrency(platformFeeAmount)}) = <strong>{formatCurrency(totalPayable)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* PROFIT CALCULATOR */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">💰 Your Profit Potential</h3>
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-5 rounded-xl text-white">
                  <div className="text-center mb-4">
                    <div className="text-sm font-bold mb-1">YOUR ESTIMATED PROFIT FOR {totalQuantity} UNITS</div>
                    <div className="text-xs opacity-90">Based on market research and competitor pricing</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/20 p-3 rounded">
                      <div className="text-xs opacity-90 mb-1">Your Total Investment</div>
                      <div className="text-base font-bold">{formatCurrency(totalPayable)}</div>
                      <div className="text-xs opacity-90 mt-1">
                        Includes all costs + 3% platform fee
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded">
                      <div className="text-xs opacity-90 mb-1">Potential Market Revenue</div>
                      <div className="text-base font-bold">{formatCurrency(estimatedRevenue)}</div>
                      <div className="text-xs opacity-90 mt-1">
                        {formatCurrency(card.recommendedPrice)} × {totalQuantity} units
                      </div>
                    </div>
                  </div>

                  <div className="text-center bg-black/20 p-4 rounded-lg mb-4">
                    <div className="text-xs opacity-90 mb-1">YOUR ESTIMATED PROFIT</div>
                    <div className="text-3xl font-bold mb-1">+{formatCurrency(estimatedProfit)}</div>
                    <div className="text-lg font-bold">{profitMarginPercentage}% Profit Margin</div>
                  </div>

                  <div className="bg-white/10 p-3 rounded">
                    <h4 className="text-sm font-bold mb-2">📈 How to Maximize Your Profit:</h4>
                    <div className="text-xs space-y-1">
                      <p className="flex items-start gap-1">
                        <span className="text-green-300">✓</span>
                        <span><strong>Sell online:</strong> Jumia/Konga price: {formatCurrency(card.retailPrice)} per unit</span>
                      </p>
                      <p className="flex items-start gap-1">
                        <span className="text-green-300">✓</span>
                        <span><strong>Retail shops:</strong> Sell at {formatCurrency(card.recommendedPrice)} in markets</span>
                      </p>
                      <p className="flex items-start gap-1">
                        <span className="text-green-300">✓</span>
                        <span><strong>Wholesale to retailers:</strong> Sell bulk to shops at 20% higher than Landing cost.</span>
                      </p>
                      <p className="flex items-start gap-1">
                        <span className="text-green-300">✓</span>
                        <span><strong>Bundle deals:</strong> Package with accessories for higher margins</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs opacity-90 text-center">
                    <p><strong>Quick Flip Potential:</strong> If you sell all {totalQuantity} units at {formatCurrency(card.recommendedPrice)} each, you make <strong className="text-yellow-300">{formatCurrency(estimatedProfit)} profit</strong> in {card.estimatedShippingDays} days.</p>
                  </div>
                </div>
              </div>

              {/* Why This Deal is Profitable */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                <h4 className="text-sm font-bold text-blue-900 mb-2">🎯 Why This Deal is Profitable:</h4>
                <div className="text-xs text-green-700 space-y-1">
                  <p className="flex items-start gap-1">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Price Gap:</strong> You're buying at a cheap price while market sells at {formatCurrency(externalStats.average)}</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Volume Advantage:</strong> Buying {totalQuantity} units reduces your cost per unit significantly</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Market Demand:</strong> {card.category} products have high demand in {card.targetMarket}</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Quick Turnaround:</strong> Average resale time is 7-14 days in Nigerian markets</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Product Description
                </h3>

                <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {(showFullDescription
                    ? card.description
                    : card.description.slice(0, 150) +
                      (card.description.length > 150 ? "..." : "")
                  )
                    .split(/(\s+)/)
                    .map((word, index) =>
                      /^[A-Z]{2,}$/.test(word.trim()) ? (
                        <strong key={index} className="font-bold">
                          {word}
                        </strong>
                      ) : (
                        <span key={index}>{word}</span>
                      )
                    )}
                </div>

                {card.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-orange-600 text-sm font-bold mt-2"
                  >
                    {showFullDescription ? "Show less" : "Read more"}
                  </button>
                )}
              </div>

              {card.features && card.features.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Key Features</h3>
                  <div className="space-y-2">
                    {card.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-800">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {card.specifications && Object.keys(card.specifications).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Specifications</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(card.specifications).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-700 font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </div>
                        <div className="text-sm font-bold text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              {card.trustBadges && card.trustBadges.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-black-900 mb-3">Why Trust This Deal</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {card.trustBadges.map((badge, index) => (
                      <div key={index} className={`bg-${badge.color}-50 p-3 rounded-lg border border-${badge.color}-200`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{badge.icon}</span>
                          <span className="text-sm font-medium text-green-900">{badge.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MARKET TAB */}
          {activeTab === 'market' && (
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Market Price Comparison</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Discover How Much Others Are Selling This Item For – Save Big!
                </p>

                <div className="space-y-3 mb-6">
                  {card.externalMarketPrices.map((market, index) => (
                    market.price > 0 && <MarketPriceCard key={index} market={market} />
                  ))}
                </div>

                {externalStats.average > 0 && (
                  <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-5 text-white">
                    <div className="text-center mb-4">
                      <div className="text-sm font-bold mb-1">YOUR PRICE ADVANTAGE</div>
                      <div className="text-xs opacity-90">Compared to retail market</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/20 p-3 rounded">
                        <div className="text-xs opacity-90 mb-1">Your Cost</div>
                        <div className="text-base font-bold">{formatCurrency(actualLandedCost)}</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded">
                        <div className="text-xs opacity-90 mb-1">Market Average</div>
                        <div className="text-base font-bold">{formatCurrency(externalStats.average)}</div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xl font-bold mb-1">Save {Math.round(((externalStats.average - actualLandedCost) / externalStats.average) * 100)}%</div>
                      <div className="text-sm opacity-90">That's {formatCurrency(externalStats.average - actualLandedCost)} per unit!</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SHIPPING TAB */}
          {activeTab === 'shipping' && (
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Shipping Timeline</h3>
                <div className="space-y-4">
                  {card.timeline.map((stage, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-lg">
                        {stage.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{stage.stage}</p>
                        <p className="text-xs text-gray-700">{stage.days}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-blue-100 p-4 rounded-lg border border-blue-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-blue-900">Total Estimated Time</p>
                      <p className="text-xs text-blue-800">From China to Nigeria</p>
                    </div>
                    <div className="text-lg font-bold text-blue-900">{card.estimatedShippingDays} days</div>
                  </div>
                </div>
              </div>

              {/* Buyer Protection */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Buyer Protection</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-100 p-3 rounded-lg border border-green-300">
                    <div className="text-base mb-1">💰</div>
                    <div className="text-sm font-bold text-green-900">Escrow Protection</div>
                    <div className="text-xs text-green-800">Funds held until delivery</div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
                    <div className="text-base mb-1">↩️</div>
                    <div className="text-sm font-bold text-blue-900">Full Refund</div>
                    <div className="text-xs text-blue-800">100% money back guarantee</div>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg border border-purple-300">
                    <div className="text-base mb-1">✅</div>
                    <div className="text-sm font-bold text-purple-900">Verified Uploader</div>
                    <div className="text-xs text-purple-800">Identity verified</div>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg border border-orange-300">
                    <div className="text-base mb-1">📞</div>
                    <div className="text-sm font-bold text-orange-900">24/7 Support</div>
                    <div className="text-xs text-orange-800">WhatsApp support</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUPPLIER TAB */}
          {activeTab === 'supplier' && (
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Uploader Information</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <UsersRound className="w-6 h-6 text-purple-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">{card.uploaderName}</span>
                      {card.verified && (
                        <span className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                          <Verified className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    {card.uploaderCompany && (
                      <p className="text-xs text-gray-700 mb-1">{card.uploaderCompany}</p>
                    )}
                    <div className="text-xs text-gray-700">
                      Joined: {formatDate(card.uploaderJoinDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-700">{card.uploaderSuccessRate}%</div>
                    <div className="text-xs text-gray-700">Success Rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-100 p-2 rounded-lg text-center">
                    <div className="text-xs text-gray-700">Completed Deals</div>
                    <div className="text-sm font-bold text-gray-900">{card.uploaderCompletedDeals}</div>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg text-center">
                    <div className="text-xs text-green-700">Current Buyers</div>
                    <div className="text-sm font-bold text-blue-900">{card.escrowParticipants}</div>
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4">
                  <h4 className="text-sm font-bold text-blue-900 mb-2">Supplier Details</h4>
                  <div className="text-xs text-green-700 space-y-1">
                    <p><strong>Factory/Supplier:</strong> {card.supplier || "Not specified"}</p>
                    <p><strong>Country of Origin:</strong> {card.origin}</p>
                    {card.supplierRating > 0 && (
                      <div className="flex items-center gap-1">
                        <span><strong>Supplier Rating:</strong></span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(card.supplierRating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="ml-1 text-black-700">({card.supplierRating}/5)</span>
                        </div>
                      </div>
                    )}
                    {card.supplierReviews > 0 && (
                      <p><strong>Supplier Reviews:</strong> {card.supplierReviews.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                {(card.uploaderWhatsApp || card.uploaderPhone) && (
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm font-bold text-gray-900 mb-1">Contact Information</p>
                    <div className="text-xs text-gray-700 space-y-1">
                      {card.uploaderWhatsApp && <p className="font-medium">WhatsApp: {card.uploaderWhatsApp}</p>}
                      {card.uploaderPhone && <p className="font-medium">Phone: {card.uploaderPhone}</p>}
                      {card.uploaderEmail && <p className="font-medium">Email: {card.uploaderEmail}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Commitment Fee */}
              {card.commitmentFeePaid && (
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="w-4 h-4 text-blue-700" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Commitment Fee Paid</p>
                      <p className="text-xs text-gray-700">
                        Uploader paid {formatCurrency(card.commitmentFeeAmount)} as commitment guarantee
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VARIANTS TAB */}
          {activeTab === 'variants' && card.hasVariants && card.variants && card.variants.length > 0 && (
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Available Variants</h3>
              
              {/* Variant Types */}
              {card.variantTypes && card.variantTypes.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Variant Options</h4>
                  <div className="flex flex-wrap gap-2">
                    {card.variantTypes.map((type, index) => (
                      <div key={index} className="bg-gray-100 px-3 py-2 rounded-lg">
                        <p className="text-xs font-bold text-gray-900">{type.name}</p>
                        <p className="text-xs text-gray-700">{type.options.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants List with Quantity Selection */}
              <div className="space-y-3">
                {card.variants.map((variant) => (
                  <div 
                    key={variant.id}
                    className={`w-full p-4 rounded-xl border transition-all ${
                      selectedVariants.includes(variant.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold text-green-900">{variant.name}</div>
                        <div className="text-xs text-green-700">{variant.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-orange-600">
                          {formatCurrency(card.buyingPrice || (variant.buyingPrice ?? 0))}
                        </div>
                        <div className="text-xs text-blue-600">
                          {(variant.weight ?? card.weightPerUnit)}kg
                        </div>
                      </div>
                    </div>
                    
                    {/* Quantity Selection for this variant */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedVariants.includes(variant.id)}
                          onChange={() => toggleVariantSelection(variant.id)}
                          disabled={isMOQFull}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <span className="text-xs text-green-700">Select this variant</span>
                      </div>
                      
                      {selectedVariants.includes(variant.id) && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-green-700">Quantity:</span>
                          <VariationQuantityInput
                            variant={variant}
                            quantity={variantQuantities[variant.id] || 0}
                            onChange={(qty) => updateVariantQuantity(variant.id, qty)}
                            disabled={isMOQFull}
                          />
                        </div>
                      )}
                    </div>
                    
                    {selectedVariants.includes(variant.id) && (
                      <div className="mt-2 text-xs text-green-700 font-medium">
                        ✓ Selected ({variantQuantities[variant.id] || 0} units)
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-300">
                <h4 className="text-sm font-bold text-blue-900 mb-3">Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Total Variants Selected:</span>
                    <span className="text-sm font-bold text-gray-900">{selectedVariants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Total Units:</span>
                    <span className={`text-sm font-bold ${
                      meetsMinimumQuantity ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {totalQuantity} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Minimum Required:</span>
                    <span className="text-sm font-bold text-blue-900">3 units</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-blue-900">Total Product Cost:</span>
                      <span className="text-sm font-bold text-orange-600">{formatCurrency(productCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variant Images */}
              {selectedVariants.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Selected Variant Images</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedVariants.map(variantId => {
                      const variant = card.variants?.find(v => v.id === variantId);
                      return variant?.images?.map((img, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-300">
                          <Image 
                            src={img} 
                            alt={`Variant ${variant.name} ${index + 1}`} 
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ));
                    }).flat() || (
                      <div className="col-span-3 text-center text-gray-500 text-sm py-4">
                        No specific images for selected variants
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPDATES TAB */}
          {activeTab === 'updates' && card.updates && card.updates.length > 0 && (
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Deal Updates</h3>
              <div className="space-y-4">
                {card.updates.map((update, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-blue-700 font-medium">{formatDate(update.date)}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Update</span>
                    </div>
                    <h4 className="text-sm font-bold text-green-900 mb-2">{update.title}</h4>
                    <p className="text-sm text-green-800">{update.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ TAB */}
          {activeTab === 'faq' && card.faqs && card.faqs.length > 0 && (
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-2">
                {card.faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                      className="w-full p-3 text-left flex justify-between items-center hover:bg-gray-100"
                    >
                      <span className="text-sm font-medium text-gray-900 pr-4">{faq.question}</span>
                      {showFAQ === index ? (
                        <ChevronUp className="w-4 h-4 text-gray-700" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-700" />
                      )}
                    </button>
                    {showFAQ === index && (
                      <div className="p-3 pt-0">
                        <p className="text-sm text-gray-800">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SOURCE VERIFICATION SECTION */}
        {(card.productSourceUrl || card.buyingPriceYuan || card.buyingPriceUSD) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-300">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <GlobeIcon className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-green-900">Source Price Verification</h3>
                  {priceVerification?.isAccurate ? (
                    <span className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Price Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded text-xs">
                      <Info className="w-3 h-3" />
                      Verify Price
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {card.buyingPriceYuan && (
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Source Price (Yuan)</div>
                      <div className="text-base font-bold text-red-600">{formatYuan(card.buyingPriceYuan)}</div>
                    </div>
                  )}

                  {card.exchangeRateYuanToNaira && (
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Exchange Rate</div>
                      <div className="text-sm font-bold text-blue-700">
                        1 ¥ = {card.exchangeRateYuanToNaira.toFixed(2)} ₦
                      </div>
                    </div>
                  )}

                  {priceVerification && (
                    <div className={`col-span-2 p-2 rounded-lg ${priceVerification.isAccurate ? 'bg-green-100 border border-green-300' : 'bg-yellow-100 border border-yellow-300'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-black-700">Price Match:</span>
                        <span className={`text-xs font-bold ${priceVerification.isAccurate ? 'text-green-700' : 'text-yellow-700'}`}>
                          {priceVerification.isAccurate ? '✓ MATCHES' : `~${priceVerification.percentageDiff.toFixed(1)}% DIFF`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {card.productSourceUrl && (
                  <a
                    href={card.productSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Check Original Product on 1688/Alibaba
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING BOTTOM BAR */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t shadow-2xl backdrop-blur-xl transition-all duration-300 ${isMOQFull ? 'bg-gray-900 text-white' : 'bg-white/95'}`}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* URGENCY + WALLET */}
          {!isMOQFull && (
            <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-semibold text-orange-600">
                <span className="text-orange-600">🔥</span>
                Only <span className="font-bold">{isMOQFull ? "MOQ reached ✓" : `${ordersNeeded}`}</span> units left to activate deal
              </div>

              {user && (
                <div className={`font-bold ${hasSufficientBalance ? 'text-green-600' : 'text-red-600'}`}>
                  Wallet: {formatCurrency(user.accountBalance)}
                </div>
              )}
            </div>
          )}

          {/* MAIN CONTENT */}
          <div className="flex items-center gap-3">
            {/* PRICE + STATUS */}
            <div className="flex-1">
              <div className="text-xs text-gray-500">Total for {totalQuantity} units</div>
              <div className="text-2xl font-extrabold text-orange-600 leading-none">
                {formatCurrency(totalPayable)}
              </div>

              {/* SMART INSTRUCTION LINE */}
              {!isMOQFull && (
                <div className="text-[11px] mt-1 font-medium">
                  {!hasSelectedVariant && <span className="text-red-600">Select a variant to continue</span>}
                  {hasSelectedVariant && !meetsMinimumQuantity && <span className="text-red-600">Minimum order is 3 units</span>}
                  {hasSelectedVariant && meetsMinimumQuantity && !hasVariantQuantities && <span className="text-red-600">Choose quantity for selected variant</span>}
                  {hasSelectedVariant && meetsMinimumQuantity && hasVariantQuantities && <span className="text-green-600">Ready to secure your units</span>}
                </div>
              )}

              {isMOQFull && (
                <div className="text-xs text-red-300 mt-1 font-semibold">
                  This deal is closed. Join the waitlist for the next batch.
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handleJoinOrder}
              disabled={joining || joined || isMOQFull || (!hasSelectedVariant || !hasVariantQuantities || !meetsMinimumQuantity)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-200 active:scale-95 shadow-lg ${
                joining || joined || isMOQFull || (!hasSelectedVariant || !hasVariantQuantities || !meetsMinimumQuantity)
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : user
                  ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white hover:shadow-2xl'
                  : 'bg-gradient-to-r from-blue-600 to-purple-700 text-white hover:shadow-2xl'
              }`}
            >
              <span className="flex items-center gap-2 justify-center">
                {isMOQFull ? <span>🚫</span> : joining ? <Loader2 className="w-4 h-4 animate-spin" /> : joined ? <Check className="w-4 h-4" /> : !user ? <LogIn className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                {isMOQFull ? 'Deal Closed' : joining ? 'Processing…' : joined ? 'Joined' : !hasSelectedVariant ? 'Select Variant' : !meetsMinimumQuantity ? 'Min 3 Units' : !hasVariantQuantities ? 'Select Quantity' : !user ? 'Sign In' : 'JOIN GROUP IMPORT'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Authentication Prompt Modal */}
      {showAuthModal && (
        <AuthPrompt
          onLogin={handleLoginRedirect}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Wallet Payment Modal */}
      <WalletPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={processPaymentAndJoinOrder}
        totalAmount={totalPayable}
        currentBalance={user?.accountBalance || 0}
        isProcessing={paymentProcessing}
      />

      <style jsx global>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}

// ==================== EXPORT WITH SUSPENSE ====================

export default function CardDetailPageWrapper() {
  return (
    <Suspense fallback={<Loading />}>
      <CardDetailPageContent />
    </Suspense>
  );
}