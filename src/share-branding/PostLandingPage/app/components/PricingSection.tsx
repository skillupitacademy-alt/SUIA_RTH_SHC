import { Check, Star, Zap, Crown } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export function PricingSection() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';
  
  const plans = [
    {
      name: "Free",
      icon: Star,
      price: "$0",
      period: "forever",
      description: "Perfect for exploring the platform",
      features: [
        "Access to 3 tutorial modules",
        `Basic ${brand.tutorLabel} responses`,
        "2 exam attempts per month",
        "Community support",
        "Level 1.0 assignments only"
      ],
      gradient: "from-gray-500 to-gray-600",
      popular: false
    },
    {
      name: "Pro",
      icon: Zap,
      price: "$29",
      period: "per month",
      description: "For serious learners committed to mastery",
      features: [
        "Unlimited tutorial access",
        `Advanced ${brand.tutorLabel} with code debugging`,
        "Unlimited exam attempts",
        "All difficulty levels unlocked",
        "Real-world project templates",
        "Priority support",
        "Progress analytics dashboard",
        "Certificate of completion"
      ],
      gradient: `${brand.gradientFrom} ${brand.gradientTo}`,
      popular: true
    },
    {
      name: "Enterprise",
      icon: Crown,
      price: "Custom",
      period: "contact sales",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Custom learning paths",
        "Team performance analytics",
        "Dedicated account manager",
        "API access",
        "Custom integrations",
        "Advanced reporting",
        "SLA guarantee"
      ],
      gradient: "from-purple-500 to-purple-600",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${accentClass}-100 rounded-full mb-6`}>
            <Star className={`w-4 h-4 text-${accentClass}-600`} />
            <span className={`text-sm text-${accentClass}-700`}>Simple, Transparent Pricing</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
            Choose Your Plan
          </h2>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Start free and upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-4 md:px-0">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            return (
              <div 
                key={idx} 
                className={`relative bg-white rounded-3xl p-8 border-2 ${
                  plan.popular 
                    ? `border-${accentClass}-400 shadow-[0_30px_60px_rgba(0,0,0,0.2)] scale-105 hover:scale-[1.08]` 
                    : 'border-gray-200 shadow-2xl scale-[1.02] hover:scale-105'
                } hover:-translate-y-1 transition-all duration-300`}
              >
                {plan.popular && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientFrom} text-white text-sm font-bold rounded-full`}>
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className={`text-4xl md:text-5xl font-bold bg-gradient-to-br ${plan.gradient} bg-clip-text text-transparent`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-500 text-sm">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={`w-full py-4 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? `bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientFrom} text-white hover:shadow-lg hover:scale-105`
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            All plans include a <span className="font-semibold text-gray-900">14-day money-back guarantee</span>
          </p>
        </div>
      </div>
    </section>
  );
}