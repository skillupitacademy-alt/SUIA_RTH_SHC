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
      iconBg: `bg-${accentClass}-700 shadow-md`
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
      gradient: "from-orange-700 to-orange-800",
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
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white py-24">
      <div className="pointer-events-none absolute right-0 top-20 h-32 w-32 max-w-full rounded-full bg-orange-200 opacity-20 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-20 left-0 h-40 w-40 max-w-full rounded-full bg-blue-200 opacity-20 blur-3xl"></div>

      <div className="relative mx-auto w-full max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2
            className="font-bold text-gray-900 mb-5"
            style={{ fontSize: 'clamp(2rem, 4.8vw, 3.6rem)', lineHeight: 1.08 }}
          >
            THE ADAPTIVE LOOP
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A continuous cycle of assessment, learning, and mastery powered by AI
          </p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className={`${step.color} min-w-0 w-full overflow-hidden rounded-2xl p-6 border-2 shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default`}
              >
                <div className={`w-16 h-16 ${step.iconBg} rounded-xl flex items-center justify-center mb-4 flex-shrink-0`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 break-words">{step.title}</h3>
                <p className="text-sm text-gray-600 mb-3 break-words">{step.subtitle}</p>
                <p className="text-sm text-gray-600 leading-relaxed break-words">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {engineCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`group min-w-0 w-full overflow-hidden rounded-2xl bg-gradient-to-br p-8 text-white shadow-2xl transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] ${card.gradient}`}
              >
                <div className="flex flex-col items-center text-center space-y-4 min-w-0">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold mb-2 break-words">{card.title}</h3>
                    <p className="text-sm opacity-90 mb-2 break-words">{card.subtitle}</p>
                    <p className="text-sm opacity-80 break-words">{card.description}</p>
                  </div>
                  <button
                    aria-label={`Enter ${card.title.toLowerCase()}`}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-gray-900 transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg group-hover:gap-3"
                  >
                    ENTER NOW
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
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
