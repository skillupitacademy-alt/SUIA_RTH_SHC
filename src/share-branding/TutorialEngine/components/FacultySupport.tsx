import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import React, { useState } from 'react';
import { Calendar, Video, Clock, CheckCircle, Lock, FileText } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: 'open' | 'locked' | 'submitted';
  dueDate: string;
}

interface FacultySupportProps {
  
}

export const FacultySupport: React.FC<FacultySupportProps> = ({}) => {
  const brandConfig = useBrand();

  const [sessionRequest, setSessionRequest] = useState({
    topic: '',
    preferredTime: '',
    description: '',
  });
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'pending' | 'scheduled'>('idle');

  const projects: Project[] = [
    {
      id: 'p1',
      name: 'Build a Todo App',
      status: 'open',
      dueDate: 'Apr 5, 2026',
    },
    {
      id: 'p2',
      name: 'Create a Weather Dashboard',
      status: 'submitted',
      dueDate: 'Apr 12, 2026',
    },
    {
      id: 'p3',
      name: 'Design System Implementation',
      status: 'locked',
      dueDate: 'Apr 19, 2026',
    },
  ];

  const handleSessionRequest = () => {
    if (sessionRequest.topic && sessionRequest.preferredTime) {
      setSessionStatus('pending');
      setTimeout(() => {
        setSessionStatus('scheduled');
      }, 2000);
    }
  };

  const getProjectIcon = (status: Project['status']) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-slate-400" />;
      case 'open':
        return <FileText className="w-5 h-5" style={{ color: brandConfig.primaryColor }} />;
    }
  };

  const getProjectStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'submitted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'locked':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'open':
        return 'bg-blue-100 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Session Panel */}
      <div
        id="live-session"
        className="rounded-lg p-6 bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{
              background: brandConfig.primaryColor,
            }}
          >
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Request Live Session
            </h2>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Schedule 1-on-1 time with faculty
            </p>
          </div>
        </div>

        {sessionStatus === 'idle' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Topic
              </label>
              <input
                type="text"
                value={sessionRequest.topic}
                onChange={(e) => setSessionRequest({ ...sessionRequest, topic: e.target.value })}
                placeholder="e.g., React Hooks confusion"
                className="w-full p-3 rounded-lg bg-white border border-gray-200 outline-none transition-colors"
                style={{ fontFamily: 'Inter, sans-serif', borderColor: 'rgb(229 231 235)' }}
                onFocus={(e) => e.target.style.borderColor = brandConfig.primaryColor}
                onBlur={(e) => e.target.style.borderColor = 'rgb(229 231 235)'}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Preferred Time
              </label>
              <div className="flex gap-2">
                <Calendar className="w-5 h-5 text-gray-500 mt-3" />
                <input
                  type="datetime-local"
                  value={sessionRequest.preferredTime}
                  onChange={(e) => setSessionRequest({ ...sessionRequest, preferredTime: e.target.value })}
                  className="flex-1 p-3 rounded-lg bg-white border border-gray-200 outline-none transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif', borderColor: 'rgb(229 231 235)' }}
                  onFocus={(e) => e.target.style.borderColor = brandConfig.primaryColor}
                  onBlur={(e) => e.target.style.borderColor = 'rgb(229 231 235)'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Additional Details
              </label>
              <textarea
                value={sessionRequest.description}
                onChange={(e) => setSessionRequest({ ...sessionRequest, description: e.target.value })}
                placeholder="What would you like to discuss?"
                rows={3}
                className="w-full p-3 rounded-lg bg-white border border-gray-200 outline-none transition-colors resize-none"
                style={{ fontFamily: 'Inter, sans-serif', borderColor: 'rgb(229 231 235)' }}
                onFocus={(e) => e.target.style.borderColor = brandConfig.primaryColor}
                onBlur={(e) => e.target.style.borderColor = 'rgb(229 231 235)'}
              />
            </div>

            <button
              onClick={handleSessionRequest}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: brandConfig.primaryColor,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Request Session
            </button>
          </div>
        )}

        {sessionStatus === 'pending' && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: brandConfig.primaryColor }} />
            <p className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Processing Request...
            </p>
          </div>
        )}

        {sessionStatus === 'scheduled' && (
          <div
            className="p-6 rounded-lg text-center bg-emerald-50 border border-emerald-200"
          >
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Session Scheduled!
            </p>
            <p className="text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
              You'll receive a confirmation email shortly with the meeting link.
            </p>
            <button
              onClick={() => setSessionStatus('idle')}
              className="mt-4 px-6 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-semibold border border-gray-200"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Request Another
            </button>
          </div>
        )}
      </div>

      {/* Project Submission Panel */}
      <div
        id="projects"
        className="rounded-lg p-6 bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Project Assignments
        </h2>

        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`p-4 rounded-lg border transition-all duration-300 bg-white ${
                project.status === 'locked' ? 'opacity-60' : 'hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]'
              }`}
              style={{
                borderColor: 'rgb(229 231 235)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getProjectIcon(project.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Due: {project.dueDate}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getProjectStatusColor(project.status)}`}
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    color: project.status === 'open' ? brandConfig.primaryColor : undefined
                  }}
                >
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