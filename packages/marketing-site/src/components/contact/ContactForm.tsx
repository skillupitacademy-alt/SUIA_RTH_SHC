

import React from 'react';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ContactFormProps {
  formData?: ContactFormData; // Make optional
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ 
  formData = { name: '', email: '', phone: '', message: '' }, // Default value
  onSubmit, 
  onChange 
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm lg:h-[520px]" style={{boxShadow: "2px 2px 20px 0.6px #00000025"}}>
      <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--brand-primary)" }}>Send Message</h2>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ''} // Safeguard
            onChange={onChange}
            required
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 transition-colors"
            placeholder="Your name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''} // Safeguard
              onChange={onChange}
              required
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''} // Safeguard
              onChange={onChange}
              required
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 transition-colors"
              placeholder="9997508801"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            name="message"
            value={formData.message || ''} // Safeguard
            onChange={onChange}
            required
            rows={4}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 transition-colors resize-none"
            placeholder="Tell us about your learning goals..."
          />
        </div>

        <button
          type="submit"
          className="w-full text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
