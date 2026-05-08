'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function VisualExplanationContent({ data }: { data?: SubtopicNotesViewData['mainContent']['visualExplanation'] }) {
  const brand = useBrand();
  
  if (!data) return null;

  return (
    <div className="min-w-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 sm:space-y-12">
      
      {/* Main Section Title */}
      <h2 className="sr-only">Visual Explanation</h2>

      {/* 1. Core Concept Visualization */}
      {data.conceptVisualIntro && (
        <section aria-label="Core concept visualization" className="rounded-[32px] bg-gradient-to-br from-purple-50 to-indigo-50 p-5 shadow-xl border border-purple-100 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {data.conceptVisualIntro.badge}
            </div>
            <h3 className="text-2xl font-bold text-slate-950">{data.conceptVisualIntro.headline}</h3>
          </div>
          <p className="text-[15px] font-medium text-slate-800 leading-relaxed mb-6">{data.conceptVisualIntro.visualDefinition}</p>
          
          {data.conceptVisualIntro.heroDiagramPreview && (
            <div className="p-6 rounded-xl bg-white border border-purple-200 mb-6">
              <p className="text-[14px] font-medium text-slate-700">{data.conceptVisualIntro.heroDiagramPreview}</p>
            </div>
          )}

          <div className="p-5 rounded-xl bg-purple-100 border border-purple-200">
            <div className="flex items-start gap-3">
              <Icons.Info size={20} className="text-purple-700 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[14px] font-medium text-purple-900">{data.conceptVisualIntro.importanceBlock}</p>
            </div>
          </div>

          {data.conceptVisualIntro.progressIndicator && (
            <p className="mt-4 text-[13px] font-medium text-slate-600">{data.conceptVisualIntro.progressIndicator}</p>
          )}
        </section>
      )}

      {/* 2. Diagrammatic Breakdown */}
      {data.diagrammaticBreakdown && (
        <section aria-label="Diagrammatic breakdown" className="rounded-[32px] bg-white p-5 shadow-xl sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>1</div>
            <h3 className="text-xl font-bold text-slate-950">{data.diagrammaticBreakdown.title}</h3>
          </div>

          <h4 className="text-lg font-bold text-slate-900 mb-6">{data.diagrammaticBreakdown.diagramTitle}</h4>

          {/* Component Labels */}
          <div className="space-y-4 mb-8">
            <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Components:</h5>
            {data.diagrammaticBreakdown.componentLabels.map((component) => (
              <div key={component.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-900">
                  {component.id}
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-900">{component.label}</p>
                  <p className="text-[13px] font-medium text-slate-700">{component.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Step Markers */}
          {data.diagrammaticBreakdown.stepMarkers.length > 0 && (
            <div className="mb-8">
              <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Steps:</h5>
              <ul className="space-y-2">
                {data.diagrammaticBreakdown.stepMarkers.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Icons.ArrowRight size={18} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[14px] font-medium text-slate-800">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Tooltips */}
          {data.diagrammaticBreakdown.technicalTooltips.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.diagrammaticBreakdown.technicalTooltips.map((tooltip) => (
                <div key={tooltip.id} className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-[13px] font-bold text-blue-900 mb-2">{tooltip.term}</p>
                  <p className="text-[12px] font-medium text-blue-800">{tooltip.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. Step-by-Step Visual Flow */}
      {data.stepByStepVisualFlow && (
        <section aria-label="Step-by-step visual flow" className="rounded-[32px] bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-xl border border-emerald-100 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>2</div>
            <h3 className="text-xl font-bold text-slate-950">{data.stepByStepVisualFlow.title}</h3>
          </div>

          <h4 className="text-lg font-bold text-slate-900 mb-6">{data.stepByStepVisualFlow.sequenceTitle}</h4>

          <div className="space-y-6">
            {data.stepByStepVisualFlow.steps.map((step, idx) => (
              <div key={step.id} className="relative">
                <div className="flex gap-4 p-5 rounded-xl bg-white border border-emerald-200">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-2 min-w-0">
                    <h5 className="text-[15px] font-bold text-slate-900">{step.title}</h5>
                    <p className="text-[14px] font-medium text-slate-700">{step.description}</p>
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-[13px] font-medium text-emerald-900">💡 {step.visualCue}</p>
                    </div>
                  </div>
                </div>
                {idx < (data.stepByStepVisualFlow?.steps.length || 0) - 1 && (
                  <div className="flex justify-center my-3">
                    <Icons.ArrowDown size={24} className="text-emerald-600" aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {data.stepByStepVisualFlow.phaseExplanations.length > 0 && (
            <div className="mt-8 space-y-3">
              <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Phase Explanations:</h5>
              {data.stepByStepVisualFlow.phaseExplanations.map((phase, idx) => (
                <p key={idx} className="text-[14px] font-medium text-slate-700 pl-4 border-l-4 border-emerald-400">
                  {phase}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Comparative Visualization */}
      {data.comparativeVisualization && (
        <section aria-label="Comparative visualization" className="rounded-[32px] bg-white p-5 shadow-xl sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>3</div>
            <h3 className="text-xl font-bold text-slate-950">{data.comparativeVisualization.title}</h3>
          </div>

          <h4 className="text-lg font-bold text-slate-900 mb-6">{data.comparativeVisualization.comparisonTitle}</h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Option 1 */}
            <div className="p-6 rounded-xl bg-blue-50 border border-blue-200">
              <h5 className="text-[16px] font-bold text-blue-900 mb-4">{data.comparativeVisualization.sideBySideVisuals.option1.title}</h5>
              <p className="text-[14px] font-medium text-blue-800 mb-4">{data.comparativeVisualization.sideBySideVisuals.option1.description}</p>
              
              <div className="space-y-3 mb-4">
                <p className="text-[13px] font-bold text-green-900 uppercase tracking-wider">Pros:</p>
                {data.comparativeVisualization.sideBySideVisuals.option1.pros.map((pro, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Icons.CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-slate-700">{pro}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-[13px] font-bold text-red-900 uppercase tracking-wider">Cons:</p>
                {data.comparativeVisualization.sideBySideVisuals.option1.cons.map((con, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Icons.XCircle size={16} className="text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-slate-700">{con}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Option 2 */}
            <div className="p-6 rounded-xl bg-purple-50 border border-purple-200">
              <h5 className="text-[16px] font-bold text-purple-900 mb-4">{data.comparativeVisualization.sideBySideVisuals.option2.title}</h5>
              <p className="text-[14px] font-medium text-purple-800 mb-4">{data.comparativeVisualization.sideBySideVisuals.option2.description}</p>
              
              <div className="space-y-3 mb-4">
                <p className="text-[13px] font-bold text-green-900 uppercase tracking-wider">Pros:</p>
                {data.comparativeVisualization.sideBySideVisuals.option2.pros.map((pro, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Icons.CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-slate-700">{pro}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-[13px] font-bold text-red-900 uppercase tracking-wider">Cons:</p>
                {data.comparativeVisualization.sideBySideVisuals.option2.cons.map((con, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Icons.XCircle size={16} className="text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[13px] font-medium text-slate-700">{con}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Difference Highlights */}
          {data.comparativeVisualization.differenceHighlights.length > 0 && (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
              <h5 className="text-sm font-bold text-amber-900 uppercase tracking-widest mb-4">Key Differences:</h5>
              <ul className="space-y-2">
                {data.comparativeVisualization.differenceHighlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Icons.Zap size={18} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[14px] font-medium text-amber-900">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 5. Mental Model Visualization */}
      {data.mentalModelVisualization && (
        <section aria-label="Mental model visualization" className="rounded-[32px] bg-gradient-to-br from-slate-50 to-gray-100 p-5 shadow-xl border border-gray-200 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>4</div>
            <h3 className="text-xl font-bold text-slate-950">{data.mentalModelVisualization.title}</h3>
          </div>

          {/* Framework Map Nodes */}
          <div className="space-y-4 mb-8">
            {data.mentalModelVisualization.frameworkMap.nodes.map((node) => (
              <div
                key={node.id}
                className={`p-5 rounded-xl border-2 ${
                  node.type === 'core' ? 'bg-blue-50 border-blue-300' :
                  node.type === 'supporting' ? 'bg-green-50 border-green-300' :
                  'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    node.type === 'core' ? 'bg-blue-600' :
                    node.type === 'supporting' ? 'bg-green-600' :
                    'bg-gray-600'
                  }`} />
                  <h5 className="text-[15px] font-bold text-slate-900">{node.label}</h5>
                </div>
                <p className="text-[13px] font-medium text-slate-700">{node.description}</p>
              </div>
            ))}
          </div>

          {/* Connections */}
          {data.mentalModelVisualization.frameworkMap.connections.length > 0 && (
            <div className="mb-8">
              <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Relationships:</h5>
              <div className="space-y-3">
                {data.mentalModelVisualization.frameworkMap.connections.map((connection, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200">
                    <span className="text-[13px] font-bold text-slate-900">{connection.from}</span>
                    <Icons.ArrowRight size={16} className={connection.type === 'primary' ? 'text-blue-600' : 'text-gray-600'} aria-hidden="true" />
                    <span className="text-[12px] font-medium text-slate-600">{connection.label}</span>
                    <Icons.ArrowRight size={16} className={connection.type === 'primary' ? 'text-blue-600' : 'text-gray-600'} aria-hidden="true" />
                    <span className="text-[13px] font-bold text-slate-900">{connection.to}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memory Labels */}
          {data.mentalModelVisualization.memoryLabels.length > 0 && (
            <div className="p-5 rounded-xl bg-purple-50 border border-purple-200">
              <h5 className="text-sm font-bold text-purple-900 uppercase tracking-widest mb-4">Memory Anchors:</h5>
              <div className="flex flex-wrap gap-2">
                {data.mentalModelVisualization.memoryLabels.map((label, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-purple-100 text-[12px] font-bold text-purple-900 border border-purple-200">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 6. Real-World Visual Mapping */}
      {data.realWorldVisualMapping && (
        <section aria-label="Real-world visual mapping" className="rounded-[32px] bg-white p-5 shadow-xl sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>5</div>
            <h3 className="text-xl font-bold text-slate-950">{data.realWorldVisualMapping.title}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {data.realWorldVisualMapping.practicalScenarios.map((scenario) => {
              const IconComponent = (Icons as any)[scenario.icon] || Icons.Briefcase;
              return (
                <div key={scenario.id} className="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 border border-orange-200">
                      <IconComponent size={20} className="text-orange-700" aria-hidden="true" />
                    </div>
                    <h5 className="text-[15px] font-bold text-slate-900">{scenario.title}</h5>
                  </div>
                  <p className="text-[13px] font-medium text-slate-700 mb-3">{scenario.description}</p>
                  <p className="text-[12px] font-medium text-orange-900 mb-3 italic">{scenario.industryContext}</p>
                  <div className="p-3 rounded-lg bg-white border border-orange-200">
                    <p className="text-[12px] font-medium text-slate-700">{scenario.visualRepresentation}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <Icons.Briefcase size={20} className="text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h5 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-2">Career Relevance:</h5>
                <p className="text-[14px] font-medium text-blue-900">{data.realWorldVisualMapping.careerRelevance}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Common Confusion Visualization */}
      {data.commonConfusionVisualization && (
        <section aria-label="Common confusion visualization" className="rounded-[32px] bg-white p-5 shadow-xl sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>6</div>
            <h3 className="text-xl font-bold text-slate-950">{data.commonConfusionVisualization.title}</h3>
          </div>

          {/* Confusion Items */}
          <div className="space-y-6 mb-8">
            {data.commonConfusionVisualization.confusionItems.map((item) => (
              <div key={item.id} className="p-5 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-start gap-3 mb-4">
                  <Icons.AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0">
                    <h5 className="text-[15px] font-bold text-red-900 mb-2">Common Confusion:</h5>
                    <p className="text-[14px] font-medium text-red-800 mb-4">{item.confusion}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-start gap-3">
                    <Icons.CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <h6 className="text-[14px] font-bold text-green-900 mb-2">Visual Clarification:</h6>
                      <p className="text-[13px] font-medium text-green-800 mb-3">{item.visualClarification}</p>
                      <p className="text-[13px] font-medium text-green-700">{item.correctVisualization}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Items */}
          {data.commonConfusionVisualization.faqItems.length > 0 && (
            <div className="space-y-4 mb-8">
              <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Frequently Asked Questions:</h5>
              {data.commonConfusionVisualization.faqItems.map((faq) => (
                <div key={faq.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h6 className="text-[14px] font-bold text-slate-900 mb-2">Q: {faq.question}</h6>
                  <p className="text-[13px] font-medium text-slate-700">A: {faq.answer}</p>
                </div>
              ))}
            </div>
          )}

          {/* Misconception Diagrams */}
          {data.commonConfusionVisualization.misconceptionDiagrams.length > 0 && (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
              <h5 className="text-sm font-bold text-amber-900 uppercase tracking-widest mb-4">Key Misconceptions to Avoid:</h5>
              <ul className="space-y-2">
                {data.commonConfusionVisualization.misconceptionDiagrams.map((diagram, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Icons.XCircle size={18} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[14px] font-medium text-amber-900">{diagram}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 8. Visual Summary */}
      {data.visualSummary && (
        <section aria-label="Visual summary" className="rounded-[32px] bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-xl border border-slate-200 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <Icons.BookOpen size={24} className="text-slate-700" aria-hidden="true" />
            <h3 className="text-2xl font-bold text-slate-950">{data.visualSummary.summaryTitle}</h3>
          </div>

          {/* Key Visual Takeaways */}
          <div className="mb-8">
            <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Key Visual Takeaways:</h5>
            <ul className="space-y-3">
              {data.visualSummary.keyVisualTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Icons.CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-[14px] font-medium text-slate-800">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Revision Infographic */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 mb-8">
            <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Revision Infographic:</h5>
            <p className="text-[14px] font-medium text-slate-700">{data.visualSummary.revisionInfographic}</p>
          </div>

          {/* Memory Reinforcement */}
          <div className="p-5 rounded-xl bg-purple-50 border border-purple-200 mb-8">
            <div className="flex items-start gap-3">
              <Icons.Brain size={20} className="text-purple-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h5 className="text-sm font-bold text-purple-900 uppercase tracking-widest mb-2">Memory Reinforcement:</h5>
                <p className="text-[14px] font-medium text-purple-900">{data.visualSummary.memoryReinforcement}</p>
              </div>
            </div>
          </div>

          {/* Exam Visual Checklist */}
          <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
            <h5 className="text-sm font-bold text-amber-900 uppercase tracking-widest mb-4">Exam Visual Checklist:</h5>
            <ul className="space-y-2">
              {data.visualSummary.examVisualChecklist.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-amber-600">
                    <Icons.Check size={14} className="text-amber-600" aria-hidden="true" />
                  </div>
                  <span className="text-[14px] font-medium text-amber-900">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

    </div>
  );
}
