'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type StudentOption = {
  id: string;
  name: string;
  email: string;
};

interface PaymentRecordFormProps {
  students: StudentOption[];
}

export function PaymentRecordForm({ students }: PaymentRecordFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('Ready to record a payment.');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setStatus('Recording payment...');

    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        setStatus('Save failed. Please check the inputs.');
        return;
      }

      setStatus('Payment recorded.');
      router.refresh();
      event.currentTarget.reset();
    } catch {
      setStatus('Save failed. Please check the inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Student
          <select
            name="userId"
            defaultValue={students[0]?.id ?? ''}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} · {student.email}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Student name
          <input
            name="studentName"
            placeholder="Aarav Patel"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Installment label
          <input
            name="installmentId"
            placeholder="Admission fee"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Amount
          <input
            name="amount"
            type="number"
            min={0}
            placeholder="18000"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Due date
          <input
            name="dueDate"
            type="date"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Payment reference
          <input
            name="paymentRef"
            placeholder="PAY-2026-001"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
      </div>

      <div className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
        Record a live installment against a student. The payment will be persisted in the people database and appear in the list
        immediately after refresh.
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Recording...' : 'Record payment'}
        </button>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
