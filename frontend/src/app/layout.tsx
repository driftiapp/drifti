import dynamic from 'next/dynamic';
import { inter, roboto, openSans } from '@/utils/fontOptimization';
import { CriticalCSS } from '@/utils/criticalCSS';
import ClientAnalytics from '@/components/ClientAnalytics';
import LoadingSpinner from '@/components/LoadingSpinner';

// Dynamically import components
const Providers = dynamic(() => import('@/components/Providers'), {
  loading: () => <LoadingSpinner fullScreen message="Loading application..." />,
});

const ClientLayout = dynamic(() => import('@/components/ClientLayout'), {
  loading: () => <LoadingSpinner />,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <CriticalCSS />
      <body
        className={`${inter.variable} ${roboto.variable} ${openSans.variable} font-sans antialiased`}
      >
        <Providers>
          <ClientLayout>
            {children}
            <ClientAnalytics />
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
