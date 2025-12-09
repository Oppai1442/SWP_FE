import React from 'react';
import { Search } from 'lucide-react';

interface TicketSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const TicketSearchBar: React.FC<TicketSearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="mb-8 backdrop-blur-xl bg-gray-900/20 border border-gray-800/50 rounded-2xl p-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Tìm kiếm ticket theo tiêu đề, danh mục, hoặc trạng thái..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-gray-800/30 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all duration-300"
        />
      </div>
    </div>
  );
};

export default TicketSearchBar;
