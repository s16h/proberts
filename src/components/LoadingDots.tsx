import React from 'react';
import { motion } from 'framer-motion';

export const LoadingDots: React.FC = () => {
  return (
    <div className="p-4 mb-4 flex items-start">
      <div className="bg-white border border-gray-100 p-4 rounded-xl rounded-tl-none shadow-sm dark:bg-gray-800 dark:border-gray-700">
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