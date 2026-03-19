// app/admin/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "./AuthGuard";
import { 
  Users,
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Download,
  Eye,
  RefreshCw,
  ChevronRight,
  User as UserIcon,
  Shield,
  DollarSign,
  Store,
  Send,
  X,
  PackageCheck,
  PackageX,
  MessageSquare,
  Award,
  LogOut,
  Loader2,

  Home,
  Gift,
  Calendar as CalendarIcon,
  Menu,
  Meh,
  Flower,
  Mountain,
  Sunset,
  Sunrise,
  Flame,
  Siren,
  AlarmClock,
  Timer,
  Hourglass,
  Cloud,
  Wind,
  Thermometer,
  Umbrella,
  Snowflake,
  Candy,
  Cookie,
  Cake,
  Pizza,
  Coffee,
  Beer,
  Wine,
  Apple,
  Banana,
  Utensils,
  ChefHat,
  Watch,
  Lamp,
  Lightbulb
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  onSnapshot,
  updateDoc,
  Timestamp,
  addDoc,
  setDoc,
  writeBatch,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
  DocumentData,
  QuerySnapshot,
  DocumentReference,
  CollectionReference,
  Firestore,
  FirestoreError,
  serverTimestamp,
  FieldValue,
  FieldPath,
  deleteField
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import debounce from "lodash/debounce";
import Link from "next/link";

// ============== TYPES ==============

interface User {
  id: string;
  uid: string;
  accountBalance: number;
  businessName: string;
  createdAt: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  phone: string;
  phoneVerified: boolean;
  referralCode: string;
  referralEarnings: number;
  referredBy?: string | null;
  verified: boolean;
  role: string;
  status: string;
  successRate: number;
  totalAmountInvested: number;
  totalDealsJoined: number;
  totalReferrals: number;
  paidReferrals: number;
  pendingReferrals: number;
  updatedAt: string;
  refundAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    accountType: string;
    verified: boolean;
    lastUpdated: string;
  };
}

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
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "completed";
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
  hasWhatsAppAccess: boolean;
  moqProgress: number;
  moqRequired: number;
  moqStatus: string;
  variantDetails?: VariantDetail[];
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  dealTitle?: string;
}

interface BulkDeal {
  id: string;
  title: string;
  description: string;
  images: string[];
  moq: number;
  currentOrders: number;
  profitMargin: number;
  buyingPrice: number;
  shippingMethod: string;
  expiresAt: string;
  uploaderName: string;
  uploaderSuccessRate: number;
  totalParticipants: number;
  status: "pending" | "active" | "completed" | "cancelled";
  price: number;
  category: string;
  estimatedNigeriaArrivalDate: string;
  estimatedProcurementDate: string;
  published: boolean;
  approved: boolean;
  urgency: boolean;
  trending: boolean;
  createdAt: string;
  updatedAt: string;
  uploaderWhatsApp?: string;
  uploaderEmail?: string;
  whatsappGroupLink?: string;
}

interface Stats {
  totalUsers: number;
  totalActiveDeals: number;
  totalCompletedDeals: number;
  totalOrders: number;
  totalRevenue: number;
  pendingDeliveries: number;
  escrowBalance: number;
  todayOrders: number;
  todayRevenue: number;
  totalPendingOrders: number;
  totalConfirmedOrders: number;
  totalProcessingOrders: number;
  totalShippedOrders: number;
  totalDeliveredOrders: number;
  totalCancelledOrders: number;
  totalCompletedOrders: number;
  totalReferralEarnings: number;
  totalPendingReferrals: number;
  totalPaidReferrals: number;
  totalReferralBonusPaid: number;
}

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  { value: "processing", label: "Processing", color: "bg-purple-100 text-purple-800", icon: Package },
  { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
  { value: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-800", icon: Award }
] as const;

const DEAL_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "completed", label: "Completed", color: "bg-blue-100 text-blue-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" }
] as const;

