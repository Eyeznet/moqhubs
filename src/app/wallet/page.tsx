"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet,
  ArrowLeft,
  Plus,
  Minus,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Download,
  Upload,
  History,
  Shield,
  Bell,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  DollarSign,
  Loader2,
  Copy,
  BarChart,
  Info
} from "lucide-react";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  updateDoc,
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface WalletUser {
  uid: string;
  email: string | null;
  name: string | null;
  accountBalance: number;
  phone?: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal" | "payment" | "refund" | "commission";
  amount: number;
  previousBalance: number;
  newBalance: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  description: string;
  reference: string;
  paymentMethod?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  metadata?: {
    orderId?: string;
    dealId?: string;
    platformFee?: number;
    transactionFee?: number;
  };
  createdAt: any;
  updatedAt: any;
}

interface Alert {
  id: string;
  userId: string;
  type: "info" | "warning" | "success" | "error" | "transaction";
  title: string;
  message: string;
  read: boolean;
  data?: {
    transactionId?: string;
    amount?: number;
    reference?: string;
  };
  createdAt: any;
  updatedAt?: any;
}

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading Wallet...</p>
    </div>
  </div>
);

// Create a separate component that uses useSearchParams
function WalletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [user, setUser] = useState<WalletUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Wallet states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingAmount: 0,
    profitEarned: 0
  });

  // Modal states
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Form states
  const [topUpAmount, setTopUpAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Filter states
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize action from URL
  useEffect(() => {
    if (action === "topup") {
      setShowTopUpModal(true);
    }
  }, [action]);

  // Fetch user data and wallet info
  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const walletUser: WalletUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || userData.fullName,
          accountBalance: userData.accountBalance || 0,
          phone: userData.phone || ""
        };
        setUser(walletUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem("ozyxhubs_user", JSON.stringify(walletUser));
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (userId: string) => {
    try {
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactionsData: Transaction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));

      setTransactions(transactionsData);

      // Calculate stats
      const totalDeposits = transactionsData
        .filter(t => t.type === "deposit" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalWithdrawals = transactionsData
        .filter(t => t.type === "withdrawal" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const pendingAmount = transactionsData
        .filter(t => t.status === "pending" || t.status === "processing")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const profitEarned = transactionsData
        .filter(t => t.type === "commission" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalDeposits,
        totalWithdrawals,
        pendingAmount,
        profitEarned
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async (userId: string) => {
    try {
      const alertsQuery = query(
        collection(db, "alerts"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const snapshot = await getDocs(alertsQuery);
      const alertsData: Alert[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Alert));

      setAlerts(alertsData);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }, []);

  // Mark alert as read
  const markAlertAsRead = async (alertId: string) => {
    try {
      await updateDoc(doc(db, "alerts", alertId), {
        read: true,
        updatedAt: serverTimestamp()
      });

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  // Mark all alerts as read
  const markAllAlertsAsRead = async () => {
    try {
      const unreadAlerts = alerts.filter(alert => !alert.read);
      
      for (const alert of unreadAlerts) {
        await updateDoc(doc(db, "alerts", alert.id), {
          read: true,
          updatedAt: serverTimestamp()
        });
      }

      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    } catch (error) {
      console.error("Error marking all alerts as read:", error);
    }
  };

  // Create alert
  const createAlert = async (
    userId: string,
    type: Alert["type"],
    title: string,
    message: string,
    data?: any
  ) => {
    try {
      const alertRef = doc(collection(db, "alerts"));
      const alertData: Alert = {
        id: alertRef.id,
        userId,
        type,
        title,
        message,
        read: false,
        data,
        createdAt: serverTimestamp(),
      };

      await setDoc(alertRef, alertData);
      
      // Update local state
      setAlerts(prev => [alertData, ...prev]);
    } catch (error) {
      console.error("Error creating alert:", error);
    }
  };

  // Load all data
  const loadWalletData = useCallback(async () => {
    setRefreshing(true);
    
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      router.push("/auth");
      return;
    }

    await fetchUserData(firebaseUser);
    await fetchTransactions(firebaseUser.uid);
    await fetchAlerts(firebaseUser.uid);
    
    setRefreshing(false);
  }, [fetchUserData, fetchTransactions, fetchAlerts, router]);

  // Initial load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadWalletData();
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadWalletData, router]);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by type
    if (transactionFilter !== "all" && transaction.type !== transactionFilter) {
      return false;
    }

    // Filter by search
    if (searchQuery && !transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !transaction.reference.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Unread alerts count
  const unreadAlertsCount = alerts.filter(alert => !alert.read).length;

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Format date
  const formatDate = (dateInput: any) => {
    if (!dateInput) return "N/A";
    
    const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
    
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case "completed": return "text-green-600 bg-green-50 border-green-200";
      case "pending": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "processing": return "text-blue-600 bg-blue-50 border-blue-200";
      case "failed": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch(type) {
      case "deposit": return <Plus className="w-4 h-4" />;
      case "withdrawal": return <Minus className="w-4 h-4" />;
      case "payment": return <CreditCard className="w-4 h-4" />;
      case "refund": return <RefreshCw className="w-4 h-4" />;
      case "commission": return <TrendingUp className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  // Get type color
  const getTypeColor = (type: string): string => {
    switch(type) {
      case "deposit": return "text-green-600 bg-green-50";
      case "withdrawal": return "text-red-600 bg-red-50";
      case "payment": return "text-blue-600 bg-blue-50";
      case "refund": return "text-purple-600 bg-purple-50";
      case "commission": return "text-orange-600 bg-orange-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  // Handle top up
  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      createAlert(
        user!.uid,
        "error",
        "Invalid Amount",
        "Please enter a valid amount greater than 0"
      );
      return;
    }

    if (!user) return;

    setProcessingPayment(true);

    try {
      const amount = parseFloat(topUpAmount);
      const newBalance = (user.accountBalance || 0) + amount;
      
      // Update user balance
      await updateDoc(doc(db, "users", user.uid), {
        accountBalance: newBalance,
        updatedAt: serverTimestamp()
      });

      // Create transaction record
      const transactionRef = doc(collection(db, "transactions"));
      const transactionData: Transaction = {
        id: transactionRef.id,
        userId: user.uid,
        type: "deposit",
        amount: amount,
        previousBalance: user.accountBalance || 0,
        newBalance: newBalance,
        status: "completed",
        description: "Wallet top up",
        reference: `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentMethod: "card",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(transactionRef, transactionData);

      // Create alert
      await createAlert(
        user.uid,
        "success",
        "Wallet Top Up Successful",
        `You have successfully added ${formatCurrency(amount)} to your wallet`,
        {
          transactionId: transactionRef.id,
          amount: amount,
          reference: transactionData.reference
        }
      );

      // Update local state
      setUser(prev => prev ? { ...prev, accountBalance: newBalance } : null);
      setTransactions(prev => [transactionData, ...prev]);
      setStats(prev => ({
        ...prev,
        totalDeposits: prev.totalDeposits + amount
      }));

      // Reset form
      setTopUpAmount("");
      setShowTopUpModal(false);

    } catch (error) {
      console.error("Error processing top up:", error);
      
      createAlert(
        user!.uid,
        "error",
        "Top Up Failed",
        "Failed to process your payment. Please try again."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle withdrawal (disabled - coming soon)
  const handleWithdrawalClick = () => {
    setShowComingSoonModal(true);
  };

  // Quick actions
  const quickAmounts = [5000, 10000, 20000, 50000, 100000];

  // Don't render until mounted
  if (!mounted || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/auth")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">My Wallet</h1>
              <p className="text-xs text-gray-600">Secure digital wallet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadWalletData}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowAlertsModal(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Balance Card */}
      <div className="px-4 pt-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">Available Balance</p>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold">
                  {showBalance ? formatCurrency(user?.accountBalance || 0) : "******"}
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  {showBalance ? (
                    <EyeOff className="w-5 h-5 opacity-90" />
                  ) : (
                    <Eye className="w-5 h-5 opacity-90" />
                  )}
                </button>
              </div>
              <p className="text-xs opacity-80 mt-1">Your current wallet balance</p>
            </div>
            <Shield className="w-10 h-10 opacity-90" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="font-medium">Add Funds</span>
              </div>
            </button>
            <button
              onClick={handleWithdrawalClick}
              className="py-3 bg-white text-green-700 rounded-xl hover:bg-gray-100 transition-colors font-medium opacity-50 cursor-not-allowed relative group"
            >
              <div className="flex items-center justify-center gap-2">
                <Minus className="w-4 h-4" />
                <span>Withdraw</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Deposits</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalDeposits)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Withdrawals</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalWithdrawals)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Profit Earned</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.profitEarned)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="px-4 pt-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Recent Alerts</h3>
              {unreadAlertsCount > 0 && (
                <button
                  onClick={markAllAlertsAsRead}
                  className="text-sm text-orange-600 font-medium hover:text-orange-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${alert.read ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      alert.type === 'success' ? 'bg-green-100 text-green-600' :
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      alert.type === 'error' ? 'bg-red-100 text-red-600' :
                      alert.type === 'transaction' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {alert.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                       alert.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                       alert.type === 'error' ? <XCircle className="w-4 h-4" /> :
                       <Bell className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-gray-900">{alert.title}</p>
                        <button
                          onClick={() => markAlertAsRead(alert.id)}
                          className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                        >
                          Mark as read
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {alerts.length > 3 && (
                <button
                  onClick={() => setShowAlertsModal(true)}
                  className="w-full py-2 text-center text-orange-600 font-medium hover:text-orange-700"
                >
                  View all alerts ({alerts.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="px-4 pt-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Transactions</h3>
            <button
              onClick={() => router.push("/transactions")}
              className="text-sm text-orange-600 font-medium"
            >
              View All
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setTransactionFilter("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  transactionFilter === "all"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTransactionFilter("deposit")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  transactionFilter === "deposit"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Deposits
              </button>
              <button
                onClick={() => setTransactionFilter("withdrawal")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  transactionFilter === "withdrawal"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Withdrawals
              </button>
              <button
                onClick={() => setTransactionFilter("payment")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  transactionFilter === "payment"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Payments
              </button>
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setShowTransactionModal(true);
                  }}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(transaction.type)}`}>
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-600">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === "deposit" || transaction.type === "refund" || transaction.type === "commission"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}>
                        {transaction.type === "deposit" || transaction.type === "refund" || transaction.type === "commission" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No transactions found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || transactionFilter !== "all" 
                  ? "Try changing your filters"
                  : "Make your first transaction to get started"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => router.push("/auth")}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600"
          >
            <BarChart className="w-5 h-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button
            onClick={() => router.push("/bulky-cards")}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs mt-1">Deals</span>
          </button>
          <button
            onClick={() => router.push("/wallet")}
            className="flex flex-col items-center p-2 text-orange-600"
          >
            <Wallet className="w-5 h-5" />
            <span className="text-xs mt-1">Wallet</span>
          </button>
          <button
            onClick={() => setShowAlertsModal(true)}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600 relative"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs mt-1">Alerts</span>
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-4 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </nav>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add Funds to Wallet</h3>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Enter Amount (₦)
              </label>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 text-2xl font-bold text-center rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                min="100"
                step="100"
              />
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Quick Amounts</p>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopUpAmount(amount.toString())}
                    className={`p-3 rounded-lg border ${
                      topUpAmount === amount.toString()
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-orange-300'
                    }`}
                  >
                    <div className="font-bold text-gray-900">₦{amount.toLocaleString()}</div>
                  </button>
                ))}
                <button
                  onClick={() => setTopUpAmount("")}
                  className="p-3 rounded-lg border border-gray-300 hover:border-orange-300"
                >
                  <div className="font-medium text-gray-900">Custom</div>
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-700">Current Balance</p>
                <p className="font-bold text-gray-900">{formatCurrency(user?.accountBalance || 0)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">New Balance</p>
                <p className="font-bold text-green-600">
                  {formatCurrency((user?.accountBalance || 0) + (parseFloat(topUpAmount) || 0))}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleTopUp}
                disabled={processingPayment || !topUpAmount || parseFloat(topUpAmount) < 100}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Add Funds Now"
                )}
              </button>

              <button
                onClick={() => setShowTopUpModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Secure payment powered by Flutterwave</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal (Withdrawal) */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Coming Soon</h3>
              <button
                onClick={() => setShowComingSoonModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="text-center py-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-10 h-10 text-orange-600" />
              </div>
              <p className="text-gray-900 font-medium mb-2">Withdrawal Feature Coming Soon!</p>
              <p className="text-sm text-gray-600">
                We're working hard to bring you seamless withdrawal functionality. This feature will be available in a future update. Stay tuned!
              </p>
            </div>

            <button
              onClick={() => setShowComingSoonModal(false)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setSelectedTransaction(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className={`text-2xl font-bold ${
                    selectedTransaction.type === "deposit" || selectedTransaction.type === "refund" || selectedTransaction.type === "commission"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {selectedTransaction.type === "deposit" || selectedTransaction.type === "refund" || selectedTransaction.type === "commission" ? "+" : "-"}
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(selectedTransaction.type)}`}>
                  {getTypeIcon(selectedTransaction.type)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedTransaction.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium text-gray-900">{selectedTransaction.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Reference</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 font-mono text-sm break-all">{selectedTransaction.reference}</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(selectedTransaction.reference)}
                    className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium text-gray-900">{formatDate(selectedTransaction.createdAt)}</p>
              </div>

              {selectedTransaction.bankDetails && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-900 mb-2">Bank Details</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Bank: {selectedTransaction.bankDetails.bankName}</p>
                    <p className="text-sm text-gray-600">Account: {selectedTransaction.bankDetails.accountNumber}</p>
                    <p className="text-sm text-gray-600">Name: {selectedTransaction.bankDetails.accountName}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowTransactionModal(false);
                setSelectedTransaction(null);
              }}
              className="w-full mt-6 py-3 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Alerts {unreadAlertsCount > 0 && `(${unreadAlertsCount} unread)`}
              </h3>
              <div className="flex items-center gap-2">
                {unreadAlertsCount > 0 && (
                  <button
                    onClick={markAllAlertsAsRead}
                    className="text-sm text-orange-600 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowAlertsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${
                      alert.read ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        alert.type === 'success' ? 'bg-green-100 text-green-600' :
                        alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        alert.type === 'error' ? 'bg-red-100 text-red-600' :
                        alert.type === 'transaction' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                         alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                         alert.type === 'error' ? <XCircle className="w-5 h-5" /> :
                         <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="font-bold text-gray-900">{alert.title}</p>
                          {!alert.read && (
                            <button
                              onClick={() => markAlertAsRead(alert.id)}
                              className="text-xs text-orange-600 font-medium hover:text-orange-700 ml-2"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(alert.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No alerts yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your alerts will appear here
                </p>
              </div>
            )}

            <button
              onClick={() => setShowAlertsModal(false)}
              className="w-full mt-6 py-3 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with Suspense boundary
export default function WalletPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WalletContent />
    </Suspense>
  );
}