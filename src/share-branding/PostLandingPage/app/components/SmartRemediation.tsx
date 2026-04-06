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
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Sync Widget */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl scale-[1.01] border border-gray-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Engine Synchronization</h2>
            </div>

            <div className="space-y-4">
              {weaknesses.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-gray-50 rounded-xl p-5 shadow-lg scale-[1.01] hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{item.topic}</h3>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 ${item.badgeColor} text-xs font-bold rounded-full`}>
                          {item.badge}
                        </span>
                        <span className="text-sm text-gray-600">Score: {item.score}%</span>
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

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full ${
                        item.status === 'failed' ? 'bg-red-500' :
                        item.status === 'weak' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>

                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    {item.action}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
              Auto-Deploy Tutorial Sequence
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">Intelligent Remediation</span>
            </div>
            
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Smart Weakness Detection & Auto-Remediation
            </h2>
            
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              Our AI instantly analyzes your exam performance, identifies exactly where you struggled, 
              and automatically generates a personalized tutorial path to fix those gaps.
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Instant Analysis</h3>
                  <p className="text-gray-600">Algorithms detect weak topics within seconds of completing an exam</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Prioritized Learning</h3>
                  <p className="text-gray-600">Critical gaps are addressed first, optimizing your study time</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Automated Tutorial Deployment</h3>
                  <p className="text-gray-600">One-click transfer to Tutorial Engine with targeted lessons</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
