'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { X, Edit3, RefreshCw, Save } from 'lucide-react';

interface EditComponentModalProps {
  editingFieldKey: string;
  editingFieldData: any;
  setEditingFieldData: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EditComponentModal({
  editingFieldKey,
  editingFieldData,
  setEditingFieldData,
  onClose,
  onSave,
  isSaving,
}: EditComponentModalProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-105 p-8 space-y-6 animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-50 text-pink-600">
              <Edit3 size={20} />
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-800 font-outfit">Edit Component Details</h3>
              <p className="text-xs text-slate-555 font-mono font-bold mt-0.5">Editing: {editingFieldKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-655 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Editable Fields */}
        <div className="max-h-[380px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {typeof editingFieldData === 'string' ? (
            <div>
              <label htmlFor="text-value-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Text Value</label>
              <textarea
                id="text-value-input"
                value={editingFieldData}
                onChange={(e) => setEditingFieldData(e.target.value)}
                className="w-full h-32 rounded-xl border border-slate-300 p-4 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          ) : typeof editingFieldData === 'object' && editingFieldData !== null ? (
            Object.keys(editingFieldData).map((objKey) => {
              const val = editingFieldData[objKey];
              if (typeof val === 'object' && val !== null) return null;
              
              const isLongText = String(val).length > 50;
              return (
                <div key={objKey}>
                  <label htmlFor={objKey} className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 font-mono">
                    ✏️ {objKey}
                  </label>
                  {isLongText ? (
                    <textarea
                      id={objKey}
                      value={String(val)}
                      onChange={(e) => setEditingFieldData((prev: any) => ({ ...prev, [objKey]: e.target.value }))}
                      className="w-full h-24 rounded-xl border border-slate-300 p-4 text-sm focus:border-blue-500 focus:outline-none font-sans"
                    />
                  ) : (
                    <input
                      id={objKey}
                      type="text"
                      value={String(val)}
                      onChange={(e) => setEditingFieldData((prev: any) => ({ ...prev, [objKey]: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              );
            })
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-3 font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="animate-spin" size={16} /> Saving Changes...
              </>
            ) : (
              <>
                <Save size={16} /> Save & Sync Database
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
