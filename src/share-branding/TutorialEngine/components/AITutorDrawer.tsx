import React, { useState } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi! I'm your ${brandConfig.tutorLabel}. Ask me anything about the current topic!`,
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
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      <aside
        aria-label={`${brandConfig.tutorLabel} drawer`}
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[400px] min-w-0 flex-col border-l border-gray-200 bg-white shadow-lg transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: brandConfig.primaryColor }}
              >
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="break-words font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {brandConfig.tutorLabel}
                </h2>
                <p className="break-words text-xs text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Always here to help
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={`Close ${brandConfig.tutorLabel} drawer`}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div tabIndex={0} aria-label="Tutor conversation history" className="min-w-0 flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-inset sm:p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] min-w-0 rounded-lg border p-3 ${
                  message.sender === 'user'
                    ? 'rounded-tr-none border-transparent'
                    : 'rounded-tl-none border-gray-200 bg-white'
                }`}
                style={{ background: message.sender === 'user' ? brandConfig.primaryColor : undefined }}
              >
                <p
                  className={`break-words text-sm ${message.sender === 'user' ? 'text-white' : 'text-gray-800'}`}
                  style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}
                >
                  {message.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex min-w-0 gap-2 rounded-lg border border-gray-200 bg-white p-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              aria-label={`Ask ${brandConfig.tutorLabel} a question`}
              placeholder="Ask a question..."
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <button
              onClick={handleSend}
              aria-label="Send tutorial question"
              className="rounded-lg p-2 transition-all hover:opacity-90"
              style={{ background: brandConfig.primaryColor }}
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
