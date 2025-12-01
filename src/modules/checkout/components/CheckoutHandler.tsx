import React, { useEffect, useState, useRef } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    XCircle,
    Clock,
    CheckCircle,
    Loader,
    DollarSign,
    Crown,
    RefreshCw,
    Copy,
    Shield,
    ChevronRight,
    Zap
} from 'lucide-react';
import type { checkoutDetail } from '../types';

type CheckoutHandlerProps = {
    onGoBack: () => void;
    onRetry?: () => void;
    onContinue?: () => void;
    checkoutDetail: checkoutDetail;
    errorMessage?: string;
};

const CheckoutHandler: React.FC<CheckoutHandlerProps> = ({
    onGoBack,
    onRetry,
    onContinue,
    checkoutDetail,
    errorMessage
}) => {
    const [copied, setCopied] = useState(false);
    const [progress, setProgress] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (checkoutDetail.checkoutStatus === 'ACTIVE') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return 95;
                    return prev + Math.random() * 10;
                });
            }, 500);
            return () => clearInterval(interval);
        }
    }, [checkoutDetail.checkoutStatus]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusConfig = () => {
        const { checkoutStatus, checkoutType } = checkoutDetail;

        switch (checkoutStatus) {
            case 'ACTIVE':
                return {
                    icon: <Zap className="w-6 h-6 text-cyan-400" />,
                    title: 'Processing Payment',
                    subtitle: 'Secure transaction in progress',
                    iconBg: 'bg-gradient-to-br from-cyan-400/10 to-cyan-600/10',
                    actionType: 'loading' as const,
                    accentColor: 'cyan'
                };

            case 'COMPLETED':
                return {
                    icon: <CheckCircle className="w-6 h-6 text-cyan-400" />,
                    title: 'Payment Successful',
                    subtitle: checkoutType === 'SUBSCRIPTION'
                        ? 'Your subscription is now active'
                        : `$${checkoutDetail.topupAmount} added to your account`,
                    iconBg: 'bg-gradient-to-br from-cyan-400/10 to-cyan-600/10',
                    actionType: 'success' as const,
                    accentColor: 'cyan'
                };

            case 'CANCELED':
                return {
                    icon: <Clock className="w-6 h-6 text-gray-400" />,
                    title: 'Payment Canceled',
                    subtitle: 'Transaction was canceled by user',
                    iconBg: 'bg-gradient-to-br from-gray-400/10 to-gray-600/10',
                    actionType: 'canceled' as const,
                    accentColor: 'gray'
                };

            case 'FAILED':
                return {
                    icon: <XCircle className="w-6 h-6 text-gray-400" />,
                    title: 'Payment Failed',
                    subtitle: 'Transaction could not be completed',
                    iconBg: 'bg-gradient-to-br from-gray-400/10 to-gray-600/10',
                    actionType: 'error' as const,
                    accentColor: 'gray'
                };

            default:
                return {
                    icon: <AlertTriangle className="w-6 h-6 text-gray-400" />,
                    title: 'Unknown Status',
                    subtitle: 'Please contact support',
                    iconBg: 'bg-gradient-to-br from-gray-400/10 to-gray-600/10',
                    actionType: 'error' as const,
                    accentColor: 'gray'
                };
        }
    };

    const renderCheckoutDetails = () => {
        const { checkoutType, subscription, topupAmount } = checkoutDetail;

        if (checkoutType === 'SUBSCRIPTION' && subscription) {
            return (
                <div className="relative overflow-hidden bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-transparent to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/10 to-cyan-600/10 flex items-center justify-center backdrop-blur-sm border border-cyan-400/20">
                                    <Crown className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-light text-lg">Premium Plan</h3>
                                    <p className="text-gray-400 text-sm font-light">Subscription Details</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-light text-white">
                                    ${subscription.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-gray-400 text-xs font-light">
                                    {subscription.isAnnual ? 'per year' : 'per month'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-800/50">
                                <span className="text-gray-400 text-sm font-light">Plan Name</span>
                                <span className="text-white font-light">{subscription.name}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-gray-400 text-sm font-light">Features</span>
                                <p className="text-gray-300 text-sm font-light mt-2 leading-relaxed">{subscription.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (checkoutType === 'TOPUP' && topupAmount) {
            return (
                <div className="relative overflow-hidden bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-transparent to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/10 to-cyan-600/10 flex items-center justify-center backdrop-blur-sm border border-cyan-400/20">
                                    <DollarSign className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-light text-lg">Account Top-up</h3>
                                    <p className="text-gray-400 text-sm font-light">Balance Addition</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-light bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                                    ${topupAmount}
                                </p>
                                <p className="text-gray-400 text-xs font-light">credit added</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderActionButtons = (actionType: string, config: any) => {
        const getButtonClasses = (variant: 'primary' | 'secondary') => {
            const baseClasses = "w-full font-light py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden";

            if (variant === 'primary') {
                if (config.accentColor === 'cyan') {
                    return `${baseClasses} bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white shadow-lg shadow-cyan-400/25 hover:shadow-cyan-400/40 hover:scale-105`;
                }
                return `${baseClasses} bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white hover:scale-105`;
            } else {
                return `${baseClasses} bg-gray-800/30 hover:bg-gray-700/30 text-gray-300 hover:text-white border border-gray-800/50 hover:border-gray-700/50 backdrop-blur-sm`;
            }
        };

        switch (actionType) {
            case 'loading':
                return (
                    <div className="space-y-4">
                        <div className="w-full bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Loader className="w-5 h-5 animate-spin text-cyan-400" />
                                    <span className="text-white font-light">Processing Payment</span>
                                </div>
                                <span className="text-cyan-400 font-light">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-800/50 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-cyan-400 to-cyan-600 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-gray-400 text-sm font-light mt-3">Please do not close this window</p>
                        </div>
                    </div>
                );

            case 'success':
                return (
                    <div className="space-y-3">
                        {onContinue && (
                            <button onClick={onContinue} className={getButtonClasses('primary')}>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <CheckCircle className="w-5 h-5 relative z-10" />
                                <span className="relative z-10">Continue</span>
                                <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                            </button>
                        )}
                        <button onClick={onGoBack} className={getButtonClasses('secondary')}>
                            <ArrowLeft className="w-5 h-5" />
                            Return Home
                        </button>
                    </div>
                );

            case 'canceled':
                return (
                    <div className="space-y-3">
                        {onRetry && (
                            <button onClick={onRetry} className={getButtonClasses('primary')}>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <RefreshCw className="w-5 h-5 relative z-10 group-hover:rotate-180 transition-transform duration-300" />
                                <span className="relative z-10">Retry Payment</span>
                            </button>
                        )}
                        <button onClick={onGoBack} className={getButtonClasses('secondary')}>
                            <ArrowLeft className="w-5 h-5" />
                            Return Home
                        </button>
                    </div>
                );

            case 'error':
            default:
                return (
                    <div className="space-y-3">
                        {errorMessage && (
                            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-300 font-light mb-1">Error Details</p>
                                        <p className="text-gray-400 text-sm font-light leading-relaxed">{errorMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {onRetry && (
                            <button onClick={onRetry} className={getButtonClasses('primary')}>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <RefreshCw className="w-5 h-5 relative z-10 group-hover:rotate-180 transition-transform duration-300" />
                                <span className="relative z-10">Try Again</span>
                            </button>
                        )}
                        <button onClick={onGoBack} className={getButtonClasses('secondary')}>
                            <ArrowLeft className="w-5 h-5" />
                            Return Home
                        </button>
                    </div>
                );
        }
    };

    const config = getStatusConfig();

    return (
        <div ref={containerRef} className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Mouse-following gradient */}
            <div 
                className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300"
                style={{
                    background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`
                }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-400/20 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Grid pattern */}
            <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}
            />

            <div className="max-w-lg w-full relative z-10">
                {/* Main Status Card */}
                <div className="relative overflow-hidden bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8">
                    <div className="relative z-10">
                        {/* Status Header */}
                        <div className="text-center mb-8">
                            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${config.iconBg} flex items-center justify-center backdrop-blur-sm border border-gray-800/50 transition-transform duration-300 hover:scale-110`}>
                                {config.icon}
                            </div>

                            <h1 className="text-4xl font-light text-white mb-3">
                                {config.title}
                            </h1>

                            <p className="text-gray-400 text-base font-light leading-relaxed">
                                {config.subtitle}
                            </p>
                        </div>

                        {/* Checkout Details */}
                        <div className="mb-8">
                            {renderCheckoutDetails()}
                        </div>

                        {/* Checkout ID */}
                        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/30 rounded-2xl p-5 mb-8 group hover:border-gray-700/50 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-4 h-4 text-gray-400" />
                                        <p className="text-xs text-gray-400 font-light uppercase tracking-wider">Transaction ID</p>
                                    </div>
                                    <p className="text-sm text-gray-300 font-mono font-light tracking-wide">{checkoutDetail.checkoutId}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(checkoutDetail.checkoutId)}
                                    className="p-2.5 hover:bg-gray-800/50 rounded-xl transition-all duration-300 group/copy hover:scale-110"
                                >
                                    <Copy className={`w-4 h-4 transition-colors duration-300 ${copied ? 'text-cyan-400' : 'text-gray-400 group-hover/copy:text-white'}`} />
                                </button>
                            </div>
                            {copied && (
                                <div className="mt-2 text-xs text-cyan-400 font-light animate-in fade-in slide-in-from-top-2 duration-300">
                                    ✓ Copied to clipboard
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {renderActionButtons(config.actionType, config)}

                        {/* Support Information */}
                        <div className="mt-8 pt-6 border-t border-gray-800/50">
                            <div className="text-center">
                                <p className="text-gray-500 text-sm font-light mb-2">
                                    Need assistance? Our support team is here to help
                                </p>
                                <a
                                    href="https://mail.google.com/mail/?view=cm&fs=1&to=SBA_Support@gmail.com&su=Support Request&body=Hi, I need help with..."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:text-cyan-300 font-light text-sm transition-colors duration-300 flex items-center justify-center gap-2 group"
                                >
                                    <span>SBA_Support@gmail.com</span>
                                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-600 text-sm font-light">
                        <Shield className="w-4 h-4" />
                        <span>Your payment information is encrypted and secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutHandler;
