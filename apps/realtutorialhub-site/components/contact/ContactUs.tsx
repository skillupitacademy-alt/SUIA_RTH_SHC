
'use client';

import React, { useState } from 'react';
import ContactInfo from './ContactInfo';
import ContactForm from './ContactForm';
import LocationCard from './LocationCard';
import { CONTACT_CONFIG, LOCATION_INFO } from '@/lib/ContactData';
import { SectionHeader } from '../CommonHeader/SectionHeader';

// Define ContactFormData locally if import fails
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const ContactUs: React.FC = () => {
  // Initialize with default values
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);

    // Validate form data
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/${CONTACT_CONFIG.phoneNumber}?text=${encodeURIComponent(CONTACT_CONFIG.defaultMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = () => {
    window.location.href = `tel:${CONTACT_CONFIG.phoneNumber}`;
  };

  const handleMapClick = () => {
    window.open(LOCATION_INFO.mapUrl, '_blank');
  };

  return (
    <section id='contact' className="py-16 md:py-20">
      <div className="mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title={CONTACT_CONFIG.title} description={CONTACT_CONFIG.description} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column - Contact Information */}
          <ContactInfo
            onCallClick={handleCallClick}
            onWhatsAppClick={handleWhatsAppClick}
            onMapClick={handleMapClick}
          />

          {/* Right Column - Contact Form */}
          <div>
            <ContactForm
              formData={formData}
              onSubmit={handleSubmit}
              onChange={handleChange}
            />
            <LocationCard onMapClick={handleMapClick} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;