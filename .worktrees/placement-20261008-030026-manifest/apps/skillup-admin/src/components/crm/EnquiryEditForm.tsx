'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type EnquiryDetail = {
  id: string;
  studentName: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  notes: string[];
};

interface EnquiryEditFormProps {
  enquiry: EnquiryDetail;
}

export function EnquiryEditForm({ enquiry }: EnquiryEditFormProps) {
  const [statusMessage, setStatusMessage] = useState('Ready to save.');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setStatusMessage('Saving enquiry...');

    try {
      const response = await fetch(`/api/admin/crm/enquiries/${enquiry.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        setStatusMessage('Save failed. Please try again.');
        return;
      }

      setStatusMessage('Enquiry updated.');
      window.location.reload();
    } catch {
      setStatusMessage('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Full name
          <input
            name="studentName"
            defaultValue={enquiry.studentName}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Email address
          <input
            name="email"
            type="email"
            defaultValue={enquiry.email}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Phone number
          <input
            name="phone"
            defaultValue={enquiry.phone}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Status
          <select
            name="status"
            defaultValue={enquiry.status}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            <option value="new">new</option>
            <option value="contacted">contacted</option>
            <option value="qualified">qualified</option>
            <option value="lost">lost</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Notes
        <textarea
          name="notes"
          rows={5}
          defaultValue={enquiry.notes.join('\n')}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
        />
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save enquiry'}
        </button>
        <p className="text-sm text-slate-600">{statusMessage}</p>
      </div>
    </form>
  );
}
