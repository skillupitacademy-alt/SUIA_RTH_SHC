import { MessageCircle, Zap, Clock, Brain, CheckCircle } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export function AITutorSection() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';
  
  const features = [
    {
      icon: MessageCircle,
      title: "24/7 Instant Answers",
      description: "Get immediate responses to your questions, no waiting for office hours"
    },
    {
      icon: Brain,
      title: "Context-Aware Guidance",
      description: "AI understands your learning history and adapts explanations to your level"
    },
    {
      icon: Zap,
      title: "Multi-Modal Explanations",
      description: "Receive answers through text, code examples, diagrams, and step-by-step breakdowns"
    },
    {
      icon: Clock,
      title: "Unlimited Interactions",
      description: "Ask as many questions as you need - there's no limit to your learning"
    }
  ];

  return (
    <section id="mentorship" className={`py-24 bg-gradient-to-br from-purple-50 via-${accentClass}-50 to-${accentClass}-50`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center px-4 md:px-0">
          {/* Left: Content */}
          <div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6`}>
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700">
                {brand.accentColor === 'orange' ? 'AI-Powered Learning' : 'Live Mentor Support'}
              </span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Your Personal {brand.tutorLabel}
            </h2>
            
            <p className="text-base md:text-xl text-gray-600 mb-8 leading-relaxed">
              Unlike traditional platforms where you're stuck when confused, our {brand.tutorLabel} provides instant, 
              personalized guidance exactly when you need it.
            </p>

            <div className="space-y-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Interactive Demo Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-xl hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 cursor-default">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">You</span>
                </div>
                <div className="bg-blue-50 rounded-2xl rounded-tl-none p-4 flex-1">
                  <p className="text-gray-700">I don't understand how async/await works in JavaScript. Can you explain?</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl rounded-tl-none p-4 flex-1">
                  <p className="text-gray-700 mb-3">
                    Great question! Let me break this down into simple terms:
                  </p>
                  <p className="text-gray-700 mb-3">
                    <strong>Layman explanation:</strong> Think of async/await like ordering food at a restaurant. 
                    You place your order (async) and wait for it (await), but you can still talk to friends while waiting.
                  </p>
                  <div className="bg-white rounded-lg p-3 font-mono text-sm text-gray-800 mt-3">
                    <code>
                      async function fetchData() {'{\n'}
                      {'  '}const data = await fetch(url);<br/>
                      {'  '}return data;<br/>
                      {'}'}
                    </code>
                  </div>
                  <p className="text-gray-700 mt-3">
                    Would you like me to show you a real-world example?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 pt-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Response generated in 0.8s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}