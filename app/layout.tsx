import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mooder - AI Music for Your Mood',
  description: 'AI picks music for your mood',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}