import React from 'react';
import { motion } from 'framer-motion';

export const LoadingDots: React.FC = () => {
  return (
    <div className="p-2 mb-2 flex items-start">
      <div className="flex flex-col">
        <div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 ml-0.5">
          AI
        </div>
        <div className="bg-white border border-gray-100 p-3 rounded-xl rounded-tl-none shadow-sm dark:bg-dark-800 dark:border-dark-700">
        <motion.div 
          className="flex space-x-1 h-4 items-center"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        >
          <motion.div
            className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, repeatType: "loop", delay: 0 }}
          />
          <motion.div
            className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, repeatType: "loop", delay: 0.15 }}
          />
          <motion.div
            className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, repeatType: "loop", delay: 0.3 }}
          />
        </motion.div>
        </div>
      </div>
    </div>
  );
};