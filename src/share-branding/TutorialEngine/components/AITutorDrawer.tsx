import React, { useState } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialData } from './TutorialDataContext';

interface AITutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({ isOpen, onClose }) => {
  const brandConfig = useBrand();
  const data = useTutorialData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: data.tutorDrawer.welcomeMessage,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "That's a great question! Let me help you understand that better...",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/20 transition-opacity ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} />

      <aside aria-label={`${brandConfig.tutorLabel} drawer`} className={`fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[400px] min-w-0 flex-col border-l border-gray-200 bg-white shadow-lg transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: brandConfig.primaryColor }}>
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="break-words font-bold text-slate-950" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {brandConfig.tutorLabel}
                </h2>
                <p className="break-words text-xs font-medium text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {data.tutorDrawer.subtitle}
                </p>
              </div>
            </div>
            <button onClick={onClose} aria-label={`Close ${brandConfig.tutorLabel} drawer`} className="rounded-lg p-2 transition-colors hover:bg-slate-100 border border-transparent hover:border-slate-200">
              <X className="h-5 w-5 text-slate-700" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div tabIndex={0} aria-label="Tutor conversation history" className="min-w-0 flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-inset sm:p-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] min-w-0 rounded-lg border p-3 shadow-sm ${
                  message.sender === 'user' ? 'rounded-tr-none border-transparent' : 'rounded-tl-none border-slate-200 bg-white'
                }`}
                style={{ background: message.sender === 'user' ? brandConfig.primaryColor : undefined }}
              >
                <p className={`break-words text-sm font-medium ${message.sender === 'user' ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
                  {message.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex min-w-0 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-inner focus-within:ring-2 focus-within:ring-slate-200">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              aria-label={`Ask ${brandConfig.tutorLabel} a question`}
              placeholder={data.tutorDrawer.inputPlaceholder}
              className="min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <button onClick={handleSend} aria-label="Send tutorial question" className="rounded-lg p-2 transition-all hover:opacity-90 active:scale-95" style={{ background: brandConfig.primaryColor }}>
              <Send className="h-4 w-4 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
