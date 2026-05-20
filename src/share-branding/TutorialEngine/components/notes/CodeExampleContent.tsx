import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

export function CodeExampleContent({ data }: { data?: SubtopicNotesViewData['mainContent']['codeExample'] }) {
  const brand = useBrand();
  
  if (!data) return null;

  return (
    <div className="min-w-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:space-y-12">

      {/* 1. Problem Context */}
      {data.problemContext && (
        <section aria-label="Problem context and requirements" className="rounded-[32px] bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-xl border border-blue-100 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <Icons.Target size={24} className="text-blue-600" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-950">{data.problemContext.title}</h2>
          </div>
          <p className="text-[15px] font-medium text-slate-800 leading-relaxed mb-6">{data.problemContext.scenario}</p>
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Requirements:</h3>
            <ul className="space-y-3">
              {data.problemContext.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Icons.CheckCircle size={18} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-[14px] font-medium text-slate-800">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {data.problemContext.constraints && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-[13px] font-medium text-amber-900">
                <strong>Constraints:</strong> {data.problemContext.constraints}
              </p>
            </div>
          )}
        </section>
      )}

      {/* 2. Basic Code Example */}
      {data.basicCodeExample && (
        <section aria-label="Basic code example" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>1</div>
            <h2 className="text-xl font-bold text-slate-950">{data.basicCodeExample.title}</h2>
          </div>
          <p className="text-[14px] font-medium text-slate-800">{data.basicCodeExample.description}</p>

          <div className="rounded-[24px] overflow-hidden bg-[#0f172a] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{data.basicCodeExample.language}</span>
              <button className="flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-white transition-colors">
                <Icons.Copy size={14} aria-hidden="true" />
                Copy
              </button>
            </div>
            <div className="p-6 overflow-auto">
              <pre className="text-[13px] leading-relaxed text-indigo-100 font-mono whitespace-pre-wrap break-words">{data.basicCodeExample.code}</pre>
            </div>
          </div>

          <p className="text-[14px] font-medium text-slate-700 leading-relaxed">{data.basicCodeExample.explanation}</p>
        </section>
      )}

      {/* 3. Line-by-Line Explanation */}
      {data.lineByLineExplanation && data.lineByLineExplanation.lines.length > 0 && (
        <section aria-label="Line-by-line code explanation" className="rounded-[32px] bg-white p-5 shadow-xl sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>2</div>
            <h2 className="text-xl font-bold text-slate-950">{data.lineByLineExplanation.title}</h2>
          </div>

          <div className="space-y-6">
            {data.lineByLineExplanation.lines.map((line) => (
              <div key={line.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-900">
                  {line.lineNumber}
                </div>
                <div className="space-y-2 min-w-0">
                  <code className="block text-[13px] font-mono text-slate-900 bg-slate-100 px-3 py-2 rounded border border-slate-200 break-words">{line.code}</code>
                  <p className="text-[13px] font-medium text-slate-700">{line.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Output Demonstration */}
      {data.outputDemonstration && (
        <section aria-label="Output demonstration" className="rounded-[32px] bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-xl border border-emerald-100 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>3</div>
            <h2 className="text-xl font-bold text-slate-950">{data.outputDemonstration.title}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-widest">Input:</h3>
              <div className="p-4 rounded-xl bg-white border border-emerald-200">
                <code className="text-[13px] font-mono text-slate-800 break-words">{data.outputDemonstration.input}</code>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-widest">Output:</h3>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
                <pre className="text-[13px] font-mono text-emerald-400 whitespace-pre-wrap break-words">{data.outputDemonstration.output}</pre>
              </div>
            </div>
          </div>

          <p className="mt-6 text-[14px] font-medium text-slate-800">{data.outputDemonstration.explanation}</p>
          <p className="mt-3 text-[13px] font-medium text-slate-700 italic">{data.outputDemonstration.visualRepresentation}</p>

          {data.outputDemonstration.previewAsset && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50 p-3">
              <SVGIconRenderer 
                dataUri={typeof data.outputDemonstration.previewAsset === 'string' ? data.outputDemonstration.previewAsset : data.outputDemonstration.previewAsset?.dataUri} 
                alt={typeof data.outputDemonstration.previewAsset === 'object' ? data.outputDemonstration.previewAsset?.alt : 'Output Visualization'} 
                className="w-full h-auto max-h-[450px] object-contain mx-auto"
              />
            </div>
          )}
        </section>
      )}

      {/* 5. Best Practice Version */}
      {data.bestPracticeVersion && (
        <section aria-label="Best practice code version" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>4</div>
            <h2 className="text-xl font-bold text-slate-950">{data.bestPracticeVersion.title}</h2>
          </div>

          <div className="rounded-xl bg-green-50 border border-green-200 p-5">
            <h3 className="text-sm font-bold text-green-900 mb-3 uppercase tracking-widest">Improvements:</h3>
            <ul className="space-y-2">
              {data.bestPracticeVersion.improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Icons.CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-[13px] font-medium text-green-900">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] overflow-hidden bg-[#0f172a] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Best Practice Code</span>
              <button className="flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-white transition-colors">
                <Icons.Copy size={14} aria-hidden="true" />
                Copy
              </button>
            </div>
            <div className="p-6 overflow-auto">
              <pre className="text-[13px] leading-relaxed text-indigo-100 font-mono whitespace-pre-wrap break-words">{data.bestPracticeVersion.code}</pre>
            </div>
          </div>

          <p className="text-[14px] font-medium text-slate-800">{data.bestPracticeVersion.explanation}</p>

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-3 uppercase tracking-widest">Benefits:</h3>
            <ul className="space-y-2">
              {data.bestPracticeVersion.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Icons.Star size={16} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-[13px] font-medium text-blue-900">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 6. Common Mistakes */}
      {data.commonMistakes && data.commonMistakes.mistakes.length > 0 && (
        <section aria-label="Common coding mistakes" className="rounded-[32px] bg-white p-5 shadow-xl sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>5</div>
            <h2 className="text-xl font-bold text-slate-950">{data.commonMistakes.title}</h2>
          </div>

          <div className="space-y-8">
            {data.commonMistakes.mistakes.map((mistake) => (
              <div key={mistake.id} className="space-y-4">
                <h3 className="text-[15px] font-bold text-red-900">{mistake.mistake}</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.XCircle size={16} className="text-red-600" aria-hidden="true" />
                      <span className="text-[12px] font-bold text-red-900 uppercase tracking-wider">Bad Code</span>
                    </div>
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                      <pre className="text-[12px] font-mono text-red-900 whitespace-pre-wrap break-words">{mistake.badCode}</pre>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.CheckCircle size={16} className="text-green-600" aria-hidden="true" />
                      <span className="text-[12px] font-bold text-green-900 uppercase tracking-wider">Good Code</span>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                      <pre className="text-[12px] font-mono text-green-900 whitespace-pre-wrap break-words">{mistake.goodCode}</pre>
                    </div>
                  </div>
                </div>

                <p className="text-[13px] font-medium text-slate-700">{mistake.why}</p>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-[13px] font-bold text-blue-900">💡 {mistake.lesson}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Real-World Implementation */}
      {data.realWorldImplementation && (
        <section aria-label="Real-world implementation example" className="rounded-[32px] bg-gradient-to-br from-purple-50 to-pink-50 p-5 shadow-xl border border-purple-100 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>6</div>
            <h2 className="text-xl font-bold text-slate-950">{data.realWorldImplementation.title}</h2>
          </div>

          <p className="text-[14px] font-medium text-slate-800 mb-6">{data.realWorldImplementation.scenario}</p>

          <div className="rounded-[24px] overflow-hidden bg-[#0f172a] shadow-2xl mb-6">
            <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Production Code</span>
              <button className="flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-white transition-colors">
                <Icons.Copy size={14} aria-hidden="true" />
                Copy
              </button>
            </div>
            <div className="p-6 overflow-auto">
              <pre className="text-[13px] leading-relaxed text-indigo-100 font-mono whitespace-pre-wrap break-words">{data.realWorldImplementation.code}</pre>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {data.realWorldImplementation.features.map((feature, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-purple-200">
                <p className="text-[13px] font-medium text-slate-800">{feature}</p>
              </div>
            ))}
          </div>

          <p className="text-[14px] font-medium text-slate-800 mb-4">{data.realWorldImplementation.explanation}</p>
          <p className="text-[13px] font-medium text-slate-700 italic">{data.realWorldImplementation.scalability}</p>
        </section>
      )}

      {/* 8. Code Summary */}
      {data.codeSummary && (
        <section aria-label="Code summary and next steps" className="rounded-[32px] bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-xl border border-slate-200 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <Icons.BookOpen size={24} className="text-slate-700" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-950">{data.codeSummary.title}</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-widest">Key Takeaways:</h3>
              <ul className="space-y-2">
                {data.codeSummary.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Icons.CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[14px] font-medium text-slate-800">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
              <h3 className="text-sm font-bold text-amber-900 mb-2 uppercase tracking-widest">Practice Exercise:</h3>
              <p className="text-[14px] font-medium text-amber-900">{data.codeSummary.practiceExercise}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-widest">Next Steps:</h3>
              <ul className="space-y-2">
                {data.codeSummary.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Icons.ArrowRight size={18} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[14px] font-medium text-slate-800">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
