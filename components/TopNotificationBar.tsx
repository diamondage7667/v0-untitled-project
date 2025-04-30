"use client";

import React from 'react';

interface TopNotificationBarProps {
  message: string;
  link?: string; // Optional link for the announcement
}

const TopNotificationBar: React.FC<TopNotificationBarProps> = ({ message, link }) => {
  const content = link ? <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">{message}</a> : message;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm py-2 px-4 sm:px-6 lg:px-8 text-center">
      {content}
      {/* Subtle divider line */}
      <hr className="border-t border-gray-200 dark:border-gray-700 mt-2" />
    </div>
  );
};

export default TopNotificationBar;
