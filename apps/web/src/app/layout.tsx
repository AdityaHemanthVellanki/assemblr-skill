import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Assemblr',
  description: 'Skill graph platform for cross-tool workflow intelligence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen antialiased font-sans">
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
        <Toaster theme="dark" richColors closeButton position="bottom-right" />
      </body>
    </html>
  );
}
