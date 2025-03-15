import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MessageProps {
  content: string;
  isUser: boolean;
}

export const Message: React.FC<MessageProps> = ({ content, isUser }) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  
  // Check for dark mode on client side
  React.useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    // Listen for changes to the color scheme
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        p-2 mb-2 flex flex-col 
        ${isUser ? 'items-end' : 'items-start'}
      `}
    >
      {!isUser && (
        <div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 ml-0.5">
          AI
        </div>
      )}
      <div className={`
        max-w-[85%] p-3 rounded-xl shadow-sm
        ${isUser 
          ? 'bg-indigo-600 text-white rounded-tr-none' 
          : 'bg-white border border-gray-100 rounded-tl-none dark:bg-dark-800 dark:border-dark-700 dark:text-white'
        }
      `}>
        <div className="text-sm md:text-base leading-relaxed markdown-body">
          <ReactMarkdown
            rehypePlugins={[rehypeSanitize]}
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              a: ({ node, ...props }) => (
                <a 
                  className={`underline ${isUser ? 'text-white/90 hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
              h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-3" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-2 mt-2" {...props} />,
              code: ({ node, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const inline = props.inline || false;
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={isUser ? oneDark : (isDarkMode ? oneDark : oneLight)}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md my-2 text-sm"
                    showLineNumbers={true}
                    customStyle={{
                      margin: '0.5em 0',
                      borderRadius: '0.375rem', 
                      background: isUser ? 'rgba(67, 56, 202, 0.3)' : undefined
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code 
                    className={`${className} ${props.inline ? `px-1 py-0.5 rounded ${isUser ? 'bg-indigo-700/40' : `bg-gray-100 ${isDarkMode ? 'dark:bg-dark-600' : ''}`}` : ''}`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ node, children, ...props }) => <pre className="my-2 rounded-md overflow-auto" {...props}>{children}</pre>,
              blockquote: ({ node, ...props }) => (
                <blockquote 
                  className={`border-l-4 pl-3 py-1 mb-2 ${isUser ? 'border-white/30' : 'border-gray-300 dark:border-gray-600'}`}
                  {...props} 
                />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};