import { Zap, Shield, BarChart } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Adaptive Difficulty',
    description:
      'Balanced questions (30% Simple, 30% Intermediate, 40% Expert) to push your limits.',
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  {
    icon: Shield,
    title: 'Verified Domains',
    description:
      'Curated assessments for Full Stack, Cyber Security, Data Science and more.',
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  {
    icon: BarChart,
    title: 'Detailed Reports',
    description:
      'Deep dive into your strengths and weaknesses with our reporting engine.',
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
];

export function Features() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-200">
      <div className="grid md:grid-cols-3 gap-12">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="text-center">
              <div className={`${feature.bgColor} w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`w-7 h-7 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
