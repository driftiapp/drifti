"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Download {
  id: string;
  userId: string;
  fileName: string;
  downloadDate: string;
  fileSize: number;
}

export function DownloadHistory() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDownloads() {
      try {
        const response = await fetch("/api/downloads");
        if (!response.ok) throw new Error("Failed to fetch downloads");
        const data = await response.json();
        setDownloads(data.downloads);
      } catch (error) {
        console.error("Error fetching downloads:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDownloads();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Download History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {downloads.length === 0 ? (
            <p className="text-muted-foreground">No downloads found</p>
          ) : (
            <div className="divide-y">
              {downloads.map((download) => (
                <div key={download.id} className="py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{download.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        Downloaded on {new Date(download.downloadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(download.fileSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 