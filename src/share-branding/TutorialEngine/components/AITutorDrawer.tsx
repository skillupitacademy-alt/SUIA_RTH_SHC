import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import React, { useState } from 'react';
import { X, Send, Bot } from 'lucide-react';

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
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
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
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[400px] z-50 transition-transform duration-300 flex flex-col bg-white border-l border-gray-200 shadow-lg ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: brandConfig.primaryColor,
                }}
              >
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {brandConfig.tutorLabel}
                </h2>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Always here to help
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg border ${
                  message.sender === 'user'
                    ? 'rounded-tr-none border-transparent'
                    : 'rounded-tl-none bg-white border-gray-200'
                }`}
                style={{
                  background: message.sender === 'user' ? brandConfig.primaryColor : undefined,
                }}
              >
                <p
                  className={`text-sm ${message.sender === 'user' ? 'text-white' : 'text-gray-800'}`}
                  style={{ fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}
                >
                  {message.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <div
            className="flex gap-2 p-2 rounded-lg bg-white border border-gray-200"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent outline-none text-sm px-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <button
              onClick={handleSend}
              className="p-2 rounded-lg transition-all hover:opacity-90"
              style={{
                background: brandConfig.primaryColor,
              }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};