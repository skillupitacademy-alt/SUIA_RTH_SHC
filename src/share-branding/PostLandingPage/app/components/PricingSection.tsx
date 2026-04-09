import { Check, Star, Zap, Crown } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export function PricingSection() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';

  const plans = [
    {
      name: 'Free',
      icon: Star,
      price: '$0',
      period: 'forever',
      description: 'Perfect for exploring the platform',
      features: [
        'Access to 3 tutorial modules',
        `Basic ${brand.tutorLabel} responses`,
        '2 exam attempts per month',
        'Community support',
        'Level 1.0 assignments only',
      ],
      gradient: 'from-gray-500 to-gray-600',
      popular: false,
    },
    {
      name: 'Pro',
      icon: Zap,
      price: '$29',
      period: 'per month',
      description: 'For serious learners committed to mastery',
      features: [
        'Unlimited tutorial access',
        `Advanced ${brand.tutorLabel} with code debugging`,
        'Unlimited exam attempts',
        'All difficulty levels unlocked',
        'Real-world project templates',
        'Priority support',
        'Progress analytics dashboard',
        'Certificate of completion',
      ],
      gradient: `${brand.gradientFrom} ${brand.gradientTo}`,
      popular: true,
    },
    {
      name: 'Enterprise',
      icon: Crown,
      price: 'Custom',
      period: 'contact sales',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Custom learning paths',
        'Team performance analytics',
        'Dedicated account manager',
        'API access',
        'Custom integrations',
        'Advanced reporting',
        'SLA guarantee',
      ],
      gradient: 'from-purple-500 to-purple-600',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="w-full bg-gradient-to-br from-gray-50 to-white py-24">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="mb-16 text-center">
          <div className={`mb-6 inline-flex items-center gap-2 rounded-full bg-${accentClass}-100 px-4 py-2`}>
            <Star className={`h-4 w-4 text-${accentClass}-600`} />
            <span className={`text-sm text-${accentClass}-700`}>Simple, Transparent Pricing</span>
          </div>
          <h2
            className="mb-4 font-bold leading-tight text-gray-900 md:mb-6"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Choose Your Plan
          </h2>
          <p className="mx-auto max-w-3xl px-4 text-base text-gray-600 md:text-xl">
            Start free and upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-6xl min-w-0 grid-cols-1 gap-10 px-4 pt-6 sm:grid-cols-2 sm:gap-8 md:px-0 lg:grid-cols-3">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;

            return (
              <div
                key={idx}
                className={`relative flex min-w-0 w-full flex-col overflow-hidden rounded-3xl border-2 bg-white p-8 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] ${
                  plan.popular
                    ? `border-${accentClass}-400 shadow-[0_30px_60px_rgba(0,0,0,0.2)]`
                    : 'border-gray-200 shadow-2xl'
                }`}
              >
                {plan.popular && (
                  <div
                    className="mx-auto mb-6 inline-flex rounded-full px-6 py-2 text-sm font-bold text-white"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6 text-center">
                  <div
                    className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.gradient}`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mb-4 text-sm text-gray-600">{plan.description}</p>
                  <div className="flex min-w-0 flex-col items-center justify-center gap-1">
                    <span
                      className={`bg-gradient-to-br ${plan.gradient} bg-clip-text font-bold text-transparent`}
                      style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
                    >
                      {plan.price}
                    </span>
                    <span className="max-w-full text-center text-sm text-gray-500 break-words">/{plan.period}</span>
                  </div>
                </div>

                <ul className="mb-8 flex min-w-0 flex-1 flex-col space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-3 w-3 text-green-600" strokeWidth={3} />
                      </div>
                      <span className="min-w-0 text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full rounded-xl py-4 font-semibold transition-transform duration-300 hover:scale-[1.02] ${
                    plan.popular ? 'text-white hover:shadow-lg' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                  style={plan.popular ? { backgroundColor: brand.primaryColor } : undefined}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
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
