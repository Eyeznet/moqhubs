"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  ShoppingBag, 
  Filter, 
  Search, 
  Grid, 
  List, 
  Shield, 
  Verified, 
  Globe, 
  TrendingUp,
  Clock,
  Users,
  X,
  ArrowLeft,
  Star,
  TrendingUp as TrendingUpIcon,
  Zap,
  Calendar,
  MapPin,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Percent,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Tag,
  TrendingDown,
  BarChart,
  User,
  LogOut,
  LogIn,
  Menu,
  Lock
} from "lucide-react";

// Firebase imports
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface BulkDeal {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  description?: string;
  moq: number;
  currentOrders: number;
  buyingPrice: number;
  retailPrice: number;
  recommendedPrice: number;
  profitMargin: number;
  estimatedProfitPerUnit: number;
  supplier: string;
  supplierRating: number;
  supplierReviews: number;
  origin: string;
  shippingMethod: string;
  estimatedShippingDays: number;
  shippingCost: number;
  weightPerUnit: number;
  urgency: boolean;
  trending: boolean;
  daysLeft: number;
  expiresAt: string;
  images: string[];
  demoImages?: string[];
  uploaderName: string;
  uploaderVerified: boolean;
  uploaderSuccessRate: number;
  uploaderCompletedDeals: number;
  escrowAmount: number;
  escrowParticipants: number;
  platformFee: number;
  status: string;
  published: boolean;
  approved: boolean;
  targetMarket: string;
  marketPriceRange: string;
  createdAt: any;
  updatedAt: any;
  logisticsPerUnit: number;
  landedCostPerUnit: number;
  features: string[];
  specifications: Record<string, string>;
  trustBadges: Array<{text: string; icon: string; color: string}>;
  timeline: Array<{stage: string; days: string; icon: string}>;
  externalMarketPrices: Array<{
    platform: string;
    price: number;
    url: string;
    verified: boolean;
    rating: number;
    reviews: number;
    shipping: string;
  }>;
  faqs: Array<{question: string; answer: string}>;
  updates: Array<{date: string; title: string; description: string}>;
  views: number;
  shares: number;
  favorites: number;
}

// Fallback images for different categories
const FALLBACK_IMAGES = {
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop&auto=format",
  fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop&auto=format",
  home: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop&auto=format",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop&auto=format",
  sports: "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=400&h=300&fit=crop&auto=format",
  automotive: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop&auto=format",
  default: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&auto=format"
};

// Get fallback image based on category
const getFallbackImage = (category: string = ""): string => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes("electronic") || lowerCategory.includes("mobile")) return FALLBACK_IMAGES.electronics;
  if (lowerCategory.includes("fashion") || lowerCategory.includes("cloth") || lowerCategory.includes("wear")) return FALLBACK_IMAGES.fashion;
  if (lowerCategory.includes("home") || lowerCategory.includes("garden") || lowerCategory.includes("furniture")) return FALLBACK_IMAGES.home;
  if (lowerCategory.includes("beauty") || lowerCategory.includes("health") || lowerCategory.includes("cosmetic")) return FALLBACK_IMAGES.beauty;
  if (lowerCategory.includes("sport") || lowerCategory.includes("outdoor") || lowerCategory.includes("fitness")) return FALLBACK_IMAGES.sports;
  if (lowerCategory.includes("automotive") || lowerCategory.includes("car") || lowerCategory.includes("vehicle")) return FALLBACK_IMAGES.automotive;
  return FALLBACK_IMAGES.default;
};

interface UserType {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export default function AllCardsPage() {
  const [cards, setCards] = useState<BulkDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedShipping, setSelectedShipping] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const cardsPerPage = 12;
  const totalPages = Math.ceil(cards.length / cardsPerPage);

