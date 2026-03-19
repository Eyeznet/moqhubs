"use client";

import Link from "next/link";
import { TrendingUp, Users, Shield, Zap, Clock, Star, CheckCircle, Package, Globe, ShoppingBag, DollarSign, Percent, Truck, Calculator, Lock, Verified, Search, Home, User, Plus, ChevronRight, ShoppingCart, BarChart, X, ArrowRight, ArrowLeft, Filter, Clock as ClockIcon, TrendingUp as TrendingIcon, Menu, LogOut, LogIn, MapPin, Flame } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Firebase imports will be lazy loaded

// Define TypeScript interfaces
interface BulkDeal {
  id: string;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  origin: string;
  targetMarket: string;
  status: string;
  published: boolean;
  approved: boolean;
  trending: boolean;
  urgency: boolean;
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
  shippingMethod: string;
  shippingCost: number;
  estimatedShippingDays: number;
  daysLeft: number;
  weightPerUnit: number;
  airFreightPerKg: number;
  seaFreightPerKg: number;
  customsPerKg: number;
  moq: number;
  currentOrders: number;
  images: string[];
  features: string[];
  faqs: Array<{ question: string; answer: string }>;
  specifications: Array<{ key: string; value: string }>;
  externalMarketPrices: Array<{ platform: string; price: number }>;
  timeline: Array<{ stage: string; days: number; icon: string }>;
  trustBadges: Array<{ icon: string; text: string; color: string }>;
  favorites: number;
  shares: number;
  views: number;
  updates: Array<{ date: string; message: string }>;
  supplier: string;
  supplierRating: number;
  supplierReviews: number;
  uploaderName: string;
  uploaderEmail: string;
  uploaderPhone: string;
  uploaderWhatsApp: string;
  uploaderJoinDate: string;
  uploaderCompletedDeals: number;
  uploaderSuccessRate: number;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  expiresAt: any;
  lastUpdatedBy: string;
}

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  stats: string;
}

