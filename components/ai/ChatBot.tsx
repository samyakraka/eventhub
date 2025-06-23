'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your EventHub assistant. How can I help you today?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const chatContainer = document.getElementById("chat-scroll");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQCLOUD_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant for EventHub, an event management platform. 
              You can help users with:
              - Creating and managing events
              - Finding events
              - Understanding platform features
              - Troubleshooting issues
              - General questions about the platform
              
              Keep your responses concise, friendly, and focused on event management.`
            },
            ...messages.filter(msg => msg.content !== 'Thinking...'),
            { role: 'user', content: userMessage }
          ]
        })
      })

      const data = await response.json()

      if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
        const assistantMessage = data.choices[0].message.content
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
      } else {
        console.error('Groqcloud API returned an unexpected response:', data)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I received an unexpected response from the AI. Please try again later.'
        }])
      }

    } catch (error) {
      console.error('Error fetching from Groqcloud API:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error communicating with the AI. Please ensure your Groqcloud API key is correct and try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(true)}
        className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-xl transition-all duration-300 ease-in-out flex items-center justify-center"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </Button>

      <div className={`fixed bottom-4 right-4 w-[360px] h-[500px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl text-white flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-50 ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 translate-y-2 pointer-events-none"}`} style={{pointerEvents: isOpen ? 'auto' : 'none'}}>
        {isOpen && (
          <>
            <CardHeader className="flex flex-row items-center justify-between h-14 px-4 border-b border-white/10 relative bg-transparent">
              <CardTitle className="text-xl font-bold text-white">EventHub Assistant</CardTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 text-white hover:text-red-400 transition"
                aria-label="Close chatbot"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="bg-transparent flex-1 flex flex-col p-0">
              <div
                id="chat-scroll"
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[400px] scroll-smooth scrollbar-thin scrollbar-thumb-purple-500"
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={
                      message.role === 'user'
                        ? 'flex flex-col items-end'
                        : 'flex flex-col items-start'
                    }
                  >
                    <div
                      className={
                        message.role === 'user'
                          ? 'self-end bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-3 rounded-xl max-w-[80%]'
                          : 'bg-white/10 backdrop-blur text-white p-3 rounded-xl max-w-[80%]'
                      }
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex flex-col items-start">
                    <div className="bg-white/10 backdrop-blur text-white p-3 rounded-xl max-w-[80%] animate-pulse flex items-center gap-2">
                      <span>Thinking</span>
                      <span className="typing-dots">...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full bg-white/10 text-white placeholder-gray-300 border border-white/20 px-4 py-2 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  disabled={isLoading}
                  autoFocus={isOpen}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-br from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white p-2 rounded-lg shadow-lg transition"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </CardContent>
          </>
        )}
      </div>
    </div>
  )
}
