import React from 'react';
import { Quote, CheckCircle, ArrowUpRight, Star, Rocket } from 'lucide-react';
import { Testimonial } from '@quiz/marketing-site/lib/Testimonial';

interface TestimonialCardProps {
  testimonial: Testimonial;
}


const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  // ── Special "You Are Next" CTA card ──────────────────────────────────────
  if (testimonial.specialBg) {
    return (
      <div className={`group relative rounded-2xl ${testimonial.specialBg} p-8 h-full flex flex-col items-center justify-center text-center shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Icon */}
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-lg">
            <Rocket className="w-10 h-10 text-white" />
          </div>

          {/* Stars */}
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            ))}
          </div>

          {/* Content */}
          <p className="text-white/90 text-lg leading-relaxed italic font-medium">
            "Your career transformation is just one decision away. Join hundreds of students who are already living their dream tech careers."
          </p>

          {/* Highlight badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/20 border border-white/40 rounded-full">
            <CheckCircle className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm tracking-wide">Your Success Story Awaits</span>
          </div>

          {/* Name block */}
          <div className="pt-4 border-t border-white/30 w-full">
            <h3 className="text-white font-extrabold text-2xl">You Could Be Next! 🚀</h3>
            <p className="text-white/70 text-sm mt-1">Enroll today and start your journey</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Regular testimonial card ─────────────────────────────────────────────
  return (
    <div
      className="group relative"
    >
      {/* Card Container with fixed height structure */}
      <div className="relative bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 p-8 h-full flex flex-col shadow-2xl hover:shadow-2xl hover:-translate-y-2 overflow-hidden">

        {/* Top Section - Fixed */}
        <div className="flex-none">
          {/* Initial Badge */}
          <div className="relative z-10 mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white text-2xl font-bold">{testimonial.initial}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Quote aria-hidden="true" className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star aria-hidden="true" key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-500">{testimonial.rating}.0 Rating</span>
          </div>
        </div>

        {/* Middle Section - Grows to fill space */}
        <div className="flex-grow">
          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-700 text-lg leading-relaxed italic">
              "{testimonial.content}"
            </p>
          </div>

          {/* Highlight Badge */}
          {testimonial.highlight && (
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-orange-50 rounded-full border border-blue-100">
                <CheckCircle aria-hidden="true" className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  {testimonial.highlight}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section - Fixed at bottom */}
        <div className="flex-none pt-6 border-t border-gray-100 mt-auto">
          <div className="flex flex-col space-y-1">
            {/* Name always on first line */}
            <h3 className="font-bold text-gray-900 text-xl">
              {testimonial.name}
            </h3>

            {/* Role and company always on second line */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-600 font-medium">
                {testimonial.role}
              </span>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1 text-blue-600 font-semibold">
                <span>@{testimonial.company}</span>
                <ArrowUpRight aria-hidden="true" className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Border Effect */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-blue-300 to-orange-500 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Floating Background Shape */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-5 blur-xl transition-all duration-500 -z-10 group-hover:scale-105" />
    </div>
  );
};

export default TestimonialCard;