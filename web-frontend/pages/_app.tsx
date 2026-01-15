import '@/styles/globals.css';
import 'reactflow/dist/style.css';
import type { AppProps } from 'next/app';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { FloatingTimerPopup } from '@/components/FloatingTimerPopup';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <TimerProvider>
            <Component {...pageProps} />
            <FloatingTimerPopup />
          </TimerProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
