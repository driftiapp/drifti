import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ title, message, onRetry }: ErrorCardProps) {
  return (
    <Card className="border-destructive">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <AlertCircle className="h-4 w-4 text-destructive mr-2" />
        <CardTitle className="text-sm font-medium text-destructive">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="text-destructive hover:text-destructive"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 