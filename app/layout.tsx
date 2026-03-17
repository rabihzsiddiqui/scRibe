import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lora } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';
import { ModeProvider } from './components/ModeProvider';
import { ContentProvider } from './components/ContentProvider';
import { Topbar } from './components/Topbar';
import { MainLayout } from './components/MainLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'scRibe',
  description: 'a minimal writing tool',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* prevent flash on load: read stored theme and apply before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}>
        <ThemeProvider>
          <ModeProvider>
            <ContentProvider>
              <Topbar />
              <MainLayout>
                {children}
              </MainLayout>
            </ContentProvider>
          </ModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
