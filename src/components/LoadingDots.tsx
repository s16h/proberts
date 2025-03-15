import React from 'react';
import { motion } from 'framer-motion';

export const LoadingDots: React.FC = () => {
  return (
    <div className="p-2 mb-2 flex items-start">
      <div className="bg-white border border-gray-100 p-3 rounded-xl rounded-tl-none shadow-sm dark:bg-dark-800 dark:border-dark-700 relative">
        <div className="absolute -top-2 -left-1 bg-indigo-100 dark:bg-indigo-900/40 rounded px-1.5 py-0.5 text-[10px] font-medium text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          AI
        </div>
        <motion.div 
          className="flex space-x-2 h-6 items-center"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "loop", delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "loop", delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "loop", delay: 0.4 }}
          />
        </motion.div>
      </div>
    </div>
  );
};