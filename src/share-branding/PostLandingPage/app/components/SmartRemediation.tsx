import { AlertCircle, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

export function SmartRemediation() {
  const weaknesses = [
    {
      topic: "Linked Lists Architecture",
      status: "failed",
      score: 45,
      badge: "FAILED EXAM",
      badgeColor: "bg-red-100 text-red-700",
      action: "Start Tutorial"
    },
    {
      topic: "Async Await Promises",
      status: "weak",
      score: 68,
      badge: "WEAK DIAGNOSTIC",
      badgeColor: "bg-amber-100 text-amber-800",
      action: "Review Concepts"
    },
    {
      topic: "Map & Filter Recursion",
      status: "mastered",
      score: 94,
      badge: "FULLY MASTERED",
      badgeColor: "bg-emerald-100 text-emerald-700",
      action: "Advanced Level"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="min-w-0 w-full overflow-hidden bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 mb-8 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 id="remediation-heading" className="text-2xl font-bold text-gray-900 min-w-0 break-words">Engine Synchronization</h2>
            </div>

            <div className="space-y-4 min-w-0">
              {weaknesses.map((item, idx) => (
                <div
                  key={idx}
                  className="min-w-0 w-full overflow-hidden bg-gray-50 rounded-xl p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2 break-words">{item.topic}</h3>
                      <div className="flex flex-wrap items-center gap-3 min-w-0">
                        <span className={`px-3 py-1 ${item.badgeColor} text-xs font-bold rounded-full max-w-full break-words`}>
                          {item.badge}
                        </span>
                        <span className="text-sm text-gray-600 break-words">Score: {item.score}%</span>
                      </div>
                    </div>

                    {item.status === 'failed' && (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    {item.status === 'weak' && (
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    )}
                    {item.status === 'mastered' && (
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'failed' ? 'bg-red-500' :
                        item.status === 'weak' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>

                  <button
                    aria-label={`${item.action} for ${item.topic}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 focus:underline outline-none min-w-0"
                  >
                    <span className="break-words">{item.action}</span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </button>
                </div>
              ))}
            </div>

            <button
              aria-label="Auto-deploy personalized tutorial sequence"
              className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-orange-700 to-orange-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="break-words">Auto-Deploy Tutorial Sequence</span>
              <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </button>
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs sm:text-sm text-blue-700">Intelligent Remediation</span>
            </div>

            <h2
              className="font-bold text-gray-900 mb-5"
              style={{ fontSize: 'clamp(2rem, 4.8vw, 3.6rem)', lineHeight: 1.08 }}
            >
              Smart Weakness Detection & Auto-Remediation
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 leading-relaxed">
              Our AI instantly analyzes your exam performance, identifies exactly where you struggled,
              and automatically generates a personalized tutorial path to fix those gaps.
            </p>

            <div className="space-y-4 min-w-0">
              <div className="flex gap-4 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 break-words">Instant Analysis</h3>
                  <p className="text-gray-600 break-words">Algorithms detect weak topics within seconds of completing an exam</p>
                </div>
              </div>

              <div className="flex gap-4 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 break-words">Prioritized Learning</h3>
                  <p className="text-gray-600 break-words">Critical gaps are addressed first, optimizing your study time</p>
                </div>
              </div>

              <div className="flex gap-4 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 break-words">Automated Tutorial Deployment</h3>
                  <p className="text-gray-600 break-words">One-click transfer to Tutorial Engine with targeted lessons</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
