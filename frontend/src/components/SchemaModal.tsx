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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-dark-900 border border-dark-800 rounded-lg w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800 bg-dark-900">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cochair-blue-bright" />
            <div>
              <h3 className="text-xs font-semibold text-slate-100">database.db Schema</h3>
              <p className="text-[11px] text-slate-400">SQLite tables queryable by LangGraph agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-dark-800 transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
          {dbStatus?.tables.map((table) => (
            <div key={table} className="p-3 rounded-md bg-dark-850 border border-dark-800">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Table className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-xs font-semibold text-slate-200">{table}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {dbStatus.row_counts[table] ?? 0} rows
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {schemaDetails[table]?.desc || 'Database table'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {schemaDetails[table]?.columns.map((col, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded bg-dark-900 text-slate-300 font-mono border border-dark-800"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-dark-800 bg-dark-900 text-right">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white text-xs font-medium border border-dark-800 transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
