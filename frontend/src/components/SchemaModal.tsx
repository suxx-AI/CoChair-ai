import React from 'react';
import { Database, Table, X } from 'lucide-react';
import type { DatabaseStatus } from '../types';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DatabaseStatus | null;
}

export const SchemaModal: React.FC<SchemaModalProps> = ({ isOpen, onClose, dbStatus }) => {
  if (!isOpen) return null;

  const schemaDetails: Record<string, { desc: string; columns: string[] }> = {
    customers: {
      desc: 'Customer demographics and location',
      columns: ['id (INTEGER PRIMARY KEY)', 'name (TEXT)', 'country (TEXT)', 'age (INTEGER)'],
    },
    products: {
      desc: 'Product catalog with category and pricing',
      columns: ['id (INTEGER PRIMARY KEY)', 'name (TEXT)', 'category (TEXT)', 'price (REAL)'],
    },
    orders: {
      desc: 'Orders placed by customers',
      columns: ['id (INTEGER PRIMARY KEY)', 'customer_id (INTEGER FK)', 'order_date (TEXT)'],
    },
    order_items: {
      desc: 'Line items linking products to orders',
      columns: [
        'id (INTEGER PRIMARY KEY)',
        'order_id (INTEGER FK)',
        'product_id (INTEGER FK)',
        'quantity (INTEGER)',
      ],
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700/80 bg-dark-850/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">database.db Schema</h3>
              <p className="text-[11px] text-slate-400">SQLite schema available to LangGraph agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
          {dbStatus?.tables.map((table) => (
            <div key={table} className="p-3.5 rounded-xl bg-dark-850 border border-dark-750">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Table className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">{table}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-750 text-slate-300 font-mono">
                  {dbStatus.row_counts[table] ?? 0} rows
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                {schemaDetails[table]?.desc || 'Database table'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {schemaDetails[table]?.columns.map((col, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-1 rounded bg-dark-900 text-slate-300 font-mono border border-dark-700"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-dark-700/80 bg-dark-850/40 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 text-xs font-medium border border-dark-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
