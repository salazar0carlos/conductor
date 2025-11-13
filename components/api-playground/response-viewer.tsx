'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePlaygroundStore } from '@/lib/api-playground/store';
import {
  formatJson,
  formatBytes,
  formatTime,
  getStatusColor,
} from '@/lib/api-playground/utils';
import {
  Copy,
  Download,
  Check,
  Clock,
  HardDrive,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ResponseViewer() {
  const { currentResponse, isLoading } = usePlaygroundStore();
  const [activeTab, setActiveTab] = useState('body');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Sending request...</p>
        </div>
      </div>
    );
  }

  if (!currentResponse) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-md">
          <Info className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold mb-2">No Response Yet</h3>
            <p className="text-muted-foreground">
              Send a request to see the response here. The response will include
              status, headers, body, and timing information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      const text = formatJson(currentResponse.data);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Response body copied successfully',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy response to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    try {
      const text = formatJson(currentResponse.data);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Downloaded',
        description: 'Response saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to download',
        description: 'Could not download response',
        variant: 'destructive',
      });
    }
  };

  const isSuccess = currentResponse.status >= 200 && currentResponse.status < 300;
  const isError = currentResponse.status >= 400;

  return (
    <div className="flex flex-col h-full">
      {/* Response Summary */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isSuccess ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : isError ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Info className="h-5 w-5 text-blue-600" />
            )}
            <Badge
              variant="outline"
              className={`font-semibold ${getStatusColor(currentResponse.status)}`}
            >
              {currentResponse.status} {currentResponse.statusText}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTime(currentResponse.time)}</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            <span>{formatBytes(currentResponse.size)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Response Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">
              Headers ({Object.keys(currentResponse.headers).length})
            </TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Body */}
          <TabsContent value="body" className="p-4 m-0">
            <JsonViewer data={currentResponse.data} />
          </TabsContent>

          {/* Headers */}
          <TabsContent value="headers" className="p-4 m-0">
            <HeadersViewer headers={currentResponse.headers} />
          </TabsContent>

          {/* Cookies */}
          <TabsContent value="cookies" className="p-4 m-0">
            <CookiesViewer cookies={currentResponse.cookies} />
          </TabsContent>

          {/* Raw */}
          <TabsContent value="raw" className="p-4 m-0">
            <pre className="bg-muted p-4 rounded-lg overflow-auto font-mono text-sm">
              {formatJson(currentResponse.data)}
            </pre>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function JsonViewer({ data }: { data: any }) {
  const formattedJson = formatJson(data);

  return (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-auto font-mono text-sm">
        <code className="language-json">{formattedJson}</code>
      </pre>
    </div>
  );
}

function HeadersViewer({ headers }: { headers: Record<string, string> }) {
  if (Object.keys(headers).length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No headers in response
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[200px,1fr] gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
        <div>KEY</div>
        <div>VALUE</div>
      </div>
      {Object.entries(headers).map(([key, value]) => (
        <div
          key={key}
          className="grid grid-cols-[200px,1fr] gap-4 text-sm py-2 border-b"
        >
          <div className="font-medium">{key}</div>
          <div className="font-mono text-muted-foreground break-all">{value}</div>
        </div>
      ))}
    </div>
  );
}

function CookiesViewer({ cookies }: { cookies?: Record<string, string> }) {
  if (!cookies || Object.keys(cookies).length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No cookies in response
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[200px,1fr] gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
        <div>NAME</div>
        <div>VALUE</div>
      </div>
      {Object.entries(cookies).map(([key, value]) => (
        <div
          key={key}
          className="grid grid-cols-[200px,1fr] gap-4 text-sm py-2 border-b"
        >
          <div className="font-medium">{key}</div>
          <div className="font-mono text-muted-foreground break-all">{value}</div>
        </div>
      ))}
    </div>
  );
}
