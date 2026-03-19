"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  ShoppingBag,
  Shield,
  Gift,
  Award,
  MoreVertical
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  increment, 
  writeBatch
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Types
interface User {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  businessName?: string;
  referralCode: string;
  referredBy?: string;
  referralEarnings: number;
  totalReferrals: number;
  paidReferrals: number;
  pendingReferrals: number;
  accountBalance: number;
  createdAt: string;
  status: string;
}

interface Order {
  id: string;
  userId: string;
  dealId: string;
  title: string;
  quantity: number;
  totalPayable: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referrerPhone?: string;
  referrerCode: string;
  referrerBalance: number;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  referredUserPhone?: string;
  referredUserJoined: string;
  referredUserStatus: string;
  orderId: string | null;
  orderAmount: number;
  orderDate: string | null;
  orderStatus: string | null;
  paymentStatus: string | null;
  bonusAmount: number;
  status: "pending" | "eligible" | "paid" | "cancelled";
  referrerEarnings: number;
  referrerPaidCount: number;
  notes?: string;
}

interface AdminUser {
  uid: string;
  email: string;
  role: string;
  name: string;
}

interface Filters {
  status: "all" | "pending" | "eligible" | "paid" | "cancelled";
  search: string;
  dateRange: "all" | "today" | "week" | "month";
  hasOrder: "all" | "yes" | "no";
}

