"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  ArrowLeft,
  ChevronRight,
  Calendar,
  X,
  Star,
  Home,
  User as UserIcon,
  Phone,
  MapPin,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  Users,
  Tag,
  CreditCard
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  onSnapshot,
  DocumentData
} from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import debounce from "lodash/debounce";

// Types
interface VariantDetail {
  variantId: string;
  variantName: string;
  variantType: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
  id: string;
  dealId: string;
  userId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  logisticsCost: number;
  platformFee: number;
  totalPayable: number;
  paymentMethod: string;
  paymentStatus: "paid" | "failed" | "refunded" | "processing";
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "completed";
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  notes?: string;
  ratings?: {
    product: number;
    seller: number;
    delivery: number;
  };
  refundRequested?: boolean;
  refundReason?: string;
  trackingNumber?: string;
  carrier?: string;
  whatsappGroupLink?: string;
  variantDetails?: VariantDetail[];
  hasWhatsAppAccess?: boolean;
  moqProgress?: number;
  moqRequired?: number;
  moqStatus?: string;
}

interface BulkDeal {
  id: string;
  title: string;
  whatsappGroupLink?: string;
  uploaderName: string;
  uploaderWhatsApp?: string;
  shippingMethod?: string;
}

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
}

interface FilterOption {
  id: string;
  label: string;
  icon: any;
  count: number;
}

