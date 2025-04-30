import NavbarWrapper from '@/components/NavbarWrapper';
import { AuthProvider } from '@/lib/contexts/authContext';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TurfMania',
  description: 'Streamlining the Turf Industry in Bangladesh',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <main>
            <NavbarWrapper />
            {children}
          </main>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
