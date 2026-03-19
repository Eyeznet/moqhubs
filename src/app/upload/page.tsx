"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import { 
  ArrowLeft, 
  ArrowRight,
  Upload, 
  Save, 
  Plus, 
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Package,
  Truck,
  Calendar,
  Users,
  Shield,
  Globe,
  Percent,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  X,
  Camera,
  FileText,
  Link,
  ExternalLink,
  Info,
  HelpCircle,
  Zap,
  Target,
  Ship,
  MapPin,
  Timer,
  Lock,
  Eye,
  MessageSquare,
  BarChart,
  Home,
  ShoppingBag,
  Smartphone,
  Wifi,
  BatteryCharging,
  Sun,
  Coffee,
  Music,
  Headphones,
  Wallet,
  Thermometer,
  Volume2,
  Wind,
  Power,
  Battery,
  Leaf,
  Droplets,
  UsersRound,
  CircleDollarSign,
  AlertTriangle,
  Verified,
  Loader2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plane,
  Globe as GlobeIcon,
  CreditCard,
  List,
  RefreshCw,
  CalendarDays,
  Users as UsersIcon,
  Calculator,
} from "lucide-react";

// Firebase imports
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";

// ==================== TYPE DEFINITIONS ====================
interface ProductSpecification {
  key: string;
  value: string;
}

interface ExternalMarketPrice {
  platform: string;
  price: number;
  url: string;
  verified: boolean;
  rating: number;
  reviews: number;
  shipping: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface Update {
  date: string;
  title: string;
  description: string;
}

interface TrustBadge {
  text: string;
  icon: string;
  color: string;
}

interface TimelineStage {
  stage: string;
  days: string;
  icon: string;
}

// Add variant interfaces
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

interface FormData {
  // Step 1
  title: string;
  category: string;
  subCategory: string;
  description: string;
  
  // Step 2
  origin: string;
  supplier: string;
  supplierRating: number;
  supplierReviews: number;
  buyingPrice: number;
  retailPrice: number;
  moq: number;
  
  // New: Product source URL and multi-currency support
  productSourceUrl: string;
  buyingPriceYuan: number;
  buyingPriceUSD: number;
  exchangeRateYuanToNaira: number;
  exchangeRateUSDToNaira: number;
  
  // Step 3
  weightPerUnit: number;
  seaFreightPerKg: number;
  customsPerKg: number;
  estimatedShippingDays: number;
  shippingCost: number;
  shippingMethod: string;
  airFreightPerKg: number;
  landFreightPerKg: number;
  
  // New: Estimated dates
  estimatedProcurementDate: string;
  estimatedNigeriaArrivalDate: string;
  
  // Step 4
  marketPriceRange: string;
  recommendedPrice: number;
  estimatedProfitPerUnit: number;
  profitMargin: number;
  targetMarket: string;
  
  // Step 5
  specifications: Record<string, string | boolean | number | undefined>;
  features: string[];
  
  // Step 6: Variants
  hasVariants: boolean;
  variantTypes: VariantType[];
  variants: ProductVariant[];
  
  // Step 7
  images: string[];
  demoImages: string[];
  
  // Step 8
  uploaderName: string;
  uploaderCompany: string;
  uploaderPhone: string;
  uploaderEmail: string;
  uploaderWhatsApp: string;
  uploaderJoinDate: string;
  uploaderCompletedDeals: number;
  uploaderSuccessRate: number;
  
  // WhatsApp Group Link
  whatsappGroupLink: string;
  
  // Step 9
  urgency: boolean;
  trending: boolean;
  daysLeft: number;
  escrowAmount: number;
  escrowParticipants: number;
  commitmentFeePaid: boolean;
  commitmentFeeAmount: number;
  
