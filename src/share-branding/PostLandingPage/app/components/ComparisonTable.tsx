import { Check, X } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export function ComparisonTable() {
  const brand = useBrand();

  const features = [
    {
      feature: brand.accentColor === 'orange' ? 'AI-Powered Personal Tutor' : 'Live Mentor Support',
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false,
    },
    {
      feature: 'Adaptive Learning Path',
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false,
    },
    {
      feature: 'Smart Weakness Detection',
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false,
    },
    {
      feature: 'Progressive Assignment Difficulty',
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false,
    },
    {
      feature: 'Real-time Code Practice',
      rth: true,
      youtube: false,
      udemy: true,
      coursera: true,
    },
    {
      feature: 'Instant Doubt Resolution',
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false,
    },
    {
      feature: '6-Block Learning System',
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false,
    },
    {
      feature: 'Portfolio Projects',
      rth: true,
      youtube: false,
      udemy: true,
      coursera: true,
    },
    {
      feature: 'Exam & Tutorial Dual Engines',
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false,
    },
    {
      feature: 'Automated Remediation',
      rth: true,
      youtube: false,
      udemy: false,
      coursera: false,
    },
  ];

  return (
    <section className="w-full bg-white py-24">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-purple-500"></span>
            <span className="text-sm text-purple-700">Platform Comparison</span>
          </div>
          <h2
            className="mb-4 font-bold leading-tight text-gray-900 md:mb-6"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Why {brand.name} Stands Apart
          </h2>
          <p className="mx-auto max-w-3xl px-4 text-base text-gray-600 md:text-xl">
            See how our AI-powered, adaptive learning platform compares to traditional online learning solutions
          </p>
        </div>

        <div className="mx-auto w-full max-w-6xl min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          <div className="grid gap-4 p-4 md:hidden">
            {features.map((row, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="mb-3 text-sm font-bold text-gray-900">{row.feature}</div>
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                    <div className="mb-2 text-gray-500">{brand.name}</div>
                    <div className="flex justify-center">
                      {row.rth ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                          <Check className="h-5 w-5 text-white" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                          <X className="h-5 w-5 text-gray-700" strokeWidth={2} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                    <div className="mb-2 text-gray-500">Others</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-500">YT</span>
                        {row.youtube ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                            <Check className="h-4 w-4 text-white" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
                            <X className="h-4 w-4 text-gray-700" strokeWidth={2} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-500">UD</span>
                        {row.udemy ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                            <Check className="h-4 w-4 text-white" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
                            <X className="h-4 w-4 text-gray-700" strokeWidth={2} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-500">CR</span>
                        {row.coursera ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                            <Check className="h-4 w-4 text-white" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
                            <X className="h-4 w-4 text-gray-700" strokeWidth={2} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden w-full overflow-x-auto md:block" tabIndex={0} role="region" aria-label="Platform Comparison Table">
            <table className="min-w-[640px] w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-6 text-left text-lg font-bold text-gray-900">Features</th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${brand.gradientFrom} ${brand.gradientTo}`}
                      >
                        <span className="text-sm font-bold text-white">
                          {brand.accentColor === 'orange' ? 'RTH' : 'SU'}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">{brand.name}</span>
                    </div>
                  </th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                        <span className="text-xs font-bold text-red-800">YT</span>
                      </div>
                      <span className="font-bold text-gray-700">YouTube</span>
                    </div>
                  </th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                        <span className="text-xs font-bold text-purple-600">UD</span>
                      </div>
                      <span className="font-bold text-gray-700">Udemy</span>
                    </div>
                  </th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex min-w-0 flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                        <span className="text-xs font-bold text-blue-800">CR</span>
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
                    className={`border-t border-gray-100 transition-colors hover:bg-orange-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-6 py-5 font-medium text-gray-700">{row.feature}</td>
                    <td className="px-6 py-5 text-center">
                      {row.rth ? (
                        <div className="flex justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                            <Check className="h-5 w-5 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <X className="h-5 w-5 text-gray-700" strokeWidth={2} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {row.youtube ? (
                        <div className="flex justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                            <Check className="h-5 w-5 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <X className="h-5 w-5 text-gray-700" strokeWidth={2} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {row.udemy ? (
                        <div className="flex justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                            <Check className="h-5 w-5 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <X className="h-5 w-5 text-gray-700" strokeWidth={2} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {row.coursera ? (
                        <div className="flex justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                            <Check className="h-5 w-5 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <X className="h-5 w-5 text-gray-700" strokeWidth={2} />
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
          <button
            className={`rounded-xl bg-gradient-to-r px-6 py-4 font-semibold text-white shadow-2xl transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] sm:px-8 ${brand.gradientFrom} ${brand.gradientTo}`}
          >
            Start Your Journey Today
          </button>
        </div>
      </div>
    </section>
  );
}
