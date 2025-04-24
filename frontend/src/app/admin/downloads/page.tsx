import { DownloadLogger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DownloadStats } from './download-stats';
import { DownloadChart } from './download-chart';
import { ErrorStats } from './error-stats';
import { RecentDownloads } from './recent-downloads';
import { ErrorDetails } from './error-details';
import { DownloadSpeed } from './download-speed';

export default async function DownloadsPage() {
  const logger = DownloadLogger.getInstance();
  const [recentDownloads, errorStats] = await Promise.all([
    logger.getRecentDownloads(20),
    logger.getErrorStats('week'),
  ]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Download Statistics</h1>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="speed">Speed Analysis</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="recent">Recent Downloads</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DownloadStats filename="all" />
          <DownloadChart />
        </TabsContent>

        <TabsContent value="speed" className="space-y-4">
          <DownloadSpeed />
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <ErrorStats data={errorStats} />
          <ErrorDetails data={errorStats} />
        </TabsContent>

        <TabsContent value="recent">
          <RecentDownloads data={recentDownloads} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 