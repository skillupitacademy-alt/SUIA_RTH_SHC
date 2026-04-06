import { X, AlertCircle } from 'lucide-react';

export function ProblemStatement() {
  const problems = [
    {
      platform: "YouTube",
      issues: [
        "No structured progression",
        "Cannot validate understanding",
        "No personalized guidance"
      ]
    },
    {
      platform: "Udemy",
      issues: [
        "Passive video consumption",
        "Generic assessments",
        "No adaptive learning path"
      ]
    },
    {
      platform: "Coursera",
      issues: [
        "Rigid course structure",
        "Limited hands-on practice",
        "No real-time AI assistance"
      ]
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-4 h-4 text-red-700" />
            <span className="text-sm text-red-700">The Problem with Traditional Platforms</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
            One-Size-Fits-All Learning Doesn't Work
          </h2>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Traditional platforms treat every learner the same, ignoring individual knowledge gaps and learning pace
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {problems.map((problem, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-2xl scale-[1.01] hover:border-red-300 hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-red-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{problem.platform}</h3>
              </div>
              <ul className="space-y-3">
                {problem.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
