"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,  
  ChevronRight,
  Phone, 
  Building, 
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  LogOut, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Package,
  CreditCard,
  Wallet,
  Banknote,
  Building2,
  CreditCard as CardIcon,
  UserCircle,
  Smartphone,
  Key,
  Shield,
  Gift,
  Users,
  Trophy,
  Clock,
  AlertTriangle,
  TrendingDown,
  Check,
  XCircle,
  Copy,
  Share2,
  Globe,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  RefreshCw,
  Bell,
  Info,
  Award,
  Star
} from "lucide-react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  increment, 
  addDoc, 
  orderBy, 
  Timestamp,
  limit 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Types
interface AuthUser {
  uid: string;
  email: string | null;
  fullName: string | null;
  phone?: string;
  businessName?: string;
  role: string;
  status: string;
  accountBalance: number;
  referralCode: string;
  referredBy?: string;
  referralEarnings?: number;
  totalReferrals?: number;
  paidReferrals?: number;
  pendingReferrals?: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileComplete: boolean;
  totalDealsJoined: number;
  totalAmountInvested: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardOrder {
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
  paymentStatus: string;
  status: string;
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
  variantDetails?: any[];
}

interface ReferralStats {
  totalReferrals: number;
  paidReferrals: number;
  pendingReferrals: number;
  referralEarnings: number;
  referralCode: string;
  referralBonus: number;
}

interface ReferralPayment {
  id: string;
  amount: number;
  createdAt: string;
  notes?: string;
  orderId: string;
  paidAt?: string;
  paidBy: string;
  paidByEmail: string;
  referredUserId: string;
  referredUserName: string;
  referrerId: string;
  referrerName: string;
  status: "pending" | "paid" | "cancelled";
}

interface ReferralDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinedDate: string;
  hasOrder: boolean;
  orderId?: string;
  orderAmount?: number;
  orderDate?: string;
  bonusStatus: "pending" | "paid" | "cancelled" | "no_order";
  bonusAmount?: number;
  notes?: string;
}

interface Alert {
  id: string;
  createdAt: string;
  message: string;
  metadata?: any;
  adminEmail: string;
  adminName: string;
  read: boolean;
  title: string;
  type: string;
  updatedAt: string;
  userId: string;
}

interface Transaction {
  id: string;
  amount: number;
  createdAt: string;
  description: string;
  metadata?: any;
  dealId?: string;
  orderId?: string;
  reference: string;
  status: string;
  type: string;
  userId: string;
}