// ============== CACHE KEYS ==============
const CACHE_KEYS = {
  USERS: 'admin_users_cache',
  ORDERS: 'admin_orders_cache',
  DEALS: 'admin_deals_cache',
  TIMESTAMP: 'admin_cache_timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============== ADMIN DASHBOARD COMPONENT ==============

export default function AdminDashboard() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [allDeals, setAllDeals] = useState<BulkDeal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<BulkDeal[]>([]);
  const [activeDeals, setActiveDeals] = useState<BulkDeal[]>([]);
  const [pendingDeals, setPendingDeals] = useState<BulkDeal[]>([]);
  const [completedDeals, setCompletedDeals] = useState<BulkDeal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<BulkDeal | null>(null);
  const [dealBuyers, setDealBuyers] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalActiveDeals: 0,
    totalCompletedDeals: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
    escrowBalance: 0,
    todayOrders: 0,
    todayRevenue: 0,
    totalPendingOrders: 0,
    totalConfirmedOrders: 0,
    totalProcessingOrders: 0,
    totalShippedOrders: 0,
    totalDeliveredOrders: 0,
    totalCancelledOrders: 0,
    totalCompletedOrders: 0,
    totalReferralEarnings: 0,
    totalPendingReferrals: 0,
    totalPaidReferrals: 0,
    totalReferralBonusPaid: 0
  });
  
  // ============== MODAL STATES ==============
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [fundAmount, setFundAmount] = useState<string>("");
  const [fundDescription, setFundDescription] = useState<string>("");
  const [showAllPendingDeals, setShowAllPendingDeals] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string>("");
  const [bulkStatusUpdating, setBulkStatusUpdating] = useState(false);
  
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [dealStatusFilter, setDealStatusFilter] = useState<string>("all");
  
  const [adminUser, setAdminUser] = useState<any>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const mountedRef = useRef(true);

  // Handle client-side only
  useEffect(() => {
    setIsClient(true);
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cleanup all listeners
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, []);

  // Check authentication on mount
  useEffect(() => {
    if (!isClient) return;
    
    const checkAuth = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.replace("/admin/login");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        
        if (userData?.role !== "admin") {
          await signOut(auth);
          router.replace("/admin/login");
          return;
        }

        if (mountedRef.current) {
          setAdminUser(userData);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.replace("/admin/login");
      }
    };

    checkAuth();
  }, [router, isClient]);

  // Cache helpers
  const getCachedData = useCallback((key: string) => {
    try {
      const cached = localStorage.getItem(key);
      const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
      
      if (cached && timestamp) {
        const now = Date.now();
        if (now - parseInt(timestamp) < CACHE_DURATION) {
          return JSON.parse(cached);
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // Clear cache on logout
      localStorage.removeItem(CACHE_KEYS.USERS);
      localStorage.removeItem(CACHE_KEYS.ORDERS);
      localStorage.removeItem(CACHE_KEYS.DEALS);
      localStorage.removeItem(CACHE_KEYS.TIMESTAMP);
      
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, [router]);

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
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid Date";
    }
  }, []);

  const formatDateShort = useCallback((dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Invalid Date";
    }
  }, []);

  // ============== ORDER TRACKING FUNCTIONS ==============
  
  const createOrUpdateOrderTracking = useCallback(async (orderId: string, userId: string, dealId: string, status: string, eventDescription?: string) => {
    try {
      const trackingRef = doc(db, "order_tracking", orderId);
      const trackingDoc = await getDoc(trackingRef);
      
      const newEvent = {
        stage: status || "pending",
        description: eventDescription || `Order status updated to ${status || "pending"}`,
        date: Timestamp.now(),
        status: "completed",
        notes: eventDescription || ""
      };
      
      if (!trackingDoc.exists()) {
        const trackingData = {
          orderId: orderId || "",
          userId: userId || "",
          dealId: dealId || "",
          status: status || "pending",
          events: [newEvent],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await setDoc(trackingRef, trackingData);
      } else {
        const currentData = trackingDoc.data();
        const currentEvents = Array.isArray(currentData?.events) ? currentData.events : [];
        
        await updateDoc(trackingRef, {
          status: status || "pending",
          events: [...currentEvents, newEvent],
          updatedAt: Timestamp.now()
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error updating order tracking:", error);
      return false;
    }
  }, []);

  // ============== DEAL BUYERS FUNCTIONS ==============

  const fetchDealBuyers = useCallback(async (dealId: string) => {
    try {
      const ordersQuery = query(
        collection(db, "orders"),
        where("dealId", "==", dealId),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData: Order[] = await Promise.all(ordersSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        
        let variantDetails: VariantDetail[] = [];
        if (data.variantDetails) {
          if (Array.isArray(data.variantDetails)) {
            variantDetails = data.variantDetails.map((vd: any) => ({
              variantId: vd.variantId || "",
              variantName: vd.variantName || "",
              variantType: vd.variantType || "",
              quantity: Number(vd.quantity) || 0,
              unitPrice: Number(vd.unitPrice) || 0,
              total: Number(vd.total) || 0
            }));
          } else if (typeof data.variantDetails === 'object') {
            variantDetails = [{
              variantId: data.variantDetails.variantId || "",
              variantName: data.variantDetails.variantName || "",
              variantType: data.variantDetails.variantType || "",
              quantity: Number(data.variantDetails.quantity) || 0,
              unitPrice: Number(data.variantDetails.unitPrice) || 0,
              total: Number(data.variantDetails.total) || 0
            }];
          }
        }
        
        const order: Order = {
          id: docSnapshot.id,
          dealId: data.dealId || "",
          userId: data.userId || "",
          title: data.title || "Untitled Order",
          quantity: Number(data.quantity) || 1,
          unitPrice: Number(data.unitPrice) || 0,
          logisticsCost: Number(data.logisticsCost) || 0,
          platformFee: Number(data.platformFee) || 0,
          totalPayable: Number(data.totalPayable) || 0,
          paymentMethod: data.paymentMethod || "",
          paymentStatus: data.paymentStatus || "pending",
          status: data.status || "pending",
          estimatedDelivery: data.estimatedDelivery || "",
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          hasWhatsAppAccess: Boolean(data.hasWhatsAppAccess),
          moqProgress: Number(data.moqProgress) || 0,
          moqRequired: Number(data.moqRequired) || 0,
          moqStatus: data.moqStatus || "pending",
          variantDetails: variantDetails
        };
        
        if (data.userId) {
          try {
            const userDoc = await getDoc(doc(db, "users", data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              order.buyerName = userData.fullName;
              order.buyerEmail = userData.email;
              order.buyerPhone = userData.phone;
            }
          } catch (error) {
            console.warn(`Error fetching user ${data.userId}:`, error);
          }
        }
        
        return order;
      }));
      
      if (mountedRef.current) {
        setDealBuyers(ordersData);
      }
    } catch (error) {
      console.error("Error fetching deal buyers:", error);
    }
  }, []);

  // Bulk update order status
  const updateAllBuyersOrderStatus = useCallback(async (dealId: string, newStatus: string, notes?: string) => {
    if (!dealId || !newStatus) return;
    
    try {
      setBulkStatusUpdating(true);
      
      const ordersQuery = query(
        collection(db, "orders"),
        where("dealId", "==", dealId),
        limit(100)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (ordersSnapshot.empty) {
        alert("No buyers found for this deal");
        return;
      }
      
      const batch = writeBatch(db);
      
      ordersSnapshot.docs.forEach((orderDoc) => {
        const orderRef = doc(db, "orders", orderDoc.id);
        batch.update(orderRef, {
          status: newStatus,
          updatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
      
      // Do tracking updates asynchronously
      ordersSnapshot.docs.forEach((orderDoc) => {
        const data = orderDoc.data();
        if (data.userId) {
          createOrUpdateOrderTracking(
            orderDoc.id,
            data.userId,
            dealId,
            newStatus,
            notes || `Bulk status update to ${newStatus} by admin`
          ).catch(console.error);
        }
      });
      
      alert(`Successfully updated ${ordersSnapshot.size} orders to ${newStatus}`);
      
      if (selectedDeal && selectedDeal.id === dealId && mountedRef.current) {
        fetchDealBuyers(dealId);
      }
      
    } catch (error) {
      console.error("Error bulk updating orders:", error);
      alert("Failed to bulk update orders");
    } finally {
      if (mountedRef.current) {
        setBulkStatusUpdating(false);
        setShowBulkStatusModal(false);
        setSelectedBulkStatus("");
      }
    }
  }, [fetchDealBuyers, createOrUpdateOrderTracking, selectedDeal]);

  // ============== FETCH ALL DATA ==============

  const fetchAllData = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      
      // Try to get from cache first unless forced refresh
      if (!forceRefresh) {
        const cachedUsers = getCachedData(CACHE_KEYS.USERS);
        const cachedOrders = getCachedData(CACHE_KEYS.ORDERS);
        const cachedDeals = getCachedData(CACHE_KEYS.DEALS);
        
        if (cachedUsers && cachedOrders && cachedDeals) {
          if (mountedRef.current) {
            setUsers(cachedUsers);
            setAllOrders(cachedOrders);
            setAllDeals(cachedDeals);
            
            // Categorize deals
            const activeDealsData = cachedDeals.filter((deal: BulkDeal) => 
              deal.status === "active" && deal.published && deal.approved
            );
            const pendingDealsData = cachedDeals.filter((deal: BulkDeal) => 
              deal.status === "pending" || !deal.published || !deal.approved
            );
            const completedDealsData = cachedDeals.filter((deal: BulkDeal) => 
              deal.status === "completed" || 
              (deal.currentOrders >= deal.moq && deal.expiresAt && new Date(deal.expiresAt) < new Date())
            );
            
            setActiveDeals(activeDealsData);
            setPendingDeals(pendingDealsData);
            setCompletedDeals(completedDealsData);
            
            // Calculate stats
            calculateStats(cachedUsers, cachedOrders, activeDealsData, completedDealsData);
            
            setInitialLoad(false);
            setLoading(false);
            
            // Refresh in background
            setTimeout(() => fetchAllData(true), 100);
            return;
          }
        }
      }
      
      // Fetch fresh data
      console.log('Fetching fresh data from Firebase...');
      
      // Fetch users with limit
      const usersQuery = query(
        collection(db, "users"), 
        orderBy("createdAt", "desc"),
        limit(500)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: User[] = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || "",
          accountBalance: Number(data.accountBalance) || 0,
          businessName: data.businessName || "",
          createdAt: data.createdAt || new Date().toISOString(),
          email: data.email || "",
          emailVerified: Boolean(data.emailVerified),
          fullName: data.fullName || "",
          phone: data.phone || "",
          phoneVerified: Boolean(data.phoneVerified),
          referralCode: data.referralCode || "",
          referralEarnings: Number(data.referralEarnings) || 0,
          referredBy: data.referredBy || null,
          verified: Boolean(data.verified),
          role: data.role || "user",
          status: data.status || "active",
          successRate: Number(data.successRate) || 0,
          totalAmountInvested: Number(data.totalAmountInvested) || 0,
          totalDealsJoined: Number(data.totalDealsJoined) || 0,
          totalReferrals: Number(data.totalReferrals) || 0,
          paidReferrals: Number(data.paidReferrals) || 0,
          pendingReferrals: Number(data.pendingReferrals) || 0,
          updatedAt: data.updatedAt || new Date().toISOString(),
          refundAccount: data.refundAccount
        } as User;
      });
      
      // Fetch deals with limit
      const dealsQuery = query(
        collection(db, "bulk_deals"), 
        orderBy("createdAt", "desc"),
        limit(500)
      );
      const dealsSnapshot = await getDocs(dealsQuery);
      const dealsData: BulkDeal[] = dealsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "Untitled Deal",
          description: data.description || "",
          images: data.images || [],
          moq: Number(data.moq) || 0,
          currentOrders: Number(data.currentOrders) || 0,
          profitMargin: Number(data.profitMargin) || 0,
          buyingPrice: Number(data.buyingPrice) || 0,
          shippingMethod: data.shippingMethod || "",
          expiresAt: data.expiresAt || "",
          uploaderName: data.uploaderName || "Unknown",
          uploaderSuccessRate: Number(data.uploaderSuccessRate) || 0,
          totalParticipants: Number(data.currentOrders) || 0,
          status: data.published && data.approved ? "active" : "pending",
          price: Number(data.price) || 0,
          category: data.category || "",
          estimatedNigeriaArrivalDate: data.estimatedNigeriaArrivalDate || "",
          estimatedProcurementDate: data.estimatedProcurementDate || "",
          published: Boolean(data.published),
          approved: Boolean(data.approved),
          urgency: Boolean(data.urgency),
          trending: Boolean(data.trending),
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          uploaderWhatsApp: data.uploaderWhatsApp,
          uploaderEmail: data.uploaderEmail,
          whatsappGroupLink: data.whatsappGroupLink
        };
      });
      
      // Fetch orders with limit
      const ordersQuery = query(
        collection(db, "orders"), 
        orderBy("createdAt", "desc"),
        limit(500)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData: Order[] = await Promise.all(ordersSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        
        let variantDetails: VariantDetail[] = [];
        if (data.variantDetails) {
          if (Array.isArray(data.variantDetails)) {
            variantDetails = data.variantDetails.map((vd: any) => ({
              variantId: vd.variantId || "",
              variantName: vd.variantName || "",
              variantType: vd.variantType || "",
              quantity: Number(vd.quantity) || 0,
              unitPrice: Number(vd.unitPrice) || 0,
              total: Number(vd.total) || 0
            }));
          } else if (typeof data.variantDetails === 'object') {
            variantDetails = [{
              variantId: data.variantDetails.variantId || "",
              variantName: data.variantDetails.variantName || "",
              variantType: data.variantDetails.variantType || "",
              quantity: Number(data.variantDetails.quantity) || 0,
              unitPrice: Number(data.variantDetails.unitPrice) || 0,
              total: Number(data.variantDetails.total) || 0
            }];
          }
        }
        
        const order: Order = {
          id: docSnapshot.id,
          dealId: data.dealId || "",
          userId: data.userId || "",
          title: data.title || "Untitled Order",
          quantity: Number(data.quantity) || 1,
          unitPrice: Number(data.unitPrice) || 0,
          logisticsCost: Number(data.logisticsCost) || 0,
          platformFee: Number(data.platformFee) || 0,
          totalPayable: Number(data.totalPayable) || 0,
          paymentMethod: data.paymentMethod || "",
          paymentStatus: data.paymentStatus || "pending",
          status: data.status || "pending",
          estimatedDelivery: data.estimatedDelivery || "",
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          hasWhatsAppAccess: Boolean(data.hasWhatsAppAccess),
          moqProgress: Number(data.moqProgress) || 0,
          moqRequired: Number(data.moqRequired) || 0,
          moqStatus: data.moqStatus || "pending",
          variantDetails: variantDetails
        };
        
        return order;
      }));
      
      // Enrich orders with user data lazily
      setTimeout(async () => {
        if (!mountedRef.current) return;
        
        const enrichedOrders = await Promise.all(ordersData.map(async (order) => {
          if (order.userId) {
            try {
              const userDoc = await getDoc(doc(db, "users", order.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                order.buyerName = userData.fullName;
                order.buyerEmail = userData.email;
                order.buyerPhone = userData.phone;
              }
            } catch (error) {
              console.warn(`Error fetching user ${order.userId}:`, error);
            }
          }
          
          const deal = dealsData.find(d => d.id === order.dealId);
          if (deal) {
            order.dealTitle = deal.title;
          }
          
          return order;
        }));
        
        if (mountedRef.current) {
          setAllOrders(enrichedOrders);
        }
      }, 0);
      
      if (!mountedRef.current) return;
      
      setUsers(usersData);
      setAllOrders(ordersData);
      setAllDeals(dealsData);
      
      // Cache the data
      setCachedData(CACHE_KEYS.USERS, usersData);
      setCachedData(CACHE_KEYS.ORDERS, ordersData);
      setCachedData(CACHE_KEYS.DEALS, dealsData);
      
      // Categorize deals
      const activeDealsData = dealsData.filter(deal => 
        deal.status === "active" && deal.published && deal.approved
      );
      const pendingDealsData = dealsData.filter(deal => 
        deal.status === "pending" || !deal.published || !deal.approved
      );
      const completedDealsData = dealsData.filter(deal => 
        deal.status === "completed" || 
        (deal.currentOrders >= deal.moq && deal.expiresAt && new Date(deal.expiresAt) < new Date())
      );
      
      setActiveDeals(activeDealsData);
      setPendingDeals(pendingDealsData);
      setCompletedDeals(completedDealsData);
      
      // Calculate stats
      calculateStats(usersData, ordersData, activeDealsData, completedDealsData);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (mountedRef.current) {
        setInitialLoad(false);
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [getCachedData, setCachedData]);

  const calculateStats = useCallback((usersData: User[], ordersData: Order[], activeDealsData: BulkDeal[], completedDealsData: BulkDeal[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = ordersData.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    }).length;
    
    const todayRevenue = ordersData
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today;
      })
      .reduce((sum, order) => sum + order.totalPayable, 0);
    
    const totalRevenue = ordersData.reduce((sum, order) => sum + order.totalPayable, 0);
    
    const pendingOrders = ordersData.filter(order => order.status === "pending").length;
    const confirmedOrders = ordersData.filter(order => order.status === "confirmed").length;
    const processingOrders = ordersData.filter(order => order.status === "processing").length;
    const shippedOrders = ordersData.filter(order => order.status === "shipped").length;
    const deliveredOrders = ordersData.filter(order => order.status === "delivered").length;
    const cancelledOrders = ordersData.filter(order => order.status === "cancelled").length;
    const completedOrders = ordersData.filter(order => order.status === "completed").length;
    
    // Calculate referral stats from users
    const totalReferralEarnings = usersData.reduce((sum, user) => sum + (user.referralEarnings || 0), 0);
    const totalPendingReferrals = usersData.reduce((sum, user) => sum + (user.pendingReferrals || 0), 0);
    const totalPaidReferrals = usersData.reduce((sum, user) => sum + (user.paidReferrals || 0), 0);
    
    if (mountedRef.current) {
      setStats({
        totalUsers: usersData.length,
        totalActiveDeals: activeDealsData.length,
        totalCompletedDeals: completedDealsData.length,
        totalOrders: ordersData.length,
        totalRevenue: totalRevenue,
        pendingDeliveries: shippedOrders,
        escrowBalance: totalRevenue * 0.1,
        todayOrders: todayOrders,
        todayRevenue: todayRevenue,
        totalPendingOrders: pendingOrders,
        totalConfirmedOrders: confirmedOrders,
        totalProcessingOrders: processingOrders,
        totalShippedOrders: shippedOrders,
        totalDeliveredOrders: deliveredOrders,
        totalCancelledOrders: cancelledOrders,
        totalCompletedOrders: completedOrders,
        totalReferralEarnings: totalReferralEarnings,
        totalPendingReferrals: totalPendingReferrals,
        totalPaidReferrals: totalPaidReferrals,
        totalReferralBonusPaid: totalReferralEarnings
      });
    }
  }, []);

  // ============== USER FUNCTIONS ==============

  const addFundsToUser = useCallback(async (userId: string, amount: number, description: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        alert("User not found");
        return;
      }
      
      const userData = userDoc.data();
      const currentBalance = Number(userData.accountBalance) || 0;
      const newBalance = currentBalance + amount;
      
      await updateDoc(userRef, {
        accountBalance: newBalance,
        updatedAt: new Date().toISOString()
      });
      
      await addDoc(collection(db, "transactions"), {
        userId: userId,
        amount: amount,
        type: "admin_credit",
        status: "completed",
        reference: `ADMIN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: description || "Admin deposit",
        metadata: {
          adminAction: true,
          adminEmail: adminUser?.email,
          adminName: adminUser?.fullName,
          timestamp: new Date().toISOString(),
          previousBalance: currentBalance,
          newBalance: newBalance
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      await addDoc(collection(db, "alerts"), {
        userId: userId,
        title: "Account Credited",
        message: `Your account has been credited with ${formatCurrency(amount)} by admin. Reason: ${description || "Admin deposit"}`,
        type: "success",
        amount: amount,
        reference: `ADMIN-${Date.now()}`,
        read: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      alert(`Added ${formatCurrency(amount)} to user's account`);
      
      if (mountedRef.current) {
        setShowAddFundsModal(false);
        setFundAmount("");
        setFundDescription("");
        
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, accountBalance: newBalance }
            : user
        ));
      }
      
    } catch (error) {
      console.error("Error adding funds:", error);
      alert("Failed to add funds to user account");
    }
  }, [formatCurrency, adminUser]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string, notes?: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        alert("Order not found");
        return;
      }
      
      const orderData = orderDoc.data();
      const userId = orderData.userId || "";
      const dealId = orderData.dealId || "";
      
      if (!userId || !dealId) {
        alert("Order is missing required user or deal information");
        return;
      }
      
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      await createOrUpdateOrderTracking(
        orderId, 
        userId, 
        dealId, 
        newStatus, 
        notes
      );
      
      if (userId) {
        await addDoc(collection(db, "alerts"), {
          userId: userId,
          title: "Order Status Updated",
          message: `Your order #${orderId.slice(-8)} status has been updated to ${newStatus}`,
          type: "info",
          read: false,
          metadata: {
            adminEmail: adminUser?.email,
            adminName: adminUser?.fullName
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      alert(`Order status updated to ${newStatus}`);
      
      // Update local state
      setAllOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any }
          : order
      ));
      
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  }, [createOrUpdateOrderTracking, adminUser]);

  const updateUserStatus = useCallback(async (userId: string, newStatus: "active" | "suspended" | "pending") => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      alert(`User ${newStatus === "active" ? "activated" : "suspended"} successfully`);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      ));
      
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      alert(`User role updated to ${newRole}`);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  }, []);

  const updateDealStatus = useCallback(async (dealId: string, newStatus: "active" | "completed" | "cancelled" | "pending") => {
    try {
      await updateDoc(doc(db, "bulk_deals", dealId), {
        status: newStatus,
        published: newStatus === "active",
        approved: newStatus === "active",
        updatedAt: Timestamp.now()
      });
      
      alert(`Deal status updated to ${newStatus}`);
      
      // Update local state
      setAllDeals(prev => prev.map(deal => 
        deal.id === dealId 
          ? { ...deal, status: newStatus, published: newStatus === "active", approved: newStatus === "active" }
          : deal
      ));
      
    } catch (error) {
      console.error("Error updating deal status:", error);
      alert("Failed to update deal status");
    }
  }, []);

  // ============== UTILITY FUNCTIONS ==============

  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }
    
    const headers = Object.keys(data[0] || {});
    const csvData = [
      headers.join(","),
      ...data.map(row => headers.map(header => {
        const cell = row[header];
        if (cell === null || cell === undefined) return '""';
        if (typeof cell === 'object') return `"${JSON.stringify(cell).replace(/"/g, '""')}"`;
        return `"${String(cell).replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");
    
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const sendBulkWhatsApp = useCallback((dealId: string, message: string) => {
    const buyers = dealBuyers.filter(order => order.buyerPhone);
    if (buyers.length === 0) {
      alert("No buyers with phone numbers found");
      return;
    }
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    alert(`Message ready to send to ${buyers.length} buyers`);
  }, [dealBuyers]);

  // ============== FILTER FUNCTIONS ==============

  const applyUserFilters = useCallback(() => {
    if (!mountedRef.current) return;
    
    let result = users;
    
    if (userStatusFilter !== "all") {
      result = result.filter(user => user.status === userStatusFilter);
    }
    
    if (userRoleFilter !== "all") {
      result = result.filter(user => user.role === userRoleFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.businessName?.toLowerCase().includes(query) ||
        user.referralCode?.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(result);
  }, [users, userStatusFilter, userRoleFilter, searchQuery]);

  const applyOrderFilters = useCallback(() => {
    if (!mountedRef.current) return;
    
    let result = allOrders;
    
    if (orderStatusFilter !== "all") {
      result = result.filter(order => order.status === orderStatusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.title.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.buyerName?.toLowerCase().includes(query) ||
        order.buyerEmail?.toLowerCase().includes(query) ||
        order.dealTitle?.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(result);
  }, [allOrders, orderStatusFilter, searchQuery]);

  const applyDealFilters = useCallback(() => {
    if (!mountedRef.current) return;
    
    let result = allDeals;
    
    if (dealStatusFilter !== "all") {
      result = result.filter(deal => deal.status === dealStatusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(deal => 
        deal.title.toLowerCase().includes(query) ||
        deal.category?.toLowerCase().includes(query) ||
        deal.uploaderName?.toLowerCase().includes(query)
      );
    }
    
    setFilteredDeals(result);
  }, [allDeals, dealStatusFilter, searchQuery]);

  // Initialize debounce
  useEffect(() => {
    if (!isClient) return;
    
    debouncedSearchRef.current = debounce((query: string) => {
      if (activeTab === "users") {
        applyUserFilters();
      } else if (activeTab === "orders") {
        applyOrderFilters();
      } else if (activeTab === "deals" || activeTab === "pending-deals" || activeTab === "completed-deals") {
        applyDealFilters();
      }
    }, 500);

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, [activeTab, applyUserFilters, applyOrderFilters, applyDealFilters, isClient]);

  // Setup minimal real-time listeners
  useEffect(() => {
    if (!adminUser || !isClient || !mountedRef.current) return;

    // Only listen to critical collections with minimal data
    const setupListeners = () => {
      // Users listener - only for status changes
      const usersUnsubscribe = onSnapshot(
        query(collection(db, "users"), limit(100)),
        (snapshot) => {
          if (!snapshot.metadata.hasPendingWrites && mountedRef.current) {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "modified") {
                const updatedUser = { id: change.doc.id, ...change.doc.data() } as User;
                setUsers(prev => prev.map(user => 
                  user.id === updatedUser.id ? updatedUser : user
                ));
              }
            });
          }
        },
        (error) => console.error("Users listener error:", error)
      );

      // Orders listener - only for status changes
      const ordersUnsubscribe = onSnapshot(
        query(collection(db, "orders"), limit(100)),
        (snapshot) => {
          if (!snapshot.metadata.hasPendingWrites && mountedRef.current) {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "modified") {
                const updatedOrder = { id: change.doc.id, ...change.doc.data() } as Order;
                setAllOrders(prev => prev.map(order => 
                  order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
                ));
              }
            });
          }
        },
        (error) => console.error("Orders listener error:", error)
      );

      // Deals listener - only for status changes
      const dealsUnsubscribe = onSnapshot(
        query(collection(db, "bulk_deals"), limit(100)),
        (snapshot) => {
          if (!snapshot.metadata.hasPendingWrites && mountedRef.current) {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "modified") {
                const updatedDeal = { id: change.doc.id, ...change.doc.data() } as BulkDeal;
                setAllDeals(prev => prev.map(deal => 
                  deal.id === updatedDeal.id ? { ...deal, ...updatedDeal } : deal
                ));
              }
            });
          }
        },
        (error) => console.error("Deals listener error:", error)
      );

      unsubscribeRefs.current = [usersUnsubscribe, ordersUnsubscribe, dealsUnsubscribe];
    };

    setupListeners();

    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [adminUser, isClient]);

  // Initial data fetch
  useEffect(() => {
    if (adminUser && isClient && mountedRef.current && initialLoad) {
      fetchAllData();
    }
  }, [fetchAllData, adminUser, isClient, initialLoad]);

  // Apply filters when dependencies change
  useEffect(() => {
    if (!isClient || !mountedRef.current || initialLoad) return;
    
    if (activeTab === "users") {
      applyUserFilters();
    } else if (activeTab === "orders") {
      applyOrderFilters();
    } else if (activeTab === "deals" || activeTab === "pending-deals" || activeTab === "completed-deals") {
      applyDealFilters();
    }
  }, [activeTab, applyUserFilters, applyOrderFilters, applyDealFilters, users, allOrders, allDeals, isClient, initialLoad]);

  // Apply filters on search change
  useEffect(() => {
    if (debouncedSearchRef.current && isClient && !initialLoad) {
      debouncedSearchRef.current(searchQuery);
    }
  }, [searchQuery, isClient, initialLoad]);

  // Apply filters on filter change
  useEffect(() => {
    if (!isClient || initialLoad) return;
    
    if (activeTab === "users") {
      applyUserFilters();
    }
  }, [userStatusFilter, userRoleFilter, activeTab, applyUserFilters, isClient, initialLoad]);

  useEffect(() => {
    if (!isClient || initialLoad) return;
    
    if (activeTab === "orders") {
      applyOrderFilters();
    }
  }, [orderStatusFilter, activeTab, applyOrderFilters, isClient, initialLoad]);

  useEffect(() => {
    if (!isClient || initialLoad) return;
    
    if (activeTab === "deals" || activeTab === "pending-deals" || activeTab === "completed-deals") {
      applyDealFilters();
    }
  }, [dealStatusFilter, activeTab, applyDealFilters, isClient, initialLoad]);

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading && initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-3">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">MOQHUBS</h1>
                <p className="text-[10px] text-gray-500">Admin</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setRefreshing(true);
                  fetchAllData(true);
                }}
                disabled={refreshing}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <Link
                href="/admin/referrals"
                className="p-1.5 hover:bg-gray-100 rounded-lg flex items-center gap-1"
              >
                <Gift className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-700 hidden sm:inline">Referrals</span>
              </Link>
              
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-1.5 hover:bg-gray-100 rounded-lg md:hidden"
              >
                <Menu className="w-4 h-4 text-gray-600" />
              </button>
              
              <div className="hidden md:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-900">{adminUser?.fullName}</p>
                  <p className="text-[10px] text-gray-500">{adminUser?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="absolute top-14 right-3 left-3 bg-white rounded-lg border border-gray-200 shadow-lg p-2 z-50 md:hidden">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-1">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">{adminUser?.fullName}</p>
                  <p className="text-[10px] text-gray-500">{adminUser?.email}</p>
                </div>
              </div>
              <Link
                href="/admin/referrals"
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                <Gift className="w-3.5 h-3.5" />
                Referrals Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto scrollbar-hide -mx-3 px-3 gap-0.5 pb-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-shrink-0 px-3 py-2 font-medium text-xs rounded-lg transition-all ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                Home
              </div>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-shrink-0 px-3 py-2 font-medium text-xs rounded-lg ${
                activeTab === "users"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Users
              </div>
            </button>
            <button
              onClick={() => setActiveTab("deals")}
              className={`flex-shrink-0 px-3 py-2 font-medium text-xs rounded-lg ${
                activeTab === "deals"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                Active
              </div>
            </button>
            <button
              onClick={() => setActiveTab("pending-deals")}
              className={`flex-shrink-0 px-3 py-2 font-medium text-xs rounded-lg ${
                activeTab === "pending-deals"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Pending
              </div>
            </button>
            <button
              onClick={() => setActiveTab("completed-deals")}
              className={`flex-shrink-0 px-3 py-2 font-medium text-xs rounded-lg ${
                activeTab === "completed-deals"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Done
              </div>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-shrink-0 px-3 py-2 font-medium text-xs rounded-lg ${
                activeTab === "orders"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                Orders
              </div>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="p-3">
          {/* ============== DASHBOARD TAB ============== */}
          {activeTab === "dashboard" && (
            <>
              {/* Welcome Card */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 mb-3 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold mb-1">Welcome back!</h2>
                    <p className="text-white/90 text-xs mb-3">{formatDate(new Date().toISOString())}</p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Gift className="w-5 h-5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-white/80 text-[10px]">Today's Orders</p>
                    <p className="text-lg font-bold">{stats.todayOrders}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-white/80 text-[10px]">Today's Revenue</p>
                    <p className="text-lg font-bold">{formatCurrency(stats.todayRevenue)}</p>
                  </div>
                </div>
              </div>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.totalUsers}</p>
                      <p className="text-[10px] text-gray-500">Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Store className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.totalActiveDeals}</p>
                      <p className="text-[10px] text-gray-500">Active</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                      <p className="text-[10px] text-gray-500">Revenue</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <PackageCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.totalCompletedDeals}</p>
                      <p className="text-[10px] text-gray-500">Done</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Stats Card - Link to Referrals Page */}
              <Link href="/admin/referrals">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 mb-3 text-white hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      Referral Program
                    </h3>
                    <span className="px-2 py-1 bg-white/20 rounded-lg text-[10px] hover:bg-white/30">
                      View Dashboard →
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/80 text-[8px]">Total Referrals</p>
                      <p className="text-sm font-bold">{stats.totalPaidReferrals + stats.totalPendingReferrals}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/80 text-[8px]">Bonus Paid</p>
                      <p className="text-sm font-bold">{formatCurrency(stats.totalReferralBonusPaid)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/80 text-[8px]">Pending</p>
                      <p className="text-sm font-bold">{stats.totalPendingReferrals}</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Order Status Grid */}
              <div className="bg-white rounded-lg border border-gray-200 mb-3">
                <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                  <h2 className="text-xs font-bold text-gray-900">Order Status</h2>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-1.5">
                    {ORDER_STATUS_OPTIONS.map((status) => {
                      const count = stats[`total${status.label}Orders` as keyof Stats] as number || 0;
                      return (
                        <div key={status.value} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${status.color}`}>
                              <status.icon className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-medium text-gray-900">{status.label}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <h2 className="text-xs font-bold text-gray-900 mb-2">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab("users")}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
                  >
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mb-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs">Users</h3>
                    <p className="text-[10px] text-gray-500">{stats.totalUsers} total</p>
                  </button>
                  <Link href="/admin/referrals" className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 text-left">
                    <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center mb-1">
                      <Gift className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs">Referrals</h3>
                    <p className="text-[10px] text-gray-500">
                      {stats.totalPendingReferrals} pending
                    </p>
                  </Link>
                  <button
                    onClick={() => setActiveTab("pending-deals")}
                    className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 text-left"
                  >
                    <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center mb-1">
                      <Clock className="w-3.5 h-3.5 text-yellow-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs">Pending</h3>
                    <p className="text-[10px] text-gray-500">{pendingDeals.length} deals</p>
                  </button>
                  <button
                    onClick={() => {
                      if (activeDeals.length > 0) {
                        setSelectedDeal(activeDeals[0]);
                        fetchDealBuyers(activeDeals[0].id);
                        setShowDealModal(true);
                      }
                    }}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
                  >
                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center mb-1">
                      <Users className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs">Buyers</h3>
                    <p className="text-[10px] text-gray-500">View all</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ============== USERS TAB ============== */}
          {activeTab === "users" && (
            <>
              {/* Search & Filters */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3 sticky top-[72px] z-40">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:border-orange-500 outline-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:border-orange-500 outline-none bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => exportToCSV(filteredUsers, 'users')}
                    className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No users found</p>
                  </div>
                ) : (
                  filteredUsers.slice(0, 50).map((user) => (
                    <div key={user.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-gray-900">{user.fullName}</h3>
                            <p className="text-[10px] text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            user.status === "active" ? "bg-green-100 text-green-800" :
                            user.status === "suspended" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {user.status}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                      
                      {/* User Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="bg-gray-50 p-1.5 rounded-lg">
                          <p className="text-[10px] text-gray-500">Balance</p>
                          <p className="text-xs font-bold text-gray-900">{formatCurrency(user.accountBalance)}</p>
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded-lg">
                          <p className="text-[10px] text-gray-500">Phone</p>
                          <p className="text-xs font-medium text-gray-900 truncate">{user.phone}</p>
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded-lg">
                          <p className="text-[10px] text-gray-500">Referral</p>
                          <p className="text-xs font-medium text-gray-900">{user.referralCode}</p>
                        </div>
                      </div>
                      
                      {/* Referral Stats */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-purple-50 p-1.5 rounded-lg">
                          <p className="text-[8px] text-purple-600">Referred</p>
                          <p className="text-xs font-bold text-purple-700">{user.totalReferrals || 0}</p>
                        </div>
                        <div className="flex-1 bg-green-50 p-1.5 rounded-lg">
                          <p className="text-[8px] text-green-600">Paid</p>
                          <p className="text-xs font-bold text-green-700">{user.paidReferrals || 0}</p>
                        </div>
                        <div className="flex-1 bg-yellow-50 p-1.5 rounded-lg">
                          <p className="text-[8px] text-yellow-600">Pending</p>
                          <p className="text-xs font-bold text-yellow-700">{user.pendingReferrals || 0}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-[10px] text-gray-500">Joined {formatDateShort(user.createdAt)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowAddFundsModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                            title="Add Funds"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/admin/referrals?userId=${user.id}`}
                            className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                            title="View Referrals"
                          >
                            <Gift className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ============== DEALS TAB ============== */}
          {activeTab === "deals" && (
            <>
              {/* Search & Filters */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3 sticky top-[72px] z-40">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <select
                  value={dealStatusFilter}
                  onChange={(e) => setDealStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:border-orange-500 outline-none bg-white"
                >
                  <option value="all">All Deals</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Deals List */}
              <div className="space-y-2">
                {filteredDeals.filter(deal => deal.status === "active").length === 0 ? (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <Store className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No active deals</p>
                  </div>
                ) : (
                  filteredDeals.filter(deal => deal.status === "active").slice(0, 50).map((deal) => (
                    <div key={deal.id} className="bg-white rounded-lg border border-gray-200">
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xs font-bold text-gray-900">{deal.title}</h3>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{deal.description}</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                            {deal.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500">MOQ</p>
                            <p className="text-xs font-bold text-gray-900">{deal.currentOrders}/{deal.moq}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500">Price</p>
                            <p className="text-xs font-bold text-gray-900">{formatCurrency(deal.price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setSelectedDeal(deal);
                              fetchDealBuyers(deal.id);
                              setShowDealModal(true);
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5" />
                            View ({deal.currentOrders})
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedDeal(deal);
                                setShowBulkStatusModal(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium"
                            >
                              Bulk Update
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ============== PENDING DEALS TAB ============== */}
          {activeTab === "pending-deals" && (
            <>
              {/* Search & Filters */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3 sticky top-[72px] z-40">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search pending deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={dealStatusFilter}
                    onChange={(e) => setDealStatusFilter(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:border-orange-500 outline-none bg-white"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => setShowAllPendingDeals(!showAllPendingDeals)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
                      showAllPendingDeals 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {showAllPendingDeals ? 'All' : 'Pending'}
                  </button>
                </div>
              </div>

              {/* Pending Deals List */}
              <div className="space-y-2">
                {(showAllPendingDeals ? filteredDeals : filteredDeals.filter(deal => deal.status === "pending")).length === 0 ? (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No pending deals</p>
                  </div>
                ) : (
                  (showAllPendingDeals ? filteredDeals : filteredDeals.filter(deal => deal.status === "pending")).slice(0, 50).map((deal) => (
                    <div key={deal.id} className="bg-white rounded-lg border border-gray-200">
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xs font-bold text-gray-900">{deal.title}</h3>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{deal.description}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            deal.status === "active" ? "bg-green-100 text-green-800" :
                            deal.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            deal.status === "completed" ? "bg-blue-100 text-blue-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {deal.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500">MOQ</p>
                            <p className="text-xs font-bold text-gray-900">{deal.moq}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500">Orders</p>
                            <p className="text-xs font-bold text-gray-900">{deal.currentOrders}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setSelectedDeal(deal);
                              fetchDealBuyers(deal.id);
                              setShowDealModal(true);
                            }}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
                          <div className="flex items-center gap-1">
                            {deal.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateDealStatus(deal.id, "active")}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-medium"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateDealStatus(deal.id, "cancelled")}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-medium"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ============== COMPLETED DEALS TAB ============== */}
          {activeTab === "completed-deals" && (
            <>
              {/* Search */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3 sticky top-[72px] z-40">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search completed deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
              </div>

              {/* Completed Deals List */}
              <div className="space-y-2">
                {completedDeals.length === 0 ? (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No completed deals</p>
                  </div>
                ) : (
                  completedDeals.slice(0, 50).map((deal) => (
                    <div key={deal.id} className="bg-white rounded-lg border border-gray-200">
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xs font-bold text-gray-900">{deal.title}</h3>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{deal.description}</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                            Completed
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500">MOQ</p>
                            <p className="text-xs font-bold text-gray-900">{deal.currentOrders}/{deal.moq}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500">Revenue</p>
                            <p className="text-xs font-bold text-gray-900">{formatCurrency(deal.currentOrders * deal.price)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDeal(deal);
                            fetchDealBuyers(deal.id);
                            setShowDealModal(true);
                          }}
                          className="w-full px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Buyers
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ============== ORDERS TAB ============== */}
          {activeTab === "orders" && (
            <>
              {/* Search & Filters */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3 sticky top-[72px] z-40">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  />
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:border-orange-500 outline-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => exportToCSV(filteredOrders, 'orders')}
                    className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-2">
                {filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No orders found</p>
                  </div>
                ) : (
                  filteredOrders.slice(0, 50).map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <h3 className="text-xs font-bold text-gray-900">{order.title}</h3>
                            <span className="text-[8px] text-gray-500">#{order.id.slice(-6)}</span>
                          </div>
                          <p className="text-[10px] text-gray-600">{order.buyerName || "Customer"}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          order.status === "delivered" || order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-gray-50 p-1.5 rounded-lg">
                          <p className="text-[10px] text-gray-500">Amount</p>
                          <p className="text-xs font-bold text-gray-900">{formatCurrency(order.totalPayable)}</p>
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded-lg">
                          <p className="text-[10px] text-gray-500">Payment</p>
                          <p className="text-xs font-medium text-gray-900 capitalize">{order.paymentStatus}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-[10px] text-gray-500">{formatDateShort(order.createdAt)}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* ============== MODALS ============== */}

        {/* Bulk Status Update Modal */}
        {showBulkStatusModal && selectedDeal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Bulk Update Status</h2>
                    <p className="text-[10px] text-gray-600 mt-0.5">{selectedDeal.title}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowBulkStatusModal(false);
                      setSelectedBulkStatus("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-gray-600 mb-4">
                  Update status for all {dealBuyers.length} buyers
                </p>
                
                <div className="space-y-2 mb-4">
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setSelectedBulkStatus(status.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selectedBulkStatus === status.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${status.color}`}>
                        <status.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-medium text-gray-900">{status.label}</p>
                      </div>
                      {selectedBulkStatus === status.value && (
                        <CheckCircle className="w-4 h-4 text-orange-600" />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowBulkStatusModal(false);
                      setSelectedBulkStatus("");
                    }}
                    className="flex-1 py-2.5 text-xs border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedBulkStatus) {
                        updateAllBuyersOrderStatus(
                          selectedDeal.id, 
                          selectedBulkStatus, 
                          `Bulk status update to ${selectedBulkStatus} by admin`
                        );
                      }
                    }}
                    disabled={!selectedBulkStatus || bulkStatusUpdating}
                    className="flex-1 py-2.5 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {bulkStatusUpdating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update All'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Funds Modal */}
        {showAddFundsModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Add Funds</h2>
                    <p className="text-[10px] text-gray-600 mt-0.5">{selectedUser.fullName}</p>
                  </div>
                  <button
                    onClick={() => setShowAddFundsModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-600">Current Balance</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedUser.accountBalance)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">
                      Amount (₦)
                    </label>
                    <input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={fundDescription}
                      onChange={(e) => setFundDescription(e.target.value)}
                      placeholder="Reason for adding funds..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowAddFundsModal(false)}
                      className="flex-1 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const amount = parseFloat(fundAmount);
                        if (amount > 0 && !isNaN(amount)) {
                          addFundsToUser(selectedUser.id, amount, fundDescription);
                        } else {
                          alert("Please enter a valid amount");
                        }
                      }}
                      className="flex-1 py-2 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium"
                    >
                      Add Funds
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full max-h-[85vh] overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">User Details</h2>
                    <p className="text-[10px] text-gray-600 mt-0.5">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">{selectedUser.fullName}</h3>
                      <p className="text-[10px] text-gray-600">{selectedUser.businessName || "No business"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500">Phone</p>
                      <p className="text-xs font-medium text-gray-900">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Referral Code</p>
                      <p className="text-xs font-medium text-gray-900">{selectedUser.referralCode}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg border border-orange-100">
                    <p className="text-[10px] text-gray-600">Wallet Balance</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedUser.accountBalance)}</p>
                  </div>

                  {/* Referral Stats */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100">
                    <h3 className="text-[10px] font-bold text-gray-900 mb-2 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-purple-600" />
                      Referral Stats
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[8px] text-gray-500">Total</p>
                        <p className="text-xs font-bold text-gray-900">{selectedUser.totalReferrals || 0}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-500">Paid</p>
                        <p className="text-xs font-bold text-green-600">{selectedUser.paidReferrals || 0}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-500">Pending</p>
                        <p className="text-xs font-bold text-yellow-600">{selectedUser.pendingReferrals || 0}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-purple-700 mt-1">
                      Earnings: {formatCurrency(selectedUser.referralEarnings || 0)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-[10px] text-gray-500">Deals Joined</p>
                      <p className="text-sm font-bold text-gray-900">{selectedUser.totalDealsJoined}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-[10px] text-gray-500">Invested</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(selectedUser.totalAmountInvested)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${
                        selectedUser.status === "active"
                          ? "bg-green-100 text-green-800"
                          : selectedUser.status === "suspended"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Role</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${
                        selectedUser.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>

                  {/* Refund Account Details */}
                  {selectedUser.refundAccount && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-[10px] font-bold text-gray-900 mb-2">Refund Account</p>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-600">
                          Bank: {selectedUser.refundAccount.bankName}
                        </p>
                        <p className="text-[10px] text-gray-600">
                          Account: {selectedUser.refundAccount.accountNumber}
                        </p>
                        <p className="text-[10px] text-gray-600">
                          Name: {selectedUser.refundAccount.accountName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setSelectedUser(selectedUser);
                      setShowAddFundsModal(true);
                    }}
                    className="w-full py-2.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Add Funds
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        updateUserRole(selectedUser.id, selectedUser.role === "admin" ? "user" : "admin");
                        setShowUserModal(false);
                      }}
                      className="py-2 text-xs bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium"
                    >
                      {selectedUser.role === "admin" ? "Make User" : "Make Admin"}
                    </button>
                    
                    {selectedUser.status === "active" ? (
                      <button
                        onClick={() => {
                          updateUserStatus(selectedUser.id, "suspended");
                          setShowUserModal(false);
                        }}
                        className="py-2 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          updateUserStatus(selectedUser.id, "active");
                          setShowUserModal(false);
                        }}
                        className="py-2 text-xs bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                  
                  <Link
                    href={`/admin/referrals?userId=${selectedUser.id}`}
                    onClick={() => setShowUserModal(false)}
                    className="w-full py-2.5 text-xs bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium flex items-center justify-center gap-1"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    View Referrals
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deal Buyers Modal */}
        {showDealModal && selectedDeal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 line-clamp-1">{selectedDeal.title}</h2>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-gray-600">{dealBuyers.length} buyers</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-[10px] text-gray-600">{formatCurrency(selectedDeal.price)} each</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setShowBulkStatusModal(true);
                      }}
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      title="Bulk Status Update"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => exportToCSV(dealBuyers, `buyers-${selectedDeal.id}`)}
                      className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowDealModal(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {dealBuyers.length === 0 ? (
                    <div className="text-center py-8">
                      <PackageX className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No buyers found</p>
                    </div>
                  ) : (
                    dealBuyers.slice(0, 50).map((order) => (
                      <div key={order.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xs font-bold text-gray-900">{order.buyerName || "Customer"}</h3>
                            <p className="text-[10px] text-gray-600">{order.buyerEmail}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            order.status === "delivered" || order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-white p-1.5 rounded-lg">
                            <p className="text-[10px] text-gray-500">Qty</p>
                            <p className="text-xs font-bold text-gray-900">{order.quantity}</p>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg">
                            <p className="text-[10px] text-gray-500">Amount</p>
                            <p className="text-xs font-bold text-gray-900">{formatCurrency(order.totalPayable)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                            className="flex-1 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-[10px] font-medium hover:bg-gray-50"
                          >
                            View
                          </button>
                          {order.buyerPhone && (
                            <a
                              href={`https://wa.me/${order.buyerPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDealModal(false)}
                    className="flex-1 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {dealBuyers.length > 0 && (
                    <button
                      onClick={() => sendBulkWhatsApp(selectedDeal.id, `Update on your order for ${selectedDeal.title}`)}
                      className="flex-1 py-2 text-xs bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Bulk WA
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Order #{selectedOrder.id.slice(-6)}</h2>
                    <p className="text-[10px] text-gray-600">{selectedOrder.dealTitle || selectedOrder.title}</p>
                  </div>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-[10px] font-bold text-gray-900 mb-2 flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      Customer
                    </h3>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[10px] text-gray-500">Name</p>
                        <p className="text-xs font-medium text-gray-900">{selectedOrder.buyerName || "Customer"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Email</p>
                        <p className="text-xs font-medium text-gray-900">{selectedOrder.buyerEmail || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Phone</p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-medium text-gray-900">{selectedOrder.buyerPhone || "N/A"}</p>
                          {selectedOrder.buyerPhone && (
                            <a
                              href={`https://wa.me/${selectedOrder.buyerPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-green-600 text-white rounded-lg"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-[10px] font-bold text-gray-900 mb-2 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      Order Details
                    </h3>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[10px] text-gray-500">Product</p>
                        <p className="text-xs font-medium text-gray-900">{selectedOrder.title}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-500">Quantity</p>
                          <p className="text-xs font-bold text-gray-900">{selectedOrder.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">Unit Price</p>
                          <p className="text-xs font-bold text-gray-900">{formatCurrency(selectedOrder.unitPrice)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Variants */}
                  {selectedOrder.variantDetails && selectedOrder.variantDetails.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h3 className="text-[10px] font-bold text-gray-900 mb-2 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Variants
                      </h3>
                      <div className="space-y-1.5">
                        {selectedOrder.variantDetails.map((variant, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-200">
                            <div>
                              <p className="text-[10px] font-medium text-gray-900">{variant.variantType}: {variant.variantName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-900">x{variant.quantity}</p>
                              <p className="text-[8px] text-orange-600">{formatCurrency(variant.total)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-[10px] font-bold text-gray-900 mb-2 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Payment
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-600">Subtotal</span>
                        <span className="text-[10px] font-medium">{formatCurrency(selectedOrder.unitPrice * selectedOrder.quantity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-600">Logistics</span>
                        <span className="text-[10px] font-medium">{formatCurrency(selectedOrder.logisticsCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-600">Platform Fee</span>
                        <span className="text-[10px] font-medium">{formatCurrency(selectedOrder.platformFee)}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-gray-200">
                        <span className="text-[10px] font-bold text-gray-900">Total</span>
                        <span className="text-xs font-bold text-gray-900">{formatCurrency(selectedOrder.totalPayable)}</span>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-medium ${
                          selectedOrder.paymentStatus === "paid" ? "bg-green-100 text-green-800" :
                          selectedOrder.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          Payment: {selectedOrder.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Referral Link */}
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <h3 className="text-[10px] font-bold text-gray-900 mb-2 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-purple-600" />
                      Referral Program
                    </h3>
                    <Link
                      href={`/admin/referrals?orderId=${selectedOrder.id}`}
                      className="w-full py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-medium hover:bg-purple-700 flex items-center justify-center gap-1"
                    >
                      <Gift className="w-3 h-3" />
                      Check Referral Eligibility
                    </Link>
                  </div>

                  {/* Status Update */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-[10px] font-bold text-gray-900 mb-2 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Update Status
                    </h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => {
                            updateOrderStatus(selectedOrder.id, status.value);
                            setShowOrderModal(false);
                          }}
                          className={`py-1.5 text-[10px] rounded-lg font-medium flex items-center justify-center gap-1 ${
                            selectedOrder.status === status.value
                              ? `${status.color} border border-current`
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}