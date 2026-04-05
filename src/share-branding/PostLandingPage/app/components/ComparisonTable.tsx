import { Check, X } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export function ComparisonTable() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';
  
  const features = [
    {
      feature: brand.accentColor === 'orange' ? "AI-Powered Personal Tutor" : "Live Mentor Support",
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false
    },
    {
      feature: "Adaptive Learning Path",
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false
    },
    {
      feature: "Smart Weakness Detection",
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false
    },
    {
      feature: "Progressive Assignment Difficulty",
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false
    },
    {
      feature: "Real-time Code Practice",
      rth: true,
      youtube: false,
      udemy: true,
      coursera: true
    },
    {
      feature: "Instant Doubt Resolution",
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false
    },
    {
      feature: "6-Block Learning System",
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false
    },
    {
      feature: "Portfolio Projects",
      rth: true,
      youtube: false,
      udemy: true,
      coursera: true
    },
    {
      feature: "Exam & Tutorial Dual Engines",
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false
    },
    {
      feature: "Automated Remediation",
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span className="text-sm text-purple-800">Platform Comparison</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Why {brand.name} Stands Apart
          </h2>
          <p className="text-xl text-gray-800 max-w-3xl mx-auto">
            See how our AI-powered, adaptive learning platform compares to traditional online learning solutions
          </p>
        </div>

        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="text-left py-6 px-6 font-bold text-gray-900 text-lg">
                    Features
                  </th>
                  <th className="py-6 px-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 bg-gradient-to-br ${brand.gradientFrom} ${brand.gradientTo} rounded-xl flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">{brand.accentColor === 'orange' ? 'RTH' : 'SU'}</span>
                      </div>
                      <span className="font-bold text-gray-900">{brand.name}</span>
                    </div>
                  </th>
                  <th className="py-6 px-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <span className="text-red-700 font-bold text-xs">YT</span>
                      </div>
                      <span className="font-bold text-gray-700">YouTube</span>
                    </div>
                  </th>
                  <th className="py-6 px-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-purple-700 font-bold text-xs">UD</span>
                      </div>
                      <span className="font-bold text-gray-700">Udemy</span>
                    </div>
                  </th>
                  <th className="py-6 px-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-xs">CR</span>
                      </div>
                      <span className="font-bold text-gray-700">Coursera</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-orange-50/30 transition-colors`}
                  >
                    <td className="py-5 px-6 text-gray-700 font-medium">
                      {row.feature}
                    </td>
                    <td className="py-5 px-6 text-center">
                      {row.rth ? (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <X className="w-5 h-5 text-gray-800" strokeWidth={2} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6 text-center">
                      {row.youtube ? (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <X className="w-5 h-5 text-gray-800" strokeWidth={2} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6 text-center">
                      {row.udemy ? (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <X className="w-5 h-5 text-gray-800" strokeWidth={2} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6 text-center">
                      {row.coursera ? (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <X className="w-5 h-5 text-gray-800" strokeWidth={2} />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all">
            Start Your Journey Today
          </button>
        </div>
      </div>
    </section>
  );
}