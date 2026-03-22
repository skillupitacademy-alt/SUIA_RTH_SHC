'use client';

import { useMemo, useState, type FormEvent } from 'react';

type TotpActionModalProps = {
  triggerLabel: string;
  title: string;
  description: string;
  endpoint: string;
  method?: 'PATCH' | 'POST';
  body: Record<string, unknown>;
  danger?: boolean;
  onSuccess?: () => void;
};

export function TotpActionModal({
  triggerLabel,
  title,
  description,
  endpoint,
  method = 'PATCH',
  body,
  danger = false,
  onSuccess,
}: TotpActionModalProps) {
  const [open, setOpen] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payload = useMemo(() => body, [body]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-totp-code': totpCode.trim(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok === false) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'Request failed');
      }

      setOpen(false);
      setTotpCode('');
      onSuccess?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Request failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full px-4 py-2 text-sm font-bold transition ${
          danger
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : 'border border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
        }`}
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_120px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-600">TOTP re-auth</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-700">
                TOTP code
                <input
                  value={totpCode}
                  onChange={(event) => setTotpCode(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </label>

              {error !== null ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className={`rounded-full px-5 py-3 text-sm font-bold text-white transition ${
                    danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-cyan-500 hover:bg-cyan-600'
                  }`}
                >
                  {pending ? 'Verifying...' : 'Verify and continue'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
