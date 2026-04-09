import { BookOpen, Lightbulb, Code, Brain, CheckCircle, Award } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export function SolutionSection() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';

  const blocks = [
    {
      icon: BookOpen,
      title: "Layman Explanation",
      description: "Complex topics broken down into simple, everyday language anyone can understand",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: Lightbulb,
      title: "Real-life Example",
      description: "Practical scenarios that connect abstract concepts to real-world applications",
      gradient: `from-yellow-500 to-${accentClass}-500`
    },
    {
      icon: Brain,
      title: "Technical Concept",
      description: "Deep dive into the theory, architecture, and fundamental principles",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: Code,
      title: "Code Practice",
      description: "Hands-on coding exercises in live editors with instant feedback",
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: CheckCircle,
      title: brand.tutorLabel,
      description: "Personalized guidance and instant answers to your specific questions",
      gradient: brand.accentColor === 'orange' ? "from-pink-500 to-pink-600" : "from-rose-500 to-rose-600"
    },
    {
      icon: Award,
      title: "Assignment",
      description: "Progressive challenges that adapt to your skill level and mastery",
      gradient: "from-red-500 to-red-600"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${accentClass}-100 rounded-full mb-6`}>
            <span className={`w-2 h-2 bg-${accentClass}-500 rounded-full`}></span>
            <span className={`text-sm text-${accentClass}-700`}>Our Solution</span>
          </div>
          <h2
            className="font-bold text-gray-900 mb-4 md:mb-6 leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            The 6-Block Learning System
          </h2>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Every topic is taught through a comprehensive, structured approach designed for deep understanding and lasting retention
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-4 md:px-0">
          {blocks.map((block, idx) => {
            const Icon = block.icon;
            return (
              <div
                key={idx}
                className={`group relative min-w-0 w-full overflow-hidden bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-[0_15px_30px_rgba(0,0,0,0.1)] hover:border-${accentClass}-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="absolute top-4 right-4 text-3xl font-bold text-gray-100 pointer-events-none">
                  {idx + 1}
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${block.gradient} rounded-xl flex items-center justify-center mb-4 flex-shrink-0`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 min-w-0 break-words">
                  {block.title}
                </h3>
                <p className="text-gray-600 leading-relaxed min-w-0 break-words">
                  {block.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}