export default function AuthPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"login" | "register" | "dashboard" | "profile" | "reset" | "referrals">("login");
  
  // Form states
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    referralCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    accountType: "savings" as "savings" | "current"
  });
  
  const [resetEmail, setResetEmail] = useState("");
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Dashboard states
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    activeDeals: 0,
    totalInvested: 0,
    totalProfit: 0,
    completedDeals: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    refundedOrders: 0,
    totalTransactions: 0,
    walletBalance: 0,
    totalReferralBonus: 0
  });
  
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Referral states
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    paidReferrals: 0,
    pendingReferrals: 0,
    referralEarnings: 0,
    referralCode: "",
    referralBonus: 1000
  });

  const [referralPayments, setReferralPayments] = useState<ReferralPayment[]>([]);
  const [referralPaymentsLoading, setReferralPaymentsLoading] = useState(false);
  
  // Detailed referrals list
  const [referralDetails, setReferralDetails] = useState<ReferralDetail[]>([]);
  const [referralDetailsLoading, setReferralDetailsLoading] = useState(false);

  // Use refs for values that don't need re-renders
  const authCheckedRef = useRef(false);
  const isMountedRef = useRef(true);
  const dataFetchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Set mounted to prevent hydration errors
  useEffect(() => {
    setMounted(true);
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (dataFetchTimeoutRef.current) {
        clearTimeout(dataFetchTimeoutRef.current);
      }
    };
  }, []);

  // Check authentication state - only run once
  useEffect(() => {
    if (authCheckedRef.current) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMountedRef.current) return;
      
      setLoading(true);
      
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
        setActiveTab("dashboard");
      } else {
        setAuthUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem("ozyxhub_user");
          const savedEmail = localStorage.getItem("ozyxhub_remember_email");
          if (savedEmail) {
            setLoginData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
          }
        }
        setLoading(false);
        setDataLoaded(true);
      }
    });

    authCheckedRef.current = true;
    
    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array is correct here - we only want this to run once

  // Format currency with memoization
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }, []);

  // Format date with memoization
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return "Invalid Date";
    }
  }, []);

  // Generate unique referral code
  const generateReferralCode = useCallback((name: string): string => {
    const nameBase = name.substring(0, 3).toUpperCase();
    const randomNumbers = Math.floor(100 + Math.random() * 900);
    const timestamp = Date.now().toString().slice(-3);
    return `${nameBase}${randomNumbers}${timestamp}`;
  }, []);

  // Validate referral code
  const validateReferralCode = async (code: string): Promise<{ valid: boolean; referrerId?: string; referrerName?: string }> => {
    if (!code.trim()) return { valid: true };
    
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("referralCode", "==", code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const referrerDoc = querySnapshot.docs[0];
        const referrerData = referrerDoc.data();
        return { 
          valid: true, 
          referrerId: referrerDoc.id,
          referrerName: referrerData.fullName || referrerData.name || "Unknown"
        };
      }
      return { valid: false };
    } catch (error) {
      console.error("Error validating referral code:", error);
      return { valid: false };
    }
  };

  // Fetch user data from Firestore
  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const user: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: userData.fullName || firebaseUser.displayName || "",
          phone: userData.phone || "",
          businessName: userData.businessName || "",
          role: userData.role || "user",
          status: userData.status || "active",
          accountBalance: userData.accountBalance || 0,
          referralCode: userData.referralCode || "",
          referredBy: userData.referredBy || "",
          referralEarnings: userData.referralEarnings || 0,
          totalReferrals: userData.totalReferrals || 0,
          paidReferrals: userData.paidReferrals || 0,
          pendingReferrals: userData.pendingReferrals || 0,
          emailVerified: userData.emailVerified || false,
          phoneVerified: userData.phoneVerified || false,
          profileComplete: userData.profileComplete || true,
          totalDealsJoined: userData.totalDealsJoined || 0,
          totalAmountInvested: userData.totalAmountInvested || 0,
          successRate: userData.successRate || 100,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString()
        };
        setAuthUser(user);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem("ozyxhub_user", JSON.stringify(user));
        }
        
        // Fetch all data in parallel
        await Promise.all([
          fetchDashboardData(firebaseUser.uid),
          fetchReferralStats(firebaseUser.uid),
          fetchReferralPayments(firebaseUser.uid),
          fetchReferralDetails(firebaseUser.uid)
        ]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  }, []);

  // Fetch dashboard data with complete statistics from all collections
  const fetchDashboardData = useCallback(async (userId: string) => {
    setDashboardLoading(true);
    try {
      // Fetch orders
      const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders: DashboardOrder[] = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString()
      } as DashboardOrder));

      // Fetch transactions
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions: Transaction[] = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString()
      } as Transaction));
      setRecentTransactions(transactions);

      // Fetch alerts
      const alertsQuery = query(
        collection(db, "alerts"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      const alertsSnapshot = await getDocs(alertsQuery);
      const alerts: Alert[] = alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString()
      } as Alert));
      setRecentAlerts(alerts);

      // Set recent orders (last 5)
      setRecentOrders(orders.slice(0, 5));

      // Calculate comprehensive statistics
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.totalPayable || 0), 0);
      const totalInvested = totalSpent;
      
      const completedDeals = orders.filter(order => 
        order.status === "completed" || order.status === "delivered"
      ).length;
      
      const activeDeals = orders.filter(order => 
        order.status === "pending" || 
        order.status === "confirmed" || 
        order.status === "processing" || 
        order.status === "shipped"
      ).length;

      const processingOrders = orders.filter(order => 
        order.status === "processing" || order.status === "confirmed" || order.status === "shipped"
      ).length;

      const deliveredOrders = orders.filter(order => 
        order.status === "delivered" || order.status === "completed"
      ).length;

      const pendingOrders = orders.filter(order => 
        order.status === "pending"
      ).length;

      const cancelledOrders = orders.filter(order => 
        order.status === "cancelled" || order.status === "failed"
      ).length;

      const refundedOrders = orders.filter(order => 
        order.status === "refunded"
      ).length;

      // Calculate profit from completed orders
      const totalProfit = orders
        .filter(order => order.status === "completed" || order.status === "delivered")
        .reduce((sum, order) => {
          // Assuming 30% profit margin on completed orders
          return sum + ((order.totalPayable || 0) * 0.3);
        }, 0);

      // Get total referral bonus from referralPayments
      const paymentsQuery = query(
        collection(db, "referralPayments"),
        where("referrerId", "==", userId),
        where("status", "==", "paid")
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const totalReferralBonus = paymentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

      // Get user document for wallet balance
      const userDoc = await getDoc(doc(db, "users", userId));
      const walletBalance = userDoc.data()?.accountBalance || 0;

      setStats({
        totalOrders,
        totalSpent,
        activeDeals,
        totalInvested,
        totalProfit,
        completedDeals,
        processingOrders,
        deliveredOrders,
        pendingOrders,
        cancelledOrders,
        refundedOrders,
        totalTransactions: transactions.length,
        walletBalance,
        totalReferralBonus
      });

      // Check for new orders that might qualify for referral bonus
      for (const order of orders) {
        if ((order.paymentStatus === "completed" || order.paymentStatus === "paid") && 
            order.status !== "cancelled" && order.status !== "refunded") {
          await checkAndAwardReferralBonus(userId, order.id, order.totalPayable);
        }
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Fetch detailed referral information
  const fetchReferralDetails = async (userId: string) => {
    setReferralDetailsLoading(true);
    try {
      // Get all users referred by this user
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("referredBy", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const details: ReferralDetail[] = [];
      
      // Get all orders to check which referred users have orders
      const ordersRef = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersRef);
      const ordersMap = new Map();
      
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        if (orderData.paymentStatus === "completed" || orderData.paymentStatus === "paid") {
          if (!ordersMap.has(orderData.userId)) {
            ordersMap.set(orderData.userId, []);
          }
          ordersMap.get(orderData.userId).push({
            id: doc.id,
            ...orderData
          });
        }
      });
      
      // Get referral payments to check bonus status and notes
      const paymentsRef = collection(db, "referralPayments");
      const paymentsQuery = query(paymentsRef, where("referrerId", "==", userId));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsMap = new Map();
      
      paymentsSnapshot.forEach((doc) => {
        const data = doc.data();
        paymentsMap.set(data.referredUserId, {
          status: data.status,
          bonusAmount: data.amount,
          orderId: data.orderId,
          paidAt: data.paidAt,
          notes: data.notes,
          createdAt: data.createdAt
        });
      });
      
      // Build referral details
      for (const doc of querySnapshot.docs) {
        const referredUser = doc.data();
        const userOrders = ordersMap.get(doc.id) || [];
        const hasOrder = userOrders.length > 0;
        const firstOrder = userOrders.length > 0 ? userOrders[0] : null;
        const paymentInfo = paymentsMap.get(doc.id);
        
        let bonusStatus: "pending" | "paid" | "cancelled" | "no_order" = "no_order";
        if (paymentInfo) {
          bonusStatus = paymentInfo.status as any;
        } else if (hasOrder) {
          bonusStatus = "pending";
        }
        
        details.push({
          id: doc.id,
          name: referredUser.fullName || "Unknown",
          email: referredUser.email || "No email",
          phone: referredUser.phone,
          joinedDate: referredUser.createdAt || new Date().toISOString(),
          hasOrder,
          orderId: firstOrder?.id,
          orderAmount: firstOrder?.totalPayable,
          orderDate: firstOrder?.createdAt,
          bonusStatus,
          bonusAmount: paymentInfo?.bonusAmount || 1000,
          notes: paymentInfo?.notes
        });
      }
      
      // Sort by date (newest first)
      details.sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
      
      setReferralDetails(details);
      
    } catch (error) {
      console.error("Error fetching referral details:", error);
    } finally {
      setReferralDetailsLoading(false);
    }
  };

  // Fetch referral statistics
  const fetchReferralStats = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();
      const referralCode = userData?.referralCode || "";
      
      if (!referralCode) return;
      
      // Get all referred users
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("referredBy", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const totalReferrals = querySnapshot.size;
      
      // Get paid referrals from referralPayments collection
      const paymentsRef = collection(db, "referralPayments");
      const paidQuery = query(paymentsRef, where("referrerId", "==", userId), where("status", "==", "paid"));
      const pendingQuery = query(paymentsRef, where("referrerId", "==", userId), where("status", "==", "pending"));
      
      const [paidSnapshot, pendingSnapshot] = await Promise.all([
        getDocs(paidQuery),
        getDocs(pendingQuery)
      ]);
      
      const paidReferrals = paidSnapshot.size;
      const pendingReferrals = pendingSnapshot.size;
      
      // Calculate total earnings from paid referrals
      let totalEarnings = 0;
      paidSnapshot.forEach((doc) => {
        totalEarnings += doc.data().amount || 0;
      });
      
      setReferralStats({
        totalReferrals,
        paidReferrals,
        pendingReferrals,
        referralEarnings: totalEarnings,
        referralCode,
        referralBonus: 1000
      });
      
    } catch (error) {
      console.error("Error fetching referral stats:", error);
    }
  };

  // Fetch referral payments history
  const fetchReferralPayments = async (userId: string) => {
    setReferralPaymentsLoading(true);
    try {
      const paymentsRef = collection(db, "referralPayments");
      const q = query(
        paymentsRef,
        where("referrerId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const payments: ReferralPayment[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ReferralPayment));
      
      setReferralPayments(payments);
    } catch (error) {
      console.error("Error fetching referral payments:", error);
    } finally {
      setReferralPaymentsLoading(false);
    }
  };

  // Function to check and award referral bonus
  const checkAndAwardReferralBonus = async (userId: string, orderId: string, orderAmount: number) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();
      
      if (!userData?.referredBy) return;
      
      const referrerId = userData.referredBy;
      const referredUserName = userData.fullName || "Unknown User";
      const referredUserEmail = userData.email || "";
      
      // Get referrer details
      const referrerDoc = await getDoc(doc(db, "users", referrerId));
      const referrerData = referrerDoc.data();
      const referrerName = referrerData?.fullName || "Unknown";
      const referrerEmail = referrerData?.email || "";
      
      // Check if payment already exists
      const paymentsRef = collection(db, "referralPayments");
      const existingPaymentsQuery = query(
        paymentsRef,
        where("referrerId", "==", referrerId),
        where("referredUserId", "==", userId)
      );
      const existingPayments = await getDocs(existingPaymentsQuery);
      
      // Only award if NO existing payment found
      if (!existingPayments.empty) {
        return;
      }
      
      const bonusAmount = 1000;
      
      // Create referral payment record
      const paymentData = {
        amount: bonusAmount,
        createdAt: new Date().toISOString(),
        notes: `Referral bonus for ${referredUserName}'s order - Order ID: ${orderId}`,
        orderId: orderId,
        paidBy: referrerId,
        paidByEmail: referrerEmail,
        referredUserId: userId,
        referredUserName: referredUserName,
        referrerId: referrerId,
        referrerName: referrerName,
        status: "pending" as const
      };
      
      const paymentRef = doc(collection(db, "referralPayments"));
      await setDoc(paymentRef, paymentData);
      
      // Update referrer's pending count
      const referrerRef = doc(db, "users", referrerId);
      await updateDoc(referrerRef, {
        pendingReferrals: increment(1)
      });
      
      // Create alert for referrer
      const alertData = {
        createdAt: new Date().toISOString(),
        message: `${referredUserName} placed an order. You'll earn ₦1,000 once it's completed.`,
        metadata: { orderId, referredUserId: userId },
        adminEmail: "system@moqhubs.com",
        adminName: "System",
        read: false,
        title: "🎁 Referral Order Placed!",
        type: "referral_order",
        updatedAt: new Date().toISOString(),
        userId: referrerId
      };
      
      await addDoc(collection(db, "alerts"), alertData);
      
    } catch (error) {
      console.error("Error creating referral payment record:", error);
    }
  };

  // Handle login form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Handle register form changes
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setRegisterData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setRegisterData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Validate registration form
  const validateRegisterForm = async () => {
    if (!registerData.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    
    if (!registerData.email.trim()) {
      setError("Email is required");
      return false;
    }
    
    if (!registerData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    
    const phoneRegex = /^(0[789][01]\d{8})$/;
    if (!phoneRegex.test(registerData.phone)) {
      setError("Please enter a valid Nigerian phone number (e.g., 08012345678)");
      return false;
    }
    
    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    
    if (registerData.referralCode.trim()) {
      const validation = await validateReferralCode(registerData.referralCode);
      if (!validation.valid) {
        setError("Invalid referral code. Please check and try again.");
        return false;
      }
    }
    
    if (!registerData.bankName.trim()) {
      setError("Bank name is required for refunds");
      return false;
    }
    
    if (!registerData.accountNumber.trim() || registerData.accountNumber.length < 10) {
      setError("Valid account number is required (minimum 10 digits)");
      return false;
    }
    
    if (!registerData.accountName.trim()) {
      setError("Account name is required");
      return false;
    }
    
    if (!registerData.accountType) {
      setError("Please select account type");
      return false;
    }
    
    if (!registerData.acceptTerms) {
      setError("You must accept the terms and conditions");
      return false;
    }
    
    return true;
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!loginData.email || !loginData.password) {
      setError("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    
    try {
      if (loginData.rememberMe) {
        localStorage.setItem("ozyxhub_remember_email", loginData.email);
      } else {
        localStorage.removeItem("ozyxhub_remember_email");
      }
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.email.trim(),
        loginData.password
      );
      
      const user = userCredential.user;
      
      setSuccess("Login successful! Redirecting...");
      
      await fetchUserData(user);
      setActiveTab("dashboard");
      
    } catch (error: any) {
      console.error("Login error:", error);
      
      switch (error.code) {
        case "auth/invalid-email":
          setError("Invalid email address. Please check your email format.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled. Contact support.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email. Please register first.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;
        case "auth/invalid-credential":
          if (loginData.email.includes("@")) {
            setError("Invalid email or password. Please check your credentials.");
          } else {
            setError("Please enter a valid email address.");
          }
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again in a few minutes.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection.");
          break;
        default:
          setError("Login failed. Please try again or contact support.");
      }
      
      setLoginData(prev => ({ ...prev, password: "" }));
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    const isValid = await validateRegisterForm();
    if (!isValid) return;
    
    setLoading(true);
    
    try {
      let referrerId = null;
      let referrerName = null;
      if (registerData.referralCode.trim()) {
        const validation = await validateReferralCode(registerData.referralCode);
        if (validation.valid && validation.referrerId) {
          referrerId = validation.referrerId;
          referrerName = validation.referrerName || null;
        }
      }
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      );
      
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: registerData.fullName
      });
      
      const userReferralCode = generateReferralCode(registerData.fullName);
      
      const userData = {
        uid: user.uid,
        email: registerData.email,
        fullName: registerData.fullName,
        phone: registerData.phone,
        businessName: registerData.businessName || "",
        referralCode: userReferralCode,
        referredBy: referrerId || null,
        referralEarnings: 0,
        totalReferrals: 0,
        paidReferrals: 0,
        pendingReferrals: 0,
        emailVerified: false,
        phoneVerified: false,
        profileComplete: true,
        totalDealsJoined: 0,
        totalAmountInvested: 0,
        successRate: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: "user",
        status: "active",
        accountBalance: 0,
        metadata: {
          ipAddress: "",
          referred: !!referrerId,
          registrationSource: "web",
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ""
        },
        notificationPreferences: {
          email: true,
          sms: true,
          whatsapp: true
        },
        preferences: {
          categories: [],
          minInvestment: 0,
          maxInvestment: 10000000
        },
        refundAccount: {
          bankName: registerData.bankName,
          accountNumber: registerData.accountNumber,
          accountName: registerData.accountName,
          accountType: registerData.accountType
        },
        security: {
          twoFactorEnabled: false,
          lastPasswordChange: new Date().toISOString()
        }
      };
      
      await setDoc(doc(db, "users", user.uid), userData);
      
      // Create pending referral payment if referred
      if (referrerId && referrerName) {
        const referrerRef = doc(db, "users", referrerId);
        
        // Update referrer's stats
        await updateDoc(referrerRef, {
          totalReferrals: increment(1),
          pendingReferrals: increment(1)
        });
        
        // Create pending referral payment record
        const paymentData = {
          amount: 1000,
          createdAt: new Date().toISOString(),
          notes: `Awaiting first order from ${registerData.fullName}`,
          orderId: "pending",
          paidBy: referrerId,
          paidByEmail: (await getDoc(referrerRef)).data()?.email || "",
          referredUserId: user.uid,
          referredUserName: registerData.fullName,
          referrerId: referrerId,
          referrerName: referrerName,
          status: "pending" as const
        };
        
        await addDoc(collection(db, "referralPayments"), paymentData);
        
        setSuccess("✅ Account created successfully! Your referrer will earn ₦1,000 when you place your first order.");
      } else {
        setSuccess("✅ Account created successfully! You can now start exploring deals.");
      }
      
      // Reset form and redirect to login
      setTimeout(() => {
        setActiveTab("login");
      }, 2000);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!resetEmail) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      switch (error.code) {
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        default:
          setError(error.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthUser(null);
      setActiveTab("login");
      localStorage.removeItem("ozyxhub_user");
      localStorage.removeItem("ozyxhub_remember_email");
      setSuccess("Logged out successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  // Copy referral code with marketing message
  const copyReferralCode = async () => {
    if (!authUser?.referralCode) return;
    
    try {
      const marketingMessage = `🚀 Join MOQHUBS - Africa's Premier Bulk Buying Platform!\n\n` +
        `💰 Use my referral code: ${authUser.referralCode}\n\n` +
        `🎁 What you get:\n` +
        `• Access to wholesale bulk deals from China to Nigeria\n` +
        `• Group buying power - lower prices when we buy together\n` +
        `• ₦1,000 bonus when you place your first order\n` +
        `• Direct shipping from suppliers\n` +
        `• Secure wallet for easy payments\n` +
        `• Automatic refunds if MOQ not reached\n\n` +
        `📱 Sign up here: ${window.location.origin}\n\n` +
        `Don't miss out on the best wholesale deals! 🛍️`;
      
      await navigator.clipboard.writeText(marketingMessage);
      setCopied(true);
      setSuccess("✅ Referral code with marketing message copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        setSuccess("");
      }, 3000);
    } catch (error) {
      setError("Failed to copy referral code");
    }
  };

  // Share referral via WhatsApp
  const shareViaWhatsApp = () => {
    if (!authUser?.referralCode) return;
    
    const message = `🚀 Join MOQHUBS - Africa's Premier Bulk Buying Platform!%0A%0A` +
      `💰 Use my referral code: *${authUser.referralCode}*%0A%0A` +
      `🎁 What you get:%0A` +
      `• Access to wholesale bulk deals from China to Nigeria%0A` +
      `• Group buying power - lower prices when we buy together%0A` +
      `• ₦1,000 bonus when you place your first order%0A` +
      `• Direct shipping from suppliers%0A` +
      `• Secure wallet for easy payments%0A` +
      `• Automatic refunds if MOQ not reached%0A%0A` +
      `📱 Sign up here: ${window.location.origin}%0A%0A` +
      `Don't miss out on the best wholesale deals! 🛍️`;
    
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Share referral via Email
  const shareViaEmail = () => {
    if (!authUser?.referralCode) return;
    
    const subject = "Join me on MOQHUBS - Africa's Premier Bulk Buying Platform";
    const body = `Join MOQHUBS - Africa's Premier Bulk Buying Platform!\n\n` +
      `Use my referral code: ${authUser.referralCode}\n\n` +
      `What you get:\n` +
      `• Access to wholesale bulk deals from China to Nigeria\n` +
      `• Group buying power - lower prices when we buy together\n` +
      `• ₦1,000 bonus when you place your first order\n` +
      `• Direct shipping from suppliers\n` +
      `• Secure wallet for easy payments\n` +
      `• Automatic refunds if MOQ not reached\n\n` +
      `Sign up here: ${window.location.origin}\n\n` +
      `Don't miss out on the best wholesale deals!`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  // Get status color for orders
  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'payment_pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

 // Get alert icon based on type
const getAlertIcon = (type: string): React.JSX.Element => {
  switch (type) {
    case 'referral_bonus':
      return <Gift className="w-4 h-4 text-purple-600" />;
    case 'referral_order':
      return <ShoppingBag className="w-4 h-4 text-blue-600" />;
    case 'order_update':
      return <Package className="w-4 h-4 text-green-600" />;
    case 'payment':
      return <Wallet className="w-4 h-4 text-emerald-600" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    default:
      return <Info className="w-4 h-4 text-gray-600" />;
  }
};

// Get status badge for referral
const getReferralStatusBadge = (status: string): React.JSX.Element => {
  switch (status) {
    case "paid":
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <CheckCircle className="w-3 h-3" />
          Paid
        </span>
      );
    case "pending":
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "cancelled":
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    case "no_order":
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <AlertCircle className="w-3 h-3" />
          No Order
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium w-fit">
          {status}
        </span>
      );
  }
};

  // Popular Nigerian banks
  const nigerianBanks = [
    "Access Bank",
    "Citibank Nigeria",
    "Ecobank Nigeria",
    "Fidelity Bank",
    "First Bank of Nigeria",
    "First City Monument Bank",
    "Guaranty Trust Bank",
    "Heritage Bank",
    "Keystone Bank",
    "Polaris Bank",
    "Stanbic IBTC Bank",
    "Standard Chartered Bank",
    "Sterling Bank",
    "SunTrust Bank",
    "Union Bank of Nigeria",
    "United Bank for Africa",
    "Unity Bank",
    "Wema Bank",
    "Zenith Bank"
  ];

  // Prevent hydration errors - show loading until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !authUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (authUser && activeTab === "dashboard") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-600">Welcome back, {authUser.fullName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-6 pb-24">
          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm opacity-90">Wallet Balance</p>
                <h2 className="text-2xl font-bold">{formatCurrency(stats.walletBalance || 0)}</h2>
              </div>
              <Wallet className="w-8 h-8 opacity-90" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/wallet")}
                className="flex-1 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              >
                View Wallet
              </button>
              <button
                onClick={() => router.push("/wallet?action=topup")}
                className="flex-1 py-2 bg-white text-green-700 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                Add Funds
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Orders</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Spent</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Active Deals</p>
                  <p className="text-xl font-bold text-gray-900">{stats.activeDeals}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-gray-900">{stats.completedDeals}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              Order Status
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{stats.pendingOrders}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{stats.processingOrders}</p>
                <p className="text-xs text-gray-600">Processing</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{stats.deliveredOrders}</p>
                <p className="text-xs text-gray-600">Delivered</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{stats.cancelledOrders}</p>
                <p className="text-xs text-gray-600">Cancelled</p>
              </div>
            </div>
          </div>

          {/* Recent Alerts Section */}
          {recentAlerts.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                Recent Alerts
              </h3>
              <div className="space-y-2">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${alert.read ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(alert.createdAt)}</p>
                      </div>
                      {!alert.read && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Recent Transactions
              </h3>
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description || tx.type}</p>
                      <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'credit' || tx.type === 'referral_bonus' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' || tx.type === 'referral_bonus' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referral Card */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-4 h-4" />
                  <p className="text-sm opacity-90">Refer & Earn</p>
                </div>
                <h2 className="text-xl font-bold">Earn ₦1,000 per Referral</h2>
              </div>
              <Users className="w-8 h-8 opacity-90" />
            </div>
            <div className="mb-3">
              <p className="text-sm opacity-90">Total Earned: {formatCurrency(stats.totalReferralBonus)}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Your Referral Code</p>
                <p className="text-lg font-bold tracking-wider">{authUser.referralCode || "GENERATING..."}</p>
              </div>
              <button
                onClick={copyReferralCode}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setActiveTab("referrals")}
              className="w-full mt-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              View Referral Stats
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => router.push("/bulky-cards")}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Browse Deals</span>
              </button>

              <button
                onClick={() => router.push("/wallet")}
                className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
              >
                <Wallet className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">My Wallet</span>
              </button>

              <button
                onClick={() => router.push("/orders")}
                className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                <Package className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">My Orders</span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                <User className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Profile</span>
              </button>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Recent Orders</h3>
              <button 
                onClick={() => router.push("/orders")}
                className="text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors"
              >
                View All
              </button>
            </div>

            {dashboardLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading orders...</p>
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const orderDate = formatDate(order.createdAt);
                  
                  return (
                    <div
                      key={order.id}
                      onClick={() => router.push(`/orders?id=${order.id}`)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{order.title || `Order ${order.id.substring(0, 8)}`}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-gray-600">
                            {order.quantity || 1} units
                          </span>
                          <span className="text-gray-600">
                            {orderDate}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(order.totalPayable || 0)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${getStatusColor(order.status)}`}>
                          {order.status?.replace('_', ' ') || 'pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No orders yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Start by joining your first bulk deal
                </p>
                <button
                  onClick={() => router.push("/bulky-cards")}
                  className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Browse Deals
                </button>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => authUser && fetchDashboardData(authUser.uid)}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            disabled={dashboardLoading}
          >
            <RefreshCw className={`w-4 h-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
            {dashboardLoading ? 'Refreshing...' : 'Refresh Dashboard'}
          </button>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4">
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className="flex flex-col items-center p-2 text-orange-600"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs mt-1">Dashboard</span>
            </button>
            <button
              onClick={() => router.push("/bulky-cards")}
              className="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs mt-1">Deals</span>
            </button>
            <button
              onClick={() => setActiveTab("referrals")}
              className="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <Gift className="w-5 h-5" />
              <span className="text-xs mt-1">Refer</span>
            </button>
            <button
              onClick={() => router.push("/wallet")}
              className="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <Wallet className="w-5 h-5" />
              <span className="text-xs mt-1">Wallet</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    );
  }

  // Profile View
  if (authUser && activeTab === "profile") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">Profile Settings</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Profile Info Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{authUser.fullName}</h2>
                <p className="text-gray-600">{authUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    Code: {authUser.referralCode}
                  </div>
                  {authUser.referredBy && (
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Referred User
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Member since {formatDate(authUser.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={authUser.fullName || ""}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={authUser.email || ""}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={authUser.phone || ""}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={authUser.businessName || ""}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900"
                  />
                </div>
              </div>

              {/* Order Stats in Profile */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  Order Statistics
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-700">{stats.totalOrders}</p>
                    <p className="text-xs text-blue-600">Total Orders</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-700">{stats.completedDeals}</p>
                    <p className="text-xs text-green-600">Completed</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-700">{stats.activeDeals}</p>
                    <p className="text-xs text-purple-600">Active</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Amount Spent</span>
                    <span className="font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</span>
                  </div>
                </div>
              </div>

              {/* Referral Stats in Profile */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  Referral Earnings
                </h3>
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Bonus Earned</p>
                      <h3 className="text-2xl font-bold">{formatCurrency(stats.totalReferralBonus)}</h3>
                    </div>
                    <Trophy className="w-8 h-8 opacity-90" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <p className="text-xs opacity-90">Total Referrals</p>
                      <p className="font-bold">{referralStats.totalReferrals}</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                      <p className="text-xs opacity-90">Paid Referrals</p>
                      <p className="font-bold">{referralStats.paidReferrals}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs opacity-90">
                    <p>• Earn ₦1,000 when referred users place any order</p>
                    <p>• {referralStats.pendingReferrals} pending referrals</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("referrals")}
                    className="mt-3 w-full py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                  >
                    View Referral Details
                  </button>
                </div>
              </div>

              {/* Account Balance in Profile */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Account Balance</h3>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Available Balance</p>
                      <h3 className="text-2xl font-bold">{formatCurrency(stats.walletBalance || 0)}</h3>
                    </div>
                    <Wallet className="w-8 h-8 opacity-90" />
                  </div>
                  <button
                    onClick={() => router.push("/wallet")}
                    className="mt-3 w-full py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                  >
                    Go to Wallet
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Account Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Verification</p>
                    <p className="font-bold text-green-700">{authUser.emailVerified ? "Email Verified" : "Email Unverified"}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Account Type</p>
                    <p className="font-bold text-blue-700">Wholesale Buyer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Security</h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab("reset")}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="font-medium text-gray-900">Change Password</p>
                    <p className="text-sm text-gray-600">Update your password regularly</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Back to Dashboard */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Referrals View - Enhanced with detailed referral list
  if (authUser && activeTab === "referrals") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">Refer & Earn</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </header>

        <div className="p-4 space-y-6 pb-24">
          {/* Referral Hero Card */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5" />
                  <h2 className="text-xl font-bold">Earn ₦1,000 per Referral</h2>
                </div>
                <p className="text-sm opacity-90">When referred users place any order</p>
              </div>
              <Gift className="w-10 h-10 opacity-90" />
            </div>
            
            {/* Bonus Information */}
            <div className="mb-4 p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4" />
                <p className="font-medium">Simple Bonus System</p>
              </div>
              <p className="text-sm opacity-90">
                You earn ₦1,000 when referred users place their first order (any amount)
              </p>
            </div>
            
            {/* Referral Code */}
            <div className="mb-4">
              <p className="text-sm opacity-90 mb-2">Your Referral Code</p>
              <div className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xl font-bold tracking-wider">{authUser.referralCode}</p>
                <button
                  onClick={copyReferralCode}
                  className="px-4 py-2 bg-white text-purple-700 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            
            {/* Share Options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={copyReferralCode}
                className="py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm hover:bg-white/30 transition-colors flex items-center justify-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={shareViaWhatsApp}
                className="py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm hover:bg-white/30 transition-colors flex items-center justify-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={shareViaEmail}
                className="py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm hover:bg-white/30 transition-colors flex items-center justify-center gap-1"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </div>

          {/* Referral Stats */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Your Referral Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Referrals</p>
                    <p className="text-xl font-bold text-gray-900">{referralStats.totalReferrals}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Paid Referrals</p>
                    <p className="text-xl font-bold text-gray-900">{referralStats.paidReferrals}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Pending Referrals</p>
                    <p className="text-xl font-bold text-gray-900">{referralStats.pendingReferrals}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Bonus</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(referralStats.referralEarnings)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Referred Users List */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              People You've Referred
            </h3>
            
            {referralDetailsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading referrals...</p>
              </div>
            ) : referralDetails.length > 0 ? (
              <div className="space-y-4">
                {referralDetails.map((referral) => (
                  <div key={referral.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <UserCircle className="w-5 h-5 text-gray-600" />
                          <p className="font-medium text-gray-900">{referral.name}</p>
                        </div>
                        <p className="text-sm text-gray-600 ml-7">{referral.email}</p>
                        {referral.phone && (
                          <p className="text-xs text-gray-500 ml-7 mt-1">{referral.phone}</p>
                        )}
                        <p className="text-xs text-gray-500 ml-7 mt-1">
                          Joined: {formatDate(referral.joinedDate)}
                        </p>
                        
                        {/* Order Info */}
                        {referral.hasOrder && referral.orderId && (
                          <div className="ml-7 mt-2 p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs font-medium text-blue-800 flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" />
                              Order placed
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              Amount: {formatCurrency(referral.orderAmount || 0)}
                            </p>
                            {referral.orderDate && (
                              <p className="text-xs text-gray-500">
                                Date: {formatDate(referral.orderDate)}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Notes if available */}
                        {referral.notes && (
                          <div className="ml-7 mt-2 text-xs text-gray-600 italic bg-gray-100 p-2 rounded">
                            📝 {referral.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        {getReferralStatusBadge(referral.bonusStatus)}
                        {referral.bonusStatus === "paid" && referral.bonusAmount && (
                          <p className="text-xs font-medium text-green-600 mt-2">
                            +{formatCurrency(referral.bonusAmount)}
                          </p>
                        )}
                        {referral.bonusStatus === "pending" && (
                          <p className="text-xs text-blue-600 mt-2">Awaiting admin approval</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress indicator for no order */}
                    {!referral.hasOrder && (
                      <div className="mt-3 ml-7">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>Waiting for first order</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    )}
                    
                    {referral.hasOrder && referral.bonusStatus === "pending" && (
                      <div className="mt-3 ml-7">
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Clock className="w-3 h-3" />
                          <span>Bonus pending - Admin review in progress</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: '50%' }}></div>
                        </div>
                      </div>
                    )}
                    
                    {referral.bonusStatus === "paid" && (
                      <div className="mt-3 ml-7">
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>Bonus paid - ₦1,000 credited to your wallet</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No referrals yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Share your referral code to start earning
                </p>
                <button
                  onClick={copyReferralCode}
                  className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Copy Referral Code
                </button>
              </div>
            )}
          </div>

          {/* Bonus Payments History */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Bonus Payments History</h3>
            
            {referralPaymentsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading payments...</p>
              </div>
            ) : referralPayments.length > 0 ? (
              <div className="space-y-3">
                {referralPayments.map((payment) => (
                  <div key={payment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{payment.referredUserName}</p>
                        <p className="text-sm text-gray-600">
                          Order ID: {payment.orderId === "pending" ? "Awaiting order" : payment.orderId.substring(0, 8) + "..."}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          +{formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Notes section */}
                    {payment.notes && (
                      <div className="mt-2 text-xs text-gray-600 italic bg-gray-100 p-2 rounded">
                        📝 {payment.notes}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : payment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status === 'paid' ? 'Paid' : 
                         payment.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                      </span>
                      {payment.status === 'paid' && payment.paidAt && (
                        <span className="text-xs text-gray-600">
                          Paid on: {formatDate(payment.paidAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No bonus payments yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Refer users who place orders to earn ₦1,000 per referral
                </p>
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">How It Works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Share Your Code</p>
                  <p className="text-sm text-gray-600">Share your unique referral code with friends</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Friend Registers</p>
                  <p className="text-sm text-gray-600">They sign up using your referral code</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Friend Places Order</p>
                  <p className="text-sm text-gray-600">They place their first order (any amount)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-900">Get ₦1,000 Bonus</p>
                  <p className="text-sm text-gray-600">You earn ₦1,000 instantly in your wallet</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Fixed ₦1,000 bonus per successful referral</li>
              <li>• Bonus is awarded when referred user places their first paid order</li>
              <li>• No minimum order amount required - any order qualifies</li>
              <li>• Only first order from each referred user qualifies for bonus</li>
              <li>• Bonus is credited after admin approval</li>
              <li>• No limit to number of referrals or total earnings</li>
              <li>• Fraudulent referrals will result in account suspension</li>
            </ul>
          </div>

          {/* Back to Dashboard */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Auth Views (Login/Register/Reset)
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          {activeTab !== "login" && activeTab !== "register" && (
            <button
              onClick={() => {
                setActiveTab("login");
                setError("");
                setSuccess("");
                setResetEmail("");
                setResetSent(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          <h1 className="ml-4 text-lg font-bold text-gray-900">
            {activeTab === "register" ? "Create Account" : 
             activeTab === "reset" ? "Reset Password" : 
             "Welcome Back"}
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === "register" ? (
              <UserCircle className="w-8 h-8 text-white" />
            ) : activeTab === "reset" ? (
              <Key className="w-8 h-8 text-white" />
            ) : (
              <Shield className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeTab === "register" ? "Join MOQHUBS Wholesale" :
             activeTab === "reset" ? "Reset Password" :
             "Sign In to MOQHUBS"}
          </h2>
          <p className="text-gray-600">
            {activeTab === "register" ? "Register to access bulk deals, group buying, and investment opportunities" :
             activeTab === "reset" ? "Enter your email to reset your password" :
             "Access your bulk deals and investment dashboard"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Tab Navigation */}
          {activeTab !== "reset" && (
            <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab("login");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-3 text-center rounded-lg font-medium ${
                  activeTab === "login"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                } transition-colors`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab("register");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-3 text-center rounded-lg font-medium ${
                  activeTab === "register"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                } transition-colors`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={loginData.rememberMe}
                    onChange={handleLoginChange}
                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-900">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab("reset")}
                  className="text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={registerData.fullName}
                    onChange={handleRegisterChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    placeholder="08012345678"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter your Nigerian phone number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Business Name (Optional)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="businessName"
                    value={registerData.businessName}
                    onChange={handleRegisterChange}
                    placeholder="Your Business Name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                  />
                </div>
              </div>

              {/* Referral Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="referralCode"
                    value={registerData.referralCode}
                    onChange={handleRegisterChange}
                    placeholder="Enter friend's referral code"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your friend earns ₦1,000 when you place your first order
                </p>
              </div>

              {/* Refund Account Details */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-green-600" />
                  Refund Account Details
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Required for automatic refunds if MOQ is not reached. Funds will be returned to this account.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Bank Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="bankName"
                        value={registerData.bankName}
                        onChange={handleRegisterChange}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white appearance-none"
                        required
                      >
                        <option value="">Select your bank</option>
                        {nigerianBanks.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Account Number
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="accountNumber"
                        value={registerData.accountNumber}
                        onChange={handleRegisterChange}
                        placeholder="0123456789"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                        required
                        minLength={10}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Account Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="accountName"
                        value={registerData.accountName}
                        onChange={handleRegisterChange}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Account Type
                    </label>
                    <div className="relative">
                      <CardIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="accountType"
                        value={registerData.accountType}
                        onChange={handleRegisterChange}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white appearance-none"
                        required
                      >
                        <option value="savings">Savings Account</option>
                        <option value="current">Current Account</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Password</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={registerData.acceptTerms}
                    onChange={handleRegisterChange}
                    className="w-4 h-4 mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    required
                  />
                  <div>
                    <p className="text-sm text-gray-900">
                      I agree to the{" "}
                      <a href="/terms" className="text-orange-600 font-medium hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-orange-600 font-medium hover:underline">
                        Privacy Policy
                      </a>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      I understand that my refund account details will be securely stored for automatic refund processing.
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-orange-600 font-medium hover:text-orange-700 transition-colors"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* Reset Password Form */}
          {activeTab === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-black bg-white"
                    required
                  />
                </div>
              </div>

              {resetSent ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    Reset instructions sent to {resetEmail}. Check your inbox and spam folder.
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </span>
                ) : (
                  "Send Reset Instructions"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Benefits */}
        {activeTab !== "reset" && activeTab === "register" && (
          <div className="mt-8 space-y-4">
            <h3 className="text-center font-bold text-gray-900">Your Account Includes:</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-blue-600 text-lg mb-1">🛡️</div>
                <p className="text-xs font-medium text-blue-900">Automatic Refunds</p>
                <p className="text-xs text-blue-700">If MOQ not reached</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-600 text-lg mb-1">💰</div>
                <p className="text-xs font-medium text-green-900">Built-in Wallet</p>
                <p className="text-xs text-green-700">Secure transactions</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-purple-600 text-lg mb-1">🎁</div>
                <p className="text-xs font-medium text-purple-900">Refer & Earn</p>
                <p className="text-xs text-purple-700">₦1,000 per referral order</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-orange-600 text-lg mb-1">🚚</div>
                <p className="text-xs font-medium text-orange-900">Direct Shipping</p>
                <p className="text-xs text-orange-700">From China to Nigeria</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}