  // Arrays
  externalMarketPrices: ExternalMarketPrice[];
  faqs: FAQ[];
  updates: Update[];
  trustBadges: TrustBadge[];
  timeline: TimelineStage[];
}

// ==================== CONSTANTS ====================
const shippingMethods = [
  { value: "sea", label: "Sea Freight", icon: Ship },
  { value: "air", label: "Air Freight", icon: Plane },
  { value: "land", label: "Land Transport", icon: Truck },
  { value: "courier", label: "Courier", icon: Package }
] as const;

const categories = [
  { value: "", label: "Select Category" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion & Clothing" },
  { value: "home_garden", label: "Home & Garden" },
  { value: "beauty_health", label: "Beauty & Health" },
  { value: "sports_outdoors", label: "Sports & Outdoors" },
  { value: "automotive", label: "Automotive" },
  { value: "toys_games", label: "Toys & Games" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "food_beverages", label: "Food & Beverages" },
  { value: "pet_supplies", label: "Pet Supplies" },
  { value: "baby_kids", label: "Baby & Kids" },
  { value: "jewelry_accessories", label: "Jewelry & Accessories" },
  { value: "industrial_supplies", label: "Industrial & Supplies" },
  { value: "other", label: "Other" }
] as const;

const subCategories: Record<string, string[]> = {
  electronics: [
    "Select Sub-Category",
    "Mobile Phones & Accessories",
    "Laptops & Computers",
    "TV & Home Theater",
    "Audio & Headphones",
    "Cameras & Photography",
    "Wearable Technology",
    "Gaming Consoles",
    "Smart Home Devices",
    "Power Banks & Chargers",
    "Other Electronics"
  ],
  fashion: [
    "Select Sub-Category",
    "Men's Clothing",
    "Women's Clothing",
    "Children's Clothing",
    "Shoes & Footwear",
    "Bags & Luggage",
    "Watches",
    "Jewelry",
    "Sunglasses & Eyewear",
    "Underwear & Sleepwear",
    "Traditional Attire",
    "Other Fashion"
  ],
  home_garden: [
    "Select Sub-Category",
    "Furniture",
    "Home Decor",
    "Kitchen & Dining",
    "Bedding & Bath",
    "Lighting",
    "Garden & Outdoor",
    "Home Appliances",
    "Storage & Organization",
    "Cleaning Supplies",
    "Other Home & Garden"
  ],
  beauty_health: [
    "Select Sub-Category",
    "Skincare",
    "Haircare",
    "Makeup & Cosmetics",
    "Fragrances",
    "Personal Care",
    "Health & Wellness",
    "Vitamins & Supplements",
    "Medical Supplies",
    "Other Beauty & Health"
  ],
  sports_outdoors: [
    "Select Sub-Category",
    "Exercise & Fitness",
    "Outdoor Recreation",
    "Team Sports",
    "Water Sports",
    "Cycling",
    "Camping & Hiking",
    "Fishing",
    "Other Sports & Outdoors"
  ],
  automotive: [
    "Select Sub-Category",
    "Car Parts",
    "Motorcycle Parts",
    "Car Electronics",
    "Tools & Equipment",
    "Car Care",
    "Interior Accessories",
    "Other Automotive"
  ],
  toys_games: [
    "Select Sub-Category",
    "Educational Toys",
    "Action Figures",
    "Dolls & Accessories",
    "Board Games",
    "Outdoor Toys",
    "Puzzles",
    "Electronic Toys",
    "Other Toys & Games"
  ],
  office_supplies: [
    "Select Sub-Category",
    "Stationery",
    "Office Furniture",
    "Printers & Scanners",
    "Presentation Equipment",
    "Filing & Storage",
    "Other Office Supplies"
  ],
  food_beverages: [
    "Select Sub-Category",
    "Snacks",
    "Beverages",
    "Cooking Ingredients",
    "Canned Foods",
    "Organic Foods",
    "Other Food & Beverages"
  ],
  pet_supplies: [
    "Select Sub-Category",
    "Pet Food",
    "Pet Toys",
    "Pet Furniture",
    "Grooming Supplies",
    "Pet Health",
    "Other Pet Supplies"
  ],
  baby_kids: [
    "Select Sub-Category",
    "Baby Clothing",
    "Baby Gear",
    "Nursery Furniture",
    "Feeding Supplies",
    "Toys for Babies",
    "Other Baby & Kids"
  ],
  jewelry_accessories: [
    "Select Sub-Category",
    "Necklaces",
    "Earrings",
    "Bracelets",
    "Rings",
    "Belts",
    "Hats & Caps",
    "Other Accessories"
  ],
  industrial_supplies: [
    "Select Sub-Category",
    "Tools & Machinery",
    "Safety Equipment",
    "Electrical Supplies",
    "Plumbing Supplies",
    "Building Materials",
    "Other Industrial"
  ],
  other: ["Other"]
};

const countries = [
  "Select Country",
  "China",
  "India",
  "Turkey",
  "United States",
  "United Kingdom",
  "Germany",
  "Japan",
  "South Korea",
  "Vietnam",
  "Thailand",
  "Indonesia",
  "Malaysia",
  "Philippines",
  "Bangladesh",
  "Pakistan",
  "Egypt",
  "South Africa",
  "Nigeria",
  "Ghana",
  "Kenya",
  "Other"
] as const;

// Default exchange rates (CNY and USD to NGN)
const DEFAULT_EXCHANGE_RATES = {
  CNY_TO_NGN: 216, // 1 Chinese Yuan = 230 Naira (approx)
  USD_TO_NGN: 1550 // 1 USD = 1550 Naira (approx)
};

// ==================== MAIN COMPONENT ====================
export default function UploaderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [showFAQ, setShowFAQ] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [priceInputMode, setPriceInputMode] = useState<'ngn' | 'yuan' | 'usd'>('ngn');

  // Initialize form data with estimated dates
  const [formData, setFormData] = useState<FormData>({
    // Step 1
    title: "",
    category: "",
    subCategory: "",
    description: "",
    
    // Step 2
    origin: "China",
    supplier: "",
    supplierRating: 4.5,
    supplierReviews: 0,
    buyingPrice: 0,
    retailPrice: 0,
    moq: 100,
    
    // New fields
    productSourceUrl: "",
    buyingPriceYuan: 0,
    buyingPriceUSD: 0,
    exchangeRateYuanToNaira: DEFAULT_EXCHANGE_RATES.CNY_TO_NGN,
    exchangeRateUSDToNaira: DEFAULT_EXCHANGE_RATES.USD_TO_NGN,
    
    // Step 3
    weightPerUnit: 0,
    seaFreightPerKg: 1860,
    customsPerKg: 1600,
    estimatedShippingDays: 55,
    shippingCost: 0,
    shippingMethod: "sea",
    airFreightPerKg: 10600,
    landFreightPerKg: 800,
    
    // New: Estimated dates (calculated based on shipping method)
    estimatedProcurementDate: getDateAfterDays(7), // Default: 7 days for procurement
    estimatedNigeriaArrivalDate: getDateAfterDays(55), // Default: 45 days for sea freight
    
    // Step 4
    marketPriceRange: "",
    recommendedPrice: 0,
    estimatedProfitPerUnit: 0,
    profitMargin: 0,
    targetMarket: "Nigeria, Ghana, Kenya, South Africa",
    
    // Step 5
    specifications: {
      batteryCapacity: "20000mAh",
      runTime: "4-8 hours",
      chargingTime: "4-6 hours",
      speeds: "3 speeds",
      bladeSize: "16 inches",
      heightAdjustment: "Yes",
      remoteControl: "Yes",
      ledDisplay: "Yes",
      material: "Plastic & Metal",
      warranty: "1 Year"
    },
    features: [
      "5-blade design for maximum airflow",
      "Rechargeable battery - no electricity needed",
      "Remote control included",
      "Height adjustable stand",
      "LED display for battery level",
      "Quiet operation"
    ],
    
    // Step 6: Variants
    hasVariants: false,
    variantTypes: [],
    variants: [],
    
    // Step 7
    images: [],
    demoImages: [],
    
    // Step 8
    uploaderName: "",
    uploaderCompany: "",
    uploaderPhone: "",
    uploaderEmail: "",
    uploaderWhatsApp: "",
    uploaderJoinDate: new Date().toISOString().split('T')[0],
    uploaderCompletedDeals: 0,
    uploaderSuccessRate: 100,
    
    // WhatsApp Group Link
    whatsappGroupLink: "",
    
    // Step 9
    urgency: true,
    trending: true,
    daysLeft: 7,
    escrowAmount: 0,
    escrowParticipants: 0,
    commitmentFeePaid: false,
    commitmentFeeAmount: 50000,
    
    // Arrays
    externalMarketPrices: [
      {
        platform: "Jumia Nigeria",
        price: 0,
        url: "",
        verified: true,
        rating: 4.5,
        reviews: 0,
        shipping: "₦2,500"
      }
    ],
    faqs: [
      {
        question: "What is the battery life on full charge?",
        answer: "4 hours on high speed, 6 hours on medium, 8 hours on low speed."
      }
    ],
    updates: [
      {
        date: new Date().toISOString().split('T')[0],
        title: "Early Bird Special",
        description: "First 50 buyers get priority shipping slot."
      }
    ],
    trustBadges: [
      { text: "Verified Uploader", icon: "✅", color: "green" },
      { text: "High Demand", icon: "🔥", color: "orange" },
      { text: "Fast Shipping", icon: "🚚", color: "blue" }
    ],
    timeline: [
      { stage: "China Warehouse", days: "3-5 days", icon: "📦" },
      { stage: "Sea Transit to Lagos", days: "30-40 days", icon: "🚢" },
      { stage: "Customs Clearing", days: "7-14 days", icon: "📋" },
      { stage: "Estimated Arrival", days: "45-60 days", icon: "📅" }
    ]
  });

  // Helper function to get date after certain days
  function getDateAfterDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  // Calculate buying price based on selected currency
  useEffect(() => {
    if (priceInputMode === 'yuan' && formData.buyingPriceYuan > 0) {
      const calculatedPrice = formData.buyingPriceYuan * formData.exchangeRateYuanToNaira;
      setFormData(prev => ({ ...prev, buyingPrice: calculatedPrice }));
    } else if (priceInputMode === 'usd' && formData.buyingPriceUSD > 0) {
      const calculatedPrice = formData.buyingPriceUSD * formData.exchangeRateUSDToNaira;
      setFormData(prev => ({ ...prev, buyingPrice: calculatedPrice }));
    }
  }, [formData.buyingPriceYuan, formData.buyingPriceUSD, formData.exchangeRateYuanToNaira, formData.exchangeRateUSDToNaira, priceInputMode]);

  // Calculate estimated dates based on shipping method
  useEffect(() => {
    let shippingDays = 55; // Default sea freight
    if (formData.shippingMethod === "air") shippingDays = 12;
    if (formData.shippingMethod === "land") shippingDays = 25;
    if (formData.shippingMethod === "courier") shippingDays = 5;
    
    setFormData(prev => ({
      ...prev,
      estimatedShippingDays: shippingDays,
      estimatedNigeriaArrivalDate: getDateAfterDays(7 + shippingDays), // 7 days procurement + shipping
      estimatedProcurementDate: getDateAfterDays(14)
    }));
  }, [formData.shippingMethod]);

  // Set mounted state to avoid hydration errors
  useEffect(() => {
    setMounted(true);
    // Load draft from localStorage
    const saved = localStorage.getItem('moqhubs_deal_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as FormData;
        setFormData(parsed);
        if (parsed.category) {
          const cat = categories.find(c => c.label === parsed.category);
          if (cat) setSelectedCategory(cat.value);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('moqhubs_deal_draft', JSON.stringify(formData));
    }
  }, [formData, mounted]);

  // Calculate derived values
  const calculateDerivedValues = () => {
    let freightCostPerKg = formData.seaFreightPerKg;
    if (formData.shippingMethod === "air") freightCostPerKg = formData.airFreightPerKg;
    if (formData.shippingMethod === "land") freightCostPerKg = formData.landFreightPerKg;
    
    const logisticsPerUnit = formData.weightPerUnit * (freightCostPerKg + formData.customsPerKg);
    const landedCostPerUnit = formData.buyingPrice + logisticsPerUnit;
    const profitPerUnit = formData.recommendedPrice - landedCostPerUnit;
    const margin = formData.recommendedPrice > 0 ? ((profitPerUnit / landedCostPerUnit) * 100) : 0;
    
    return {
      logisticsPerUnit,
      landedCostPerUnit,
      profitPerUnit: Number(profitPerUnit),
      margin: margin.toFixed(1),
      freightCostPerKg
    };
  };

  const derivedValues = calculateDerivedValues();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format Yuan
  const formatYuan = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) {
      return "¥0.00";
    }
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format USD
  const formatUSD = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) {
      return "$0.00";
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Update the handleChange function to ensure proper number handling:
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;
    const checked = target.type === 'checkbox' ? target.checked : undefined;
    
    if (name.includes('specifications.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [key]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle number inputs specifically
      if (type === 'number') {
        const numValue = value === '' ? 0 : parseFloat(value);
        setFormData(prev => ({
          ...prev,
          [name]: isNaN(numValue) ? 0 : numValue
        }));
      } else if (type === 'checkbox') {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  // Handle currency input change
  const handleCurrencyChange = (value: number, currency: 'ngn' | 'yuan' | 'usd') => {
    let newNgn = formData.buyingPrice;
    let newYuan = formData.buyingPriceYuan;
    let newUsd = formData.buyingPriceUSD;
    
    if (currency === 'ngn') {
      newNgn = value;
      newYuan = value / formData.exchangeRateYuanToNaira;
      newUsd = value / formData.exchangeRateUSDToNaira;
    } else if (currency === 'yuan') {
      newYuan = value;
      newNgn = value * formData.exchangeRateYuanToNaira;
      newUsd = (value * formData.exchangeRateYuanToNaira) / formData.exchangeRateUSDToNaira;
    } else if (currency === 'usd') {
      newUsd = value;
      newNgn = value * formData.exchangeRateUSDToNaira;
      newYuan = (value * formData.exchangeRateUSDToNaira) / formData.exchangeRateYuanToNaira;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      buyingPrice: newNgn,
      buyingPriceYuan: newYuan,
      buyingPriceUSD: newUsd
    }));
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value === "other") {
      setFormData(prev => ({ 
        ...prev, 
        category: customCategory || "",
        subCategory: customSubCategory || ""
      }));
    } else {
      const categoryLabel = categories.find(c => c.value === value)?.label || value;
      setFormData(prev => ({ 
        ...prev, 
        category: categoryLabel,
        subCategory: "" 
      }));
    }
    setCustomCategory("");
    setCustomSubCategory("");
  };

  // Handle subcategory change
  const handleSubCategoryChange = (value: string) => {
    if (value === "Other" || value === "Select Sub-Category") {
      setFormData(prev => ({ ...prev, subCategory: "" }));
    } else {
      setFormData(prev => ({ ...prev, subCategory: value }));
    }
    setCustomSubCategory("");
  };

  // Handle array field changes
  const handleArrayChange = <T extends keyof FormData>(
    field: T,
    index: number,
    value: FormData[T] extends Array<infer U> ? U : never
  ) => {
    setFormData(prev => {
      const newArray = [...(prev[field] as any[])];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  // Add new item to array
  const addArrayItem = <T extends keyof FormData>(
    field: T,
    defaultValue: FormData[T] extends Array<infer U> ? U : never
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), defaultValue]
    }));
  };

  // Remove item from array
  const removeArrayItem = <T extends keyof FormData>(field: T, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }));
  };

  // Helper function to create default variant
  const createDefaultVariant = (): ProductVariant => ({
    id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'Default',
    name: 'Default Variant',
    buyingPrice: formData.buyingPrice,
    buyingPriceYuan: formData.buyingPriceYuan,
    buyingPriceUSD: formData.buyingPriceUSD,
    weight: formData.weightPerUnit,
    images: [],
    specifications: {}
  });

  // Generate variant combinations
  const generateVariants = () => {
    if ((formData.variantTypes || []).length === 0) return;
    
    const combinations: ProductVariant[] = [];
    
    const generateCombinations = (current: any[], depth: number) => {
      if (depth === (formData.variantTypes || []).length) {
        const variantName = current.map((c, i) => c).join(' / ');
        const variantType = (formData.variantTypes || []).map(t => t.name).join(' + ');
        
        combinations.push({
          id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: variantType,
          name: variantName,
          buyingPrice: formData.buyingPrice,
          buyingPriceYuan: formData.buyingPriceYuan,
          buyingPriceUSD: formData.buyingPriceUSD,
          weight: formData.weightPerUnit,
          images: [],
          specifications: {}
        });
        return;
      }
      
      const currentType = (formData.variantTypes || [])[depth];
      for (const option of (currentType.options || [])) {
        generateCombinations([...current, option], depth + 1);
      }
    };
    
    generateCombinations([], 0);
    setFormData(prev => ({ ...prev, variants: combinations }));
  };

  // Update variant
  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  // Remove variant
  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Upload image to imgBB
  const uploadToImgBB = async (imageFile: File): Promise<string> => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    if (imageFile.size > MAX_FILE_SIZE) {
      throw new Error(`Image ${imageFile.name} exceeds 5MB limit. Please compress before uploading.`);
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('key', '39b68ebb7fbb74fa25d3d9c86796226b');

    try {
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Image upload failed');
      }

      return data.data.url;
    } catch (error) {
      console.error('Error uploading to imgBB:', error);
      throw error;
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'images' | 'demoImages') => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const imageUrl = await uploadToImgBB(file);
        uploadedUrls.push(imageUrl);
      } catch (error: any) {
        console.error("Error uploading image:", error);
        alert2(`Failed to upload image ${file.name}: ${error.message}`);
        setUploadingImages(false);
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ...uploadedUrls]
    }));
    setUploadingImages(false);
  };

  // Remove image
  const removeImage = (field: 'images' | 'demoImages', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Add specification
  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [`spec_${Date.now()}`]: ""
      }
    }));
  };

  // Remove specification
  const removeSpecification = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  // Add FAQ
  const addFAQ = () => {
    addArrayItem('faqs', { question: "", answer: "" });
  };

  // Add external market price
  const addExternalPrice = () => {
    addArrayItem('externalMarketPrices', {
      platform: "",
      price: 0,
      url: "",
      verified: true,
      rating: 4.5,
      reviews: 0,
      shipping: "₦2,500"
    });
  };

  // Form validation
  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return !!(formData.title && formData.category && formData.description);
      case 2:
        return !!(formData.buyingPrice > 0 && formData.moq >= 10);
      case 3:
        return !!(formData.weightPerUnit > 0 && formData.estimatedShippingDays > 0);
      case 4:
        return !!(formData.recommendedPrice > 0 && formData.marketPriceRange);
      case 5:
        return !!(formData.features.length >= 1 && formData.features[0] !== "");
      case 6:
        if (formData.hasVariants) {
          if ((formData.variantTypes || []).length === 0) return false;
          for (const type of (formData.variantTypes || [])) {
            if (!type.name.trim() || (type.options || []).length === 0) return false;
          }
          if ((formData.variants || []).length === 0) return false;
        }
        return true;
      case 7:
        return !!(formData.images.length >= 1);
      case 8:
        return !!(formData.uploaderName && formData.uploaderPhone);
      case 9:
        return true;
      default:
        return true;
    }
  };

  // Validate all steps
  const validateAllSteps = (): boolean => {
    for (let i = 1; i <= 8; i++) {
      if (!validateStep(i)) {
        setStep(i);
        alert2(`Please complete all required fields in step ${i}`);
        return false;
      }
    }
    return true;
  };

  // Alert function (replacement for standard alert)
  const alert2 = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    // Create custom alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 left-4 right-4 sm:right-auto sm:left-auto sm:right-4 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg text-sm sm:text-base ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      alertDiv.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
      }, 300);
    }, 5000);
  };

  // Handle form submission to Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAllSteps()) return;
    
    setIsProcessing(true);
    setLoading(true);

    try {
      // Generate a unique ID
      const dealId = `deal_${Date.now()}_${uuidv4().slice(0, 8)}`;
      
      // Prepare final data for Firestore
      const dealData = {
        // Basic Information
        id: dealId,
        title: formData.title,
        category: formData.category,
        subCategory: formData.subCategory,
        description: formData.description,
        targetMarket: formData.targetMarket,
        
        // Supplier & Pricing
        origin: formData.origin,
        supplier: formData.supplier,
        supplierRating: formData.supplierRating,
        supplierReviews: formData.supplierReviews,
        buyingPrice: formData.buyingPrice,
        retailPrice: formData.retailPrice,
        moq: formData.moq,
        
        // New: Product source URL and multi-currency
        productSourceUrl: formData.productSourceUrl,
        buyingPriceYuan: formData.buyingPriceYuan,
        buyingPriceUSD: formData.buyingPriceUSD,
        exchangeRateYuanToNaira: formData.exchangeRateYuanToNaira,
        exchangeRateUSDToNaira: formData.exchangeRateUSDToNaira,
        
        // Logistics
        weightPerUnit: formData.weightPerUnit,
        shippingMethod: formData.shippingMethod,
        seaFreightPerKg: formData.seaFreightPerKg,
        airFreightPerKg: formData.airFreightPerKg,
        landFreightPerKg: formData.landFreightPerKg,
        customsPerKg: formData.customsPerKg,
        estimatedShippingDays: formData.estimatedShippingDays,
        shippingCost: formData.shippingCost,
        
        // New: Estimated dates
        estimatedProcurementDate: formData.estimatedProcurementDate,
        estimatedNigeriaArrivalDate: formData.estimatedNigeriaArrivalDate,
        
        // Market Information
        marketPriceRange: formData.marketPriceRange,
        recommendedPrice: formData.recommendedPrice,
        estimatedProfitPerUnit: derivedValues.profitPerUnit,
        profitMargin: parseFloat(derivedValues.margin),
        
        // Product Details
        specifications: formData.specifications,
        features: formData.features.filter(f => f.trim() !== ""),
        
        // Variants
        hasVariants: formData.hasVariants,
        variantTypes: formData.variantTypes || [],
        variants: formData.variants || [],
        
        // Images (from imgBB)
        images: formData.images,
        demoImages: formData.demoImages,
        
        // Uploader Information
        uploaderName: formData.uploaderName,
        uploaderCompany: formData.uploaderCompany,
        uploaderPhone: formData.uploaderPhone,
        uploaderEmail: formData.uploaderEmail,
        uploaderWhatsApp: formData.uploaderWhatsApp,
        uploaderJoinDate: formData.uploaderJoinDate,
        uploaderCompletedDeals: formData.uploaderCompletedDeals,
        uploaderSuccessRate: formData.uploaderSuccessRate,
        
        // WhatsApp Group Link
        whatsappGroupLink: formData.whatsappGroupLink,
        
        // Deal Settings
        urgency: formData.urgency,
        trending: formData.trending,
        daysLeft: formData.daysLeft,
        expiresAt: new Date(Date.now() + (formData.daysLeft * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        escrowAmount: formData.escrowAmount,
        escrowParticipants: formData.escrowParticipants,
        commitmentFeePaid: formData.commitmentFeePaid,
        commitmentFeeAmount: formData.commitmentFeeAmount,
        
        // External Market Data
        externalMarketPrices: formData.externalMarketPrices,
        faqs: formData.faqs,
        updates: formData.updates,
        trustBadges: formData.trustBadges,
        timeline: formData.timeline,
        
        // Calculated Fields
        currentOrders: 0,
        platformFee: 3,
        logisticsPerUnit: derivedValues.logisticsPerUnit,
        landedCostPerUnit: derivedValues.landedCostPerUnit,
        
        // Status
        status: "pending",
        published: false,
        approved: false,
        
        // Analytics
        views: 0,
        shares: 0,
        favorites: 0,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // System Fields
        createdBy: "user",
        lastUpdatedBy: "user",
        
        // Additional metadata for auto-field creation
        _metadata: {
          version: "1.0",
          schemaVersion: "1.0",
          lastUpdatedBy: "uploader_form_v1"
        }
      };

      // Save to Firestore - Collection will be auto-created
      await setDoc(doc(db, "bulk_deals", dealId), dealData, { merge: true });
      
      // Also save to localStorage for cache
      const existingCards = JSON.parse(localStorage.getItem('moqhubs_user_cards') || '[]');
      localStorage.setItem('moqhubs_user_cards', JSON.stringify([...existingCards, { ...dealData, id: dealId }]));
      
      // Clear draft
      localStorage.removeItem('moqhubs_deal_draft');
      
      // Show success message
      alert2(`✅ Bulk deal uploaded successfully!\n\nDeal ID: ${dealId}\n\nYour deal is pending admin approval.`, 'success');
      
      // Reset form
      setFormData({
        title: "",
        category: "",
        subCategory: "",
        description: "",
        origin: "China",
        supplier: "",
        supplierRating: 4.5,
        supplierReviews: 0,
        buyingPrice: 0,
        retailPrice: 0,
        moq: 100,
        productSourceUrl: "",
        buyingPriceYuan: 0,
        buyingPriceUSD: 0,
        exchangeRateYuanToNaira: DEFAULT_EXCHANGE_RATES.CNY_TO_NGN,
        exchangeRateUSDToNaira: DEFAULT_EXCHANGE_RATES.USD_TO_NGN,
        weightPerUnit: 0,
        seaFreightPerKg: 1860,
        customsPerKg: 1600,
        estimatedShippingDays: 55,
        shippingCost: 0,
        shippingMethod: "sea",
        airFreightPerKg: 10600,
        landFreightPerKg: 800,
        estimatedProcurementDate: getDateAfterDays(7),
        estimatedNigeriaArrivalDate: getDateAfterDays(55),
        marketPriceRange: "",
        recommendedPrice: 0,
        estimatedProfitPerUnit: 0,
        profitMargin: 0,
        targetMarket: "Nigeria, Ghana, Kenya, South Africa",
        specifications: {
          batteryCapacity: "",
          runTime: "",
          chargingTime: "",
          speeds: "",
          bladeSize: "",
          heightAdjustment: "",
          remoteControl: "Yes",
          ledDisplay: "Yes",
          material: "",
          warranty: "1 Year"
        },
        features: [""],
        hasVariants: false,
        variantTypes: [],
        variants: [],
        images: [],
        demoImages: [],
        uploaderName: "",
        uploaderCompany: "",
        uploaderPhone: "",
        uploaderEmail: "",
        uploaderWhatsApp: "",
        uploaderJoinDate: new Date().toISOString().split('T')[0],
        uploaderCompletedDeals: 0,
        uploaderSuccessRate: 100,
        whatsappGroupLink: "",
        urgency: true,
        trending: true,
        daysLeft: 7,
        escrowAmount: 0,
        escrowParticipants: 0,
        commitmentFeePaid: false,
        commitmentFeeAmount: 50000,
        externalMarketPrices: [],
        faqs: [],
        updates: [],
        trustBadges: [],
        timeline: []
      });
      
      setSelectedCategory("");
      setCustomCategory("");
      setCustomSubCategory("");
      setStep(1);
      setPriceInputMode('ngn');
      
      // Redirect to deals page
      setTimeout(() => {
        router.push(`/card-details?id=${dealId}`);
      }, 2000);

    } catch (error: any) {
      console.error('Error uploading deal:', error);
      alert2(`❌ ${error.message || 'Error uploading deal. Please try again.'}`, 'error');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  // Preview card
  const previewCard = () => {
    if (validateStep(step)) {
      setPreviewMode(true);
    } else {
      alert2(`Please complete all required fields in step ${step} before previewing.`, 'error');
    }
  };

  // Steps configuration (updated with variants step)
  const steps = [
    { number: 1, title: "Basic Info", icon: <FileText className="w-5 h-5" /> },
    { number: 2, title: "Pricing", icon: <DollarSign className="w-5 h-5" /> },
    { number: 3, title: "Logistics", icon: <Truck className="w-5 h-5" /> },
    { number: 4, title: "Market", icon: <BarChart className="w-5 h-5" /> },
    { number: 5, title: "Details", icon: <Package className="w-5 h-5" /> },
    { number: 6, title: "Variants", icon: <List className="w-5 h-5" /> },
    { number: 7, title: "Images", icon: <Camera className="w-5 h-5" /> },
    { number: 8, title: "Uploader", icon: <UsersRound className="w-5 h-5" /> },
    { number: 9, title: "Verification", icon: <Shield className="w-5 h-5" /> }
  ];

  // Don't render until mounted to avoid hydration errors
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-800">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
            <span className="hidden sm:inline text-gray-800">Back</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={previewCard}
              className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <h1 className="text-xl font-bold text-gray-900 hidden md:block">
              Upload Bulk Deal
            </h1>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            {steps.map((stepItem) => (
              <button
                key={stepItem.number}
                type="button"
                className={`flex items-center gap-2 ${step >= stepItem.number ? "cursor-pointer" : "cursor-not-allowed"}`}
                onClick={() => step >= stepItem.number && setStep(stepItem.number)}
                disabled={step < stepItem.number}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${
                  step === stepItem.number
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : step > stepItem.number
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-gray-300 bg-gray-50 text-gray-600"
                }`}>
                  {stepItem.icon}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs">Step {stepItem.number}</p>
                  <p className="text-sm font-bold text-gray-900">{stepItem.title}</p>
                </div>
                {stepItem.number < 9 && (
                  <div className={`h-0.5 w-4 sm:w-8 ${
                    step > stepItem.number ? "bg-green-500" : "bg-gray-400"
                  }`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {previewMode ? (
          // Preview Mode
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Deal Preview</h2>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close Preview
              </button>
            </div>
            
            {/* Preview Card */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-xl overflow-hidden">
                  {formData.images.length > 0 ? (
                    <img 
                      src={formData.images[0]} 
                      alt="Product preview"
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{formData.title || "Product Title"}</h3>
                  <p className="text-gray-800">{formData.description || "Product description will appear here..."}</p>
                  
                  {/* WhatsApp Group Link in Preview */}
                  {formData.whatsappGroupLink && (
                    <div className="mt-4">
                      <a 
                        href={formData.whatsappGroupLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Join WhatsApp Group for Updates
                      </a>
                    </div>
                  )}
                  
                  {/* Estimated Dates in Preview */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-800">Estimated Procurement Date</p>
                      <p className="font-bold text-gray-900">
                        {new Date(formData.estimatedProcurementDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-800">Estimated Nigeria Arrival</p>
                      <p className="font-bold text-gray-900">
                        {new Date(formData.estimatedNigeriaArrivalDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Variants in Preview */}
                  {formData.hasVariants && (formData.variants || []).length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-bold text-gray-900 mb-2">Available Variants</h4>
                      <div className="flex flex-wrap gap-2">
                        {(formData.variants || []).slice(0, 5).map((variant, index) => (
                          <div key={index} className="bg-gray-100 px-3 py-2 rounded-lg">
                            <p className="text-sm font-bold text-gray-900">{variant.name}</p>
                            <p className="text-xs text-gray-800">₦{variant.buyingPrice?.toLocaleString()}</p>
                          </div>
                        ))}
                        {(formData.variants || []).length > 5 && (
                          <div className="bg-gray-100 px-3 py-2 rounded-lg">
                            <p className="text-sm text-gray-800">+{(formData.variants || []).length - 5} more</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                  <h4 className="font-bold text-gray-900 mb-3">Pricing Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-800">Buying Price:</span>
                      <span className="font-bold">{formatCurrency(formData.buyingPrice)}</span>
                    </div>
                    
                    {/* Multi-currency display */}
                    {formData.buyingPriceYuan > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-800">Buying Price (Yuan):</span>
                        <span className="font-bold">{formatYuan(formData.buyingPriceYuan)}</span>
                      </div>
                    )}
                    
                    {formData.buyingPriceUSD > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-800">Buying Price (USD):</span>
                        <span className="font-bold">{formatUSD(formData.buyingPriceUSD)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-800">Landed Cost:</span>
                      <span className="font-bold">{formatCurrency(derivedValues.landedCostPerUnit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800">Recommended Price:</span>
                      <span className="font-bold">{formatCurrency(formData.recommendedPrice)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-orange-200">
                      <span className="text-green-600 font-bold">Profit Per Unit:</span>
                      <span className="text-green-600 font-bold text-lg">
                        {formatCurrency(derivedValues.profitPerUnit)} ({derivedValues.margin}%)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-3">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-800">MOQ</p>
                      <p className="font-bold text-lg">{formData.moq} units</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-800">Shipping Time</p>
                      <p className="font-bold text-lg">{formData.estimatedShippingDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-800">Target Margin</p>
                      <p className="font-bold text-lg">{formData.profitMargin}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-800">Commitment Fee</p>
                      <p className="font-bold text-lg">
                        {formData.commitmentFeePaid ? "✅ Paid" : "❌ Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Form Mode
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                    <p className="text-gray-800">Tell us about your product</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Rechargeable Standing Fan - Stay Cool Anywhere"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      required
                    />
                    <p className="text-xs text-gray-700 mt-1">
                      Make it descriptive and attractive to buyers
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Category *
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                        required
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      
                      {selectedCategory === "other" && (
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => {
                            setCustomCategory(e.target.value);
                            setFormData(prev => ({ ...prev, category: e.target.value }));
                          }}
                          placeholder="Enter custom category"
                          className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                          required
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Sub-Category
                      </label>
                      {selectedCategory && selectedCategory !== "other" ? (
                        <select
                          value={formData.subCategory}
                          onChange={(e) => handleSubCategoryChange(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                        >
                          {(subCategories[selectedCategory as keyof typeof subCategories] || ["Select Sub-Category"]).map((subCat) => (
                            <option key={subCat} value={subCat}>{subCat}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={customSubCategory || formData.subCategory}
                          onChange={(e) => {
                            setCustomSubCategory(e.target.value);
                            setFormData(prev => ({ ...prev, subCategory: e.target.value }));
                          }}
                          placeholder="Enter sub-category"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">
                      Product Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Describe your product in detail. Include key features, benefits, specifications, target users, and any other important information..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      required
                    />
                    <p className="text-xs text-gray-700 mt-1">
                      Be detailed. Buyers want to know exactly what they're getting.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">
                      Target Market
                    </label>
                    <input
                      type="text"
                      name="targetMarket"
                      value={formData.targetMarket}
                      onChange={handleChange}
                      placeholder="e.g., Nigeria, Ghana, Kenya, South Africa"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Supplier & Pricing */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Supplier & Pricing</h2>
                    <p className="text-gray-800">Cost and supplier details</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Product Source URL */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <GlobeIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-gray-900">Product Source Information</h3>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Product Source URL (1688, Alibaba, etc.)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          name="productSourceUrl"
                          value={formData.productSourceUrl}
                          onChange={handleChange}
                          placeholder="https://www.1688.com/product/12345 or https://www.alibaba.com/product-detail/..."
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                        />
                        {formData.productSourceUrl && (
                          <a
                            href={formData.productSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Check
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-2">
                        Provide the direct link to the product on 1688, Alibaba, or other sourcing platforms. This helps buyers verify prices.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Country of Origin *
                      </label>
                      <select
                        name="origin"
                        value={formData.origin}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                        required
                      >
                        {countries.map((country) => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Supplier/Factory Name
                      </label>
                      <input
                        type="text"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleChange}
                        placeholder="e.g., XYZ Manufacturing Co."
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Supplier Rating (1-5)
                      </label>
                      <input
                        type="number"
                        name="supplierRating"
                        value={formData.supplierRating}
                        onChange={handleChange}
                        min="1"
                        max="5"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Supplier Reviews
                      </label>
                      <input
                        type="number"
                        name="supplierReviews"
                        value={formData.supplierReviews}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                  </div>
                  
                  {/* Multi-Currency Price Input */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Buying Price Input</h3>
                      <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-300">
                        <button
                          type="button"
                          onClick={() => setPriceInputMode('ngn')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${priceInputMode === 'ngn' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          ₦ NGN
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriceInputMode('yuan')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${priceInputMode === 'yuan' ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          ¥ CNY
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriceInputMode('usd')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${priceInputMode === 'usd' ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          $ USD
                        </button>
                      </div>
                    </div>
                    
                    {/* Exchange Rate Input for Yuan */}
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Exchange Rate (1 CNY → NGN)
                      </label>
                      <input
                        type="number"
                        name="exchangeRateYuanToNaira"
                        value={formData.exchangeRateYuanToNaira || DEFAULT_EXCHANGE_RATES.CNY_TO_NGN}
                        onChange={handleChange}
                        min="1"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                      <p className="text-xs text-gray-700 mt-1">Current rate: ~{DEFAULT_EXCHANGE_RATES.CNY_TO_NGN} NGN per Yuan</p>
                    </div>

                    {/* Exchange Rate Input for USD */}
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Exchange Rate (1 USD → NGN)
                      </label>
                      <input
                        type="number"
                        name="exchangeRateUSDToNaira"
                        value={formData.exchangeRateUSDToNaira || DEFAULT_EXCHANGE_RATES.USD_TO_NGN}
                        onChange={handleChange}
                        min="1"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                      <p className="text-xs text-gray-700 mt-1">Current rate: ~{DEFAULT_EXCHANGE_RATES.USD_TO_NGN} NGN per USD</p>
                    </div>
                    
                    {/* Price Input Based on Selected Currency */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {priceInputMode === 'ngn' && (
                        <div className="md:col-span-3">
                          <label className="block text-sm text-gray-900 mb-2">
                            Buying Price (₦ NGN) *
                          </label>
                          <input
                            type="number"
                            name="buyingPrice"
                            value={formData.buyingPrice || ""}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                          />
                          <p className="text-xs text-gray-700 mt-1">Per unit from supplier in Naira</p>
                        </div>
                      )}
                      
                      {priceInputMode === 'yuan' && (
                        <div className="md:col-span-3">
                          <label className="block text-sm text-gray-900 mb-2">
                            Buying Price (¥ CNY) *
                          </label>
                          <input
                            type="number"
                            value={formData.buyingPriceYuan || ""}
                            onChange={(e) => handleCurrencyChange(parseFloat(e.target.value) || 0, 'yuan')}
                            min="0"
                            step="0.01"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                          />
                          <p className="text-xs text-gray-700 mt-1">
                            Per unit from supplier in Chinese Yuan. Equivalent to: {formatCurrency(formData.buyingPrice)}
                          </p>
                        </div>
                      )}
                      
                      {priceInputMode === 'usd' && (
                        <div className="md:col-span-3">
                          <label className="block text-sm text-gray-900 mb-2">
                            Buying Price ($ USD) *
                          </label>
                          <input
                            type="number"
                            value={formData.buyingPriceUSD || ""}
                            onChange={(e) => handleCurrencyChange(parseFloat(e.target.value) || 0, 'usd')}
                            min="0"
                            step="0.01"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                          />
                          <p className="text-xs text-gray-700 mt-1">
                            Per unit from supplier in US Dollars. Equivalent to: {formatCurrency(formData.buyingPrice)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Currency Conversion Display */}
                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-800">NGN</p>
                          <p className="font-bold text-lg text-gray-900">{formatCurrency(formData.buyingPrice)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-800">CNY</p>
                          <p className="font-bold text-lg text-red-600">{formatYuan(formData.buyingPriceYuan)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-800">USD</p>
                          <p className="font-bold text-lg text-green-600">{formatUSD(formData.buyingPriceUSD)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Retail Price (₦)
                      </label>
                      <input
                        type="number"
                        name="retailPrice"
                        value={formData.retailPrice || ""}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Minimum Order Quantity (MOQ) *
                      </label>
                      <input
                        type="number"
                        name="moq"
                        value={formData.moq || ""}
                        onChange={handleChange}
                        min="10"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                      <p className="text-xs text-gray-700 mt-1">Minimum units needed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Weight Per Unit (kg)
                      </label>
                      <input
                        type="number"
                        name="weightPerUnit"
                        value={formData.weightPerUnit || ""}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                  </div>
                  
                  {/* Price Calculator */}
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Price Calculator
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-800">Unit Cost</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(formData.buyingPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">Total MOQ Cost</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(formData.buyingPrice * formData.moq)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-800">Breakdown</p>
                        <div className="text-xs text-gray-700 space-y-1">
                          <div className="flex justify-between">
                            <span>In Chinese Yuan:</span>
                            <span>{formatYuan(formData.buyingPriceYuan)} per unit</span>
                          </div>
                          <div className="flex justify-between">
                            <span>In US Dollars:</span>
                            <span>{formatUSD(formData.buyingPriceUSD)} per unit</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Exchange Rate (CNY→NGN):</span>
                            <span>{formData.exchangeRateYuanToNaira} NGN per Yuan</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Exchange Rate (USD→NGN):</span>
                            <span>{formData.exchangeRateUSDToNaira} NGN per USD</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Logistics */}
            {step === 3 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Logistics & Shipping</h2>
                    <p className="text-gray-800">Transportation and customs details</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Weight Per Unit (kg) *
                      </label>
                      <input
                        type="number"
                        name="weightPerUnit"
                        value={formData.weightPerUnit || ""}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Estimated Shipping Days *
                      </label>
                      <input
                        type="number"
                        name="estimatedShippingDays"
                        value={formData.estimatedShippingDays || ""}
                        onChange={handleChange}
                        min="1"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">
                      Shipping Method
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {shippingMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <label
                            key={method.value}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${
                              formData.shippingMethod === method.value
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={method.value}
                              checked={formData.shippingMethod === method.value}
                              onChange={handleChange}
                              className="hidden"
                            />
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{method.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Estimated Dates Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                      Estimated Timeline
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-900 mb-2">
                          Estimated Procurement Date
                        </label>
                        <input
                          type="date"
                          name="estimatedProcurementDate"
                          value={formData.estimatedProcurementDate}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                        />
                        <p className="text-xs text-gray-700 mt-1">
                          When procurement will start (approx. 7 days from now)
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-900 mb-2">
                          Estimated Nigeria Arrival Date
                        </label>
                        <input
                          type="date"
                          name="estimatedNigeriaArrivalDate"
                          value={formData.estimatedNigeriaArrivalDate}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                        />
                        <p className="text-xs text-gray-700 mt-1">
                          Estimated arrival in Nigeria based on shipping method
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-800">
                        <span className="font-bold">Shipping Method:</span> {shippingMethods.find(m => m.value === formData.shippingMethod)?.label}
                      </p>
                      <p className="text-sm text-gray-800">
                        <span className="font-bold">Estimated Transit Time:</span> {formData.estimatedShippingDays} days
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Customs & Duties (₦/kg)
                      </label>
                      <input
                        type="number"
                        name="customsPerKg"
                        value={formData.customsPerKg || ""}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Shipping Cost (₦)
                      </label>
                      <input
                        type="number"
                        name="shippingCost"
                        value={formData.shippingCost || ""}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Sea Freight (₦/kg)
                      </label>
                      <input
                        type="number"
                        name="seaFreightPerKg"
                        value={formData.seaFreightPerKg || ""}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Air Freight (₦/kg)
                      </label>
                      <input
                        type="number"
                        name="airFreightPerKg"
                        value={formData.airFreightPerKg || ""}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Land Freight (₦/kg)
                      </label>
                      <input
                        type="number"
                        name="landFreightPerKg"
                        value={formData.landFreightPerKg || ""}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                  </div>
                  
                  {/* Logistics Calculator */}
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Ship className="w-4 h-4" />
                      Logistics Calculator
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-800">Logistics per unit:</span>
                        <span className="font-bold">{formatCurrency(derivedValues.logisticsPerUnit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800">Total landed cost:</span>
                        <span className="font-bold text-lg text-green-600">
                          {formatCurrency(derivedValues.landedCostPerUnit)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-700 mt-2">
                        This includes buying price + freight + customs
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline Setup */}
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">
                      Shipping Timeline
                    </label>
                    <div className="space-y-3">
                      {formData.timeline.map((stage, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={stage.stage}
                            onChange={(e) => handleArrayChange('timeline', index, {
                              ...stage,
                              stage: e.target.value
                            })}
                            placeholder="Stage name"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                          />
                          <input
                            type="text"
                            value={stage.days}
                            onChange={(e) => handleArrayChange('timeline', index, {
                              ...stage,
                              days: e.target.value
                            })}
                            placeholder="Duration"
                            className="w-32 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                          />
                          <input
                            type="text"
                            value={stage.icon}
                            onChange={(e) => handleArrayChange('timeline', index, {
                              ...stage,
                              icon: e.target.value
                            })}
                            placeholder="Icon"
                            className="w-20 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('timeline', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('timeline', { stage: '', days: '', icon: '' })}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Timeline Stage
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Market Information */}
            {step === 4 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BarChart className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Market Information</h2>
                    <p className="text-gray-800">Pricing strategy and competition</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Market Price Range (₦) *
                      </label>
                      <input
                        type="text"
                        name="marketPriceRange"
                        value={formData.marketPriceRange}
                        onChange={handleChange}
                        placeholder="e.g., ₦50,000 – ₦55,000"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      />
                      <p className="text-xs text-gray-700 mt-1">Current selling price range in Nigeria</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Recommended Resale Price (₦) *
                      </label>
                      <input
                        type="number"
                        name="recommendedPrice"
                        value={formData.recommendedPrice || ""}
                        onChange={handleChange}
                        min="0"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                      <p className="text-xs text-gray-700 mt-1">Optimal price for quick sales</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Estimated Profit Per Unit (₦)
                      </label>
                      <input
                        type="number"
                        name="estimatedProfitPerUnit"
                        value={formData.estimatedProfitPerUnit || ""}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Target Profit Margin (%)
                      </label>
                      <input
                        type="number"
                        name="profitMargin"
                        value={formData.profitMargin || ""}
                        onChange={handleChange}
                        min="0"
                        max="200"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                  </div>
                  
                  {/* External Market Comparison */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">External Market Prices</h3>
                      <button
                        type="button"
                        onClick={addExternalPrice}
                        className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Add Platform
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.externalMarketPrices.map((market, index) => (
                        <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-purple-800">Platform {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeArrayItem('externalMarketPrices', index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Platform (e.g., Jumia)"
                              value={market.platform}
                              onChange={(e) => handleArrayChange('externalMarketPrices', index, {
                                ...market,
                                platform: e.target.value
                              })}
                              className="px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                            />
                            <input
                              type="number"
                              placeholder="Price (₦)"
                              value={market.price || ""}
                              onChange={(e) => handleArrayChange('externalMarketPrices', index, {
                                ...market,
                                price: parseFloat(e.target.value) || 0
                              })}
                              className="px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                            />
                            <input
                              type="text"
                              placeholder="URL"
                              value={market.url}
                              onChange={(e) => handleArrayChange('externalMarketPrices', index, {
                                ...market,
                                url: e.target.value
                              })}
                              className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Profit Calculator */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Profit Calculator
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-800">Landed Cost Per Unit</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(derivedValues.landedCostPerUnit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">Recommended Price</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(formData.recommendedPrice)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex justify-between items-center pt-3 border-t border-green-200">
                          <span className="text-lg font-bold text-green-700">Estimated Profit Per Unit</span>
                          <span className="text-2xl font-bold text-green-700">
                            {formatCurrency(derivedValues.profitPerUnit)} ({derivedValues.margin}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 5: Product Details */}
            {step === 5 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
                    <p className="text-gray-800">Specifications and features</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Specifications */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">Product Specifications</h3>
                      <button
                        type="button"
                        onClick={addSpecification}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Specification
                      </button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(formData.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="Specification"
                            value={key}
                            onChange={(e) => {
                              const newSpecs = { ...formData.specifications };
                              delete newSpecs[key];
                              newSpecs[e.target.value] = value as string;
                              setFormData(prev => ({ ...prev, specifications: newSpecs }));
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={(() => {
                              if (value === undefined || value === null) return '';
                              if (typeof value === 'boolean') return value.toString();
                              if (typeof value === 'number') return value.toString();
                              return value as string;
                            })()}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              specifications: {
                                ...prev.specifications,
                                [key]: e.target.value
                              }
                            }))}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpecification(key)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">Key Features *</h3>
                      <span className="text-sm text-gray-700">Minimum 1 feature required</span>
                    </div>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleArrayChange('features', index, e.target.value)}
                            placeholder="e.g., Rechargeable battery with 8-hour runtime"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                            required={index === 0}
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeArrayItem('features', index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('features', "")}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Feature
                      </button>
                    </div>
                  </div>
                  
                  {/* FAQs */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">Frequently Asked Questions</h3>
                      <button
                        type="button"
                        onClick={addFAQ}
                        className="px-3 py-1.5 text-sm bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Add FAQ
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.faqs.map((faq, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                            className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 bg-gray-100"
                          >
                            <span className="text-gray-900 pr-4">
                              FAQ {index + 1}: {faq.question || "New Question"}
                            </span>
                            {showFAQ === index ? (
                              <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                            )}
                          </button>
                          {showFAQ === index && (
                            <div className="p-4 space-y-3">
                              <input
                                type="text"
                                placeholder="Question"
                                value={faq.question}
                                onChange={(e) => handleArrayChange('faqs', index, {
                                  ...faq,
                                  question: e.target.value
                                })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                              />
                              <textarea
                                placeholder="Answer"
                                value={faq.answer}
                                onChange={(e) => handleArrayChange('faqs', index, {
                                  ...faq,
                                  answer: e.target.value
                                })}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                              />
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem('faqs', index)}
                                  className="px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove FAQ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Updates */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Deal Updates</h3>
                    <div className="space-y-3">
                      {formData.updates.map((update, index) => (
                        <div key={index} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5>Update {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeArrayItem('updates', index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="date"
                            value={update.date}
                            onChange={(e) => handleArrayChange('updates', index, {
                              ...update,
                              date: e.target.value
                            })}
                            className="w-full mb-2 px-3 py-2 rounded-lg border border-gray-300 text-black"
                          />
                          <input
                            type="text"
                            placeholder="Update title"
                            value={update.title}
                            onChange={(e) => handleArrayChange('updates', index, {
                              ...update,
                              title: e.target.value
                            })}
                            className="w-full mb-2 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                          />
                          <textarea
                            placeholder="Update description"
                            value={update.description}
                            onChange={(e) => handleArrayChange('updates', index, {
                              ...update,
                              description: e.target.value
                            })}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('updates', { 
                          date: new Date().toISOString().split('T')[0], 
                          title: "", 
                          description: "" 
                        })}
                        className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 6: Variants */}
            {step === 6 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <List className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Product Variants</h2>
                    <p className="text-gray-800">Add different colors, sizes, materials, etc.</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Toggle for variants */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h3 className="font-bold text-gray-900">Does this product have variants?</h3>
                      <p className="text-sm text-gray-800">e.g., different colors, sizes, or materials</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasVariants}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          hasVariants: e.target.checked,
                          variantTypes: e.target.checked ? [] : [],
                          variants: e.target.checked ? [createDefaultVariant()] : []
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  
                  {formData.hasVariants && (
                    <>
                      {/* Variant Types Management */}
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-gray-900">Variant Types</h3>
                          <button
                            type="button"
                            onClick={() => {
                              const newType = { name: '', options: [], required: true };
                              setFormData(prev => ({
                                ...prev,
                                variantTypes: [...(prev.variantTypes || []), newType]
                              }));
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Variant Type
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {(formData.variantTypes || []).map((type, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900">Type #{index + 1}</h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTypes = (formData.variantTypes || []).filter((_, i) => i !== index);
                                    setFormData(prev => ({ ...prev, variantTypes: newTypes }));
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <label className="block text-sm text-gray-900 mb-2">
                                    Type Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={type.name || ''}
                                    onChange={(e) => {
                                      const newTypes = [...(formData.variantTypes || [])];
                                      newTypes[index] = { ...type, name: e.target.value };
                                      setFormData(prev => ({ ...prev, variantTypes: newTypes }));
                                    }}
                                    placeholder="e.g., Color, Size, Material"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                                  />
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={type.required || true}
                                    onChange={(e) => {
                                      const newTypes = [...(formData.variantTypes || [])];
                                      newTypes[index] = { ...type, required: e.target.checked };
                                      setFormData(prev => ({ ...prev, variantTypes: newTypes }));
                                    }}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div>
                                    <label className="text-gray-900">Required Selection</label>
                                    <p className="text-xs text-gray-800">Buyer must choose this variant</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Options for this variant type */}
                              <div>
                                <label className="block text-sm text-gray-900 mb-2">
                                  Options *
                                </label>
                                <div className="space-y-2">
                                  {(type.options || []).map((option, optIndex) => (
                                    <div key={optIndex} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={option || ''}
                                        onChange={(e) => {
                                          const newTypes = [...(formData.variantTypes || [])];
                                          const newOptions = [...(type.options || [])];
                                          newOptions[optIndex] = e.target.value;
                                          newTypes[index] = { ...type, options: newOptions };
                                          setFormData(prev => ({ ...prev, variantTypes: newTypes }));
                                        }}
                                        placeholder={`Option ${optIndex + 1}`}
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newTypes = [...(formData.variantTypes || [])];
                                          const newOptions = (type.options || []).filter((_, i) => i !== optIndex);
                                          newTypes[index] = { ...type, options: newOptions };
                                          setFormData(prev => ({ ...prev, variantTypes: newTypes }));
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTypes = [...(formData.variantTypes || [])];
                                      const newOptions = [...(type.options || []), ''];
                                      newTypes[index] = { ...type, options: newOptions };
                                      setFormData(prev => ({ ...prev, variantTypes: newTypes }));
                                    }}
                                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add Option
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Generate Variants Button */}
                      {(formData.variantTypes || []).length > 0 && (
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={generateVariants}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:from-purple-600 hover:to-violet-600 transition-colors flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Generate Variant Combinations
                          </button>
                        </div>
                      )}
                      
                      {/* Variants Table */}
                      {(formData.variants || []).length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900">
                              Generated Variants ({(formData.variants || []).length})
                            </h3>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Variant</th>
                                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">SKU</th>
                                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Price (₦)</th>
                                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Weight (kg)</th>
                                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(formData.variants || []).map((variant, index) => (
                                  <tr key={variant.id || index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-gray-900">
                                        {variant.type}: {variant.name}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="text"
                                        value={variant.sku || ''}
                                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                        placeholder="Auto-generate"
                                        className="w-full px-3 py-1 rounded border border-gray-300 text-sm placeholder-gray-600 text-black"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="number"
                                        value={variant.buyingPrice || formData.buyingPrice}
                                        onChange={(e) => updateVariant(index, 'buyingPrice', parseFloat(e.target.value) || formData.buyingPrice)}
                                        className="w-32 px-3 py-1 rounded border border-gray-300 text-sm text-black"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="number"
                                        value={variant.weight || formData.weightPerUnit}
                                        onChange={(e) => updateVariant(index, 'weight', parseFloat(e.target.value) || formData.weightPerUnit)}
                                        step="0.1"
                                        className="w-24 px-3 py-1 rounded border border-gray-300 text-sm text-black"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-800">Total variants: {(formData.variants || []).length}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newVariant = createDefaultVariant();
                                  newVariant.id = `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                  newVariant.name = `Custom ${(formData.variants || []).length + 1}`;
                                  newVariant.type = 'Custom';
                                  setFormData(prev => ({
                                    ...prev,
                                    variants: [...(prev.variants || []), newVariant]
                                  }));
                                }}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Add Custom Variant
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 7: Images */}
            {step === 7 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Images & Media</h2>
                    <p className="text-gray-800">Upload product photos and videos</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Main Images */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">Product Images *</h3>
                        <p className="text-sm text-gray-800">Upload clear photos of your product</p>
                      </div>
                      <span className="text-sm text-gray-700">
                        {formData.images.length} / 10 images
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-4">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-300">
                          <img 
                            src={img} 
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setSelectedImageIndex(index)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x400/3b82f6/ffffff?text=Image+${index + 1}`;
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('images', index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      {formData.images.length < 10 && (
                        <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 cursor-pointer transition-colors flex flex-col items-center justify-center">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'images')}
                            className="hidden"
                            disabled={uploadingImages}
                          />
                          {uploadingImages ? (
                            <Loader2 className="w-8 h-8 text-gray-400 mb-2 animate-spin" />
                          ) : (
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          )}
                          <span className="text-sm text-gray-800">Add Image</span>
                          <span className="text-xs text-gray-700 mt-1">Max 10 images</span>
                        </label>
                      )}
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          <span className="font-bold">Images are uploaded to imgBB (secure image hosting).</span> Use high-quality images (min 800x800), show product from different angles, include packaging.
                        </p>
                      </div>
                    </div>
                    
                    {uploadingImages && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-gray-800 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading images to imgBB... Please wait.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Demo Images */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Demo Images (Optional)</h3>
                    <p className="text-sm text-gray-800 mb-3">
                      Upload demo/sample images that show the product being used or displayed
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {formData.demoImages.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-300">
                          <img 
                            src={img} 
                            alt={`Demo ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setSelectedImageIndex(index + formData.images.length)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x400/3b82f6/ffffff?text=Demo+${index + 1}`;
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('demoImages', index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors flex flex-col items-center justify-center">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'demoImages')}
                          className="hidden"
                          disabled={uploadingImages}
                        />
                        {uploadingImages ? (
                          <Loader2 className="w-8 h-8 text-gray-400 mb-2 animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        )}
                        <span className="text-sm text-gray-800">Add Demo</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Trust Badges */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Trust Badges</h3>
                    <div className="space-y-2">
                      {formData.trustBadges.map((badge, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <select
                            value={badge.color}
                            onChange={(e) => handleArrayChange('trustBadges', index, {
                              ...badge,
                              color: e.target.value
                            })}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-black"
                          >
                            <option value="green">Green</option>
                            <option value="orange">Orange</option>
                            <option value="blue">Blue</option>
                            <option value="purple">Purple</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Icon (emoji)"
                            value={badge.icon}
                            onChange={(e) => handleArrayChange('trustBadges', index, {
                              ...badge,
                              icon: e.target.value
                            })}
                            className="w-20 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                          />
                          <input
                            type="text"
                            placeholder="Badge text"
                            value={badge.text}
                            onChange={(e) => handleArrayChange('trustBadges', index, {
                              ...badge,
                              text: e.target.value
                            })}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-600 text-black"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('trustBadges', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('trustBadges', { text: "", icon: "", color: "green" })}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Trust Badge
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 8: Uploader Information */}
            {step === 8 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <UsersRound className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Uploader Information</h2>
                    <p className="text-gray-800">Your contact and business details</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="uploaderName"
                        value={formData.uploaderName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Company/Business Name
                      </label>
                      <input
                        type="text"
                        name="uploaderCompany"
                        value={formData.uploaderCompany}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="uploaderPhone"
                        value={formData.uploaderPhone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="uploaderEmail"
                        value={formData.uploaderEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        name="uploaderWhatsApp"
                        value={formData.uploaderWhatsApp}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Join Date
                      </label>
                      <input
                        type="date"
                        name="uploaderJoinDate"
                        value={formData.uploaderJoinDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                  </div>
                  
                  {/* WhatsApp Group Link */}
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">
                      WhatsApp Group Link (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      <input
                        type="url"
                        name="whatsappGroupLink"
                        value={formData.whatsappGroupLink}
                        onChange={handleChange}
                        placeholder="https://chat.whatsapp.com/yourgroupinvitelink"
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-gray-600 text-black"
                      />
                    </div>
                    <p className="text-xs text-gray-700 mt-1">
                      Add a WhatsApp group link for buyers to join for updates and discussions about this deal
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Completed Deals
                      </label>
                      <input
                        type="number"
                        name="uploaderCompletedDeals"
                        value={formData.uploaderCompletedDeals}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Success Rate (%)
                      </label>
                      <input
                        type="number"
                        name="uploaderSuccessRate"
                        value={formData.uploaderSuccessRate}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-900 mb-2">
                        Escrow Participants
                      </label>
                      <input
                        type="number"
                        name="escrowParticipants"
                        value={formData.escrowParticipants}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 9: Verification */}
            {step === 9 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Verification & Finalization</h2>
                    <p className="text-gray-800">Review and complete your deal</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* WhatsApp Group Link Review */}
                  {formData.whatsappGroupLink && (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        WhatsApp Group Link Added
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-800">Group Link:</span>
                          <a 
                            href={formData.whatsappGroupLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          >
                            Join Group <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-xs text-gray-700">
                          This link will be visible to buyers on the order card in their dashboard
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Product Source Review */}
                  {formData.productSourceUrl && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <GlobeIcon className="w-5 h-5 text-blue-600" />
                        Product Source Verification
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-800">Source URL:</span>
                          <a 
                            href={formData.productSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            View Source <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {formData.buyingPriceYuan > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-800">Price on Source (CNY):</span>
                            <span className="font-bold text-red-600">{formatYuan(formData.buyingPriceYuan)}</span>
                          </div>
                        )}
                        {formData.buyingPriceUSD > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-800">Price on Source (USD):</span>
                            <span className="font-bold text-green-600">{formatUSD(formData.buyingPriceUSD)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Estimated Dates Review */}
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-purple-600" />
                      Estimated Timeline
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-800">Estimated Procurement Start</p>
                        <p className="font-bold text-lg text-gray-900">
                          {new Date(formData.estimatedProcurementDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">Estimated Nigeria Arrival</p>
                        <p className="font-bold text-lg text-gray-900">
                          {new Date(formData.estimatedNigeriaArrivalDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-800">Shipping Method</p>
                        <p className="font-bold text-gray-900">
                          {shippingMethods.find(m => m.value === formData.shippingMethod)?.label} 
                          ({formData.estimatedShippingDays} days transit)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Variants Review */}
                  {formData.hasVariants && (formData.variants || []).length > 0 && (
                    <div className="bg-violet-50 p-4 rounded-xl border border-violet-200">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <List className="w-5 h-5 text-violet-600" />
                        Product Variants Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-800">Total Variants:</span>
                          <span className="font-bold">{(formData.variants || []).length} variants</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-800">Variant Types:</span>
                          <span className="font-bold">{(formData.variantTypes || []).map(t => t.name).join(', ')}</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-800">Sample Variants:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(formData.variants || []).slice(0, 3).map((variant, index) => (
                              <div key={index} className="bg-white px-2 py-1 rounded border border-gray-300">
                                <p className="text-xs font-bold text-gray-900">{variant.name}</p>
                              </div>
                            ))}
                            {(formData.variants || []).length > 3 && (
                              <div className="bg-gray-100 px-2 py-1 rounded border border-gray-300">
                                <p className="text-xs text-gray-800">+{(formData.variants || []).length - 3} more</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Urgency Settings */}
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <h3 className="font-bold text-gray-900 mb-3">Urgency Settings</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="urgency"
                          checked={formData.urgency}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                          <label className="text-gray-900">Mark as Urgent</label>
                          <p className="text-sm text-gray-800">Show urgency badge on deal</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="trending"
                          checked={formData.trending}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                          <label className="text-gray-900">Mark as Trending</label>
                          <p className="text-sm text-gray-800">Show trending badge on deal</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-900 mb-2">
                          Days Left for Deal
                        </label>
                        <input
                          type="number"
                          name="daysLeft"
                          value={formData.daysLeft}
                          onChange={handleChange}
                          min="1"
                          max="30"
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 text-black"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-900 mb-2">
                          Escrow Amount (₦)
                        </label>
                        <input
                          type="number"
                          name="escrowAmount"
                          value={formData.escrowAmount}
                          onChange={handleChange}
                          min="0"
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 text-black"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Commitment Fee */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h3 className="font-bold text-gray-900 mb-3">Commitment Fee</h3>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="commitmentFeePaid"
                        checked={formData.commitmentFeePaid}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                      />
                      <div>
                        <label className="text-gray-900">
                          I agree to pay the ₦50,000 commitment fee
                        </label>
                        <p className="text-sm text-gray-800 mt-1">
                          This fee ensures deal legitimacy and will be refunded when MOQ is reached.
                        </p>
                      </div>
                    </div>
                    
                    {formData.commitmentFeePaid && (
                      <div className="mt-3">
                        <label className="block text-sm text-gray-900 mb-2">
                          Commitment Fee Amount (₦)
                        </label>
                        <input
                          type="number"
                          name="commitmentFeeAmount"
                          value={formData.commitmentFeeAmount}
                          onChange={handleChange}
                          min="50000"
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 text-black"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Terms & Conditions */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-3">Terms & Conditions</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          required
                          className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 mt-1"
                        />
                        <div>
                          <label className="text-gray-900">
                            I confirm all information provided is accurate
                          </label>
                          <p className="text-sm text-gray-800">
                            I have verified all prices, specifications, and supplier details
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          required
                          className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 mt-1"
                        />
                        <div>
                          <label className="text-gray-900">
                            I agree to platform Terms of Service
                          </label>
                          <p className="text-sm text-gray-800">
                            Including escrow protection, buyer protection, and platform fees
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          required
                          className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 mt-1"
                        />
                        <div>
                          <label className="text-gray-900">
                            I understand my responsibilities as an uploader
                          </label>
                          <p className="text-sm text-gray-800">
                            Including order management, communication with buyers, and deal fulfillment
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Final Review */}
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Final Review
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-800">Product:</span>
                        <span className="text-gray-900">{formData.title || "Not set"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800">MOQ:</span>
                        <span className="text-gray-900">{formData.moq} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800">Estimated Profit Margin:</span>
                        <span className="text-green-600">{derivedValues.margin}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800">Total Required Capital:</span>
                        <span className="text-gray-900">
                          {formatCurrency(formData.moq * derivedValues.landedCostPerUnit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800">Commitment Fee:</span>
                        <span className="text-gray-900">₦{formData.commitmentFeeAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {step < 9 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep(step)) {
                        setStep(step + 1);
                      } else {
                        alert2(`Please complete all required fields in step ${step}`, 'error');
                      }
                    }}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || isProcessing}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading || isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Publish Bulk Deal
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={
              selectedImageIndex < formData.images.length
                ? formData.images[selectedImageIndex]
                : formData.demoImages[selectedImageIndex - formData.images.length]
            }
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/800x600/3b82f6/ffffff?text=Image+Preview`;
            }}
          />
        </div>
      )}

      {/* Mobile-specific styles for better readability */}
      <style jsx global>{`
        @media (max-width: 640px) {
          input::placeholder,
          textarea::placeholder,
          select::placeholder {
            color: #4b5563;
            opacity: 0.9;
          }
          
        
          input[type="text"],
          input[type="number"],
          input[type="tel"],
          input[type="email"],
          input[type="date"],
          input[type="password"],
          textarea,
          select {
           style={{ color: '#000000' }};
            font-size: 16px !important;
          }
          
     
          option {
            color: #000000 !important;
          }
          
         
          input:disabled,
          textarea:disabled,
          select:disabled {
            opacity: 0.8 !important;
            background-color: #f9fafb !important;
            color: #374151 !important;
          }
       
style={{ color: '#000000' }}
          
        
          .text-black {
            color: #000000;
          }
        }
      `}</style>
    </div>
  );
}