  // Timer effect to update days left every hour
  useEffect(() => {
    if (cards.length === 0) return;

    const timer = setInterval(() => {
      setCards(prevCards => 
        prevCards.map(card => {
          if (!card.expiresAt) return card;
          
          const expiresDate = new Date(card.expiresAt);
          const now = new Date();
          const diffTime = expiresDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            ...card,
            daysLeft: Math.max(0, diffDays)
          };
        })
      );
    }, 3600000); // Update every hour

    return () => clearInterval(timer);
  }, [cards.length]);

  // Set mounted state to avoid hydration errors
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Firebase authentication
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
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
        
        setFirebaseLoaded(true);
        fetchCards();
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Firebase authentication error:", error);
        setFirebaseLoaded(true);
        fetchCards();
      }
    };

    initializeFirebase();
  }, []);

  // Handle click outside mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch cards from Firestore - SIMPLIFIED QUERY
  const fetchCards = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log("Fetching cards from Firestore...");
      
      // SIMPLIFIED: Just get all documents from bulk_deals collection
      const cardsQuery = query(
        collection(db, "bulk_deals"),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      const querySnapshot = await getDocs(cardsQuery);
      console.log(`Found ${querySnapshot.size} documents`);
      
      const fetchedCards: BulkDeal[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Processing document ${doc.id}:`, data.title);
        
        // Calculate days left from expiresAt
        let daysLeft = data.daysLeft || 7;
        if (data.expiresAt) {
          const expiresDate = new Date(data.expiresAt);
          const now = new Date();
          const diffTime = expiresDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          daysLeft = Math.max(0, diffDays);
        }
        
        fetchedCards.push({
          id: doc.id,
          ...data,
          // Ensure required fields have defaults
          moq: data.moq || 100,
          currentOrders: data.currentOrders || 0,
          buyingPrice: data.buyingPrice || 0,
          retailPrice: data.retailPrice || 0,
          recommendedPrice: data.recommendedPrice || 0,
          profitMargin: data.profitMargin || 0,
          images: data.images || [],
          category: data.category || "Uncategorized",
          supplier: data.supplier || "Unknown Supplier",
          origin: data.origin || "China",
          shippingMethod: data.shippingMethod || "sea",
          daysLeft: daysLeft,
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        } as BulkDeal);
      });

      console.log(`Successfully fetched ${fetchedCards.length} cards`);
      
      // Shuffle cards on refresh or initial load
      const shuffledCards = shuffleArray([...fetchedCards]);
      setCards(shuffledCards);
      setHasError(false);
      
      if (initialLoad) {
        setInitialLoad(false);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
      setHasError(true);
      
      // Fallback to sample data if Firebase fails
      console.log("Using fallback sample data...");
      const sampleCards = generateSampleCards();
      // Shuffle sample cards too
      const shuffledSampleCards = shuffleArray([...sampleCards]);
      setCards(shuffledSampleCards);
      setHasError(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialLoad]);

  // Function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Generate sample cards for fallback
  const generateSampleCards = (): BulkDeal[] => {
    return Array.from({ length: 20 }, (_, i) => {
      const categories = ["Electronics", "Fashion", "Home & Garden", "Beauty & Health", "Sports & Outdoors"];
      const origins = ["China", "USA", "Germany", "Japan", "South Korea", "India"];
      const category = categories[i % categories.length];
      const origin = origins[i % origins.length];
      
      // Calculate days left with some variety
      const daysLeft = 30 - (i % 30);
      const expiresDate = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);
      
      return {
        id: `sample_${i + 1}`,
        title: `Sample Product ${i + 1} - ${category}`,
        category,
        moq: 100 + (i * 10),
        currentOrders: Math.floor(Math.random() * 120), // Some may exceed MOQ
        buyingPrice: 5000 + (i * 1000),
        retailPrice: 15000 + (i * 3000),
        recommendedPrice: 12000 + (i * 2500),
        profitMargin: 30 + (i % 20),
        estimatedProfitPerUnit: 5000,
        supplier: `${origin} Supplier ${i + 1}`,
        supplierRating: 4 + Math.random(),
        supplierReviews: Math.floor(Math.random() * 1000),
        origin,
        shippingMethod: i % 2 === 0 ? "sea" : "air",
        estimatedShippingDays: 30 + (i % 30),
        shippingCost: 500,
        weightPerUnit: 2,
        urgency: i % 4 === 0,
        trending: i < 10,
        daysLeft: daysLeft,
        expiresAt: expiresDate.toISOString(),
        images: [getFallbackImage(category)],
        uploaderName: `Uploader ${i + 1}`,
        uploaderVerified: i % 3 === 0,
        uploaderSuccessRate: 90 + (i % 10),
        uploaderCompletedDeals: i * 10,
        escrowAmount: 100000 + (i * 50000),
        escrowParticipants: Math.floor(Math.random() * 50),
        platformFee: 3,
        status: "active",
        published: true,
        approved: true,
        targetMarket: "Nigeria",
        marketPriceRange: "₦10,000 - ₦15,000",
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        logisticsPerUnit: 1500,
        landedCostPerUnit: 6500,
        features: ["Feature 1", "Feature 2", "Feature 3"],
        specifications: { color: "Black", size: "Medium" },
        trustBadges: [{ text: "Verified", icon: "✅", color: "green" }],
        timeline: [{ stage: "Shipping", days: "30 days", icon: "🚢" }],
        externalMarketPrices: [],
        faqs: [],
        updates: [],
        views: Math.floor(Math.random() * 1000),
        shares: Math.floor(Math.random() * 100),
        favorites: Math.floor(Math.random() * 200)
      };
    });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowMobileMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Mobile menu links
  const mobileMenuLinks = useMemo(() => [
    { href: "/about", label: "About Us", icon: <Users className="w-5 h-5" /> },
    { href: "/terms", label: "Terms", icon: <Shield className="w-5 h-5" /> },
    { href: "/bulky-deals", label: "All Deals", icon: <ShoppingBag className="w-5 h-5" /> },
    { href: "/calculator", label: "Calculator", icon: <DollarSign className="w-5 h-5" /> },
    { href: "/auth", label: user ? "Dashboard" : "Login", icon: user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" /> },
  ], [user]);

  // Shuffle cards on page refresh/reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('lastPageLoad', Date.now().toString());
    };

    const handleLoad = () => {
      const lastLoad = localStorage.getItem('lastPageLoad');
      const currentTime = Date.now();
      
      if (!lastLoad || (currentTime - parseInt(lastLoad)) > 2000) {
        if (cards.length > 0) {
          const shuffledCards = shuffleArray([...cards]);
          setCards(shuffledCards);
        }
        localStorage.setItem('lastPageLoad', currentTime.toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, [cards.length]);

  // Check if MOQ is reached
  const isMOQReached = useCallback((currentOrders: number, moq: number) => {
    return currentOrders >= moq;
  }, []);

  // Calculate derived values for each card
  const calculateCardStats = useCallback((card: BulkDeal) => {
    const progressPercentage = card.moq > 0 ? 
      Math.min((card.currentOrders / card.moq) * 100, 100) : 0;
    
    const landedCost = card.landedCostPerUnit || (card.buyingPrice + (card.logisticsPerUnit || 0));
    const profit = card.estimatedProfitPerUnit || (card.retailPrice - landedCost);
    const profitMargin = card.profitMargin || 
      (landedCost > 0 ? Math.round((profit / landedCost) * 100) : 0);
    
    const expiresDate = new Date(card.expiresAt);
    const daysLeft = card.daysLeft || Math.max(
      1, 
      Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    
    const urgency = card.urgency || daysLeft <= 3;
    const trending = card.trending || progressPercentage >= 50;
    const moqReached = isMOQReached(card.currentOrders, card.moq);
    
    return {
      progressPercentage,
      landedCost,
      profit,
      profitMargin,
      daysLeft,
      urgency,
      trending,
      moqReached,
      currentProgress: Math.round(progressPercentage),
      retailPrice: card.retailPrice || card.recommendedPrice || 0,
      buyingPrice: card.buyingPrice || 0
    };
  }, [isMOQReached]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    return cards
      .filter(card => {
        const stats = calculateCardStats(card);
        const matchesSearch = searchTerm === "" || 
          card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (card.category && card.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (card.description && card.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (card.supplier && card.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (card.origin && card.origin.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = selectedCategory === "all" || card.category === selectedCategory;
        const matchesShipping = selectedShipping === "all" || card.shippingMethod === selectedShipping;
        
        return matchesSearch && matchesCategory && matchesShipping;
      })
      .sort((a, b) => {
        const statsA = calculateCardStats(a);
        const statsB = calculateCardStats(b);
        
        switch(sortBy) {
          case "profit":
            return statsB.profitMargin - statsA.profitMargin;
          case "price-low":
            return a.buyingPrice - b.buyingPrice;
          case "price-high":
            return b.buyingPrice - a.buyingPrice;
          case "moq":
            return a.moq - b.moq;
          case "progress":
            return statsB.currentProgress - statsA.currentProgress;
          case "urgency":
            return (statsB.urgency ? 1 : 0) - (statsA.urgency ? 1 : 0);
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "retail-low":
            return statsA.retailPrice - statsB.retailPrice;
          case "retail-high":
            return statsB.retailPrice - statsA.retailPrice;
          default: // trending
            return (statsB.trending ? 1 : 0) - (statsA.trending ? 1 : 0);
        }
      });
  }, [cards, searchTerm, selectedCategory, selectedShipping, sortBy, calculateCardStats]);

  // Lazy loading pagination
  const [loadedCards, setLoadedCards] = useState(cardsPerPage);
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (filteredCards.length <= loadedCards) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && loadedCards < filteredCards.length) {
          setLoadedCards(prev => Math.min(prev + cardsPerPage, filteredCards.length));
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('load-more-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [filteredCards.length, loadedCards]);

  // Current cards for display with lazy loading
  const currentCards = useMemo(() => {
    return filteredCards.slice(0, loadedCards);
  }, [filteredCards, loadedCards]);

  // Categories from filtered cards
  const categories = useMemo(() => {
    const uniqueCategories = new Set(cards.map(card => card.category).filter(Boolean));
    return ["all", ...Array.from(uniqueCategories)].slice(0, 6);
  }, [cards]);

  // Shipping methods from filtered cards
  const shippingMethods = useMemo(() => {
    const uniqueShipping = new Set(cards.map(card => card.shippingMethod).filter(Boolean));
    return ["all", ...Array.from(uniqueShipping)];
  }, [cards]);

  // Origins from filtered cards
  const origins = useMemo(() => {
    const uniqueOrigins = new Set(cards.map(card => card.origin).filter(Boolean));
    return Array.from(uniqueOrigins);
  }, [cards]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedShipping, sortBy]);

  // Don't render until mounted to avoid hydration errors
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-16 safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-3 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isMobile && (
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-4 h-4 text-gray-600" />
              </button>
            )}
            
            <Link 
              href="/" 
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
            
            <div>
              <h1 className="text-sm font-bold text-gray-900">Bulk Group Deals</h1>
              <p className="text-[10px] text-gray-500">
                {filteredCards.length} active deals • {cards.length} total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Mobile Menu */}
            {showMobileMenu && isMobile && (
              <div 
                ref={mobileMenuRef}
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 mt-1 p-3"
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
                  
                  {/* Logout Link in Mobile Menu if logged in */}
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
            
            <button
              onClick={() => fetchCards(true)}
              disabled={refreshing}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              aria-label="Refresh deals"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? (
                <List className="w-4 h-4 text-gray-600" />
              ) : (
                <Grid className="w-4 h-4 text-gray-600" />
              )}
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 rounded transition-colors ${showFilters ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-600'}`}
              aria-label="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            
            {/* Auth Button for Desktop */}
            {!isMobile && (
              <Link
                href="/auth"
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label={user ? "Dashboard" : "Login"}
              >
                {user ? (
                  <User className="w-4 h-4 text-gray-600" />
                ) : (
                  <LogIn className="w-4 h-4 text-gray-600" />
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-1.5">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search deals by title, category, supplier, or origin..."
            className="w-full pl-8 pr-8 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            aria-label="Search deals"
          />
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-600">
          <span className="flex items-center gap-0.5">
            <Globe className="w-3 h-3 text-blue-600" />
            <span>{origins.length} Origins</span>
          </span>
          <span className="flex items-center gap-0.5">
            <ShoppingCart className="w-3 h-3 text-green-600" />
            <span>Buy Direct</span>
          </span>
          <span className="flex items-center gap-0.5">
            <Tag className="w-3 h-3 text-purple-600" />
            <span>Retail Prices</span>
          </span>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="mt-1.5 p-1.5 bg-white rounded-lg border border-gray-200 shadow-lg animate-slideDown">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 flex items-center gap-0.5">
                  <Package className="w-3 h-3" />
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-1.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  aria-label="Filter by category"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 flex items-center gap-0.5">
                  <Truck className="w-3 h-3" />
                  Shipping
                </label>
                <select
                  value={selectedShipping}
                  onChange={(e) => setSelectedShipping(e.target.value)}
                  className="w-full px-1.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  aria-label="Filter by shipping method"
                >
                  {shippingMethods.map(method => (
                    <option key={method} value={method}>
                      {method === "all" ? "All Shipping" : method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-1.5">
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5 flex items-center gap-0.5">
                <TrendingUpIcon className="w-3 h-3" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-1.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                aria-label="Sort deals"
              >
                <option value="trending">🔥 Trending</option>
                <option value="profit">💰 High Profit</option>
                <option value="retail-low">🛒 Retail: Low to High</option>
                <option value="retail-high">🛒 Retail: High to Low</option>
                <option value="progress">📈 Fast Filling</option>
                <option value="urgency">⏰ Ending Soon</option>
                <option value="price-low">⬇️ Buy Price: Low to High</option>
                <option value="price-high">⬆️ Buy Price: High to Low</option>
                <option value="moq">📦 Low MOQ</option>
                <option value="newest">🆕 Newest</option>
              </select>
            </div>
            
            <div className="mt-1.5 pt-1.5 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">
                  {currentCards.length} of {filteredCards.length} deals
                </span>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedShipping("all");
                    setSortBy("trending");
                    setSearchTerm("");
                  }}
                  className="text-[10px] text-orange-600 hover:text-orange-700 font-medium px-2 py-0.5 hover:bg-orange-50 rounded transition-colors"
                  aria-label="Reset all filters"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="px-1.5 py-2">
        {/* Loading State */}
        {loading && initialLoad ? (
          <div className="space-y-1.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-1.5 animate-pulse">
                <div className="flex gap-1.5">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2.5 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Empty State */}
            {filteredCards.length === 0 && !hasError && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">No deals available yet</h3>
                <p className="text-gray-600 text-xs mb-4">Be the first to explore bulk deals!</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setSelectedShipping("all");
                      setSortBy("trending");
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-200 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Error State */}
            {hasError && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Connection Error</h3>
                <p className="text-gray-600 text-xs mb-4">Showing sample data. Check your Firebase connection.</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => fetchCards(true)}
                    disabled={refreshing}
                    className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm rounded-lg font-bold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {refreshing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reconnecting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Retry Connection
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Cards Grid/List View */}
            {filteredCards.length > 0 && (
              <>
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                    {currentCards.map((card) => {
                      const stats = calculateCardStats(card);
                      return (
                        <CardGridItem 
                          key={card.id} 
                          card={card} 
                          stats={stats}
                          formatCurrency={formatCurrency} 
                        />
                      );
                    })}
                  </div>
                ) : (
                  // List View
                  <div className="space-y-1.5">
                    {currentCards.map((card) => {
                      const stats = calculateCardStats(card);
                      return (
                        <CardListItem 
                          key={card.id} 
                          card={card} 
                          stats={stats}
                          formatCurrency={formatCurrency} 
                        />
                      );
                    })}
                  </div>
                )}

                {/* Price Insights Section */}
                <div className="mt-3 mb-13 p-1.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <h3 className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Price Insights
                  </h3>
                  <div className="grid grid-cols-4 gap-1">
                    <div className="text-center p-0.5">
                      <div className="text-sm font-bold text-blue-700">
                        {formatCurrency(Math.round(filteredCards.reduce((sum, card) => sum + card.buyingPrice, 0) / filteredCards.length)).replace('NGN', '₦')}
                      </div>
                      <div className="text-[9px] text-blue-600">Avg Buy Price</div>
                    </div>
                    <div className="text-center p-0.5">
                      <div className="text-sm font-bold text-green-700">
                        {formatCurrency(Math.round(filteredCards.reduce((sum, card) => {
                          const stats = calculateCardStats(card);
                          return sum + stats.retailPrice;
                        }, 0) / filteredCards.length)).replace('NGN', '₦')}
                      </div>
                      <div className="text-[9px] text-green-600">Avg Retail Price</div>
                    </div>
                    <div className="text-center p-0.5">
                      <div className="text-sm font-bold text-purple-700">
                        {Math.round(filteredCards.reduce((sum, card) => {
                          const stats = calculateCardStats(card);
                          return sum + stats.profitMargin;
                        }, 0) / filteredCards.length)}%
                      </div>
                      <div className="text-[9px] text-purple-600">Avg Profit Margin</div>
                    </div>
                    <div className="text-center p-0.5">
                      <div className="text-sm font-bold text-orange-700">
                        {Math.round(filteredCards.reduce((sum, card) => {
                          const stats = calculateCardStats(card);
                          return sum + stats.currentProgress;
                        }, 0) / filteredCards.length)}%
                      </div>
                      <div className="text-[9px] text-orange-600">Avg Progress</div>
                    </div>
                  </div>
                </div>

                {/* Load More Sentinel for Infinite Scroll */}
                {loadedCards < filteredCards.length && (
                  <div id="load-more-sentinel" className="h-4 flex items-center justify-center my-4">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  </div>
                )}

                {/* Pagination (Fallback) */}
                {filteredCards.length > cardsPerPage && loadedCards >= filteredCards.length && (
                  <div className="mt-3 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setLoadedCards(cardsPerPage);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        aria-label="Show less"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.min(5, Math.ceil(filteredCards.length / cardsPerPage)) }, (_, i) => {
                          const pageNum = i + 1;
                          const isCurrentPage = loadedCards >= pageNum * cardsPerPage && 
                                              loadedCards < (pageNum + 1) * cardsPerPage;
                          
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setLoadedCards(pageNum * cardsPerPage);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-all ${
                                isCurrentPage
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                              aria-label={`Page ${pageNum}`}
                              aria-current={isCurrentPage ? "page" : undefined}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => {
                          const newLoaded = Math.min(loadedCards + cardsPerPage, filteredCards.length);
                          setLoadedCards(newLoaded);
                        }}
                        disabled={loadedCards >= filteredCards.length}
                        className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        aria-label="Load more"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      Showing {Math.min(loadedCards, filteredCards.length)} of {filteredCards.length} deals
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around py-2 safe-area-bottom shadow-lg z-50">
        <Link href="/" className="flex flex-col items-center text-gray-600 hover:text-orange-600 transition-colors">
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium mt-0.5">Home</span>
        </Link>
        <Link href="/bulky-cards" className="flex flex-col items-center text-orange-600">
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs font-medium mt-0.5">Deals</span>
        </Link>
        <Link href="/faq" className="flex flex-col items-center text-gray-600 hover:text-orange-600 transition-colors">
          <BarChart className="w-5 h-5" />
          <span className="text-xs font-medium mt-0.5">FAQ ❓</span>
        </Link>
        <Link href="/auth" className="flex flex-col items-center text-gray-600 hover:text-orange-600 transition-colors">
          <User className="w-5 h-5" />
          <span className="text-xs font-medium mt-0.5">{user ? "Dashboard" : "Login"}</span>
        </Link>
      </nav>

      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .truncate-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .card-hover {
          transition: all 0.2s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .card-hover:active {
          transform: translateY(0);
        }

        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </main>
  );
}

// Grid View Card Component
function CardGridItem({ 
  card, 
  stats, 
  formatCurrency 
}: { 
  card: BulkDeal; 
  stats: any;
  formatCurrency: (amount: number) => string 
}) {
  return (
    <Link
      href={`/card-detail?id=${card.id}`}
      className="block bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm card-hover overflow-hidden"
      aria-label={`View ${card.title} details`}
    >
      {/* Card Image - 2/3 of container height */}
      <div className="relative h-48 rounded-t-lg overflow-hidden">
        {card.images && card.images.length > 0 ? (
          <img
            src={card.images[0]}
            alt={card.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getFallbackImage(card.category);
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/1 via-black/1 to-transparent" />
        
        <div className="absolute top-6 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-lg shadow-lg flex flex-col items-center justify-center">
          <div className="text-[11px] opacity-90">Factory Price/Unit</div>
          <div className="text-[16px] font-black">{formatCurrency(stats.buyingPrice)}</div>
        </div>
        
        {/* Badges */}
        <div className="absolute top-1 left-1 right-1 flex justify-between items-start">
          <div className="flex flex-wrap gap-0.5">
            {card.uploaderVerified && (
              <div className="bg-green-600 text-white text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                <Verified className="w-2.5 h-2.5" />
                <span>Verified</span>
              </div>
            )}
            
            {/* MOQ Reached Badge */}
            {stats.moqReached && (
              <div className="bg-purple-600 text-white text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" />
                <span>MOQ Filled</span>
              </div>
            )}
            
            {stats.urgency && !stats.moqReached && (
              <div className="bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span>{stats.daysLeft}d left</span>
              </div>
            )}
            
            {stats.trending && !stats.moqReached && (
              <div className="bg-orange-500 text-white text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />
                <span>Trending</span>
              </div>
            )}
          </div>
          
          <div className="bg-black/70 text-white text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
            <Percent className="w-2.5 h-2.5" />
            <span>{stats.profitMargin}%</span>
          </div>
        </div>
        
        {/* Progress Bar - Changed color if MOQ reached */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex justify-between text-white text-xs mb-0.5">
            <span className="font-medium">
              {card.currentOrders}/{card.moq} units
            </span>
            <span className="font-bold">{stats.currentProgress}%</span>
          </div>
          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${
                stats.moqReached ? 'from-purple-400 to-purple-500' : 'from-green-400 to-green-500'
              }`}
              style={{ width: `${stats.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Body - 1/3 of container */}
      <div className="p-1">
        {/* Title & Category */}
        <div className="mb-1">
          <h3 className="font-semibold text-[11px] text-gray-900 leading-tight truncate">
            {card.title}
          </h3>

          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] px-1 py-[1px] bg-blue-100 text-blue-700 rounded">
              {card.category}
            </span>

            {card.shippingMethod && !stats.moqReached && (
              <span className="text-[9px] text-gray-600 flex items-center gap-0.5">
                <Truck className="w-2 h-2" />
                {card.shippingMethod}
              </span>
            )}
          </div>
        </div>

        {/* Price Comparison - Hide profit if MOQ reached */}
        <div className="space-y-1 mb-1">
          {/* Buying Price */}
          <div className="flex items-center justify-between p-1 bg-gray-50 rounded">
          </div>

          {/* Retail & Profit */}
          {!stats.moqReached ? (
            <div className="grid grid-cols-2 gap-1">
              <div className="p-1 bg-green-50 rounded border border-green-200 text-center">
                <div className="text-[9px] text-gray-500 leading-none">
                  You can Sell for
                </div>
                <div className="text-[11px] font-bold text-green-700 leading-tight">
                  {formatCurrency(stats.retailPrice)}
                </div>
              </div>

              <div className="p-1 bg-orange-50 rounded border border-orange-200 text-center">
                <div className="text-[9px] text-gray-500 leading-none">
                  Make Profit of
                </div>
                <div className="text-[11px] font-bold text-orange-700 leading-tight">
                  {formatCurrency(stats.profit)}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-1 bg-purple-50 rounded border border-purple-200 text-center">
              <div className="text-[9px] text-purple-600 leading-none font-semibold">
                ✅ Minimum Order Quantity Filled
              </div>
              <div className="text-[10px] text-purple-700 font-medium mt-0.5">
                Deal is closed for new Buyers
              </div>
            </div>
          )}

          {/* Shipping Info */}
          <div className="flex items-center justify-between text-[9px] text-gray-600">
            <span className="flex items-center gap-0.5">
              <MapPin className="w-2 h-2" />
              {card.origin}
            </span>

            <span className="flex items-center gap-0.5">
              <Calendar className="w-2 h-2" />
              {card.estimatedShippingDays}d
            </span>
          </div>
        </div>

        {/* Action Button - Changed when MOQ reached */}
        {stats.moqReached ? (
          <button className="w-full bg-purple-600 text-white text-[11px] py-1.5 rounded font-semibold flex items-center justify-center gap-1 cursor-default opacity-90">
            <Lock className="w-3 h-3" />
            Deal Closed
          </button>
        ) : (
          <button className="w-full bg-orange-600 text-white text-[11px] py-1.5 rounded font-semibold active:scale-[0.98] transition">
            Join Group Buy
          </button>
        )}
      </div>
    </Link>
  );
}

// List View Card Component
function CardListItem({ 
  card, 
  stats, 
  formatCurrency 
}: { 
  card: BulkDeal; 
  stats: any;
  formatCurrency: (amount: number) => string 
}) {
  return (
    <Link
      href={`/card-detail?id=${card.id}`}
      className="block bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-2 card-hover"
      aria-label={`View ${card.title} details`}
    >
      <div className="flex gap-2">
        {/* Image - Larger in list view */}
        <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
          {card.images && card.images.length > 0 ? (
            <img
              src={card.images[0]}
              alt={card.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getFallbackImage(card.category);
              }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
          )}
          
          {/* MOQ Reached Badge on Image */}
          {stats.moqReached && (
            <div className="absolute top-1 left-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow">
              <CheckCircle className="w-2.5 h-2.5" />
              <span>MOQ Filled</span>
            </div>
          )}
          
          {/* Progress Indicator */}
          <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  stats.moqReached ? 'bg-purple-400' : 'bg-green-400'
                }`}
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 truncate-1 mb-0.5">
                {card.title}
              </h3>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  {card.category}
                </span>
                {card.subCategory && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                    {card.subCategory}
                  </span>
                )}
                {stats.urgency && !stats.moqReached && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {stats.daysLeft}d left
                  </span>
                )}
              </div>
            </div>
            
            {card.uploaderVerified && (
              <Verified className="w-4 h-4 text-green-600 flex-shrink-0 ml-1" />
            )}
          </div>

          {/* Price Comparison - Different if MOQ reached */}
          {!stats.moqReached ? (
            <div className="grid grid-cols-3 gap-1 mb-2">
              <div className="text-center p-1 bg-blue-50 rounded">
                <div className="text-[10px] text-gray-500">Buy from {card.origin}</div>
                <div className="text-sm font-bold text-blue-600">
                  {formatCurrency(stats.buyingPrice)}
                </div>
              </div>
              
              <div className="text-center p-1 bg-green-50 rounded">
                <div className="text-[10px] text-gray-500">Retail Price</div>
                <div className="text-sm font-bold text-green-600">
                  {formatCurrency(stats.retailPrice)}
                </div>
              </div>
              
              <div className="text-center p-1 bg-orange-50 rounded">
                <div className="text-[10px] text-gray-500">You Profit</div>
                <div className="text-sm font-bold text-orange-600">
                  {stats.profitMargin}%
                </div>
                <div className="text-[9px] text-orange-600">
                  {formatCurrency(stats.profit)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-700">
                    MOQ Filled - Deal Closed
                  </span>
                </div>
                <span className="text-[10px] text-purple-600">
                  {card.currentOrders}/{card.moq} units joined
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium">{card.currentOrders}/{card.moq}</span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Globe className="w-3.5 h-3.5" />
                <span>{card.supplier}</span>
              </div>
            </div>
            
            {stats.moqReached ? (
              <button className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs rounded-lg font-bold flex items-center gap-1 cursor-default opacity-90">
                <Lock className="w-3 h-3" />
                Deal Closed
              </button>
            ) : (
              <button className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-lg font-bold hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all shadow">
                Join Now
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}