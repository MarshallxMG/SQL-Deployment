'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Trash2, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSql: (prompt: string) => Promise<{ success: boolean; message?: string }>;
  isGenerating: boolean;
}

export default function ChatSidebar({ isOpen, onClose, onGenerateSql, isGenerating }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    const savedChat = localStorage.getItem('sql_editor_chat_history');
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
  }, []);

  // Save chat history
  useEffect(() => {
    localStorage.setItem('sql_editor_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // We wrap the onGenerateSql to capture the response if possible, 
    // but currently onGenerateSql in page.tsx updates the editor directly.
    // For a true chat, we might want the AI to reply with text AND SQL.
    // For now, we'll assume the "Assistant" action is "Generating SQL..."
    
    // Ideally, page.tsx should return the generated SQL or explanation.
    // Let's assume onGenerateSql returns void but we can add a system message.
    
    const response = await onGenerateSql(userMsg.content);
    
    if (response.success) {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || 'I have generated the SQL for you. Check the editor!',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } else {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || 'Sorry, I encountered an error generating the SQL.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const clearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col h-full shadow-xl z-30 absolute right-0 top-0 bottom-0">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <span className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Bot size={16} /> AI Assistant
        </span>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-red-500" title="Clear Chat">
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            <Bot size={32} className="mx-auto mb-2 opacity-50" />
            <p>Ask me anything about your data!</p>
            <p className="text-xs mt-2">Example: "Show me the top 10 users"</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isGenerating && (
           <div className="flex justify-start">
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 rounded-bl-none shadow-sm flex items-center gap-2">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75" />
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150" />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="w-full pl-4 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
