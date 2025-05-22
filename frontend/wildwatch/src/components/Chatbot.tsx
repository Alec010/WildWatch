"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Bot, SendHorizonal, X, Sparkles, User, Loader2, ChevronDown, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export default function Chatbot() {
  const hideScrollbarStyle = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open])

  useEffect(() => {
    if (open && !minimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open, minimized])

  const sendMessage = async () => {
    if (!input.trim()) return
    setMessages([...messages, { sender: "user", text: input }])
    setLoading(true)
    setError(null)
    const userInput = input
    setInput("")
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      if (!data.reply) {
        throw new Error("No reply received from the server")
      }
      setMessages((msgs) => [...msgs, { sender: "bot", text: data.reply }])
    } catch (err) {
      console.error("Chat error:", err)
      setError("Failed to get a response. Please try again.")
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "bot",
          text: "Sorry, I encountered an error. Please try again in a moment.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && input.trim()) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleMinimize = () => {
    setMinimized(!minimized)
  }

  const quickResponses = [
    "How do I report an incident?",
    "What offices are available?",
    "Tell me about WildWatch",
    "How to contact security?",
    "Where is the admin office?",
    "What are the reporting hours?",
    "How to track my report?",
    "Emergency procedures",
  ]

  return (
    <div>
      <style jsx>{hideScrollbarStyle}</style>
      {/* Chat button */}
      <button
        className="fixed bottom-6 right-6 bg-gradient-to-r from-[#800000] via-[#9a0000] to-[#800000] text-white rounded-full p-4 shadow-xl z-50 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
        onClick={() => {
          setOpen((o) => !o)
          setMinimized(false)
        }}
        aria-label="Open chatbot"
        style={{ boxShadow: "0 8px 32px rgba(128, 0, 0, 0.3)" }}
      >
        <Image src="/AI%20CAT.png" alt="AI Cat" width={40} height={40} className="w-8 object-contain" />
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4AF37]"></span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: minimized ? "auto" : "600px",
            }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-24 right-6 w-[95vw] max-w-lg bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-[#D4AF37]/30 overflow-hidden"
          >
            {/* Chat header */}
            <div className="p-4 border-b bg-gradient-to-r from-[#800000] via-[#9a0000] to-[#800000] text-white rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                <div className="absolute -inset-0.5 bg-[#D4AF37]/50 rounded-full blur-sm -mr-2"></div>
                  <div className=" relative bg-[#800000] p-1.5 rounded-full">
                    <Image src="/AI%20CAT.png" alt="AI Cat" width={40} height={40} className="w-8 ml-0.5 object-contain object-center items-center text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">WildWatch Assistant</h3>
                  <div className="flex items-center text-xs text-white/80">
                    <span className="flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMinimize}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label={minimized ? "Expand chat" : "Minimize chat"}
                >
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-300 ${minimized ? "rotate-180" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat content - conditionally rendered based on minimized state */}
            <AnimatePresence>
              {!minimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col flex-1"
                >
                  {/* Messages area */}
                  <div
                    className="flex-1 p-5 overflow-y-auto bg-gradient-to-b from-gray-50 to-white"
                    style={{ maxHeight: "350px" }}
                  >
                    <div className="space-y-6">
                      {messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                        >
                          {msg.sender === "bot" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#800000]/70 flex items-center justify-center">
                              <Image src="/AI%20CAT.png" alt="AI Cat" width={24} height={24} className="w-6 ml-0.5 object-contain text-[#800000]" />
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className={`px-4 py-3 rounded-2xl shadow-sm max-w-[80%] ${
                              msg.sender === "user"
                                ? "bg-gradient-to-r from-[#800000] to-[#9a0000] text-white rounded-tr-none"
                                : "bg-white text-gray-800 border border-[#D4AF37]/20 rounded-tl-none"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                          </motion.div>
                          {msg.sender === "user" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#800000] flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                      {loading && (
                        <div className="flex items-end gap-2">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#800000]/70 flex items-center justify-center">
                            <Image src="/AI%20CAT.png" alt="AI Cat" width={24} height={24} className="w-6 object-contain text-[#800000]" />
                          </div>
                          <div className="px-4 py-3 rounded-2xl shadow-sm bg-white border border-[#D4AF37]/20 rounded-tl-none">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2 h-2 rounded-full bg-[#800000]/40 animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 rounded-full bg-[#800000]/40 animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 rounded-full bg-[#800000]/40 animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                      {error && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                          <p>{error}</p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Quick responses - only shown on first message */}
                  {messages.length === 1 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-[#D4AF37]/10">
                      <p className="text-xs text-gray-500 mb-2 font-medium">Suggested questions:</p>
                      <div className="flex overflow-x-auto pb-2 hide-scrollbar gap-2">
                        {quickResponses.map((response, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setInput(response)
                              if (inputRef.current) inputRef.current.focus()
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 text-[#800000] hover:bg-[#800000]/5 transition-colors whitespace-nowrap flex-shrink-0"
                          >
                            {response}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input area */}
                  <div className="p-4 border-t border-[#D4AF37]/20 bg-white flex gap-3 items-center mt-auto">
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        className="w-full border border-[#D4AF37]/30 rounded-full px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#800000]/30 focus:border-[#D4AF37] transition-all shadow-sm bg-gray-50"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message here..."
                        disabled={loading}
                        aria-label="Chatbot input"
                      />
                      {input.length > 0 && (
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setInput("")}
                          aria-label="Clear input"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      className="bg-gradient-to-r from-[#800000] to-[#9a0000] text-white p-2.5 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
                      onClick={sendMessage}
                      disabled={loading || !input.trim()}
                      aria-label="Send message"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizonal className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50 border-t border-[#D4AF37]/10">
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>Powered by WildWatch AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