// Status tracking with proper order
const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "completed"
] as const;

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkDealsMap, setBulkDealsMap] = useState<Map<string, BulkDeal>>(new Map());
  const [error, setError] = useState<string | null>(null);
  
  const touchStartY = useRef<number | null>(null);
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Initialize debounce
  useEffect(() => {
    debouncedSearchRef.current = debounce((query: string, ordersList: Order[]) => {
      if (!query.trim()) {
        setFilteredOrders(ordersList);
        return;
      }
      
      const searchQuery = query.toLowerCase();
      const filtered = ordersList.filter(order => 
        order.title.toLowerCase().includes(searchQuery) ||
        order.id.toLowerCase().includes(searchQuery) ||
        (order.shippingAddress?.fullName?.toLowerCase().includes(searchQuery)) ||
        (bulkDealsMap.get(order.dealId)?.title?.toLowerCase().includes(searchQuery))
      );
      
      setFilteredOrders(filtered);
    }, 300);

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, [bulkDealsMap]);

  // Stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const processing = orders.filter(o => o.status === "processing").length;
    const paid = orders.filter(o => o.paymentStatus === "paid").length;
    const delivered = orders.filter(o => 
      o.status === "delivered" || o.status === "completed"
    ).length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalPayable, 0);
    
    return { totalOrders, processing, paid, delivered, totalSpent };
  }, [orders]);

  // Filters
  const filters: FilterOption[] = useMemo(() => [
    { id: "all", label: "All", icon: ShoppingBag, count: stats.totalOrders },
    { id: "pending", label: "Pending", icon: Clock, count: orders.filter(o => o.status === "pending").length },
    { id: "confirmed", label: "Confirmed", icon: CheckCircle, count: orders.filter(o => o.status === "confirmed").length },
    { id: "processing", label: "Processing", icon: Package, count: orders.filter(o => o.status === "processing").length },
    { id: "shipped", label: "Shipped", icon: Truck, count: orders.filter(o => o.status === "shipped").length },
    { id: "delivered", label: "Delivered", icon: CheckCircle, count: orders.filter(o => o.status === "delivered" || o.status === "completed").length },
    { id: "cancelled", label: "Cancelled", icon: XCircle, count: orders.filter(o => o.status === "cancelled").length }
  ], [orders, stats.totalOrders]);

  // Memoized helpers
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 60) {
        if (diffMinutes < 1) return "Just now";
        return `${diffMinutes}m ago`;
      }
      if (diffHours < 24) {
        if (diffHours === 1) return "1 hour ago";
        return `${diffHours}h ago`;
      }
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: diffDays > 365 ? 'numeric' : undefined
      });
    } catch {
      return "Invalid Date";
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-purple-100 text-purple-800";
      case "shipped": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-3.5 h-3.5" />;
      case "confirmed": return <CheckCircle className="w-3.5 h-3.5" />;
      case "processing": return <Package className="w-3.5 h-3.5" />;
      case "shipped": return <Truck className="w-3.5 h-3.5" />;
      case "delivered": return <CheckCircle className="w-3.5 h-3.5" />;
      case "completed": return <CheckCircle className="w-3.5 h-3.5" />;
      case "cancelled": return <XCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  }, []);

  const getPaymentStatusColor = useCallback((status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getPaymentStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="w-3 h-3" />;
      case "processing": return <Clock className="w-3 h-3" />;
      case "failed": return <XCircle className="w-3 h-3" />;
      case "refunded": return <CheckCircle className="w-3 h-3" />;
      default: return <CreditCard className="w-3 h-3" />;
    }
  }, []);

  const getPaymentStatusText = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      paid: "Payment Confirmed",
      processing: "Processing Payment",
      failed: "Payment Failed",
      refunded: "Refunded",
    };
    
    return statusMap[status] || "Payment Pending";
  }, []);

  // Parse variant details
  const parseVariantDetails = useCallback((variantData: any): VariantDetail[] => {
    if (!variantData) return [];
    
    try {
      if (Array.isArray(variantData)) {
        return variantData.map((vd: any) => ({
          variantId: vd.variantId || vd.id || "",
          variantName: vd.variantName || vd.name || vd.value || "",
          variantType: vd.variantType || vd.type || "",
          quantity: Number(vd.quantity) || 1,
          unitPrice: Number(vd.unitPrice) || Number(vd.price) || 0,
          total: Number(vd.total) || (Number(vd.quantity) || 1) * (Number(vd.unitPrice) || Number(vd.price) || 0)
        }));
      } else if (typeof variantData === 'object') {
        return [{
          variantId: variantData.variantId || variantData.id || "",
          variantName: variantData.variantName || variantData.name || variantData.value || "",
          variantType: variantData.variantType || variantData.type || "",
          quantity: Number(variantData.quantity) || 1,
          unitPrice: Number(variantData.unitPrice) || Number(variantData.price) || 0,
          total: Number(variantData.total) || (Number(variantData.quantity) || 1) * (Number(variantData.unitPrice) || Number(variantData.price) || 0)
        }];
      }
    } catch (error) {
      console.warn("Error parsing variant details:", error);
    }
    
    return [];
  }, []);

  // Fetch Bulk Deals
  const fetchBulkDeals = useCallback(async (dealIds: string[]) => {
    try {
      if (dealIds.length === 0) return;
      
      const uniqueDealIds = [...new Set(dealIds)].slice(0, 30);
      const dealsMap = new Map<string, BulkDeal>();
      
      const dealsQuery = query(
        collection(db, "bulk_deals"),
        where('__name__', 'in', uniqueDealIds)
      );
      
      const dealsSnapshot = await getDocs(dealsQuery);
      dealsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        dealsMap.set(doc.id, {
          id: doc.id,
          title: data.title || "Untitled Deal",
          whatsappGroupLink: data.whatsappGroupLink,
          uploaderName: data.uploaderName || "Unknown Supplier",
          uploaderWhatsApp: data.uploaderWhatsApp,
          shippingMethod: data.shippingMethod
        });
      });
      
      setBulkDealsMap(dealsMap);
    } catch (error) {
      console.warn("Error fetching bulk deals:", error);
    }
  }, []);

  // Process order data from Firestore
  const processOrderData = useCallback((docData: DocumentData, docId: string): Order => {
    const data = docData;
    const createdAt = data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString();
    const updatedAt = data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || createdAt;
    
    // Parse variant details
    const variantDetails = parseVariantDetails(data.variantDetails);
    
    // AUTO SET PAYMENT STATUS TO 'paid' WHEN ORDER IS CREATED
    // If order exists, payment is considered successful
    let paymentStatus = data.paymentStatus || "paid";
    
    // Convert any old "pending" or "processing" to "paid" for existing orders
    if (paymentStatus === "pending" || paymentStatus === "processing") {
      paymentStatus = "paid";
    }
    
    // Ensure it's one of the valid values
    const validStatuses = ["paid", "failed", "refunded"];
    if (!validStatuses.includes(paymentStatus)) {
      // Default to paid for any other unexpected status
      paymentStatus = "paid";
    }
    
    return {
      id: docId,
      dealId: data.dealId || "",
      userId: data.userId || "",
      title: data.title || "Untitled Order",
      quantity: Number(data.quantity) || 1,
      unitPrice: Number(data.unitPrice) || 0,
      logisticsCost: Number(data.logisticsCost) || 0,
      platformFee: Number(data.platformFee) || 0,
      totalPayable: Number(data.totalPayable) || 0,
      paymentMethod: data.paymentMethod || "",
      paymentStatus: paymentStatus as "paid" | "failed" | "refunded" | "processing",
      status: data.status || "pending",
      estimatedDelivery: data.estimatedDelivery || "",
      createdAt,
      updatedAt,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
      ratings: data.ratings,
      refundRequested: data.refundRequested || false,
      refundReason: data.refundReason,
      trackingNumber: data.trackingNumber,
      carrier: data.carrier,
      whatsappGroupLink: data.whatsappGroupLink,
      variantDetails: variantDetails,
      hasWhatsAppAccess: Boolean(data.hasWhatsAppAccess),
      moqProgress: Number(data.moqProgress) || 0,
      moqRequired: Number(data.moqRequired) || 0,
      moqStatus: data.moqStatus || "pending"
    };
  }, [parseVariantDetails]);

  // Fetch all data
  const fetchAllData = useCallback(async (userId: string) => {
    try {
      setError(null);
      
      // Fetch orders and user profile in parallel
      const [ordersSnapshot, userDoc] = await Promise.all([
        getDocs(query(
          collection(db, "orders"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        )),
        getDoc(doc(db, "users", userId))
      ]);

      // Process orders
      const ordersData: Order[] = [];
      const dealIds: string[] = [];
      
      ordersSnapshot.docs.forEach(doc => {
        const order = processOrderData(doc.data(), doc.id);
        ordersData.push(order);
        
        if (order.dealId && !dealIds.includes(order.dealId)) {
          dealIds.push(order.dealId);
        }
      });

      // Set user if exists
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          uid: userId,
          name: userData.name || userData.fullName || "User",
          email: userData.email,
          phone: userData.phone || "",
          businessName: userData.businessName || ""
        });
      }

      // Set orders immediately
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      
      // Fetch bulk deals in background
      if (dealIds.length > 0) {
        fetchBulkDeals(dealIds);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load orders. Please try again.");
      throw error;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchBulkDeals, processOrderData]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(value, orders);
    }
  }, [orders]);

  // Apply filters
  const applyFilters = useCallback(() => {
    let result = orders;
    
    if (activeFilter !== "all") {
      result = result.filter(order => order.status === activeFilter);
    }
    
    if (searchQuery && debouncedSearchRef.current) {
      debouncedSearchRef.current(searchQuery, result);
    } else {
      setFilteredOrders(result);
    }
  }, [orders, activeFilter, searchQuery]);

  // Setup real-time listener
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          await fetchAllData(firebaseUser.uid);
          
          // Setup real-time updates
          const ordersQuery = query(
            collection(db, "orders"),
            where("userId", "==", firebaseUser.uid),
            orderBy("createdAt", "desc")
          );
          
          unsubscribeSnapshot = onSnapshot(ordersQuery, (snapshot) => {
            const updatedOrders: Order[] = [];
            const dealIds: string[] = [];
            
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added' || change.type === 'modified') {
                const order = processOrderData(change.doc.data(), change.doc.id);
                updatedOrders.push(order);
                
                if (order.dealId && !dealIds.includes(order.dealId)) {
                  dealIds.push(order.dealId);
                }
              }
            });
            
            // Update state with new orders
            setOrders(prev => {
              const orderMap = new Map(prev.map(order => [order.id, order]));
              updatedOrders.forEach(order => orderMap.set(order.id, order));
              
              return Array.from(orderMap.values()).sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
            
            // Fetch bulk deals for new orders if needed
            if (dealIds.length > 0) {
              fetchBulkDeals(dealIds);
            }
          });
          
        } catch (error) {
          console.error("Error in auth listener:", error);
          setError("Authentication error. Please login again.");
          router.push("/auth");
        }
      } else {
        router.push("/auth");
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [fetchAllData, fetchBulkDeals, processOrderData, router]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle pull-to-refresh
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY.current;
      
      // Only trigger if pulling down
      if (diff > 0 && window.scrollY === 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const distance = touchEndY - touchStartY.current;
      
      if (distance > 50 && window.scrollY === 0) {
        setRefreshing(true);
        if (user) {
          fetchAllData(user.uid);
        }
      }
      
      touchStartY.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [user, fetchAllData]);

  // Handlers
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleRefresh = () => {
    if (!refreshing && user) {
      setRefreshing(true);
      fetchAllData(user.uid);
    }
  };

  const handleJoinWhatsAppGroup = (order: Order) => {
    const bulkDeal = bulkDealsMap.get(order.dealId);
    if (bulkDeal?.whatsappGroupLink) {
      window.open(bulkDeal.whatsappGroupLink, '_blank', 'noopener,noreferrer');
    }
  };

  const getOrderStatusProgress = (order: Order) => {
    const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status as any);
    if (currentIndex === -1) return order.status === "cancelled" ? 0 : 100;
    return ((currentIndex + 1) / ORDER_STATUS_FLOW.length) * 100;
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 safe-area overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 pt-2 pb-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex-1 px-2">
              <div className="h-6 bg-gray-200 rounded mx-auto max-w-[200px] animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded mx-auto max-w-[150px] mt-1 animate-pulse"></div>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-3 rounded-xl border border-gray-200">
                <div className="text-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg mx-auto mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pt-4 pb-3">
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-full min-w-[80px] animate-pulse"></div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-24">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="h-3 bg-gray-200 rounded mb-1 w-1/3 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 rounded mb-1 w-1/3 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center safe-area p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold active:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-bold active:bg-gray-50 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Order Details Modal
  if (showOrderDetails && selectedOrder) {
    const bulkDeal = bulkDealsMap.get(selectedOrder.dealId);
    const statusProgress = getOrderStatusProgress(selectedOrder);
    const paymentStatusText = getPaymentStatusText(selectedOrder.paymentStatus);
    
    return (
      <div className="fixed inset-0 bg-white z-50 animate-slideIn safe-area overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 pt-2 pb-3 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowOrderDetails(false)}
              className="p-2 -ml-2 active:bg-gray-100 rounded-lg transition-colors active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            
            <div className="flex-1 px-2 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 text-center truncate">
                {selectedOrder.title}
              </h1>
              <p className="text-xs text-gray-500 text-center truncate">Order #{selectedOrder.id.slice(-8)}</p>
            </div>
            
            <div className="w-10"></div>
          </div>
        </div>

        <div className="h-[calc(100vh-130px)] overflow-y-auto px-4 pb-4 -webkit-overflow-scrolling-touch">
          <div className={`mt-4 p-4 rounded-xl ${getStatusColor(selectedOrder.status)} flex items-center justify-between`}>
            <div>
              <p className="font-bold text-lg capitalize">{selectedOrder.status}</p>
              <p className="text-sm opacity-90">{paymentStatusText}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(selectedOrder.totalPayable)}</p>
              <p className="text-sm">{selectedOrder.quantity} item{selectedOrder.quantity > 1 ? 's' : ''}</p>
            </div>
          </div>

          {selectedOrder.variantDetails && selectedOrder.variantDetails.length > 0 && (
            <div className="mt-4 bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-600" />
                <span>Selected Variants</span>
              </h3>
              <div className="space-y-2">
                {selectedOrder.variantDetails.map((variant, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">
                        {variant.variantType}: {variant.variantName}
                      </p>
                      <p className="text-xs text-gray-500">ID: {variant.variantId || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">x{variant.quantity}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(variant.unitPrice)} each</p>
                      <p className="text-xs font-medium text-gray-900">
                        Total: {formatCurrency(variant.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Order Placed</span>
              <span>Delivered</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${statusProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
              {selectedOrder.estimatedDelivery && (
                <span className="font-medium">
                  {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>

          {bulkDeal?.whatsappGroupLink && (
            <div className="mt-4">
              <button
                onClick={() => handleJoinWhatsAppGroup(selectedOrder)}
                className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold active:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
              >
                <Users className="w-5 h-5" />
                Join WhatsApp Group
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Connect with other buyers and the supplier
              </p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="font-bold text-gray-900 mb-3">Order Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">Order Placed</p>
                  <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  getPaymentStatusColor(selectedOrder.paymentStatus)
                }`}>
                  {getPaymentStatusIcon(selectedOrder.paymentStatus)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">Payment Status</p>
                  <p className="text-sm text-gray-500 truncate">{paymentStatusText}</p>
                </div>
              </div>
              
              {selectedOrder.estimatedDelivery && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">Estimated Delivery</p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {bulkDeal && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Bulk Deal Information</span>
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier:</span>
                  <span className="font-medium text-gray-900 truncate ml-2">{bulkDeal.uploaderName}</span>
                </div>
                {bulkDeal.uploaderWhatsApp && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier WhatsApp:</span>
                    <a 
                      href={`https://wa.me/${bulkDeal.uploaderWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-green-600 truncate ml-2"
                    >
                      Chat Now
                    </a>
                  </div>
                )}
                {bulkDeal.shippingMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Method:</span>
                    <span className="font-medium text-gray-900 truncate ml-2">{bulkDeal.shippingMethod}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedOrder.shippingAddress && (
            <div className="mt-6 bg-blue-50 rounded-xl p-4">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>Shipping Address</span>
              </h2>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <UserIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{selectedOrder.shippingAddress.fullName}</p>
                    <a 
                      href={`tel:${selectedOrder.shippingAddress.phone}`}
                      className="text-sm text-blue-600 flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{selectedOrder.shippingAddress.phone}</span>
                    </a>
                  </div>
                </div>
                <div className="pl-8">
                  <p className="text-gray-900 truncate">{selectedOrder.shippingAddress.address}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="font-bold text-gray-900 mb-3">Price Breakdown</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Item Price</span>
                <span className="font-medium">{formatCurrency(selectedOrder.unitPrice)} × {selectedOrder.quantity}</span>
              </div>
              {selectedOrder.variantDetails && selectedOrder.variantDetails.length > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Variants Total</span>
                  <span className="font-medium">
                    {formatCurrency(selectedOrder.variantDetails.reduce((sum, variant) => sum + variant.total, 0))}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Logistics</span>
                <span className="font-medium">{formatCurrency(selectedOrder.logisticsCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-medium">{formatCurrency(selectedOrder.platformFee)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">{formatCurrency(selectedOrder.totalPayable)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {selectedOrder.trackingNumber && (
              <button 
                onClick={() => window.open(`https://track.africa/${selectedOrder.trackingNumber}`, '_blank')}
                className="w-full p-3 bg-blue-50 text-blue-700 rounded-xl font-bold active:bg-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5" />
                Track Order #{selectedOrder.trackingNumber}
              </button>
            )}
            
            <button
              onClick={() => {
                setShowOrderDetails(false);
                setTimeout(() => router.push(`/card-detail/?id=${selectedOrder.dealId}`), 100);
              }}
              className="w-full p-3 bg-gray-100 text-gray-800 rounded-xl font-bold active:bg-gray-200 active:scale-[0.98] transition-all"
            >
              View Product Details
            </button>
            
            <button
              onClick={() => {
                setShowOrderDetails(false);
                setTimeout(() => router.push('/support'), 100);
              }}
              className="w-full p-3 border border-gray-300 text-gray-700 rounded-xl font-bold active:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Support
            </button>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-bold active:bg-gray-50 active:scale-[0.98] transition-all"
            >
              Print
            </button>
            <button
              onClick={() => {
                setShowOrderDetails(false);
                setTimeout(() => router.push('/bulky-cards'), 100);
              }}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold active:opacity-90 active:scale-[0.98] transition-all"
            >
              Shop More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Orders List
  return (
    <div className="min-h-screen bg-gray-50 safe-area">
      {refreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 safe-area-top">
          <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 pt-2 pb-3 safe-area-top">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 active:bg-gray-100 rounded-lg transition-colors active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex-1 px-2 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 text-center truncate">My Orders</h1>
            <p className="text-xs text-gray-500 text-center truncate">
              {stats.totalOrders} orders • {formatCurrency(stats.totalSpent)}
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="p-2 -mr-2 active:bg-gray-100 rounded-lg transition-colors active:scale-95"
            aria-label="Refresh"
            disabled={refreshing}
          >
            <RefreshCw className={`w-6 h-6 text-gray-700 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm active:scale-[0.96] transition-transform">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-[10px] text-gray-500">Total</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm active:scale-[0.96] transition-transform">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{stats.processing}</p>
              <p className="text-[10px] text-gray-500">Processing</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm active:scale-[0.96] transition-transform">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{stats.paid}</p>
              <p className="text-[10px] text-gray-500">Paid</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm active:scale-[0.96] transition-transform">
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{stats.delivered}</p>
              <p className="text-[10px] text-gray-500">Delivered</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders by ID, product or supplier..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-base"
            aria-label="Search orders"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 active:bg-gray-100 rounded"
              aria-label="Clear search"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -webkit-overflow-scrolling-touch">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-colors active:scale-95 ${
                activeFilter === filter.id
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 active:bg-gray-50"
              }`}
              aria-label={`Filter by ${filter.label}`}
            >
              <filter.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-sm font-medium">{filter.label}</span>
              {filter.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] flex-shrink-0 ${
                  activeFilter === filter.id
                    ? "bg-white text-orange-500"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-24">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6 px-4">
              {searchQuery
                ? "No orders match your search"
                : activeFilter !== "all"
                ? `You don't have any ${activeFilter} orders`
                : "Start shopping to see your orders here"}
            </p>
            <button
              onClick={() => router.push("/bulky-cards")}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold active:opacity-90 active:scale-95 transition-all shadow-lg"
            >
              Browse Deals
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const bulkDeal = bulkDealsMap.get(order.dealId);
              const paymentStatusText = getPaymentStatusText(order.paymentStatus);
              
              return (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm active:scale-[0.996] active:border-orange-300 transition-all cursor-pointer"
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{order.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">Order #{order.id.slice(-8)}</p>
                      
                      {order.variantDetails && order.variantDetails.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {order.variantDetails.slice(0, 2).map((variant, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                <span className="truncate">{variant.variantType}: {variant.variantName} (x{variant.quantity})</span>
                              </span>
                            ))}
                            {order.variantDetails.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                +{order.variantDetails.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} flex items-center gap-1`}>
                        {getStatusIcon(order.status)}
                        <span className="truncate">{order.status}</span>
                      </span>
                    </div>
                  </div>

                  {bulkDeal?.whatsappGroupLink && (
                    <div className="mb-3">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        <span>Group Available</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date</p>
                      <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{formatDate(order.createdAt)}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Amount</p>
                      <p className="font-bold text-gray-900 truncate">{formatCurrency(order.totalPayable)}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Payment</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {getPaymentStatusIcon(order.paymentStatus)}
                      <span className="truncate">{paymentStatusText}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {order.ratings && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900">
                            {order.ratings.product.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {order.refundRequested && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                          Refund
                        </span>
                      )}
                      {order.moqProgress !== undefined && order.moqRequired !== undefined && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          MOQ: {order.moqProgress}/{order.moqRequired}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-blue-900 mb-1">Need help with an order?</p>
                  <p className="text-sm text-blue-800 mb-3">
                    Our support team is available 24/7 to assist you
                  </p>
                  <button
                    onClick={() => router.push('/support')}
                    className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg font-bold active:bg-blue-700 active:scale-95 transition-all"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 safe-area-bottom z-30">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center p-2 text-gray-600 active:text-orange-600 transition-colors active:scale-95"
            aria-label="Home"
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </button>
          <button
            onClick={() => router.push("/bulky-cards")}
            className="flex flex-col items-center p-2 text-gray-600 active:text-orange-600 transition-colors active:scale-95"
            aria-label="Deals"
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Deals</span>
          </button>
          <button
            className="flex flex-col items-center p-2 text-orange-600 active:scale-95"
            aria-label="Orders"
          >
            <div className="relative">
              <Package className="w-6 h-6" />
              {stats.processing > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {Math.min(stats.processing, 9)}{stats.processing > 9 ? '+' : ''}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium">Orders</span>
          </button>
          <button
            onClick={() => router.push("/auth?tab=profile")}
            className="flex flex-col items-center p-2 text-gray-600 active:text-orange-600 transition-colors active:scale-95"
            aria-label="Profile"
          >
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}