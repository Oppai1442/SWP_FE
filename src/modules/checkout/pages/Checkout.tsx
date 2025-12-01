import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Check,
  Loader2,
  Globe,
  Lock,
  CreditCard,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loading } from "@/components/Loading";
import { toast } from "react-hot-toast";
import {
  checkoutStripeConfirm,
  checkoutRedirectConfirm,
  getCheckoutDetailAPI,
  getCheckoutMethodsAPI,
  getWalletBalanceAPI,
  initiatePaymentAPI,
} from "../services/checkout";
import {
  SubscriptionSummary,
  TopUpComponent,
} from "../components";
import { ROUTES } from "@/constant/routes";
import type { checkoutDetail, TopUpPlan, checkoutPaymentMethodStatus } from "../types";
import CheckoutHandler from "../components/CheckoutHandler";

interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

type CustomerInfoField = keyof CustomerInfo;

type PaymentMethodId = "ACCOUNT_BALANCE" | "VNPAY" | "STRIPE" | "MOMO" | "PAYOS";

interface PaymentMethodOption {
  id: PaymentMethodId;
  name: string;
  image: string;
  description: string;
  available: boolean;
  statusLabel?: string;
}

const BASE_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "VNPAY",
    name: "VNPay",
    image: "https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png",
    description: "Vietnamese banks and QR code payments",
    available: true,
  },
  {
    id: "STRIPE",
    name: "International Cards (Stripe)",
    image: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
    description: "Visa, Mastercard, AMEX, and global debit cards",
    available: true,
  },
  {
    id: "MOMO",
    name: "MoMo Wallet",
    image: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png",
    description: "MoMo e-wallet in Vietnam (coming soon)",
    available: false,
  },
  {
    id: "PAYOS",
    name: "PayOS",
    image: "https://avatars.githubusercontent.com/u/142285739?s=200&v=4",
    description: "Pay via PayOS network",
    available: false,
  },
];


const PAYOS_SUCCESS_STATUSES = new Set(["success", "succeeded", "paid", "complete", "completed", "0", "00"]);
const PAYOS_CANCELLED_STATUSES = new Set(["cancel", "canceled", "cancelled", "1", "user_cancelled", "true"]);
const PAYOS_FAILED_STATUSES = new Set(["failed", "failure", "error", "expired", "2", "refunded"]);

