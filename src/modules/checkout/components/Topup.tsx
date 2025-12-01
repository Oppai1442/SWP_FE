import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Plus, Check, Sparkles } from 'lucide-react';
import type { TopUpPlan } from '../types';
import { PaymentCard, SecurityBadge, PaymentButton, PricingBadge } from './shared';

interface TopUpComponentProps {
  topUpPlan: TopUpPlan;
  isFormValid: boolean;
  isProcessing?: boolean;
  onConfirmPayment: () => void;
}

const TopUpComponent: React.FC<TopUpComponentProps> = ({
  topUpPlan,
  isFormValid,
  isProcessing = false,
  onConfirmPayment
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const totalAmount = topUpPlan.amount + (topUpPlan.bonus || 0);

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

  const amountDetails = [
    {
      label: 'Base Amount',
      value: topUpPlan.amount,
      icon: Check,
      sign: ''
    },
    ...(topUpPlan.bonus ? [{
      label: 'Bonus Amount',
      value: topUpPlan.bonus,
      icon: Plus,
      sign: '+'
    }] : []),
    {
      label: 'Total Credit',
      value: totalAmount,
      icon: Wallet,
      sign: ''
    }
  ];

  return (
    <div ref={containerRef} className="space-y-6 relative">
      {/* Mouse-following gradient */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300 -z-10"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`
        }}
      />

      {/* TopUp Details Card */}
      <PaymentCard className="relative overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <PricingBadge badge={topUpPlan.badge} />

        <div className="mb-8 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/10 to-cyan-600/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-cyan-400/20">
              <Wallet className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-light text-white">
              Top Up <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Wallet</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl font-light text-white">
              {topUpPlan.amount.toLocaleString()} {topUpPlan.currency}
            </div>
            {topUpPlan.bonus && (
              <div className="px-3 py-1.5 bg-gradient-to-br from-cyan-400/10 to-cyan-600/10 text-cyan-400 border border-cyan-400/30 rounded-xl text-sm font-light backdrop-blur-sm">
                +{topUpPlan.bonus.toLocaleString()} {topUpPlan.currency} bonus
              </div>
            )}
          </div>
          <div className="text-gray-400 font-light">Add funds to your wallet instantly</div>
        </div>

        {/* Amount Breakdown */}
        <div className="space-y-4 relative z-10">
          <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Amount Details
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {amountDetails.map((detail, index) => {
              const IconComponent = detail.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-gray-800/30 rounded-2xl border border-gray-800/50 backdrop-blur-sm hover:bg-gray-800/40 hover:border-gray-700/50 transition-all duration-300 group"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400/10 to-cyan-600/10 flex items-center justify-center backdrop-blur-sm border border-cyan-400/20 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-white font-light">{detail.label}</span>
                  </div>
                  <span className="text-cyan-400 font-light">
                    {detail.sign}{detail.value.toLocaleString()} {topUpPlan.currency}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <SecurityBadge />
      </PaymentCard>

      {/* Summary Card */}
      <PaymentCard>
        <h3 className="text-lg font-light text-white mb-6">Payment Summary</h3>

        <div className="space-y-4">
          <div className="flex justify-between text-gray-400 font-light">
            <span>Amount to Pay</span>
            <span>{topUpPlan.amount.toLocaleString()} {topUpPlan.currency}</span>
          </div>
          {topUpPlan.bonus && (
            <div className="flex justify-between text-cyan-400 font-light">
              <span>Bonus Credit</span>
              <span>+{topUpPlan.bonus.toLocaleString()} {topUpPlan.currency}</span>
            </div>
          )}
          <div className="border-t border-gray-800/50 pt-4">
            <div className="flex justify-between text-white font-light text-xl">
              <span>Total Wallet Credit</span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                {totalAmount.toLocaleString()} {topUpPlan.currency}
              </span>
            </div>
          </div>
        </div>
      </PaymentCard>

      {/* Payment Button */}
      <PaymentButton
        isFormValid={isFormValid}
        isProcessing={isProcessing}
        onConfirmPayment={onConfirmPayment}
        amount={topUpPlan.amount}
        currency={topUpPlan.currency}
        type="topup"
      />
    </div>
  );
};

export default TopUpComponent;
