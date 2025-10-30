import type { AppProps } from 'next/app';
import { ImageViewerProvider } from '@/components/ImageViewerProvider';
import '../app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ImageViewerProvider>
      <Component {...pageProps} />
    </ImageViewerProvider>
  );
}
