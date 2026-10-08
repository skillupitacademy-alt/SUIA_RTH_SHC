'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type PaymentDetail = {
  id: string;
  installmentId: string;
  amount: number;
  dueDate: string;
  paymentRef: string;
  status: 'paid' | 'due' | 'overdue';
};

interface PaymentEditFormProps {
  payment: PaymentDetail;
}

export function PaymentEditForm({ payment }: PaymentEditFormProps) {
  const [status, setStatus] = useState('Ready to save.');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus('Saving payment...');
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/admin/payments/${payment.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        setStatus('Save failed. Please try again.');
        return;
      }

      setStatus('Payment updated.');
    } catch {
      setStatus('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Installment label
          <input
            name="installmentId"
            defaultValue={payment.installmentId}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Amount
          <input
            name="amount"
            type="number"
            min={0}
            defaultValue={payment.amount}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Due date
          <input
            name="dueDate"
            type="date"
            defaultValue={payment.dueDate}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Payment reference
          <input
            name="paymentRef"
            defaultValue={payment.paymentRef}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Status
          <select
            name="status"
            defaultValue={payment.status}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            <option value="paid">paid</option>
            <option value="due">due</option>
            <option value="overdue">overdue</option>
          </select>
        </label>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save payment'}
        </button>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
