import React from 'react';

export interface SubjectLogoProps {
  subject?: string;
  primaryColor?: string;
  secondaryColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function SubjectLogo({
  subject = 'Python',
  primaryColor = '#ff0055',
  secondaryColor = '#0b132b',
  size = 'md',
  className = '',
}: SubjectLogoProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
    xl: 'w-24 h-24',
  };

  const currentSizeClass = className || sizeClasses[size] || sizeClasses.md;
  const normalizedSubject = (subject || '').toLowerCase().trim();

  // Python Logo (Pink / Dark Navy with white eyes)
  if (normalizedSubject.includes('python')) {
    const pythonPrimary = primaryColor || '#ff0055';
    const pythonSecondary = secondaryColor || '#0b132b';

    return (
      <svg className={currentSizeClass} viewBox="0 0 256 255" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet">
        <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072z" fill={pythonPrimary} />
        <circle cx="92.8" cy="30.8" r="8" fill="#ffffff" />
        <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897z" fill={pythonSecondary} />
        <circle cx="162.8" cy="223.4" r="8" fill="#ffffff" />
      </svg>
    );
  }

  // Java Logo
  if (normalizedSubject.includes('java') && !normalizedSubject.includes('javascript')) {
    return (
      <svg className={currentSizeClass} viewBox="0 0 256 346" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet">
        <path d="M82.554 267.473s-13.198 7.675 9.393 10.272c27.369 3.122 41.356 2.675 71.517-3.034 0 0 7.93 4.972 19.003 9.279-67.611 28.977-153.019-1.679-99.913-16.517M74.292 229.659s-14.803 10.958 7.805 13.296c29.236 3.016 52.324 3.263 92.276-4.43 0 0 5.526 5.602 14.215 8.666-81.747 23.904-172.798 1.885-114.296-17.532" fill={primaryColor}></path>
        <path d="M143.942 165.515c16.66 19.18-4.377 36.44-4.377 36.44s42.301-21.837 22.874-49.183c-18.144-25.5-32.059-38.172 43.268-81.858 0 0-118.238 29.53-61.765 94.6" fill={secondaryColor}></path>
        <path d="M233.364 295.442s9.767 8.047-10.757 14.273c-39.026 11.823-162.432 15.393-196.714.471-12.323-5.36 10.787-12.8 18.056-14.362 7.581-1.644 11.914-1.337 11.914-1.337-13.705-9.655-88.583 18.957-38.034 27.15 137.853 22.356 251.292-10.066 215.535-26.195M88.9 190.48s-62.771 14.91-22.228 20.323c17.118 2.292 51.243 1.774 83.03-.89 25.978-2.19 52.063-6.85 52.063-6.85s-9.16 3.923-15.787 8.448c-63.744 16.765-186.886 8.966-151.435-8.183 29.981-14.492 54.358-12.848 54.358-12.848M201.506 253.422c64.8-33.672 34.839-66.03 13.927-61.67-5.126 1.066-7.411 1.99-7.411 1.99s1.903-2.98 5.537-4.27c41.37-14.545 73.187 42.897-13.355 65.647 0 .001 1.003-.895 1.302-1.697" fill={primaryColor}></path>
        <path d="M162.439.371s35.887 35.9-34.037 91.101c-56.071 44.282-12.786 69.53-.023 98.377-32.73-29.53-56.75-55.526-40.635-79.72C111.395 74.612 176.918 57.393 162.439.37" fill={secondaryColor}></path>
        <path d="M95.268 344.665c62.199 3.982 157.712-2.209 159.974-31.64 0 0-4.348 11.158-51.404 20.018-53.088 9.999-118.596 8.827-157.399 2.421.001 0 7.95 6.58 48.83 9.201" fill={primaryColor}></path>
      </svg>
    );
  }

  // JavaScript / TypeScript Logo
  if (normalizedSubject.includes('javascript') || normalizedSubject.includes('js') || normalizedSubject.includes('typescript') || normalizedSubject.includes('ts')) {
    const isTS = normalizedSubject.includes('typescript') || normalizedSubject.includes('ts');
    return (
      <div className={`${currentSizeClass} rounded-xl flex items-end justify-end p-2 font-black text-xl shadow-sm`} style={{ backgroundColor: isTS ? '#3178c6' : '#f7df1e', color: isTS ? '#ffffff' : '#000000' }}>
        {isTS ? 'TS' : 'JS'}
      </div>
    );
  }

  // React Logo
  if (normalizedSubject.includes('react')) {
    return (
      <svg className={currentSizeClass} viewBox="0 0 256 228" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet">
        <path d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621 6.238-30.281 2.16-54.676-11.769-62.708-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848 155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233 50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165 167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266 13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923 168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586 13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488 29.348-9.723 48.443-25.443 48.443-41.52 0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345-3.24-10.257-7.612-21.163-12.963-32.432 5.106-11 9.31-21.767 12.459-31.957 2.619.758 5.16 1.557 7.61 2.4 23.69 8.156 38.14 20.213 38.14 29.504 0 9.896-15.606 22.743-40.946 31.14Z" fill={primaryColor || '#61dafb'}></path>
        <circle cx="128" cy="114" r="16" fill={primaryColor || '#61dafb'}></circle>
      </svg>
    );
  }

  // Database / SQL Logo
  if (normalizedSubject.includes('sql') || normalizedSubject.includes('data') || normalizedSubject.includes('db')) {
    return (
      <div className={`${currentSizeClass} rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center p-2 text-indigo-600`}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      </div>
    );
  }

  // C++ / C# / C Logo
  if (normalizedSubject.includes('c++') || normalizedSubject.includes('cpp') || normalizedSubject === 'c' || normalizedSubject.includes('c#')) {
    const label = normalizedSubject.includes('c#') ? 'C#' : normalizedSubject.includes('c++') || normalizedSubject.includes('cpp') ? 'C++' : 'C';
    return (
      <div className={`${currentSizeClass} rounded-xl bg-blue-900 border border-blue-700 flex items-center justify-center p-2 font-black text-white text-base shadow-sm`}>
        {label}
      </div>
    );
  }

  // Generic Dynamic Subject Badge (with clean initials & branding)
  const words = subject.trim().split(/\s+/);
  const initials = words.length > 1
    ? (words[0][0] + words[1][0]).toUpperCase()
    : subject.slice(0, 2).toUpperCase();

  return (
    <div
      className={`${currentSizeClass} rounded-2xl flex items-center justify-center font-black text-white shadow-md`}
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      }}
    >
      <span className="text-base tracking-wider">{initials}</span>
    </div>
  );
}
