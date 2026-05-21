// components/footer/FooterBrand.tsx
'use client';

import React, { useState } from 'react';
import { FOOTER_CONFIG } from '@quiz/marketing-site/lib/FooterData';
import { useBrand } from '@quiz/marketing-site/brand';

const FooterBrand: React.FC = () => {
  const [email, setEmail] = useState('');
  const brand = useBrand();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing with ${email}!`);
      setEmail('');
    }
  };

  return (
    <div className="lg:col-span-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-gray-900">
          {brand.name}
        </h2>
        <p className="text-gray-600">
          Join <span className="font-bold" style={{ color: "var(--brand-primary)" }}>{FOOTER_CONFIG.brand.studentCount}</span> students who have successfully launched their tech careers with our expert-led programs and placement support.
        </p>
      </div>

      {/* Newsletter */}
      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <h3 className="text-lg font-bold mb-2 text-gray-900">Stay Updated</h3>
        <p className="text-gray-600 mb-3">Get course updates & career tips</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="newsletter-email" className="block text-sm text-gray-600 mb-1">Enter your email</label>
            <div className="flex gap-2 flex-col md:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded focus:ring-1"
                required
              />
              <button
                type="submit"
                className="text-white font-medium px-4 py-2 rounded flex items-center transition-colors"
                style={{ backgroundColor: "var(--brand-secondary)" }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Subscribe
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>
      </div>
    </div>
  );
};

export default FooterBrand;
