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
      color: "from-orange-700 to-orange-800",
      borderColor: "border-gray-300"
    }
  ];

  return (
    <section id="paths" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
            <Trophy className="w-4 h-4 text-blue-700" />
            <span className="text-xs sm:text-sm text-blue-700">Progressive Difficulty System</span>
          </div>
          <h2
            className="font-bold text-gray-900 mb-5"
            style={{ fontSize: 'clamp(2rem, 4.8vw, 3.6rem)', lineHeight: 1.08 }}
          >
            Adaptive Assignment Progression
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Unlock higher difficulty levels by mastering foundational concepts.
            Each level adapts to your performance and ensures you're truly ready.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {levels.map((level, idx) => {
              const Icon = level.icon;
              const isLocked = level.status === 'locked';
              const isCurrent = level.status === 'current';
              const isCompleted = level.status === 'completed';

              return (
                <div
                  key={idx}
                  className={`min-w-0 w-full overflow-hidden rounded-2xl border-2 bg-white p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 ${level.borderColor}`}
                >
                  <div className="mb-4 flex min-w-0 justify-end">
                    {isCurrent && (
                      <div className="max-w-full rounded-full bg-gradient-to-r from-orange-700 to-orange-800 px-3 py-1 text-xs font-semibold text-white shadow-lg sm:px-4 sm:text-sm">
                        In Progress
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 items-start gap-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${level.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 mb-2 min-w-0 flex-wrap">
                        <span className={`text-3xl font-bold bg-gradient-to-br ${level.color} bg-clip-text text-transparent shrink-0`}>
                          {level.level}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 min-w-0 break-words">{level.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-4 break-words">{level.description}</p>

                      {isCompleted && (
                        <div className="flex items-center gap-2 text-sm text-green-700 min-w-0">
                          <div className="w-full bg-green-100 rounded-full h-2 min-w-0">
                            <div className="bg-green-600 h-2 rounded-full w-full"></div>
                          </div>
                          <span className="font-semibold flex-shrink-0">100%</span>
                        </div>
                      )}

                      {isCurrent && (
                        <div className="flex items-center gap-2 text-sm text-blue-700 min-w-0">
                          <div className="w-full bg-blue-100 rounded-full h-2 min-w-0">
                            <div className="bg-blue-600 h-2 rounded-full w-3/5"></div>
                          </div>
                          <span className="font-semibold flex-shrink-0">60%</span>
                        </div>
                      )}

                      {isLocked && (
                        <p className="text-sm text-gray-500 italic break-words">
                          Complete previous level to unlock
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="min-w-0 w-full overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 bg-orange-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-2 break-words">
                  How It Works
                </h3>
                <p className="text-gray-700 leading-relaxed break-words">
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
