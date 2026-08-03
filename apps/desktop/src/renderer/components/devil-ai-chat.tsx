/**
 * Devil AI Animated Chat UI Components
 * 
 * JARVIS-style animations, typing indicators, and visual effects
 */

import React, { useState, useEffect, useRef } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
  emotion?: 'happy' | 'neutral' | 'concerned' | 'excited' | 'thinking'
  audioLevel?: number
}

export interface DevilAIChatProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isListening: boolean
  isSpeaking: boolean
  audioLevel: number
  language: 'en' | 'hi' | 'gu'
}

/**
 * JARVIS-style Typing Indicator
 */
export const TypingIndicator: React.FC<{ emotion?: string }> = ({ emotion = 'thinking' }) => {
  const [dots, setDots] = useState([0, 0, 0])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.map((_, i) => (i + Date.now() / 500) % 3))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-blue-500"
            style={{
              animation: 'bounce 1.4s infinite ease-in-out',
              animationDelay: `${i * 0.16}s`,
              opacity: dots[i] > 1 ? 1 : 0.3
            }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-400">
        {emotion === 'thinking' ? 'Thinking...' : 'Processing...'}
      </span>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

/**
 * Audio Visualizer (JARVIS-style)
 */
export const AudioVisualizer: React.FC<{ level: number; isActive: boolean }> = ({ level, isActive }) => {
  const bars = 20
  
  return (
    <div className="flex items-end gap-1 h-16 p-2 bg-black/30 rounded-lg">
      {Array.from({ length: bars }).map((_, i) => {
        const height = isActive 
          ? Math.max(4, Math.sin(Date.now() / 100 + i * 0.5) * level * 30 + 10)
          : 4
        
        return (
          <div
            key={i}
            className="w-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full transition-all duration-75"
            style={{
              height: `${height}px`,
              opacity: isActive ? 0.8 + Math.random() * 0.2 : 0.3
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * Emotion Indicator
 */
export const EmotionIndicator: React.FC<{ emotion: string }> = ({ emotion }) => {
  const emotionConfig = {
    happy: { emoji: '😊', color: 'text-green-400', bg: 'bg-green-500/20' },
    neutral: { emoji: '😐', color: 'text-gray-400', bg: 'bg-gray-500/20' },
    concerned: { emoji: '😟', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    excited: { emoji: '🎉', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    thinking: { emoji: '🤔', color: 'text-blue-400', bg: 'bg-blue-500/20' }
  }

  const config = emotionConfig[emotion as keyof typeof emotionConfig] || emotionConfig.neutral

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
      <span className="text-lg">{config.emoji}</span>
      <span className={`text-xs ${config.color}`}>{emotion}</span>
    </div>
  )
}

/**
 * Voice Wave Animation
 */
export const VoiceWave: React.FC<{ isListening: boolean }> = ({ isListening }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="w-1 bg-blue-500 rounded-full"
          style={{
            animation: isListening ? 'wave 1s ease-in-out infinite' : 'none',
            animationDelay: `${i * 0.1}s`,
            height: isListening ? '20px' : '4px'
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
      `}</style>
    </div>
  )
}

/**
 * JARVIS Avatar
 */
export const JarvisAvatar: React.FC<{ isSpeaking: boolean; emotion?: string }> = ({ isSpeaking, emotion }) => {
  return (
    <div className="relative">
      <div className={`
        w-12 h-12 rounded-full 
        bg-gradient-to-br from-blue-500 to-purple-600 
        flex items-center justify-center
        ${isSpeaking ? 'animate-pulse' : ''}
      `}>
        <span className="text-2xl">🤖</span>
      </div>
      
      {/* Status ring */}
      <div className={`
        absolute inset-0 rounded-full border-2 
        ${isSpeaking ? 'border-blue-400 animate-spin' : 'border-gray-600'}
      `} />
      
      {/* Emotion indicator */}
      {emotion && (
        <div className="absolute -bottom-1 -right-1">
          <EmotionIndicator emotion={emotion} />
        </div>
      )}
    </div>
  )
}

/**
 * Chat Message Bubble
 */
export const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="mr-3">
          <JarvisAvatar isSpeaking={false} emotion={message.emotion} />
        </div>
      )}
      
      <div className={`
        max-w-[70%] p-4 rounded-2xl
        ${isUser 
          ? 'bg-blue-600 text-white rounded-br-md' 
          : 'bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-bl-md'
        }
      `}>
        {message.emotion && !isUser && (
          <div className="mb-2">
            <EmotionIndicator emotion={message.emotion} />
          </div>
        )}
        
        <p className="text-sm leading-relaxed">{message.content}</p>
        
        <div className={`
          text-xs mt-2 
          ${isUser ? 'text-blue-200' : 'text-gray-400'}
        `}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {isUser && (
        <div className="ml-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
            <span className="text-xl">👤</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Language Selector
 */
export const LanguageSelector: React.FC<{
  selected: 'en' | 'hi' | 'gu'
  onSelect: (lang: 'en' | 'hi' | 'gu') => void
}> = ({ selected, onSelect }) => {
  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'hi' as const, name: 'हिंदी', flag: '🇮🇳' },
    { code: 'gu' as const, name: 'ગુજરાતી', flag: '🇮🇳' }
  ]

  return (
    <div className="flex gap-2">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => onSelect(lang.code)}
          className={`
            px-3 py-1 rounded-full text-sm font-medium transition-all
            ${selected === lang.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  )
}

/**
 * Voice Input Button (JARVIS-style)
 */
export const VoiceInputButton: React.FC<{
  isListening: boolean
  onToggle: () => void
}> = ({ isListening, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`
        relative w-14 h-14 rounded-full 
        flex items-center justify-center
        transition-all duration-300
        ${isListening 
          ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
          : 'bg-blue-600 hover:bg-blue-700'
        }
      `}
    >
      {isListening ? (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      ) : (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
      
      {/* Pulse ring */}
      {isListening && (
        <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
      )}
    </button>
  )
}

/**
 * Main Chat Interface
 */
export const DevilAIChat: React.FC<DevilAIChatProps> = ({
  messages,
  onSendMessage,
  isListening,
  isSpeaking,
  audioLevel,
  language
}) => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <JarvisAvatar isSpeaking={isSpeaking} />
            <div>
              <h2 className="text-white font-semibold">Devil AI</h2>
              <p className="text-xs text-gray-400">
                {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Ready'}
              </p>
            </div>
          </div>
          
          <LanguageSelector selected={language} onSelect={() => {}} />
        </div>
        
        {/* Audio Visualizer */}
        {(isListening || isSpeaking) && (
          <div className="mt-4">
            <AudioVisualizer level={audioLevel} isActive={isListening || isSpeaking} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <ChatBubble key={message.id} message={message} />
        ))}
        
        {/* Typing Indicator */}
        {isSpeaking && (
          <TypingIndicator emotion="thinking" />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <VoiceInputButton isListening={isListening} onToggle={() => {}} />
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'hi' ? 'बोलो या टाइप करो...' : language === 'gu' ? 'બોલો અથવા ટાઇપ કરો...' : 'Speak or type...'}
            className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={handleSend}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {[
            { label: '📁 Organize Files', command: 'organize my files' },
            { label: '🔍 Search', command: 'search google' },
            { label: '🏠 Smart Home', command: 'turn on lights' },
            { label: '📊 Status', command: 'daily briefing' }
          ].map(action => (
            <button
              key={action.command}
              onClick={() => onSendMessage(action.command)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-full whitespace-nowrap transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DevilAIChat