interface Stats {
  totalReferrals: number;
  totalPaid: number;
  totalPending: number;
  totalEligible: number;
  totalAmountPaid: number;
  totalAmountPending: number;
  totalAmountEligible: number;
  uniqueReferrers: number;
  totalReferrersWithPending: number;
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<ReferralRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReferrals: 0,
    totalPaid: 0,
    totalPending: 0,
    totalEligible: 0,
    totalAmountPaid: 0,
    totalAmountPending: 0,
    totalAmountEligible: 0,
    uniqueReferrers: 0,
    totalReferrersWithPending: 0
  });
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    search: "",
    dateRange: "all",
    hasOrder: "all"
  });
  
  // UI States
  const [showFilters, setShowFilters] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReferrals, setSelectedReferrals] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Check admin authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();
          
          if (userData?.role === "admin" || userData?.role === "super_admin") {
            setAdminUser({
              uid: user.uid,
              email: user.email || "",
              role: userData.role,
              name: userData.fullName || user.displayName || "Admin"
            });
            await fetchAllReferralData();
          } else {
            router.push("/auth");
          }
        } catch (error) {
          console.error("Auth error:", error);
          router.push("/auth");
        }
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Check if a referral bonus has already been paid for this referred user
  const checkIfBonusPaid = async (referrerId: string, referredUserId: string): Promise<boolean> => {
    try {
      const paymentsRef = collection(db, "referralPayments");
      const q = query(
        paymentsRef, 
        where("referrerId", "==", referrerId),
        where("referredUserId", "==", referredUserId)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking bonus paid:", error);
      return false;
    }
  };

  // Fetch all referral data from users and orders collections
  const fetchAllReferralData = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("Fetching referral data...");
      
      // Get all users
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      const users: User[] = [];
      const userMap = new Map<string, User>();
      
      usersSnapshot.forEach((doc) => {
        const userData = { uid: doc.id, ...doc.data() } as User;
        users.push(userData);
        userMap.set(doc.id, userData);
      });

      console.log(`Found ${users.length} total users`);

      // Get all orders with completed payment status
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(ordersRef, where("paymentStatus", "==", "completed"));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const orders: Order[] = [];
      const userOrdersMap = new Map<string, Order[]>();
      
      ordersSnapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() } as Order;
        orders.push(orderData);
        
        const userOrders = userOrdersMap.get(orderData.userId) || [];
        userOrders.push(orderData);
        userOrdersMap.set(orderData.userId, userOrders);
      });

      console.log(`Found ${orders.length} completed orders`);

      // Build referral records
      const referralRecords: ReferralRecord[] = [];

      for (const user of users) {
        if (user.referredBy) {
          const referrer = userMap.get(user.referredBy);
          
          if (referrer) {
            const isPaid = await checkIfBonusPaid(referrer.uid, user.uid);
            
            const userOrders = userOrdersMap.get(user.uid) || [];
            const completedOrders = userOrders.filter(order => 
              order.paymentStatus === "completed"
            );
            
            const firstCompletedOrder = completedOrders.length > 0 
              ? completedOrders.sort((a, b) => 
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )[0]
              : null;
            
            let status: "pending" | "eligible" | "paid" | "cancelled" = "pending";
            
            if (isPaid) {
              status = "paid";
            } else if (firstCompletedOrder) {
              status = "eligible";
            } else {
              status = "pending";
            }
            
            referralRecords.push({
              id: `${user.uid}_${referrer.uid}`,
              referrerId: referrer.uid,
              referrerName: referrer.fullName || "Unknown",
              referrerEmail: referrer.email,
              referrerPhone: referrer.phone,
              referrerCode: referrer.referralCode || "N/A",
              referrerBalance: referrer.accountBalance || 0,
              referredUserId: user.uid,
              referredUserName: user.fullName || "Unknown",
              referredUserEmail: user.email,
              referredUserPhone: user.phone,
              referredUserJoined: user.createdAt || new Date().toISOString(),
              referredUserStatus: user.status || "active",
              orderId: firstCompletedOrder?.id || null,
              orderAmount: firstCompletedOrder?.totalPayable || 0,
              orderDate: firstCompletedOrder?.createdAt || null,
              orderStatus: firstCompletedOrder?.status || null,
              paymentStatus: firstCompletedOrder?.paymentStatus || null,
              bonusAmount: 1000,
              status: status,
              referrerEarnings: referrer.referralEarnings || 0,
              referrerPaidCount: referrer.paidReferrals || 0,
              notes: firstCompletedOrder 
                ? `User placed order on ${new Date(firstCompletedOrder.createdAt).toLocaleString()} for ₦${firstCompletedOrder.totalPayable}`
                : "No order yet"
            });
          }
        }
      }

      console.log(`Total referral records created: ${referralRecords.length}`);
      setReferrals(referralRecords);
      calculateStats(referralRecords);
      
    } catch (error) {
      console.error("Error fetching referral data:", error);
      setError("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data: ReferralRecord[]) => {
    const newStats: Stats = {
      totalReferrals: data.length,
      totalPaid: data.filter(r => r.status === "paid").length,
      totalPending: data.filter(r => r.status === "pending").length,
      totalEligible: data.filter(r => r.status === "eligible").length,
      totalAmountPaid: data.filter(r => r.status === "paid").reduce((sum, r) => sum + r.bonusAmount, 0),
      totalAmountPending: data.filter(r => r.status === "pending").reduce((sum, r) => sum + r.bonusAmount, 0),
      totalAmountEligible: data.filter(r => r.status === "eligible").reduce((sum, r) => sum + r.bonusAmount, 0),
      uniqueReferrers: new Set(data.map(r => r.referrerId)).size,
      totalReferrersWithPending: new Set(data.filter(r => r.status === "pending" || r.status === "eligible").map(r => r.referrerId)).size
    };
    
    setStats(newStats);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...referrals];
    
    if (filters.status !== "all") {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.referrerName.toLowerCase().includes(searchLower) ||
        r.referrerEmail.toLowerCase().includes(searchLower) ||
        r.referredUserName.toLowerCase().includes(searchLower) ||
        r.referredUserEmail.toLowerCase().includes(searchLower) ||
        r.referrerCode.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(r => {
        const date = new Date(r.referredUserJoined);
        
        switch (filters.dateRange) {
          case "today":
            return date >= today;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return date >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    if (filters.hasOrder !== "all") {
      filtered = filtered.filter(r => 
        filters.hasOrder === "yes" ? r.orderId !== null : r.orderId === null
      );
    }
    
    setFilteredReferrals(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  }, [filters, referrals, itemsPerPage]);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedReferrals(filteredReferrals.map(r => r.id));
    } else {
      setSelectedReferrals([]);
    }
  }, [selectAll, filteredReferrals]);

  // Approve single referral
  const approveReferral = async (referral: ReferralRecord) => {
    if (!adminUser) return;
    
    setProcessingId(referral.id);
    setError("");
    
    try {
      const batch = writeBatch(db);
      
      const referrerRef = doc(db, "users", referral.referrerId);
      batch.update(referrerRef, {
        accountBalance: increment(referral.bonusAmount),
        referralEarnings: increment(referral.bonusAmount),
        paidReferrals: increment(1),
        pendingReferrals: increment(-1)
      });
      
      const paymentRef = doc(collection(db, "referralPayments"));
      batch.set(paymentRef, {
        referrerId: referral.referrerId,
        referredUserId: referral.referredUserId,
        orderId: referral.orderId,
        amount: referral.bonusAmount,
        status: "paid",
        paidBy: adminUser.uid,
        paidByEmail: adminUser.email,
        paidAt: new Date().toISOString(),
        notes: approvalNote || "Approved by admin",
        createdAt: new Date().toISOString(),
        referrerName: referral.referrerName,
        referredUserName: referral.referredUserName
      });
      
      if (referral.orderId) {
        const orderRef = doc(db, "orders", referral.orderId);
        batch.update(orderRef, {
          referralBonusPaid: true,
          referralBonusPaidAt: new Date().toISOString(),
          referralBonusAmount: referral.bonusAmount,
          referralBonusPaidBy: adminUser.uid
        });
      }
      
      await batch.commit();
      
      setSuccess(`✅ ₦${referral.bonusAmount.toLocaleString()} bonus approved and credited to ${referral.referrerName}`);
      await fetchAllReferralData();
      
    } catch (error) {
      console.error("Error approving referral:", error);
      setError("Failed to approve referral bonus");
    } finally {
      setProcessingId(null);
      setShowApproveModal(false);
      setSelectedReferral(null);
      setApprovalNote("");
    }
  };

  // Bulk approve eligible referrals
  const bulkApproveReferrals = async () => {
    if (!adminUser || selectedReferrals.length === 0) return;
    
    setProcessingId("bulk");
    setError("");
    
    try {
      const batch = writeBatch(db);
      let approvedCount = 0;
      let totalAmount = 0;
      
      for (const referralId of selectedReferrals) {
        const referral = referrals.find(r => r.id === referralId);
        if (!referral || referral.status !== "eligible") continue;
        
        const referrerRef = doc(db, "users", referral.referrerId);
        batch.update(referrerRef, {
          accountBalance: increment(referral.bonusAmount),
          referralEarnings: increment(referral.bonusAmount),
          paidReferrals: increment(1),
          pendingReferrals: increment(-1)
        });
        
        const paymentRef = doc(collection(db, "referralPayments"));
        batch.set(paymentRef, {
          referrerId: referral.referrerId,
          referredUserId: referral.referredUserId,
          orderId: referral.orderId,
          amount: referral.bonusAmount,
          status: "paid",
          paidBy: adminUser.uid,
          paidByEmail: adminUser.email,
          paidAt: new Date().toISOString(),
          notes: "Bulk approved by admin",
          createdAt: new Date().toISOString(),
          referrerName: referral.referrerName,
          referredUserName: referral.referredUserName
        });
        
        approvedCount++;
        totalAmount += referral.bonusAmount;
      }
      
      await batch.commit();
      
      setSuccess(`✅ Approved ${approvedCount} referrals, total ₦${totalAmount.toLocaleString()}`);
      setSelectedReferrals([]);
      setSelectAll(false);
      setShowBulkActions(false);
      
      await fetchAllReferralData();
      
    } catch (error) {
      console.error("Error in bulk approval:", error);
      setError("Failed to approve some referrals");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject referral
  const rejectReferral = async (referral: ReferralRecord) => {
    if (!adminUser) return;
    
    setProcessingId(referral.id);
    setError("");
    
    try {
      const batch = writeBatch(db);
      
      const referrerRef = doc(db, "users", referral.referrerId);
      batch.update(referrerRef, {
        pendingReferrals: increment(-1)
      });
      
      const rejectionRef = doc(collection(db, "referralRejections"));
      batch.set(rejectionRef, {
        referrerId: referral.referrerId,
        referredUserId: referral.referredUserId,
        orderId: referral.orderId,
        amount: referral.bonusAmount,
        reason: rejectionReason,
        rejectedBy: adminUser.uid,
        rejectedByEmail: adminUser.email,
        rejectedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        referrerName: referral.referrerName,
        referredUserName: referral.referredUserName
      });
      
      await batch.commit();
      
      setSuccess(`Referral bonus rejected for ${referral.referrerName}`);
      await fetchAllReferralData();
      
    } catch (error) {
      console.error("Error rejecting referral:", error);
      setError("Failed to reject referral bonus");
    } finally {
      setProcessingId(null);
      setShowRejectModal(false);
      setSelectedReferral(null);
      setRejectionReason("");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const dataToExport = selectedReferrals.length > 0 
      ? referrals.filter(r => selectedReferrals.includes(r.id))
      : filteredReferrals;
    
    const headers = [
      "Referrer Name",
      "Referrer Email",
      "Referrer Code",
      "Referred User",
      "Referred Email",
      "Referred Joined",
      "Has Order",
      "Order ID",
      "Order Amount",
      "Order Date",
      "Order Status",
      "Payment Status",
      "Bonus Amount",
      "Status",
      "Referrer Balance",
      "Referrer Paid Count"
    ];
    
    const csvData = dataToExport.map(r => [
      r.referrerName,
      r.referrerEmail,
      r.referrerCode,
      r.referredUserName,
      r.referredUserEmail,
      new Date(r.referredUserJoined).toLocaleDateString(),
      r.orderId ? "Yes" : "No",
      r.orderId || "N/A",
      r.orderAmount || 0,
      r.orderDate ? new Date(r.orderDate).toLocaleDateString() : "N/A",
      r.orderStatus || "N/A",
      r.paymentStatus || "N/A",
      r.bonusAmount,
      r.status,
      r.referrerBalance,
      r.referrerPaidCount
    ]);
    
    const csv = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        );
      case "eligible":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            Eligible (Has Order)
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending (No Order)
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  // Format date safely
  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    try {
      if (date.toDate) {
        return date.toDate().toLocaleString();
      }
      return new Date(date).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  // Pagination
  const paginatedReferrals = filteredReferrals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Referral Management</h1>
              <p className="text-sm text-gray-600">Admin Control Panel</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllReferralData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
              <Shield className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">{adminUser?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700 flex-1">{success}</p>
            <button onClick={() => setSuccess("")} className="text-green-700 hover:text-green-900">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{stats.uniqueReferrers} unique referrers</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eligible for Payment</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalEligible}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ₦{stats.totalAmountEligible.toLocaleString()} to pay
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending (No Order)</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Awaiting first order
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Bonuses</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalPaid}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ₦{stats.totalAmountPaid.toLocaleString()} paid out
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or referral code..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <span>Filters</span>
              {(filters.status !== "all" || filters.dateRange !== "all" || filters.hasOrder !== "all") && (
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </button>

            {/* Bulk Actions */}
            {selectedReferrals.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedReferrals.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="relative"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                  {showBulkActions && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={bulkApproveReferrals}
                        disabled={processingId === "bulk"}
                        className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Selected
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Selected
                      </button>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Export All */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export All</span>
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="eligible">Eligible (Has Order)</option>
                    <option value="pending">Pending (No Order)</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Referral Date
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>

                {/* Has Order Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Order Status
                  </label>
                  <select
                    value={filters.hasOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasOrder: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  >
                    <option value="all">All</option>
                    <option value="yes">Has Order</option>
                    <option value="no">No Order</option>
                  </select>
                </div>

                {/* Quick Stats */}
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-xs text-orange-700 font-medium">Ready to Pay</p>
                  <p className="text-lg font-bold text-orange-900">
                    {stats.totalEligible} referrals
                  </p>
                  <p className="text-sm text-orange-700">
                    ₦{stats.totalAmountEligible.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Info - Remove in production */}
        {referrals.length === 0 && !loading && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-yellow-800">
              No referral records found. Make sure:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
              <li>Users have the "referredBy" field set</li>
              <li>The referrer user exists in the database</li>
              <li>Orders have paymentStatus = "completed"</li>
            </ul>
          </div>
        )}

        {/* Referrals Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => setSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referred User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bonus
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrer Stats
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedReferrals.includes(referral.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReferrals(prev => [...prev, referral.id]);
                          } else {
                            setSelectedReferrals(prev => prev.filter(id => id !== referral.id));
                            setSelectAll(false);
                          }
                        }}
                        disabled={referral.status !== "eligible"}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{referral.referrerName}</p>
                        <p className="text-sm text-gray-600">{referral.referrerEmail}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Gift className="w-3 h-3 text-purple-500" />
                          <p className="text-xs text-purple-600 font-mono">{referral.referrerCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{referral.referredUserName}</p>
                        <p className="text-sm text-gray-600">{referral.referredUserEmail}</p>
                        <p className="text-xs text-gray-500">
                          Joined: {new Date(referral.referredUserJoined).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {referral.orderId ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Order: {referral.orderId.substring(0, 8)}...
                          </p>
                          <p className="text-sm text-gray-600">
                            ₦{referral.orderAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(referral.orderDate)}
                          </p>
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full mt-1">
                            {referral.paymentStatus}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No order yet</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-green-600">
                        ₦{referral.bonusAmount.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(referral.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-gray-900">Balance: ₦{referral.referrerBalance.toLocaleString()}</p>
                        <p className="text-gray-600">Paid: {referral.referrerPaidCount}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {referral.status === "eligible" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedReferral(referral);
                                setShowApproveModal(true);
                              }}
                              disabled={processingId === referral.id}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Approve Bonus"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReferral(referral);
                                setShowRejectModal(true);
                              }}
                              disabled={processingId === referral.id}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Reject Bonus"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            alert(JSON.stringify(referral, null, 2));
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredReferrals.length === 0 && !loading && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals found</h3>
              <p className="text-gray-600">
                {filters.search ? "Try adjusting your search filters" : "No referral records available"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredReferrals.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
                <span className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReferrals.length)} of {filteredReferrals.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedReferral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Approve Referral Bonus</h3>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800 mb-2">
                  You are about to approve a referral bonus for:
                </p>
                <p className="font-medium text-gray-900">{selectedReferral.referrerName}</p>
                <p className="text-sm text-gray-600">{selectedReferral.referrerEmail}</p>
                <p className="text-xs text-gray-500 mt-1">Code: {selectedReferral.referrerCode}</p>
                
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-gray-600">Referred User:</p>
                  <p className="font-medium text-gray-900">{selectedReferral.referredUserName}</p>
                  <p className="text-xs text-gray-500">{selectedReferral.referredUserEmail}</p>
                </div>
                
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-gray-600">Order Details:</p>
                  {selectedReferral.orderId ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        Order ID: {selectedReferral.orderId.substring(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-700">
                        Amount: ₦{selectedReferral.orderAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: {formatDate(selectedReferral.orderDate)}
                      </p>
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full mt-1">
                        {selectedReferral.paymentStatus}
                      </span>
                    </>
                  ) : (
                    <p className="text-sm text-yellow-600">Warning: No order found for this referral!</p>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-gray-600">Bonus Amount:</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{selectedReferral.bonusAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Approval Note (Optional)
                </label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => approveReferral(selectedReferral)}
                  disabled={processingId === selectedReferral.id}
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {processingId === selectedReferral.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    "Approve & Credit ₦1,000"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedReferral(null);
                    setApprovalNote("");
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedReferral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Referral Bonus</h3>
            
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-800 mb-2">
                  You are about to reject the referral bonus for:
                </p>
                <p className="font-medium text-gray-900">{selectedReferral.referrerName}</p>
                <p className="text-sm text-gray-600">{selectedReferral.referrerEmail}</p>
                <div className="mt-2 pt-2 border-t border-red-200">
                  <p className="text-sm text-gray-600">Bonus Amount:</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₦{selectedReferral.bonusAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => rejectReferral(selectedReferral)}
                  disabled={processingId === selectedReferral.id || !rejectionReason.trim()}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {processingId === selectedReferral.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    "Confirm Rejection"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedReferral(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}