const CheckoutPage = () => {
  const { id = "" } = useParams();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId | undefined>(undefined)
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const [topupDetail, setTopupDetail] = useState<TopUpPlan>({
    amount: 123,
    currency: "VNDX",
  })
  const [checkoutDetail, setCheckoutDetail] = useState<checkoutDetail>({
    checkoutId: "-1",
    checkoutType: "SUBSCRIPTION",
    checkoutStatus: "UNKNOWN",
  })
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [isWalletLoading, setIsWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [backendPaymentMethods, setBackendPaymentMethods] = useState<checkoutPaymentMethodStatus[]>([])

  const fetchCheckoutDetail = useCallback(async () => {
    const response = await getCheckoutDetailAPI(id ?? "");
    setCheckoutDetail(response);

    if (response.checkoutType === "TOPUP") {
      setTopupDetail({
        amount: response.topupAmount || 0,
        currency: "USD",
      });
    }
  }, [id]);

  const fetchWalletBalance = useCallback(async () => {
    try {
      setIsWalletLoading(true);
      setWalletError(null);
      const balanceResponse = await getWalletBalanceAPI();
      const normalized = typeof balanceResponse === "number" ? balanceResponse : Number(balanceResponse ?? 0);
      console.log(balanceResponse)
      setWalletBalance(Number.isFinite(normalized) ? normalized : 0);
    } catch (err) {
      console.error("Failed to fetch wallet balance:", err);
      setWalletError("Failed to load wallet balance.");
      setWalletBalance(null);
    } finally {
      setIsWalletLoading(false);
    }
  }, []);
  const [params] = useSearchParams();
  const amountDue = useMemo(() => {
    if (checkoutDetail.checkoutType === "TOPUP") {
      return topupDetail.amount || 0;
    }
    const finalPrice = checkoutDetail.subscription?.finalPrice ?? 0;
    const numericFinalPrice = typeof finalPrice === "number" ? finalPrice : Number(finalPrice ?? 0);
    return Number.isFinite(numericFinalPrice) ? numericFinalPrice : 0;
  }, [checkoutDetail, topupDetail]);

  const backendMethodLookup = useMemo(() => {
    const map = new Map<string, checkoutPaymentMethodStatus>();
    backendPaymentMethods.forEach((method) => {
      if (method?.paymentMethod) {
        map.set(method.paymentMethod, method);
      }
    });
    return map;
  }, [backendPaymentMethods]);

  const paymentMethods = useMemo<PaymentMethodOption[]>(() => {
    const baseMethods = BASE_PAYMENT_METHODS.map((method) => {
      const backendInfo = backendMethodLookup.get(method.id);
      const available = backendInfo?.available ?? method.available;
      return {
        ...method,
        name: backendInfo?.displayName ?? method.name,
        available,
        statusLabel: available ? undefined : backendInfo?.statusMessage,
      };
    });

    const walletAvailable =
      checkoutDetail.checkoutType === "SUBSCRIPTION" &&
      walletBalance !== null &&
      walletBalance >= amountDue;

    const walletDescription = (() => {
      if (checkoutDetail.checkoutType !== "SUBSCRIPTION") {
        return "Available for subscription purchases only.";
      }
      if (walletBalance === null) {
        return "Checking your balance...";
      }
      if (walletAvailable) {
        return "Pay instantly using your account balance.";
      }
      return `Insufficient balance. Requires ${amountDue.toLocaleString()} credits.`;
    })();

    const walletBackendInfo = backendMethodLookup.get("ACCOUNT_BALANCE");
    const backendWalletAvailable = walletBackendInfo?.available ?? true;
    const walletStatusLabel =
      walletAvailable && backendWalletAvailable
        ? undefined
        : walletBackendInfo?.statusMessage ?? walletDescription;

    const walletOption: PaymentMethodOption = {
      id: "ACCOUNT_BALANCE",
      name: walletBackendInfo?.displayName ?? "Account Balance",
      image: "",
      description: walletDescription,
      available: walletAvailable && backendWalletAvailable,
      statusLabel: walletStatusLabel,
    };

    return [walletOption, ...baseMethods]
      .map((method, originalIndex) => ({ ...method, originalIndex }))
      .sort((a, b) => {
        if (a.available === b.available) {
          return a.originalIndex - b.originalIndex; // keep original ordering when availability matches
        }
        return a.available ? -1 : 1; // available methods first
      })
      .map(({ originalIndex, ...rest }) => rest);
  }, [amountDue, backendMethodLookup, checkoutDetail.checkoutType, walletBalance]);

  useEffect(() => {
    const current = paymentMethods.find((method) => method.id === selectedPaymentMethod);
    if (current?.available) {
      return;
    }
    const fallback = paymentMethods.find((method) => method.available);
    if (fallback && fallback.id !== selectedPaymentMethod) {
      setSelectedPaymentMethod(fallback.id);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  const selectedMethod = paymentMethods.find((method) => method.id === selectedPaymentMethod);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const basePath = `/checkout/${id}`;
      const providerParam = (params.get("provider") ?? params.get("platform") ?? "").toLowerCase();
      const statusParam = params.get("status")?.toLowerCase();
      const cancelParam = (params.get("cancel") ?? "").toLowerCase();
      const payosCodeParam = params.get("code")?.toLowerCase();
      const stripeSessionId = params.get("session_id");
      const vnpParams: Record<string, string> = {};
      const payosParams: Record<string, string> = {};

      if (stripeSessionId && (providerParam === "" || providerParam === "stripe")) {
        try {
          setIsProcessing(true);
          const response = await checkoutStripeConfirm({ checkoutId: id, sessionId: stripeSessionId });
          if (response?.success) {
            toast.success("Stripe payment confirmed successfully.");
          } else {
            toast.error(response?.message ?? "Unable to confirm Stripe payment.");
          }
        } catch (error) {
          console.error("Failed to confirm Stripe payment:", error);
          toast.error("Failed to confirm Stripe payment.");
        } finally {
          setIsProcessing(false);
          window.history.replaceState(null, "", basePath);
        }
      } else if (stripeSessionId && statusParam === "cancel" && (providerParam === "" || providerParam === "stripe")) {
        toast.error("Stripe payment was cancelled.");
        window.history.replaceState(null, "", basePath);
      }

      for (const [key, value] of params.entries()) {
        if (key === "provider") {
          continue;
        }
        if (providerParam === "payos") {
          payosParams[key] = value;
        }
        if (key.startsWith("vnp_")) {
          vnpParams[key] = value;
        }
      }

      if (providerParam === "payos" && Object.keys(payosParams).length > 0) {
        const isPayosCancelled = PAYOS_CANCELLED_STATUSES.has(statusParam ?? "") || PAYOS_CANCELLED_STATUSES.has(cancelParam);
        const isPayosFailed = PAYOS_FAILED_STATUSES.has(statusParam ?? "");
        const isPayosSuccess = PAYOS_SUCCESS_STATUSES.has(statusParam ?? "") || PAYOS_SUCCESS_STATUSES.has(payosCodeParam ?? "");

        if (isPayosCancelled) {
          toast.error("PayOS payment was cancelled.");
          window.history.replaceState(null, "", basePath);
        } else if (isPayosFailed) {
          toast.error("PayOS payment failed.");
          window.history.replaceState(null, "", basePath);
        } else if (isPayosSuccess || (!statusParam && !cancelParam)) {
          try {
            setIsProcessing(true);
            await checkoutRedirectConfirm({ checkoutId: id, provider: "payos", params: payosParams });
            toast.success("PayOS payment confirmed successfully.");
          } catch (error) {
            console.error("Failed to confirm PayOS payment:", error);
            toast.error("Failed to confirm PayOS payment.");
          } finally {
            setIsProcessing(false);
            window.history.replaceState(null, "", basePath);
          }
        }
      } else if (Object.keys(vnpParams).length > 0) {
        try {
          await checkoutRedirectConfirm({ checkoutId: id, provider: "vnpay", params: vnpParams });
          toast.success("VNPay payment confirmed successfully.");
        } catch (error) {
          console.error("Failed to confirm VNPay payment:", error);
          toast.error("Failed to confirm VNPay payment.");
        } finally {
          window.history.replaceState(null, "", basePath);
        }
      }

      try {
        await fetchCheckoutDetail();
      } catch (err) {
        console.error("Failed to fetch checkout detail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [fetchCheckoutDetail, id, params]);

  useEffect(() => {
    void fetchWalletBalance();
  }, [fetchWalletBalance]);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const methods = await getCheckoutMethodsAPI();
        setBackendPaymentMethods(methods ?? []);
      } catch (err) {
        console.error("Failed to load payment methods:", err);
      }
    };

    void fetchMethods();
  }, []);

  const handleInputChange = (field: CustomerInfoField, value: string) => {
    setCustomerInfo((prev: CustomerInfo) => ({ ...prev, [field]: value }));
  };

  const handleConfirmPayment = async () => {
    if (!isFormValid()) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!selectedPaymentMethod || !selectedMethod?.available) {
      toast.error("Please select an available payment method.");
      return;
    }

    const isAccountBalance = selectedPaymentMethod === "ACCOUNT_BALANCE";

    if (isAccountBalance) {
      if (checkoutDetail.checkoutType !== "SUBSCRIPTION") {
        toast.error("Account balance can only be used for subscription payments.");
        return;
      }
      if (walletBalance === null) {
        toast.error("Unable to load your wallet balance. Please try again.");
        return;
      }
      if (amountDue <= 0) {
        toast.error("Invalid payment amount.");
        return;
      }
      if (walletBalance < amountDue) {
        toast.error("Insufficient balance. Please choose another payment method.");
        return;
      }
    }

    setIsProcessing(true);

    try {
      const response = await initiatePaymentAPI({
        checkoutId: id,
        paymentMethod: selectedPaymentMethod,
      });

      if (isAccountBalance) {
        await fetchCheckoutDetail();
        await fetchWalletBalance();
        setIsProcessing(false);
        toast.success("Payment completed using account balance.");
        return;
      }

      if (response?.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Failed to initiate payment:", err);
      toast.error("Failed to initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const isFormValid = () => {
    return Boolean(
      customerInfo.fullName &&
      customerInfo.email &&
      customerInfo.phone &&
      customerInfo.address &&
      selectedMethod?.available
    );
  };

  if (isLoading) {
    return (
      <>
        <Loading isVisible={isLoading} variant="fullscreen" />
      </>
    );
  }

  if (checkoutDetail.checkoutStatus !== 'ACTIVE' || checkoutDetail.checkoutId === "-1") {
    return (
      <CheckoutHandler checkoutDetail={checkoutDetail} onGoBack={() => { navigate(ROUTES.HOME.path) }} />
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Dynamic gradient background that follows mouse */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.08), transparent 40%)`
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Header with backdrop blur */}
      <div className="sticky top-0 z-50 border-b border-gray-800/50 backdrop-blur-xl bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-light">
              Secure <span className="text-cyan-400">Checkout</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 font-light">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>256-bit encryption</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Customer Info & Payment */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Information */}
            <div className="group relative bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-8 hover:border-cyan-400/30 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-light text-white">
                    Customer Information
                  </h2>
                </div>
                <p className="text-gray-400 font-light ml-13">
                  Please provide your details below
                </p>
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative group/input">
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={customerInfo.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light placeholder-gray-600 focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative group/input">
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light placeholder-gray-600 focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <div className="relative group/input">
                    <input
                      type="number"
                      placeholder="+84 123 456 789"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light placeholder-gray-600 focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Country/Region
                  </label>
                  <div className="relative group/input">
                    <select className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300 appearance-none cursor-pointer">
                      <option value="VN">Vietnam</option>
                      <option value="US">United States</option>
                      <option value="SG">Singapore</option>
                      <option value="TH">Thailand</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-light text-gray-400 uppercase tracking-wider block">
                    Full Address
                  </label>
                  <textarea
                    placeholder="123 Main Street, District 1, Ho Chi Minh City"
                    value={customerInfo.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-4 text-white font-light placeholder-gray-600 focus:border-cyan-400/50 focus:bg-gray-800/50 focus:outline-none transition-all duration-300 resize-none"
                  />
                </div>
              </div>

              <div className="relative mt-6 flex items-start gap-3 p-4 bg-cyan-400/5 border border-cyan-400/20 rounded-xl">
                <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm font-light">
                  <span className="text-cyan-400">Your data is protected.</span>
                  <span className="text-gray-400 ml-1">
                    We use enterprise-grade encryption to secure your information.
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="group relative bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-8 hover:border-cyan-400/30 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-light text-white">
                    Payment Method
                  </h2>
                </div>
                <p className="text-gray-400 font-light ml-13">
                  Select your preferred payment option
                </p>
              </div>

              <div className="relative space-y-3">
                {paymentMethods.map((method, index) => {
                  const isSelected = selectedPaymentMethod === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => method.available && setSelectedPaymentMethod(method.id)}
                      style={{ animationDelay: `${index * 50}ms` }}
                      className={`group/method relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                        !method.available
                          ? "opacity-40 cursor-not-allowed bg-gray-800/10 border-gray-800/30"
                          : isSelected
                          ? "bg-cyan-400/10 border-cyan-400/50 shadow-lg shadow-cyan-500/10 cursor-pointer scale-[1.02]"
                          : "bg-gray-800/20 border-gray-800/50 hover:border-gray-700 hover:bg-gray-800/30 cursor-pointer hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex-shrink-0 w-14 h-14 bg-white/95 rounded-xl p-2.5 flex items-center justify-center shadow-sm">
                        {method.image ? (
                          <img
                            src={method.image}
                            alt={method.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-900/5 rounded flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-cyan-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-light text-base flex items-center gap-2 text-white">
                          {method.name}
                          {!method.available && (
                            <span className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full font-light">
                              {method.statusLabel ?? (method.id === "ACCOUNT_BALANCE" ? "Insufficient" : "Soon")}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 font-light mt-0.5">{method.description}</div>
                        {method.id === "ACCOUNT_BALANCE" && (
                          <div className="text-xs font-light mt-1">
                            {walletError ? (
                              <span className="text-red-400">{walletError}</span>
                            ) : isWalletLoading ? (
                              <span className="text-gray-500">Checking balance...</span>
                            ) : (
                              <span className="text-gray-400">Available: {walletBalance !== null ? walletBalance.toLocaleString() : "0"} credits</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {isSelected && method.available ? (
                          <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Check className="w-4 h-4 text-gray-950" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                            !method.available
                              ? "border-gray-700/50"
                              : "border-gray-600 group-hover/method:border-cyan-400/50"
                          }`}></div>
                        )}
                      </div>

                      {isSelected && method.available && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/5 to-transparent pointer-events-none"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div className="lg:col-span-2">
            {checkoutDetail.checkoutType == "SUBSCRIPTION" ? (
              <SubscriptionSummary
                checkoutDetail={checkoutDetail}
                onConfirmPayment={() => handleConfirmPayment()}
                isFormValid={isFormValid()}
                isProcessing={isProcessing}
              />
            ) : (
              <TopUpComponent
                onConfirmPayment={() => handleConfirmPayment()}
                topUpPlan={topupDetail}
                isFormValid={isFormValid()}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </div>
      </div>

      {/* Processing Overlay with modern design */}
      {isProcessing && (
        <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="relative bg-gray-900/50 border border-gray-800/50 backdrop-blur-sm rounded-3xl p-10 max-w-md w-full mx-4 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-3xl" />
            
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                <Loader2 className="w-10 h-10 text-white animate-spin" strokeWidth={2} />
              </div>
              
              <h3 className="text-2xl font-light text-white mb-3">
                Processing Payment
              </h3>
              
              <p className="text-gray-400 font-light mb-8 leading-relaxed">
                Securely connecting to payment gateway. Please do not close this window.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-light">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <span>Awaiting confirmation</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
