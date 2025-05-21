"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, SendHorizonal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I can help you with incident reporting, offices, or WildWatch.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setLoading(true);
    setError(null);
    const userInput = input;
    setInput('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (!data.reply) {
        throw new Error('No reply received from the server');
      }
      setMessages(msgs => [...msgs, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get a response. Please try again.');
      setMessages(msgs => [...msgs, { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error. Please try again in a moment.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="fixed bottom-6 right-6 bg-gradient-to-tr from-[#8B0000] to-[#a83232] text-white rounded-full p-4 shadow-xl z-50 hover:scale-105 transition-transform focus:outline-none"
        onClick={() => setOpen(o => !o)}
        aria-label="Open chatbot"
        style={{ boxShadow: '0 4px 24px rgba(139,0,0,0.25)' }}
      >
        <Bot className="w-6 h-6" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 w-[90vw] max-w-sm bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200"
            style={{ minHeight: 420 }}
          >
            <div className="p-4 border-b bg-gradient-to-tr from-[#8B0000] to-[#a83232] text-white rounded-t-2xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <span className="font-bold text-lg tracking-wide">WildWatch Chatbot</span>
              </div>
              <button onClick={() => setOpen(false)} className="ml-2 text-white hover:text-gray-200 text-xl font-bold"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50" style={{ maxHeight: 320 }}>
              {messages.map((msg, i) => (
                <div key={i} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className={`inline-block px-4 py-2 rounded-2xl shadow-sm max-w-[80%] break-words ${msg.sender === 'user' ? 'bg-gradient-to-tr from-[#8B0000] to-[#a83232] text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                    {msg.text}
                  </span>
                </div>
              ))}
              {loading && <div className="text-gray-400 text-sm">AI is typing...</div>}
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t bg-white flex gap-2 items-center rounded-b-2xl">
              <input
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B0000] transition-all shadow-sm bg-gray-100"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
                placeholder="Ask about incidents, offices, or WildWatch..."
                disabled={loading}
                aria-label="Chatbot input"
              />
              <button
                className="bg-gradient-to-tr from-[#8B0000] to-[#a83232] text-white px-4 py-2 rounded-full shadow-md hover:scale-105 transition-transform disabled:opacity-50 font-semibold flex items-center gap-1"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                <SendHorizonal className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 