import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim() === '') return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
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
      const assistantMessage: Message = { 
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
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-4">
      <Head>
        <title>Peter Roberts Immigration Assistant</title>
        <meta name="description" content="Ask immigration questions to a virtual Peter Roberts" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Peter Roberts Immigration Assistant</h1>
        <p className="text-center text-gray-600">
          Ask immigration questions and get responses based on Peter Roberts' HN AMAs
        </p>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="flex-1 bg-gray-100 rounded-lg p-4 mb-4 overflow-y-auto max-h-[60vh]">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center my-10">
              Ask a question about US immigration to get started
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-white text-gray-800 mr-auto'
                  } max-w-[80%]`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-white text-gray-800 p-3 rounded-lg mr-auto max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your immigration question here..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading || input.trim() === ''}
          >
            Send
          </button>
        </form>
      </main>

      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>
          This assistant is fine-tuned on Peter Roberts' Hacker News AMA responses and is for informational purposes only.
        </p>
        <p className="mt-1">
          It is not a substitute for professional legal advice.
        </p>
      </footer>
    </div>
  );
}