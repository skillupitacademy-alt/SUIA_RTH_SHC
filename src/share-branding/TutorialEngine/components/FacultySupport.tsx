import React, { useState } from 'react';
import { Calendar, Video, Clock, CheckCircle, Lock, FileText } from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialData } from './TutorialDataContext';

export const FacultySupport: React.FC = () => {
  const brandConfig = useBrand();
  const data = useTutorialData();
  const [sessionRequest, setSessionRequest] = useState({
    topic: '',
    preferredTime: '',
    description: '',
  });
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'pending' | 'scheduled'>('idle');

  const handleSessionRequest = () => {
    if (sessionRequest.topic && sessionRequest.preferredTime) {
      setSessionStatus('pending');
      setTimeout(() => setSessionStatus('scheduled'), 2000);
    }
  };

  const getProjectIcon = (status: 'open' | 'locked' | 'submitted') => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-5 w-5 text-emerald-700" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-slate-700" aria-hidden="true" />;
      case 'open':
        return <FileText className="h-5 w-5" style={{ color: brandConfig.primaryColor }} aria-hidden="true" />;
    }
  };

  const getProjectStatusColor = (status: 'open' | 'locked' | 'submitted') => {
    switch (status) {
      case 'submitted':
        return 'bg-emerald-100 text-emerald-950 border border-emerald-200';
      case 'locked':
        return 'bg-slate-100 text-slate-800 border border-slate-200';
      case 'open':
        return 'bg-blue-100 text-blue-950 border border-blue-200';
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
      <div id="live-session" className="w-full min-w-0 overflow-hidden rounded-lg bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(0,0,0,0.12)] sm:p-6">
        <div className="mb-6 flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg shadow-lg shadow-primary/20" style={{ background: brandConfig.primaryColor }}>
            <Video className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-bold text-slate-950" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {data.facultySupport.liveSessionTitle}
            </h2>
            <p className="break-words text-sm font-medium text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              {data.facultySupport.liveSessionSubtitle}
            </p>
          </div>
        </div>

        {sessionStatus === 'idle' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="session-topic" className="mb-2 block text-sm font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {data.facultySupport.topicLabel}
              </label>
              <input
                id="session-topic"
                type="text"
                value={sessionRequest.topic}
                onChange={(e) => setSessionRequest({ ...sessionRequest, topic: e.target.value })}
                placeholder={data.facultySupport.topicPlaceholder}
                className="w-full rounded-lg bg-white p-3 outline-none transition-colors shadow-sm border border-slate-200 focus:border-transparent placeholder:text-slate-500 text-slate-900"
                style={{ fontFamily: 'Inter, sans-serif' }}
                onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${brandConfig.primaryColor}33`)}
                onBlur={(e) => (e.target.style.boxShadow = 'none')}
              />
            </div>

            <div>
              <label htmlFor="session-preferred-time" className="mb-2 block text-sm font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {data.facultySupport.timeLabel}
              </label>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
                <Calendar className="mt-0 h-5 w-5 shrink-0 text-slate-800 sm:mt-3" aria-hidden="true" />
                <input
                  id="session-preferred-time"
                  type="datetime-local"
                  aria-label="Preferred time for live session"
                  value={sessionRequest.preferredTime}
                  onChange={(e) => setSessionRequest({ ...sessionRequest, preferredTime: e.target.value })}
                  className="w-full min-w-0 flex-1 rounded-lg bg-white p-3 outline-none transition-colors shadow-sm border border-slate-200 focus:border-transparent text-slate-900"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${brandConfig.primaryColor}33`)}
                  onBlur={(e) => (e.target.style.boxShadow = 'none')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="session-description" className="mb-2 block text-sm font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {data.facultySupport.detailLabel}
              </label>
              <textarea
                id="session-description"
                value={sessionRequest.description}
                onChange={(e) => setSessionRequest({ ...sessionRequest, description: e.target.value })}
                placeholder={data.facultySupport.detailPlaceholder}
                rows={3}
                className="w-full resize-none rounded-lg bg-white p-3 outline-none transition-colors shadow-sm border border-slate-200 focus:border-transparent placeholder:text-slate-500 text-slate-900"
                style={{ fontFamily: 'Inter, sans-serif' }}
                onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${brandConfig.primaryColor}33`)}
                onBlur={(e) => (e.target.style.boxShadow = 'none')}
              />
            </div>

            <button onClick={handleSessionRequest} className="w-full rounded-lg py-3 font-semibold text-white transition-all hover:opacity-90" style={{ background: brandConfig.primaryColor, fontFamily: 'Outfit, sans-serif' }}>
              {data.facultySupport.requestCtaLabel}
            </button>
          </div>
        )}

        {sessionStatus === 'pending' && (
          <div className="py-8 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 animate-pulse" style={{ color: brandConfig.primaryColor }} aria-hidden="true" />
            <p className="text-lg font-bold text-slate-950" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {data.facultySupport.processingLabel}
            </p>
          </div>
        )}

        {sessionStatus === 'scheduled' && (
          <div className="rounded-lg bg-emerald-50 p-6 text-center shadow-sm border border-emerald-100">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-800" aria-hidden="true" />
            <p className="mb-2 text-lg font-bold text-slate-950" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {data.facultySupport.scheduledTitle}
            </p>
            <p className="text-sm font-medium text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              {data.facultySupport.scheduledDescription}
            </p>
            <button onClick={() => setSessionStatus('idle')} className="mt-4 rounded-lg bg-white px-6 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50 shadow-sm border border-slate-200" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {data.facultySupport.requestAnotherLabel}
            </button>
          </div>
        )}
      </div>

      <div id="projects" className="w-full min-w-0 overflow-hidden rounded-lg bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(0,0,0,0.12)] sm:p-6 border border-slate-100">
        <h2 className="mb-6 break-words text-xl font-bold text-slate-950" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {data.facultySupport.projectsTitle}
        </h2>

        <div className="space-y-3">
          {data.facultySupport.projects.map((project) => (
            <div
              key={project.id}
              className={`w-full min-w-0 overflow-hidden rounded-lg bg-white p-4 transition-all duration-300 ${
                project.status === 'locked' ? 'bg-gray-50' : 'shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.10)]'
              }`}
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {getProjectIcon(project.status)}
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {project.name}
                    </h3>
                    <p className="break-words text-xs font-medium text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Due: {project.dueDate}
                    </p>
                  </div>
                </div>
                <span className={`max-w-full shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getProjectStatusColor(project.status)}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
