import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import type { TicketSummary } from '../types';
import { formatDateLabel, getPriorityMeta, getStatusMeta } from '../utils';

interface TicketTableProps {
  tickets: TicketSummary[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  filteredCount: number;
  onPageChange: (page: number) => void;
  onViewTicket: (ticketId: number) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  currentPage,
  totalPages,
  pageSize,
  filteredCount,
  onPageChange,
  onViewTicket,
  onRefresh,
  isRefreshing,
}) => {
  const startIndex = (currentPage - 1) * pageSize;

  return (
    <div className="backdrop-blur-xl bg-gray-900/20 border border-gray-800/50 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/30 border-b border-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-light text-gray-400">ID</th>
              <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Title</th>
              <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Category</th>
              <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Status</th>
              <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Priority</th>
              <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Date</th>
              <th className="px-6 py-4 text-left text-sm font-light text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr className="border-b border-gray-800/30">
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500 text-sm"
                >
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((ticket, index) => {
                const statusMeta = getStatusMeta(ticket.status);
                const priorityMeta = getPriorityMeta(ticket.priority);
                return (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors duration-200"
                    style={{
                      animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                    }}
                  >
                    <td className="px-6 py-4 text-gray-300">#{ticket.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-white font-light">{ticket.subject}</div>
                      {ticket.shortDescription && (
                        <div className="text-gray-500 text-xs mt-1 truncate">
                          {ticket.shortDescription}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${statusMeta.className}`}
                      >
                        <statusMeta.Icon className="w-4 h-4" />
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${priorityMeta.className}`}
                      >
                        {priorityMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {formatDateLabel(ticket.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewTicket(ticket.id)}
                          className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 hover:scale-110 transition-all duration-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={onRefresh}
                          className="p-2 rounded-lg bg-purple-400/10 border border-purple-400/20 text-purple-400 hover:bg-purple-400/20 hover:scale-110 transition-all duration-200"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 bg-gray-800/20 border-t border-gray-800/50">
        <div className="text-sm text-gray-400">
          Showing {filteredCount === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(startIndex + pageSize, filteredCount)} of {filteredCount} tickets
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-800/30 border border-gray-700/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {Array.from({ length: totalPages }).map((_, index) => {
            const page = index + 1;
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-400'
                    : 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg bg-gray-800/30 border border-gray-700/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketTable;