interface Category {
  value: string;
  label: string;
  icon: string;
  firebaseValue?: string;
}

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(true);
  const [calculator, setCalculator] = useState({
    buyingPrice: 5000,
    retailPrice: 10000,
    quantity: 10,
    shipping: 500,
    platformFee: 3
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bulkDeals, setBulkDeals] = useState<BulkDeal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<BulkDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showCategories, setShowCategories] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [shuffledDeals, setShuffledDeals] = useState<BulkDeal[]>([]);
  const [showLoading, setShowLoading] = useState(true);
  const [autoSlideStopped, setAutoSlideStopped] = useState(false);
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const infiniteSlideRef = useRef<HTMLDivElement>(null);

  // Static hero slides
  const heroSlides: HeroSlide[] = [
    {
      id: 1,
      title: "Import Like Big Traders",
      subtitle: "Join group orders and pay only for what you need, no big capital required",
      image: "/images/hero/1.webp",
      stats: "Start with as low as ₦5,000"
    },
    {
      id: 2,
      title: "Access Verified Factories",
      subtitle: "Source directly from 1688, Alibaba, Taobao and other trusted suppliers",
      image: "/images/hero/2.webp",
      stats: "100+ Active Products"
    },
    {
      id: 3,
      title: "Safe & Transparent Payments",
      subtitle: "Your funds are held in escrow until group orders are fulfilled",
      image: "/images/hero/3.webp",
      stats: "₦50M+ Securely Escrowed"
    }
  ];

  const baseCategories: Category[] = [
    { value: "", label: "All Categories", icon: "📦" },
    { value: "electronics", label: "Electronics", icon: "📱" },
    { value: "fashion", label: "Fashion & Clothing", icon: "👕" },
    { value: "home_garden", label: "Home & Garden", icon: "🏠" },
    { value: "beauty_health", label: "Beauty & Health", icon: "💄" },
    { value: "sports_outdoors", label: "Sports & Outdoors", icon: "⚽" },
    { value: "automotive", label: "Automotive", icon: "🚗" },
    { value: "toys_games", label: "Toys & Games", icon: "🎮" },
    { value: "office_supplies", label: "Office Supplies", icon: "📎" },
    { value: "food_beverages", label: "Food & Beverages", icon: "🍔" },
    { value: "pet_supplies", label: "Pet Supplies", icon: "🐕" },
    { value: "baby_kids", label: "Baby & Kids", icon: "👶" },
    { value: "jewelry_accessories", label: "Jewelry & Accessories", icon: "💎" },
    { value: "industrial_supplies", label: "Industrial & Supplies", icon: "⚙️" },
    { value: "other", label: "Other", icon: "📦" }
  ];

  // Lazy load Firebase
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const firebase = await import('@/lib/firebase');
        const { auth, db } = firebase;
        const { onAuthStateChanged } = await import("firebase/auth");
        
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
        fetchBulkDeals(db);
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Firebase initialization error:", error);
        setFirebaseLoaded(true);
        // Fetch bulk deals even if Firebase fails
        fetchBulkDeals(null);
      }
    };

    initializeFirebase();
  }, []);

  // Timer effect to update days left every hour
  useEffect(() => {
    if (bulkDeals.length === 0) return;

    const timer = setInterval(() => {
      setBulkDeals(prevDeals => 
        prevDeals.map(deal => {
          if (!deal.expiresAt) return deal;
          
          let expiresAtDate;
          if (deal.expiresAt?.toDate) {
            expiresAtDate = deal.expiresAt.toDate();
          } else if (deal.expiresAt?.seconds) {
            expiresAtDate = new Date(deal.expiresAt.seconds * 1000);
          } else {
            expiresAtDate = new Date(deal.expiresAt);
          }
          
          const now = new Date();
          const diffTime = expiresAtDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            ...deal,
            daysLeft: Math.max(0, diffDays)
          };
        })
      );
    }, 3600000); // Update every hour

    return () => clearInterval(timer);
  }, [bulkDeals.length]);

  const handleLogout = async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
      setShowMobileMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Optimized shuffle array function
  const shuffleArray = useCallback((array: BulkDeal[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Fetch bulk deals from Firebase
  const fetchBulkDeals = useCallback(async (db: any) => {
    try {
      setLoading(true);
      
      // Initialize empty arrays
      setBulkDeals([]);
      setShuffledDeals([]);
      setFilteredDeals([]);
      setAvailableCategories(baseCategories);
      
      // Try to fetch real data from Firebase if available
      if (db) {
        try {
          const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore");
          
          const q = query(
            collection(db, "bulk_deals"),
            orderBy("createdAt", "desc"),
            limit(20)
          );
          
          const querySnapshot = await getDocs(q);
          const deals: BulkDeal[] = [];
          const categorySet = new Set<string>();

          querySnapshot.forEach((doc: any) => {
            const data = doc.data();
            
            // Calculate days left from expiresAt
            let daysLeft = data.daysLeft || 7;
            if (data.expiresAt) {
              let expiresAtDate;
              if (data.expiresAt?.toDate) {
                expiresAtDate = data.expiresAt.toDate();
              } else if (data.expiresAt?.seconds) {
                expiresAtDate = new Date(data.expiresAt.seconds * 1000);
              } else {
                expiresAtDate = new Date(data.expiresAt);
              }
              const now = new Date();
              const diffTime = expiresAtDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              daysLeft = Math.max(0, diffDays);
            }
            
            const deal: BulkDeal = {
              id: doc.id,
              title: data.title || "Untitled Deal",
              description: data.description || "",
              category: data.category || "other",
              subCategory: data.subCategory || "",
              origin: data.origin || "China",
              targetMarket: data.targetMarket || "Nigeria",
              status: data.status || "active",
              published: data.published !== false,
              approved: data.approved !== false,
              trending: data.trending || false,
              urgency: data.urgency || false,
              buyingPrice: Number(data.buyingPrice) || 0,
              retailPrice: Number(data.retailPrice) || 0,
              recommendedPrice: Number(data.recommendedPrice) || 0,
              marketPriceRange: data.marketPriceRange || "",
              estimatedProfitPerUnit: Number(data.estimatedProfitPerUnit) || 0,
              profitMargin: Number(data.profitMargin) || 0,
              landedCostPerUnit: Number(data.landedCostPerUnit) || 0,
              logisticsPerUnit: Number(data.logisticsPerUnit) || 0,
              platformFee: Number(data.platformFee) || 3,
              escrowAmount: Number(data.escrowAmount) || 0,
              escrowParticipants: Number(data.escrowParticipants) || 0,
              shippingMethod: data.shippingMethod || "Air Freight",
              shippingCost: Number(data.shippingCost) || 0,
              estimatedShippingDays: Number(data.estimatedShippingDays) || 14,
              daysLeft: daysLeft,
              weightPerUnit: Number(data.weightPerUnit) || 0,
              airFreightPerKg: Number(data.airFreightPerKg) || 0,
              seaFreightPerKg: Number(data.seaFreightPerKg) || 0,
              customsPerKg: Number(data.customsPerKg) || 0,
              moq: Number(data.moq) || 50,
              currentOrders: Number(data.currentOrders) || 0,
              images: data.images || [],
              features: data.features || [],
              faqs: data.faqs || [],
              specifications: data.specifications || [],
              externalMarketPrices: data.externalMarketPrices || [],
              timeline: data.timeline || [],
              trustBadges: data.trustBadges || [],
              favorites: Number(data.favorites) || 0,
              shares: Number(data.shares) || 0,
              views: Number(data.views) || 0,
              updates: data.updates || [],
              supplier: data.supplier || "Trusted Supplier",
              supplierRating: Number(data.supplierRating) || 0,
              supplierReviews: Number(data.supplierReviews) || 0,
              uploaderName: data.uploaderName || "",
              uploaderEmail: data.uploaderEmail || "",
              uploaderPhone: data.uploaderPhone || "",
              uploaderWhatsApp: data.uploaderWhatsApp || "",
              uploaderJoinDate: data.uploaderJoinDate || "",
              uploaderCompletedDeals: Number(data.uploaderCompletedDeals) || 0,
              uploaderSuccessRate: Number(data.uploaderSuccessRate) || 0,
              createdBy: data.createdBy || "",
              createdAt: data.createdAt || new Date(),
              updatedAt: data.updatedAt || new Date(),
              expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              lastUpdatedBy: data.lastUpdatedBy || ""
            };
            
            if (deal.title && deal.buyingPrice > 0 && deal.retailPrice > 0) {
              deals.push(deal);
              
              if (deal.category) {
                categorySet.add(deal.category.toLowerCase());
              }
            }
          });

          // Update with real data
          if (deals.length > 0) {
            setBulkDeals(deals);
            const shuffled = shuffleArray(deals);
            setShuffledDeals(shuffled);
            setFilteredDeals(shuffled);
            
            updateAvailableCategories(deals, categorySet);
          } else {
            // If no deals found, keep empty state
            setBulkDeals([]);
            setShuffledDeals([]);
            setFilteredDeals([]);
          }
        } catch (firestoreError) {
          console.error("Firestore error:", firestoreError);
          // Keep empty state if Firestore fails
          setBulkDeals([]);
          setShuffledDeals([]);
          setFilteredDeals([]);
        }
      }
      
    } catch (error) {
      console.error("Error in fetchBulkDeals:", error);
      // Keep empty state if everything fails
      setBulkDeals([]);
      setShuffledDeals([]);
      setFilteredDeals([]);
    } finally {
      setLoading(false);
      setShowLoading(false);
    }
  }, [shuffleArray]);

  const updateAvailableCategories = useCallback((deals: BulkDeal[], categorySet: Set<string>) => {
    const categoriesFromFirebase = Array.from(categorySet);
    
    const addedCategories = new Map<string, Category>();
    
    const availableCats: Category[] = [{ 
      value: "", 
      label: "All Categories", 
      icon: "📦" 
    }];
    addedCategories.set("", { value: "", label: "All Categories", icon: "📦" });
    
    categoriesFromFirebase.forEach(fbCategory => {
      if (!fbCategory || fbCategory.trim() === "") return;
      
      const lowerCaseFbCategory = fbCategory.toLowerCase().trim();
      
      if (addedCategories.has(lowerCaseFbCategory)) return;
      
      let matchedBaseCategory: Category | undefined;
      
      for (const baseCat of baseCategories) {
        if (!baseCat.value) continue;
        
        if (baseCat.firebaseValue?.toLowerCase() === lowerCaseFbCategory) {
          matchedBaseCategory = baseCat;
          break;
        }
        
        if (baseCat.value.toLowerCase() === lowerCaseFbCategory) {
          matchedBaseCategory = baseCat;
          break;
        }
        
        const baseCatKeywords = baseCat.label.toLowerCase().split(/[ &]+/);
        const hasKeyword = baseCatKeywords.some(keyword => 
          lowerCaseFbCategory.includes(keyword)
        );
        
        if (hasKeyword) {
          matchedBaseCategory = baseCat;
          break;
        }
      }
      
      const categoryEntry: Category = {
        value: fbCategory,
        label: matchedBaseCategory?.label || 
               fbCategory.charAt(0).toUpperCase() + fbCategory.slice(1).replace(/_/g, ' '),
        icon: matchedBaseCategory?.icon || "📦"
      };
      
      availableCats.push(categoryEntry);
      addedCategories.set(lowerCaseFbCategory, categoryEntry);
    });
    
    setAvailableCategories(availableCats);
  }, []);

  // Filter deals based on search and category - Optimized with useMemo
  const filteredDealsMemo = useMemo(() => {
    let filtered = shuffledDeals;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.title.toLowerCase().includes(query) ||
        deal.description.toLowerCase().includes(query) ||
        deal.category.toLowerCase().includes(query) ||
        deal.supplier.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(deal => 
        deal.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    return filtered;
  }, [searchQuery, selectedCategory, shuffledDeals]);

  useEffect(() => {
    setFilteredDeals(filteredDealsMemo);
  }, [filteredDealsMemo]);

  // Get search suggestions
  const getSearchSuggestions = useCallback(() => {
    const suggestions = new Set<string>();
    
    shuffledDeals.forEach(deal => {
      suggestions.add(deal.title);
      if (deal.category) suggestions.add(deal.category);
      if (deal.supplier) suggestions.add(deal.supplier);
    });
    
    const popularSearches = [
      "Wireless Earbuds",
      "Smart Watch",
      "Power Bank",
      "LED Lights",
      "T-Shirts",
      "Solar Panel",
      "Inverter",
      "Phone Cases",
      "Bluetooth Speaker",
      "Fashion Items",
      "Home Appliances",
      "Electronics"
    ];
    
    popularSearches.forEach(search => suggestions.add(search));
    
    return Array.from(suggestions).filter(suggestion => 
      suggestion.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [searchQuery, shuffledDeals]);

  // Main useEffect for initialization
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    
    const resizeHandler = () => checkMobile();
    window.addEventListener('resize', resizeHandler);

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    const slideInterval = setInterval(() => {
      if (!autoSlideStopped) {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }
    }, 5000);

    const loadingTimeout = setTimeout(() => {
      setShowLoading(false);
    }, 300);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(slideInterval);
      clearTimeout(loadingTimeout);
    };
  }, [autoSlideStopped, firebaseLoaded]);

  // Calculate profit
  const calculateProfit = useCallback(() => {
    const totalShippingCost = calculator.shipping * calculator.quantity;
    const totalCost = (calculator.buyingPrice * calculator.quantity) + totalShippingCost;
    const totalRevenue = calculator.retailPrice * calculator.quantity;
    const platformFeeAmount = (totalRevenue * calculator.platformFee) / 100;
    const netProfit = totalRevenue - totalCost - platformFeeAmount;
    const profitMargin = ((netProfit / totalCost) * 100).toFixed(1);
    
    return {
      totalCost,
      totalRevenue,
      platformFeeAmount,
      netProfit,
      profitMargin,
      totalShippingCost
    };
  }, [calculator]);

  const profitData = calculateProfit();

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSearchSuggestions(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Get placeholder image
  const getCardImage = useCallback((deal: BulkDeal) => {
    if (deal.images && deal.images.length > 0 && deal.images[0]) {
      return deal.images[0];
    }
    
    // Return a generic placeholder if no image available
    return "/images/placeholder.jpg";
  }, []);

  const getHeroImage = useCallback((imagePath: string) => {
    // Use absolute paths
    const heroImages = [
      "/images/hero/3.webp",
      "/images/hero/2.webp", 
      "/images/hero/1.webp"
    ];
    
    if (!imagePath || imagePath.trim() === '') {
      const randomIndex = Math.floor(Math.random() * heroImages.length);
      return heroImages[randomIndex];
    }
    
    // If path is already a full URL, return as-is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Handle local paths
    const match = imagePath.match(/(\d+)\.webp$/);
    if (match) {
      const index = parseInt(match[1]) - 1;
      return heroImages[index % heroImages.length];
    }
    
    // Default to first hero image
    return heroImages[0];
  }, []);

  // Calculate progress percentage
  const calculateProgress = useCallback((current: number, total: number) => {
    return Math.min((current / total) * 100, 100);
  }, []);

  // Check if MOQ is reached
  const isMOQReached = useCallback((deal: BulkDeal) => {
    return deal.currentOrders >= deal.moq;
  }, []);

  // Get category icon
  const getCategoryIcon = useCallback((categoryValue: string) => {
    const availableCat = availableCategories.find(c => 
      c.value.toLowerCase() === categoryValue.toLowerCase()
    );
    if (availableCat) return availableCat.icon;
    
    const baseCat = baseCategories.find(c => 
      c.value.toLowerCase() === categoryValue.toLowerCase() ||
      c.firebaseValue?.toLowerCase() === categoryValue.toLowerCase()
    );
    
    return baseCat ? baseCat.icon : "📦";
  }, [availableCategories]);

  // Get category label
  const getCategoryLabel = useCallback((categoryValue: string) => {
    const availableCat = availableCategories.find(c => 
      c.value.toLowerCase() === categoryValue.toLowerCase()
    );
    if (availableCat) return availableCat.label;
    
    const baseCat = baseCategories.find(c => 
      c.value.toLowerCase() === categoryValue.toLowerCase() ||
      c.firebaseValue?.toLowerCase() === categoryValue.toLowerCase()
    );
    
    return baseCat ? baseCat.label : categoryValue;
  }, [availableCategories]);

  // Navigation links for mobile menu
  const mobileMenuLinks = useMemo(() => [
    { href: "/about", label: "About Us", icon: <Users className="w-5 h-5" /> },
    { href: "/terms", label: "Terms", icon: <Shield className="w-5 h-5" /> },
    { href: "/bulky-deals", label: "All Deals", icon: <ShoppingBag className="w-5 h-5" /> },
    { href: "/calc", label: "Calculator", icon: <Calculator className="w-5 h-5" /> },
    { href: "/auth", label: user ? "Dashboard" : "Login", icon: user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" /> },
  ], [user]);

  // Get display deals - 6 on mobile, 5 on desktop
  const displayDeals = useMemo(() => {
    return filteredDeals.slice(0, isMobile ? 6 : 5);
  }, [filteredDeals, isMobile]);

  // Handle infinite scroll pause
  useEffect(() => {
    const slideContainer = infiniteSlideRef.current;
    if (!slideContainer) return;

    const handleMouseEnter = () => {
      const slides = slideContainer.querySelector('.animate-infinite-scroll') as HTMLElement;
      if (slides) {
        slides.style.animationPlayState = 'paused';
      }
    };

    const handleMouseLeave = () => {
      const slides = slideContainer.querySelector('.animate-infinite-scroll') as HTMLElement;
      if (slides) {
        slides.style.animationPlayState = 'running';
      }
    };

    slideContainer.addEventListener('mouseenter', handleMouseEnter);
    slideContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      slideContainer.removeEventListener('mouseenter', handleMouseEnter);
      slideContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Loading Screen */}
      {showLoading && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">MOQHUBS</h1>
          <p className="text-gray-500 mt-2">Loading deals...</p>
        </div>
      )}

      <main className={`min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 safe-area-bottom ${showLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}>
        {/* Sticky Header with Hamburger */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Hamburger Menu Button for Mobile */}
              {isMobile && (
                <button 
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
              )}
              
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-[13px] font-bold text-gray-900">MOQHUBS</h1>
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              
              <button 
                onClick={() => setShowCategories(!showCategories)}
                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Filter by category"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Auth Button - Shows Dashboard or Login */}
              <Link
                href="/auth"
                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                aria-label={user ? "Dashboard" : "Login"}
              >
                {user ? (
                  <>
                    <User className="w-5 h-5 text-gray-600" />
                    {!isMobile && <span className="text-sm">Dashboard</span>}
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 text-gray-600" />
                    {!isMobile && <span className="text-sm">Login</span>}
                  </>
                )}
              </Link>
              
              <Link href="/cart" className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
              </Link>
            </div>
          </div>

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

          {/* Search Bar - Always Visible */}
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  placeholder="Search bulk deals, products, categories..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white p-1.5 rounded-md hover:bg-orange-600 transition-colors"
                  aria-label="Search"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Search Suggestions - Smart Dropdown */}
            {showSearchSuggestions && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">PRODUCT SUGGESTIONS</p>
                  <div className="space-y-1">
                    {getSearchSuggestions().map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <span>{suggestion}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                      </button>
                    ))}
                  </div>
                  
                  {availableCategories.filter(cat => 
                    cat.value && cat.label.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length > 0 && (
                    <>
                      <p className="text-xs font-medium text-gray-500 mb-2 mt-3">CATEGORIES</p>
                      <div className="space-y-1">
                        {availableCategories.filter(cat => 
                          cat.value && cat.label.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((category, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category.value);
                              setSearchQuery("");
                              setShowSearchSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700 flex items-center gap-2"
                          >
                            <span className="text-lg">{category.icon}</span>
                            <span>{category.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Categories Filter - Scrollable Tabs */}
          <div className="mt-2 overflow-x-auto">
            <div className="flex space-x-1 pb-1 min-w-max">
              {availableCategories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === category.value ? "" : category.value);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-sm">{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Hero Section with Priority Loading for First Image */}
        <section 
          className="relative h-[380px] md:h-[420px] overflow-hidden"
          onMouseEnter={() => setAutoSlideStopped(true)}
          onMouseLeave={() => setAutoSlideStopped(false)}
        >
          <div className="relative h-full">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="absolute inset-0">
                  <Image
                    src={getHeroImage(slide.image)}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="100vw"
                    quality={75}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="relative h-full flex flex-col justify-end pb-6 px-4">
                  <div className="max-w-md">
                    <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
                      <Shield className="w-3 h-3" />
                      ESCROW PROTECTED
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
                      {slide.title}
                    </h1>

                    <p className="text-white/90 text-sm md:text-base mb-4">
                      {slide.subtitle}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-white/80 text-sm">{slide.stats}</span>

                      <Link
                        href="/bulky-cards"
                        className="bg-white text-orange-600 px-2.5 py-1 rounded-md font-semibold text-xs hover:bg-gray-100 active:scale-95 transition-all inline-flex items-center gap-1"
                      >
                        Join Group
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      {/* FAQ Button */}
                      <Link
                        href="/itworks"
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2.5 py-1 rounded-md font-semibold text-xs hover:from-yellow-500 hover:to-orange-600 active:scale-95 transition-all inline-flex items-center gap-1"
                      >
                        How it Works
                      </Link>

                      {/* About Us Button */}
                      <Link
                        href="/about"
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2.5 py-1 rounded-md font-semibold text-xs hover:from-yellow-500 hover:to-orange-600 active:scale-95 transition-all inline-flex items-center gap-1"
                      >
                        About Us
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-white w-6' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Hot Bulk Deals Section - Optimized with Lazy Loading */}
        <section className="px-2 py-2">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                {selectedCategory ? (
                  <>
                    {getCategoryIcon(selectedCategory)} {getCategoryLabel(selectedCategory)}
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 text-orange-500" /> Hot Bulk Deals
                  </>
                )}
              </h2>
              <p className="text-[10px] text-gray-600">
                {displayDeals.length}{" "}
                {selectedCategory
                  ? `${getCategoryLabel(selectedCategory)} deals`
                  : "trending group/bulk orders"}
              </p>
            </div>

            {/* GLASSMORPHIC VIEW ALL BUTTON */}
            <Link
              href="/bulky-cards"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-300 text-orange-600 font-semibold text-xs backdrop-blur-sm shadow-md hover:bg-orange-500/30 hover:text-white hover:translate-x-1 transition-all duration-200"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-5"} gap-1`}>
              {Array.from({ length: isMobile ? 6 : 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-300 p-2 animate-pulse"
                >
                  <div className="h-32 bg-gray-200 rounded-lg mb-1" />
                  <div className="h-3 bg-gray-200 rounded mb-1" />
                  <div className="h-2 bg-gray-200 rounded mb-1" />
                  <div className="h-7 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : displayDeals.length === 0 ? (
            /* EMPTY STATE */
            <div className="text-center py-6 bg-white rounded-2xl border border-gray-300">
              <p className="text-gray-500 font-medium text-sm">No deals found</p>
              <p className="text-gray-400 text-[11px] mt-1">
                {searchQuery || selectedCategory
                  ? "Try a different search or category"
                  : "Check back later for new deals"}
              </p>

              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setSearchQuery("");
                  }}
                  className="mt-3 bg-orange-500 text-white py-1.5 px-4 rounded-lg font-bold text-xs hover:bg-orange-600 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            /* DEAL GRID with Lazy Loading Images */
            <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-5"} gap-0.5`}>
              {displayDeals.map((deal) => {
                const moqReached = isMOQReached(deal);
                const progress = Math.min((deal.currentOrders / deal.moq) * 100, 100);
                const profit = deal.retailPrice - deal.landedCostPerUnit;

                return (
                  <Link
                    key={deal.id}
                    href={`/card-detail?id=${deal.id}`}
                    className="block"
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                      {/* IMAGE with Lazy Loading */}
                      <div className="relative h-36 w-full">
                        <Image
                          src={getCardImage(deal)}
                          alt={deal.title}
                          fill
                          className="object-cover rounded-t-2xl"
                          sizes="(max-width: 768px) 50vw, 20vw"
                          loading="lazy"
                          quality={75}
                        />

                        {/* VERIFIED */}
                        {deal.uploaderSuccessRate >= 90 && (
                          <div className="absolute top-1 left-1 bg-green-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-full flex items-center gap-1 shadow">
                            <Verified className="w-3 h-3" /> Verified
                          </div>
                        )}

                        {/* CATEGORY */}
                        <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded-full backdrop-blur-sm">
                          {getCategoryIcon(deal.category)}
                        </div>

                        {/* MOQ REACHED BADGE - NEW */}
                        {moqReached && (
                          <div className="absolute top-1 right-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                            <CheckCircle className="w-3 h-3" /> MOQ Filled
                          </div>
                        )}

                        {/* URGENCY - Only show if MOQ not reached */}
                        {deal.urgency && !moqReached && (
                          <div className="absolute bottom-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full shadow">
                            {deal.daysLeft} {deal.daysLeft === 1 ? 'day' : 'days'} left
                          </div>
                        )}
                      </div>

                      {/* BODY */}
                      <div className="p-2 flex flex-col gap-1 flex-1">
                        {/* TITLE */}
                        <h3 className="font-semibold text-[12px] line-clamp-2 min-h-[35px] text-gray-900">
                          {deal.title}
                        </h3>

                        {/* PROFIT HIGHLIGHT - Only show if MOQ not reached */}
                        {!moqReached && (
                          <div className="bg-green-50 border border-green-300 rounded-lg px-0.5 py-0.5 text-center">
                            <p className="text-[10px] text-green-700 font-semibold">Potential Profit</p>
                            <p className="text-green-900 font-extrabold text-xs">
                              {formatCurrency(profit)} / unit
                            </p>
                          </div>
                        )}

                        {/* PRICE ROW */}
                        <div className="flex justify-between text-[10px] mt-1 mb-1">
                          <span className="text-gray-500">
                            Import: {formatCurrency(deal.landedCostPerUnit)}
                          </span>
                          <span className="font-semibold text-gray-800">
                            Sell: {formatCurrency(deal.retailPrice)}
                          </span>
                        </div>

                        {/* PROGRESS - Show with full bar if MOQ reached */}
                        <div>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span>MOQ: {deal.currentOrders}/{deal.moq} joined</span>
                            <span className="font-bold text-[10px]">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${
                                moqReached 
                                  ? 'from-purple-400 to-purple-600' 
                                  : 'from-green-400 to-green-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* CTA - Changed when MOQ reached */}
                        <div className="mt-auto">
                          {moqReached ? (
                            <div className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[12px] py-2 rounded-2xl font-bold text-center">
                              <Lock className="w-3 h-3 inline mr-1" /> Deal Closed
                            </div>
                          ) : (
                            <div className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[12px] py-2 rounded-2xl font-bold text-center group-hover:from-pink-500 group-hover:to-orange-600 group-hover:scale-105 transition-all duration-300">
                              Join Import Bulk Order
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Active Filter Display */}
        {(selectedCategory || searchQuery) && (
          <div className="px-3 py-2 bg-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">
                    {getCategoryIcon(selectedCategory)}
                    {getCategoryLabel(selectedCategory)}
                    <button
                      onClick={() => setSelectedCategory("")}
                      className="ml-1 hover:text-orange-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                    <Search className="w-3 h-3" />
                    "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setSearchQuery("");
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* INFINITE AUTOSLIDE CARDS SECTION - Optimized */}
        <section className="px-2 py-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                🔄 New & Trending Deals
              </h2>
              <p className="text-xs text-gray-600">
                Continuously updated deals from our community
              </p>
            </div>
            <button
              onClick={() => {
                const shuffled = shuffleArray([...bulkDeals]);
                setShuffledDeals(shuffled);
                setFilteredDeals(shuffled);
              }}
              className="text-orange-600 font-semibold text-xs flex items-center gap-1 hover:text-orange-700"
            >
              Refresh <Zap className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2.5 gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-md border border-gray-200 p-4 animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-t-md mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : bulkDeals.length === 0 ? (
            <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium text-sm">No deals available</p>
            </div>
          ) : (
            <div ref={infiniteSlideRef} className="relative overflow-hidden">
              {/* Infinite slide container */}
              <div 
                className="flex gap-2 animate-infinite-scroll"
                style={{
                  animation: 'infiniteScroll 30s linear infinite',
                }}
              >
                {/* First set of slides - Loads initially */}
                {shuffledDeals.slice(0, 5).map((deal) => {
                  const moqReached = isMOQReached(deal);
                  
                  return (
                    <Link
                      key={`first-${deal.id}`}
                      href={`/card-detail?id=${deal.id}`}
                      className="flex-shrink-0 w-[calc(50vw-20px)] md:w-[calc(33vw-20px)] lg:w-[calc(20vw-20px)] xl:w-[calc(16vw-20px)]"
                    >
                      <div className="bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full active:scale-95 transition-transform">
                        {/* Card Image */}
                        <div className="relative h-32 rounded-t-md overflow-hidden">
                          <Image
                            src={getCardImage(deal)}
                            alt={deal.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                            loading="lazy"
                            quality={75}
                          />
                          
                          {/* Category Badge */}
                          <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                            <span>{getCategoryIcon(deal.category)}</span>
                            <span className="text-[10px]">{deal.category.split('_')[0]}</span>
                          </div>
                          
                          {/* MOQ Reached Badge */}
                          {moqReached && (
                            <div className="absolute top-1 right-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                              <CheckCircle className="w-3 h-3" /> Filled
                            </div>
                          )}
                          
                          {/* Price Badge */}
                          <div className="absolute bottom-1 right-1">
                            <div className="bg-black/80 backdrop-blur-sm rounded-md p-1 shadow-lg">
                              <div className="text-[10px] text-white font-bold">
                                {formatCurrency(deal.landedCostPerUnit)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex justify-between text-white text-[10px] mb-0.5">
                              <span>MOQ: {deal.moq}</span>
                              <span className="font-bold">
                                {calculateProgress(deal.currentOrders, deal.moq).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${
                                  moqReached ? 'from-purple-400 to-purple-500' : 'from-blue-400 to-blue-500'
                                }`}
                                style={{ width: `${calculateProgress(deal.currentOrders, deal.moq)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Card Body */}
                        <div className="p-2 flex-1 flex flex-col">
                          <h3 className="font-bold text-[11px] line-clamp-2 h-8 mb-1">
                            {deal.title}
                          </h3>
                          <div className="mt-auto">
                            <div className="text-[10px] text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {deal.origin} → Nigeria
                              </div>
                            </div>
                            <div className={`block w-full ${
                              moqReached 
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                                : 'bg-gradient-to-r from-blue-500 to-blue-600'
                            } text-white text-[10px] py-1.5 rounded font-bold text-center hover:from-blue-600 hover:to-blue-700`}>
                              {moqReached ? 'Deal Closed' : 'View Deal'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* How Group Bulk Import Works */}
        <section className="px-0 py-4 bg-gray-50">
          <h2 className="text-base font-bold text-gray-900 mb-3 text-center">
            How Group Bulk Import Works
          </h2>
          <p className="text-[11px] text-gray-600 text-center mb-4 px-2">
            Follow these simple steps to join a group and import products profitably.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-[1px]">
            {/* Step 1 */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col items-center text-center p-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <h3 className="font-bold text-[12px] mb-1">Browse Deals</h3>
              <p className="text-[10px] text-gray-600">
                Explore trending bulk orders and products in your favorite categories.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col items-center text-center p-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <h3 className="font-bold text-[12px] mb-1">Join a Group</h3>
              <p className="text-[10px] text-gray-600">
                Select the deal and join other buyers to reach the minimum order quantity.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col items-center text-center p-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <h3 className="font-bold text-[12px] mb-1">Pay Securely</h3>
              <p className="text-[10px] text-gray-600">
                Complete payment for your units safely through our platform's escrow system.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col items-center text-center p-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2">
                4
              </div>
              <h3 className="font-bold text-[12px] mb-1">Receive & Profit</h3>
              <p className="text-[10px] text-gray-600">
                Your products are delivered, and you can sell at your retail price for profit.
              </p>
            </div>
          </div>
        </section>

        {/* LIVE PROFIT CALCULATOR */}
        <section className="px-3 py-4 bg-white mt-2 mx-2 rounded-lg border border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Profit Calculator</h2>
          </div>
          
          <div className="space-y-3">
            {/* Inputs */}
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Buying Price (₦)</label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-gray-500 text-sm">₦</span>
                  <input
                    type="number"
                    value={calculator.buyingPrice}
                    onChange={(e) => setCalculator({...calculator, buyingPrice: Number(e.target.value)})}
                    className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Retail Price (₦)</label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-gray-500 text-sm">₦</span>
                  <input
                    type="number"
                    value={calculator.retailPrice}
                    onChange={(e) => setCalculator({...calculator, retailPrice: Number(e.target.value)})}
                    className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="100"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={calculator.quantity}
                  onChange={(e) => setCalculator({...calculator, quantity: Number(e.target.value)})}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Shipping per Unit (₦)</label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-gray-500 text-sm">₦</span>
                  <input
                    type="number"
                    value={calculator.shipping}
                    onChange={(e) => setCalculator({...calculator, shipping: Number(e.target.value)})}
                    className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                  />
                  <div className="absolute right-2 top-2 text-gray-500 text-xs">
                    × {calculator.quantity} = {formatCurrency(calculator.shipping * calculator.quantity)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Total Cost</p>
                  <p className="text-base font-bold text-gray-900">{formatCurrency(profitData.totalCost)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Total Revenue</p>
                  <p className="text-base font-bold text-green-600">{formatCurrency(profitData.totalRevenue)}</p>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">Platform Fee (3%)</span>
                  <span className="text-sm font-bold text-blue-600">{formatCurrency(profitData.platformFeeAmount)}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">Total Shipping</span>
                  <span className="text-sm font-bold text-purple-600">{formatCurrency(profitData.totalShippingCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Your Net Profit</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(profitData.netProfit)}</span>
                </div>
                <div className="mt-1 text-center">
                  <span className="text-sm font-bold text-green-700">{profitData.profitMargin}% Profit Margin</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ESCROW BENEFITS */}
        <section className="px-3 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 mt-3 mx-2 rounded-lg">
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600 font-semibold text-sm">Money Protection</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Why Choose MOQHUBS</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              {
                title: "Escrow Protection",
                desc: "Money held safely until MOQ complete",
                icon: "🛡️",
                color: "bg-blue-100"
              },
              {
                title: "Verified Uploaders",
                desc: "All uploaders are ID verified",
                icon: "✅",
                color: "bg-green-100"
              },
              {
                title: "Low 3% Fee",
                desc: "Only charged on successful orders",
                icon: "💸",
                color: "bg-orange-100"
              },
              {
                title: "Full Refund",
                desc: "100% back if MOQ not reached",
                icon: "↩️",
                color: "bg-purple-100"
              },
            ].map((item, i) => (
              <div key={i} className={`${item.color} rounded-lg p-2 hover:shadow-sm transition-shadow`}>
                <div className="text-lg mb-1">{item.icon}</div>
                <h3 className="font-bold text-xs text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="px-3 py-4 bg-gradient-to-r from-orange-600 to-orange-700 mx-2 mt-3 rounded-lg">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full mb-2">
              <Verified className="w-4 h-4 text-yellow-300" />
              <span className="text-white text-sm font-bold">Start Today</span>
            </div>
            
            <h2 className="text-lg font-bold text-white">Ready to Buy Safe?</h2>
            <p className="text-orange-100 text-sm mt-1">Join thousands saving with escrow protection</p>
            
            <div className="mt-3 mb-10 grid grid-cols-2 gap-2">
              <Link
                href="/auth"
                className="block w-full py-2 bg-white text-orange-600 font-bold rounded text-center text-sm hover:bg-gray-100 active:scale-95 transition-transform"
              >
                {user ? "Go to Dashboard" : "Login / Register"}
              </Link>
              <Link
                href="/bulky-cards"
                className="block w-full py-2 bg-orange-500 text-white font-bold rounded text-center text-sm hover:bg-orange-600 active:scale-95 transition-transform"
              >
                Browse Deals
              </Link>
            </div>
          </div>
        </section>

        {/* BOTTOM NAV */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around py-2 safe-area-bottom shadow-lg z-50">
          <Link href="/" className="flex flex-col items-center text-orange-600">
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium mt-0.5">Home</span>
          </Link>
          <Link href="/bulky-cards" className="flex flex-col items-center text-gray-600 hover:text-orange-600">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-medium mt-0.5">Deals</span>
          </Link>
          <Link href="/faq" className="flex flex-col items-center text-gray-600 hover:text-orange-600">
            <BarChart className="w-5 h-5" />
            <span className="text-xs font-medium mt-0.5">FAQ ❓</span>
          </Link>
          <Link href="/auth" className="flex flex-col items-center text-gray-600 hover:text-orange-600">
            <User className="w-5 h-5" />
            <span className="text-xs font-medium mt-0.5">{user ? "Dashboard" : "Login"}</span>
          </Link>
        </nav>

        {/* Safe area CSS */}
        <style jsx global>{`
          .safe-area-bottom {
            padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 20px);
          }
          
          .active\:scale-95:active {
            transform: scale(0.95);
          }
          
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          input[type=number] {
            -moz-appearance: textfield;
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .transition-all {
            transition: all 0.2s ease-in-out;
          }
          
          .transition-transform {
            transition: transform 0.2s ease-in-out;
          }
          
          .transition-shadow {
            transition: box-shadow 0.2s ease-in-out;
          }
          
          .transition-opacity {
            transition: opacity 0.3s ease-in-out;
          }
          
          .transition-colors {
            transition: background-color 0.2s ease-in-out;
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          /* Infinite scroll animation */
          @keyframes infiniteScroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-25%);
            }
          }

          /* Grid columns for different screen sizes */
          .grid-cols-2\.5 {
            grid-template-columns: repeat(2.5, minmax(0, 1fr));
          }

          /* Responsive widths */
          @media (min-width: 768px) {
            .md\:w-\[calc\(33vw-20px\)\] {
              width: calc(33vw - 20px);
            }
          }

          @media (min-width: 1024px) {
            .lg\:w-\[calc\(20vw-20px\)\] {
              width: calc(20vw - 20px);
            }
          }

          @media (min-width: 1280px) {
            .xl\:w-\[calc\(16vw-20px\)\] {
              width: calc(16vw - 20px);
            }
          }
        `}</style>
      </main>
    </>
  );
}