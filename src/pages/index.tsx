import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Message } from '../components/Message';
import { LoadingDots } from '../components/LoadingDots';
import { ThemeToggle } from '../components/ThemeToggle';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track theme changes for synchronized updates
  useEffect(() => {
    // Check initial dark mode state
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    // Create a mutation observer to track class changes on the html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Cleanup on unmount
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-focus input on page load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim() === '') return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input, messages: messages }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: data.response 
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit form on Enter (without Shift key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-dark-900 dark:to-dark-800">
      <Head>
        <title>Peter Roberts • Immigration Assistant</title>
        <meta name="description" content="Ask immigration questions to a virtual Peter Roberts" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
{/* Theme toggle removed from here */}

      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col"
      >
        <header className="mb-8">
          <div className="flex flex-col items-center">
            <h1 className={`text-2xl md:text-3xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Peter Roberts</span> Immigration Assistant
            </h1>
            <p className={`text-sm md:text-base max-w-md text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Ask immigration questions and get AI-generated responses based on Peter Roberts' past answers
            </p>
          </div>
        </header>

        <main className={`flex-1 flex flex-col rounded-2xl shadow-sm border ${isDarkMode ? 'border-dark-700 bg-dark-800' : 'border-gray-100 bg-white'} overflow-hidden`}>
          <div className={`flex-1 overflow-y-auto scrollbar-thin ${isDarkMode ? 'scrollbar-thumb-gray-600' : 'scrollbar-thumb-gray-300'}`}>
            <div className="p-4 md:p-6">
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col items-center justify-center h-full py-10 md:py-16"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h2 className={`text-lg md:text-xl font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Ask an immigration question
                  </h2>
                  <p className={`text-center max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Get AI-generated insights on visas, green cards, citizenship, and other immigration topics
                  </p>
                  <p className={`mt-2 text-center text-xs max-w-md ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Powered by AI fine-tuned on Peter Roberts' Hacker News immigration AMAs
                  </p>
                </motion.div>
              ) : (
                <div>
                  {messages.map((message, index) => (
                    <Message 
                      key={index}
                      content={message.content}
                      isUser={message.role === 'user'}
                    />
                  ))}
                  {isLoading && <LoadingDots />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className={`border-t ${isDarkMode ? 'border-dark-700' : 'border-gray-100'} p-3 md:p-4`}>
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about US immigration..."
                  className={`w-full py-3 px-4 pr-11 text-sm md:text-base resize-none overflow-hidden min-h-[42px] max-h-[200px] rounded-xl border transition-colors duration-150 ${isDarkMode ? 'border-dark-600 bg-dark-700 text-white hover:border-indigo-700 focus:border-indigo-500' : 'border-gray-200 bg-white text-gray-900 hover:border-indigo-300 focus:border-indigo-500'} shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none notransition`}
                  disabled={isLoading}
                  rows={1}
                />
                <motion.button
                  whileTap={input.trim() !== '' ? { scale: 0.95 } : {}}
                  type="submit"
                  disabled={isLoading || input.trim() === ''}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full transition-opacity cursor-default ${
                    input.trim() === '' 
                      ? `opacity-40 ${isDarkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'}`
                      : `${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </motion.button>
              </div>
            </form>
          </div>
        </main>

        <footer className="mt-6 flex flex-col items-center gap-3">
          <ThemeToggle />
          <div className="text-center text-xs text-gray-400 dark:text-gray-500">
            <p>
              For informational purposes only • Not legal advice
            </p>
            <p className="mt-1 text-xs">
              Fine-tuned OpenAI GPT-4o mini on Peter Roberts' past responses from Hacker News AMAs
            </p>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}