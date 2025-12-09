import React from 'react';
import type { TicketStats } from '../types';

interface TicketStatsGridProps {
  stats: TicketStats | null;
  fallbackTotal: number;
}

const TicketStatsGrid: React.FC<TicketStatsGridProps> = ({ stats, fallbackTotal }) => {
  const total = stats?.total ?? fallbackTotal;
  const open = stats?.open ?? 0;
  const inProgress = stats?.inProgress ?? 0;
  const closed = stats?.closed ?? 0;

  const items = [
    { label: 'Total Tickets', value: total, color: 'cyan' },
    { label: 'Open', value: open, color: 'cyan' },
    { label: 'In Progress', value: inProgress, color: 'purple' },
    { label: 'Closed', value: closed, color: 'green' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {items.map((item) => (
        <div
          key={item.label}
          className="backdrop-blur-xl bg-gray-900/20 border border-gray-800/50 rounded-xl p-6 hover:scale-105 transition-transform duration-300"
        >
          <div className={`text-3xl font-light mb-2 text-${item.color}-400`}>{item.value}</div>
          <div className="text-gray-400 text-sm">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default TicketStatsGrid;
