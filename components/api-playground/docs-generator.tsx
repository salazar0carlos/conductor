'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlaygroundStore } from '@/lib/api-playground/store';
import { getMethodColor, formatJson } from '@/lib/api-playground/utils';
import { generateCode } from '@/lib/api-playground/code-generator';
import type { Collection, ApiRequest } from '@/lib/api-playground/types';
import {
  FileText,
  Book,
  Eye,
  Code,
  Download,
  Share2,
  Settings,
  Globe,
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocsConfig {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  isPublic: boolean;
  showTryItOut: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export function DocsGenerator() {
  const { collections } = usePlaygroundStore();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [docsConfig, setDocsConfig] = useState<DocsConfig>({
    title: 'API Documentation',
    description: 'Comprehensive API documentation',
    version: '1.0.0',
    baseUrl: 'https://api.example.com',
    isPublic: true,
    showTryItOut: true,
    theme: 'light',
  });
  const { toast } = useToast();

  const selectedCollection = collections.find(
    (col) => col.id === selectedCollectionId
  );

  const handleExportDocs = () => {
    if (!selectedCollection) {
      toast({
        title: 'No collection selected',
        description: 'Please select a collection to export',
        variant: 'destructive',
      });
      return;
    }

    const docsHtml = generateDocsHtml(selectedCollection, docsConfig);
    const blob = new Blob([docsHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCollection.name.replace(/\s+/g, '-')}-docs.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Documentation exported',
      description: 'HTML file saved successfully',
    });
  };

  const handleExportMarkdown = () => {
    if (!selectedCollection) {
      toast({
        title: 'No collection selected',
        description: 'Please select a collection to export',
        variant: 'destructive',
      });
      return;
    }

    const markdown = generateMarkdown(selectedCollection, docsConfig);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCollection.name.replace(/\s+/g, '-')}-README.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Markdown exported',
      description: 'README.md file saved successfully',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Documentation Generator</h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
          >
            <Eye className="h-4 w-4 mr-2" />
            {viewMode === 'edit' ? 'Preview' : 'Edit'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            Export Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDocs}>
            <Download className="h-4 w-4 mr-2" />
            Export HTML
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {viewMode === 'edit' ? (
          <>
            {/* Configuration Panel */}
            <div className="w-80 border-r p-4 space-y-4">
              <div>
                <Label>Collection</Label>
                <Select
                  value={selectedCollectionId}
                  onValueChange={setSelectedCollectionId}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={docsConfig.title}
                  onChange={(e) =>
                    setDocsConfig({ ...docsConfig, title: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={docsConfig.description}
                  onChange={(e) =>
                    setDocsConfig({ ...docsConfig, description: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Version</Label>
                <Input
                  value={docsConfig.version}
                  onChange={(e) =>
                    setDocsConfig({ ...docsConfig, version: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Base URL</Label>
                <Input
                  value={docsConfig.baseUrl}
                  onChange={(e) =>
                    setDocsConfig({ ...docsConfig, baseUrl: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Public Documentation</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDocsConfig({
                        ...docsConfig,
                        isPublic: !docsConfig.isPublic,
                      })
                    }
                  >
                    {docsConfig.isPublic ? (
                      <Globe className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-orange-600" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <ScrollArea className="flex-1">
              <div className="p-8 max-w-4xl mx-auto">
                {selectedCollection ? (
                  <DocsPreview
                    collection={selectedCollection}
                    config={docsConfig}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-16">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a collection to generate documentation</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-8 max-w-4xl mx-auto">
              {selectedCollection ? (
                <DocsPreview collection={selectedCollection} config={docsConfig} />
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a collection to preview documentation</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

function DocsPreview({
  collection,
  config,
}: {
  collection: Collection;
  config: DocsConfig;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">{config.title}</h1>
          <Badge variant="outline">v{config.version}</Badge>
        </div>
        <p className="text-lg text-muted-foreground">{config.description}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Base URL:</span>
          <code className="bg-muted px-2 py-1 rounded">{config.baseUrl}</code>
        </div>
      </div>

      {/* Collection Info */}
      <Card>
        <CardHeader>
          <CardTitle>{collection.name}</CardTitle>
          {collection.description && (
            <CardDescription>{collection.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {collection.requests.length} endpoint(s)
          </p>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Endpoints</h2>
        {collection.requests.map((request) => (
          <EndpointDoc key={request.id} request={request} config={config} />
        ))}
      </div>
    </div>
  );
}

function EndpointDoc({
  request,
  config,
}: {
  request: ApiRequest;
  config: DocsConfig;
}) {
  const [showCode, setShowCode] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge className={getMethodColor(request.method)}>
            {request.method}
          </Badge>
          <code className="text-lg font-mono">{request.url}</code>
        </div>
        <CardTitle className="text-xl">{request.name}</CardTitle>
        {request.description && (
          <CardDescription>{request.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Parameters */}
        {request.queryParams.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Query Parameters</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Value</th>
                    <th className="text-left p-2">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {request.queryParams.map((param) => (
                    <tr key={param.id} className="border-t">
                      <td className="p-2 font-mono">{param.key}</td>
                      <td className="p-2 font-mono text-muted-foreground">
                        {param.value}
                      </td>
                      <td className="p-2">
                        {param.enabled ? (
                          <Badge variant="default" className="text-xs">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Headers */}
        {request.headers.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Headers</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {request.headers.map((header) => (
                    <tr key={header.id} className="border-t">
                      <td className="p-2 font-mono">{header.key}</td>
                      <td className="p-2 font-mono text-muted-foreground">
                        {header.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Request Body */}
        {request.body.type !== 'none' && (
          <div>
            <h4 className="font-semibold mb-2">Request Body</h4>
            {request.body.type === 'json' && request.body.json && (
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono">
                {request.body.json}
              </pre>
            )}
          </div>
        )}

        {/* Code Examples */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            <Code className="h-4 w-4 mr-2" />
            {showCode ? 'Hide' : 'Show'} Code Example
          </Button>

          {showCode && (
            <Tabs defaultValue="curl" className="mt-4">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono">
                  {generateCode(request, 'curl')}
                </pre>
              </TabsContent>
              <TabsContent value="javascript">
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono">
                  {generateCode(request, 'javascript-fetch')}
                </pre>
              </TabsContent>
              <TabsContent value="python">
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono">
                  {generateCode(request, 'python')}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function generateMarkdown(collection: Collection, config: DocsConfig): string {
  let md = `# ${config.title}\n\n`;
  md += `${config.description}\n\n`;
  md += `**Version:** ${config.version}\n`;
  md += `**Base URL:** \`${config.baseUrl}\`\n\n`;

  md += `## ${collection.name}\n\n`;
  if (collection.description) {
    md += `${collection.description}\n\n`;
  }

  md += `## Endpoints\n\n`;

  collection.requests.forEach((request) => {
    md += `### ${request.name}\n\n`;
    md += `\`${request.method}\` \`${request.url}\`\n\n`;

    if (request.description) {
      md += `${request.description}\n\n`;
    }

    if (request.queryParams.length > 0) {
      md += `#### Query Parameters\n\n`;
      md += `| Name | Value | Required |\n`;
      md += `|------|-------|----------|\n`;
      request.queryParams.forEach((param) => {
        md += `| \`${param.key}\` | \`${param.value}\` | ${param.enabled ? 'Yes' : 'No'} |\n`;
      });
      md += `\n`;
    }

    if (request.headers.length > 0) {
      md += `#### Headers\n\n`;
      md += `| Name | Value |\n`;
      md += `|------|-------|\n`;
      request.headers.forEach((header) => {
        md += `| \`${header.key}\` | \`${header.value}\` |\n`;
      });
      md += `\n`;
    }

    if (request.body.type === 'json' && request.body.json) {
      md += `#### Request Body\n\n`;
      md += `\`\`\`json\n${request.body.json}\n\`\`\`\n\n`;
    }

    md += `#### Example (cURL)\n\n`;
    md += `\`\`\`bash\n${generateCode(request, 'curl')}\n\`\`\`\n\n`;

    md += `---\n\n`;
  });

  return md;
}

function generateDocsHtml(collection: Collection, config: DocsConfig): string {
  // This would generate a full HTML page with styling
  // For brevity, returning a simplified version
  return `<!DOCTYPE html>
<html>
<head>
  <title>${config.title}</title>
  <style>
    body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .endpoint { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; margin: 1rem 0; }
    .method { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 0.25rem; font-weight: 600; }
    .get { background: #dcfce7; color: #16a34a; }
    .post { background: #dbeafe; color: #2563eb; }
    pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${config.title}</h1>
  <p>${config.description}</p>
  <p><strong>Version:</strong> ${config.version}</p>
  <p><strong>Base URL:</strong> <code>${config.baseUrl}</code></p>

  <h2>${collection.name}</h2>
  ${collection.description ? `<p>${collection.description}</p>` : ''}

  <h2>Endpoints</h2>
  ${collection.requests
    .map(
      (req) => `
    <div class="endpoint">
      <div>
        <span class="method ${req.method.toLowerCase()}">${req.method}</span>
        <code>${req.url}</code>
      </div>
      <h3>${req.name}</h3>
      ${req.description ? `<p>${req.description}</p>` : ''}
      ${
        req.body.type === 'json' && req.body.json
          ? `<h4>Request Body</h4><pre>${req.body.json}</pre>`
          : ''
      }
      <h4>Example (cURL)</h4>
      <pre>${generateCode(req, 'curl')}</pre>
    </div>
  `
    )
    .join('')}
</body>
</html>`;
}
