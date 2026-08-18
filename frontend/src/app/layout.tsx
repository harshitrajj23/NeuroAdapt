import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuroAdapt | Clinician-Guided Cognitive Rehabilitation',
  description: 'AI-assisted, home-based computerized cognitive retraining program for children with developmental disabilities. SIH Problem Statement SIH260206.',
  keywords: ['Cognitive Rehabilitation', 'SIH260206', 'NeuroAdapt', 'Child Development', 'Cognitive Retraining'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#fafafa] text-[#1a1a2e] antialiased selection:bg-violet-200 selection:text-violet-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
