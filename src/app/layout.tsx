import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import LayoutWrapper from '@/components/LayoutWrapper';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hustle.Nunn Pro | Job Application Tracker',
  description: "Don't Give Up Until You Get Hired. Premium Application Tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-[#020617] text-slate-300">
        <ToastProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
