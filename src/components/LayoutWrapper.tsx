'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen relative bg-[#020617]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div 
        className={`flex-grow flex flex-col min-w-0 transition-all duration-300 w-full ${
          isCollapsed ? 'md:pl-20' : 'md:pl-44'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
