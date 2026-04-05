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
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            The 6-Block Learning System
          </h2>
          <p className="text-xl text-gray-800 max-w-3xl mx-auto">
            Every topic is taught through a comprehensive, structured approach designed for deep understanding and lasting retention
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blocks.map((block, idx) => {
            const Icon = block.icon;
            return (
              <div 
                key={idx} 
                className={`group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-${accentClass}-300 hover:shadow-xl transition-all`}
              >
                <div className="absolute top-4 right-4 text-3xl font-bold text-gray-100">
                  {idx + 1}
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${block.gradient} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {block.title}
                </h3>
                <p className="text-gray-800 leading-relaxed">
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