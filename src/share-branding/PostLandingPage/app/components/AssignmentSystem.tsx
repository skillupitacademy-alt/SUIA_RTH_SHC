import { Lock, Unlock, Trophy, Star } from 'lucide-react';

export function AssignmentSystem() {
  const levels = [
    {
      level: "1.0",
      title: "Foundation",
      description: "Basic concepts and syntax",
      status: "completed",
      icon: Star,
      color: "from-green-400 to-green-500",
      borderColor: "border-green-300"
    },
    {
      level: "2.0",
      title: "Intermediate",
      description: "Advanced patterns and techniques",
      status: "current",
      icon: Unlock,
      color: "from-blue-400 to-blue-500",
      borderColor: "border-blue-300"
    },
    {
      level: "3.0",
      title: "Advanced",
      description: "Complex architectures and optimization",
      status: "locked",
      icon: Lock,
      color: "from-purple-400 to-purple-500",
      borderColor: "border-gray-300"
    },
    {
      level: "4.0",
      title: "Expert",
      description: "Production-grade systems and scalability",
      status: "locked",
      icon: Lock,
      color: "from-orange-400 to-orange-500",
      borderColor: "border-gray-300"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
            <Trophy className="w-4 h-4 text-blue-700" />
            <span className="text-sm text-blue-700">Progressive Difficulty System</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Adaptive Assignment Progression
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock higher difficulty levels by mastering foundational concepts. 
            Each level adapts to your performance and ensures you're truly ready.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Level Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {levels.map((level, idx) => {
              const Icon = level.icon;
              const isLocked = level.status === 'locked';
              const isCurrent = level.status === 'current';
              const isCompleted = level.status === 'completed';

              return (
                <div 
                  key={idx} 
                  className={`relative bg-white rounded-2xl p-8 border-2 ${level.borderColor} shadow-2xl scale-[1.02] hover:scale-105 hover:-translate-y-1 transition-all duration-300`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 -right-3 px-4 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-full">
                      In Progress
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${level.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className={`text-3xl font-bold bg-gradient-to-br ${level.color} bg-clip-text text-transparent`}>
                          {level.level}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">{level.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-4">{level.description}</p>
                      
                      {isCompleted && (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <div className="w-full bg-green-100 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full w-full"></div>
                          </div>
                          <span className="font-semibold">100%</span>
                        </div>
                      )}
                      
                      {isCurrent && (
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <div className="w-full bg-blue-100 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full w-3/5"></div>
                          </div>
                          <span className="font-semibold">60%</span>
                        </div>
                      )}
                      
                      {isLocked && (
                        <p className="text-sm text-gray-500 italic">
                          Complete previous level to unlock
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  How It Works
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Start with foundational assignments and prove your mastery through rigorous testing. 
                  Once you consistently score 85% or higher, the next difficulty level unlocks. 
                  This ensures you build a solid knowledge base before tackling advanced topics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
