import { Target, TrendingUp, MessageSquare, Shield, FileEdit, ClipboardCheck } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export function AdaptiveLoop() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';
  
  const steps = [
    {
      icon: Target,
      title: "1. DIAGNOSTICS",
      subtitle: "Analyze knowledge gaps",
      description: "Take rigorous timed assessments to map your exact bounds in the Exam Engine",
      color: `bg-${accentClass}-50 border-${accentClass}-200`,
      iconBg: `bg-${accentClass}-500`
    },
    {
      icon: TrendingUp,
      title: "2. ANALYSIS",
      subtitle: "Identify strengths & weaknesses",
      description: "Internal algorithms instantly compute and isolate the specific topics you failed",
      color: "bg-green-50 border-green-200",
      iconBg: "bg-green-500"
    },
    {
      icon: MessageSquare,
      title: "3. TUTORIAL",
      subtitle: "Personalized AI guidance",
      description: "Transition natively into the Tutorial Engine focused explicitly on those weak topics",
      color: "bg-purple-50 border-purple-200",
      iconBg: "bg-purple-500"
    },
    {
      icon: Shield,
      title: "4. MASTERY",
      subtitle: "Achieve learning goals",
      description: "Validate your newly fortified knowledge against fresh, dynamically generated tests",
      color: "bg-blue-50 border-blue-200",
      iconBg: "bg-blue-600"
    }
  ];

  const engineCards = [
    {
      title: "ENTER EXAM ENGINE",
      subtitle: "STRICT TESTING",
      description: "Evaluate Knowledge & Performance",
      gradient: "from-orange-500 to-orange-600",
      icon: ClipboardCheck
    },
    {
      title: "ENTER TUTORIAL ENGINE",
      subtitle: "GUIDED LEARNING",
      description: "Guided by AI Tutor Personalized Path",
      gradient: "from-blue-900 to-blue-800",
      icon: FileEdit
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            THE ADAPTIVE LOOP
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A continuous cycle of assessment, learning, and mastery powered by AI
          </p>
        </div>

        {/* 4-Step Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className={`${step.color} rounded-2xl p-6 border-2 shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-default`}>
                <div className={`w-16 h-16 ${step.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{step.subtitle}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>

        {/* Engine Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {engineCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx} 
                className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-8 text-white shadow-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                    <p className="text-sm opacity-90 mb-2">{card.subtitle}</p>
                    <p className="text-sm opacity-80">{card.description}</p>
                  </div>
                  <button className="mt-4 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 group-hover:gap-3">
                    ENTER NOW
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}