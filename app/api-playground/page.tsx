'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RequestBuilder } from '@/components/api-playground/request-builder';
import { ResponseViewer } from '@/components/api-playground/response-viewer';
import { CollectionsSidebar } from '@/components/api-playground/collections-sidebar';
import { CodeGenerator } from '@/components/api-playground/code-generator';
import { EnvironmentsManager } from '@/components/api-playground/environments-manager';
import { DocsGenerator } from '@/components/api-playground/docs-generator';
import { usePlaygroundStore } from '@/lib/api-playground/store';
import {
  replaceVariables,
  buildUrl,
  headersToObject,
  calculateSize,
  importFromPostman,
  exportToPostman,
} from '@/lib/api-playground/utils';
import type { ApiResponse } from '@/lib/api-playground/types';
import {
  Send,
  Save,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Upload,
  FileText,
  Settings,
  Zap,
  Book,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ApiPlaygroundPage() {
  const {
    currentRequest,
    updateCurrentRequest,
    setCurrentResponse,
    setIsLoading,
    isLoading,
    environments,
    addToHistory,
    showSidebar,
    toggleSidebar,
    collections,
    activeCollectionId,
    addRequestToCollection,
    importCollection,
  } = usePlaygroundStore();

  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'code' | 'env' | 'docs'>('request');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const { toast } = useToast();

  const executeRequest = async () => {
    try {
      setIsLoading(true);

      // Replace environment variables in URL
      let processedUrl = replaceVariables(currentRequest.url, environments);

      // Replace variables in headers
      const processedHeaders = currentRequest.headers.map((header) => ({
        ...header,
        value: replaceVariables(header.value, environments),
      }));

      // Replace variables in query params
      const processedParams = currentRequest.queryParams.map((param) => ({
        ...param,
        value: replaceVariables(param.value, environments),
      }));

      // Create processed request
      const processedRequest = {
        ...currentRequest,
        url: processedUrl,
        headers: processedHeaders,
        queryParams: processedParams,
      };

      // Execute request via API proxy
      const response = await fetch('/api/playground/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedRequest),
      });

      const apiResponse: ApiResponse = await response.json();

      setCurrentResponse(apiResponse);
      addToHistory(currentRequest, apiResponse);
      setActiveTab('response');

      toast({
        title: 'Request completed',
        description: `${apiResponse.status} ${apiResponse.statusText}`,
      });
    } catch (error: any) {
      console.error('Request execution error:', error);
      toast({
        title: 'Request failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });

      // Set error response
      setCurrentResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: { error: true, message: error.message },
        time: 0,
        size: 0,
      });
      setActiveTab('response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRequest = () => {
    if (!requestName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a request name',
        variant: 'destructive',
      });
      return;
    }

    if (!activeCollectionId) {
      toast({
        title: 'No collection selected',
        description: 'Please select a collection first',
        variant: 'destructive',
      });
      return;
    }

    const requestToSave = {
      ...currentRequest,
      name: requestName,
    };

    addRequestToCollection(activeCollectionId, requestToSave);
    setShowSaveDialog(false);
    setRequestName('');

    toast({
      title: 'Request saved',
      description: `"${requestName}" has been added to the collection`,
    });
  };

  const handleExportAll = () => {
    const exportData = {
      collections,
      environments,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-playground-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export complete',
      description: 'All collections and environments exported',
    });
  };

  const handleImport = () => {
    try {
      const collection = importFromPostman(importText);
      importCollection(collection);
      setShowImportDialog(false);
      setImportText('');

      toast({
        title: 'Import successful',
        description: `"${collection.name}" has been imported`,
      });
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
            >
              {showSidebar ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">API Playground</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={!activeCollectionId}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              size="sm"
              onClick={executeRequest}
              disabled={isLoading || !currentRequest.url}
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && <CollectionsSidebar />}

        {/* Center Panel */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList className="h-12">
                <TabsTrigger value="request">
                  <Settings className="h-4 w-4 mr-2" />
                  Request
                </TabsTrigger>
                <TabsTrigger value="response">
                  <FileText className="h-4 w-4 mr-2" />
                  Response
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Zap className="h-4 w-4 mr-2" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="env">
                  <Settings className="h-4 w-4 mr-2" />
                  Environments
                </TabsTrigger>
                <TabsTrigger value="docs">
                  <Book className="h-4 w-4 mr-2" />
                  Docs
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="request" className="flex-1 m-0">
              <RequestBuilder />
            </TabsContent>

            <TabsContent value="response" className="flex-1 m-0">
              <ResponseViewer />
            </TabsContent>

            <TabsContent value="code" className="flex-1 m-0">
              <CodeGenerator />
            </TabsContent>

            <TabsContent value="env" className="flex-1 m-0">
              <EnvironmentsManager />
            </TabsContent>

            <TabsContent value="docs" className="flex-1 m-0">
              <DocsGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Request</DialogTitle>
            <DialogDescription>
              Save this request to the active collection
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Request Name</Label>
            <Input
              placeholder="e.g., Get User Profile"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRequest}>Save Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Collection</DialogTitle>
            <DialogDescription>
              Import a Postman collection (JSON format)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upload File</Label>
              <Input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Or paste JSON</Label>
              <textarea
                placeholder="Paste Postman collection JSON here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-64 mt-2 p-2 border rounded font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importText}>
              Import Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
