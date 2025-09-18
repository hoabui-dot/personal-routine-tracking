import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </ThemeProvider>
  );
}
