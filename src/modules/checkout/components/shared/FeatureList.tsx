import React from 'react';
import { Check, Zap } from 'lucide-react';

interface Feature {
  featureKey: string;
  featureValue: string;
}

interface FeatureListProps {
  features: Feature[];
  title?: string;
  titleIcon?: React.ReactNode;
  getFeatureText: (featureKey: string) => string;
}

export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  title = "Features",
  titleIcon = <Zap className="w-5 h-5 text-cyan-400" />,
  getFeatureText
}) => (
  <div className="space-y-6">
    <h3 className="text-2xl font-light text-white flex items-center gap-3">
      {titleIcon}
      {title}
    </h3>

    <div className="grid grid-cols-1 gap-2">
      {features.map((feature, index) => (
        <div 
          key={`${feature.featureKey}-${index}`} 
          className="group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex items-start justify-between p-4 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 hover:border-cyan-500/30 transition-all duration-300 gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                <Check className="w-3 h-3 text-gray-950" />
              </div>
              <span className="text-gray-300 font-light leading-relaxed break-words group-hover:text-white transition-colors duration-300">
                {getFeatureText(feature.featureKey)}
              </span>
            </div>
            <span className="text-cyan-400 font-light text-lg whitespace-nowrap flex-shrink-0">
              {feature.featureValue}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
