'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlaygroundStore } from '@/lib/api-playground/store';
import {
  createEmptyKeyValue,
  getMethodColor,
  replaceVariables,
} from '@/lib/api-playground/utils';
import type { HttpMethod, KeyValue, AuthType, BodyType } from '@/lib/api-playground/types';
import { Send, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

export function RequestBuilder() {
  const { currentRequest, updateCurrentRequest, environments } =
    usePlaygroundStore();
  const [activeTab, setActiveTab] = useState('params');

  const handleMethodChange = (method: HttpMethod) => {
    updateCurrentRequest({ method });
  };

  const handleUrlChange = (url: string) => {
    updateCurrentRequest({ url });
  };

  const handleKeyValueUpdate = (
    type: 'headers' | 'queryParams',
    index: number,
    field: 'key' | 'value' | 'enabled' | 'description',
    value: any
  ) => {
    const items = [...currentRequest[type]];
    items[index] = { ...items[index], [field]: value };
    updateCurrentRequest({ [type]: items });
  };

  const handleAddKeyValue = (type: 'headers' | 'queryParams') => {
    const items = [...currentRequest[type], createEmptyKeyValue()];
    updateCurrentRequest({ [type]: items });
  };

  const handleRemoveKeyValue = (type: 'headers' | 'queryParams', index: number) => {
    const items = currentRequest[type].filter((_, i) => i !== index);
    updateCurrentRequest({ [type]: items });
  };

  const handleBodyTypeChange = (type: BodyType) => {
    updateCurrentRequest({
      body: { ...currentRequest.body, type },
    });
  };

  const handleBodyContentChange = (content: string) => {
    const bodyType = currentRequest.body.type;
    if (bodyType === 'json') {
      updateCurrentRequest({
        body: { ...currentRequest.body, json: content },
      });
    } else if (bodyType === 'raw') {
      updateCurrentRequest({
        body: { ...currentRequest.body, raw: content },
      });
    }
  };

  const handleAuthTypeChange = (type: AuthType) => {
    updateCurrentRequest({
      auth: { type },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Request Line */}
      <div className="flex gap-2 p-4 border-b">
        <Select
          value={currentRequest.method}
          onValueChange={(value) => handleMethodChange(value as HttpMethod)}
        >
          <SelectTrigger className={`w-32 font-semibold ${getMethodColor(currentRequest.method)}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="HEAD">HEAD</SelectItem>
            <SelectItem value="OPTIONS">OPTIONS</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Enter request URL (use {{variable}} for environment variables)"
          value={currentRequest.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Request Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="params">Query Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Query Params */}
          <TabsContent value="params" className="p-4 m-0">
            <KeyValueEditor
              items={currentRequest.queryParams}
              onUpdate={(index, field, value) =>
                handleKeyValueUpdate('queryParams', index, field, value)
              }
              onAdd={() => handleAddKeyValue('queryParams')}
              onRemove={(index) => handleRemoveKeyValue('queryParams', index)}
            />
          </TabsContent>

          {/* Headers */}
          <TabsContent value="headers" className="p-4 m-0">
            <KeyValueEditor
              items={currentRequest.headers}
              onUpdate={(index, field, value) =>
                handleKeyValueUpdate('headers', index, field, value)
              }
              onAdd={() => handleAddKeyValue('headers')}
              onRemove={(index) => handleRemoveKeyValue('headers', index)}
            />
          </TabsContent>

          {/* Body */}
          <TabsContent value="body" className="p-4 m-0">
            <BodyEditor
              body={currentRequest.body}
              onTypeChange={handleBodyTypeChange}
              onContentChange={handleBodyContentChange}
            />
          </TabsContent>

          {/* Auth */}
          <TabsContent value="auth" className="p-4 m-0">
            <AuthEditor
              auth={currentRequest.auth}
              onTypeChange={handleAuthTypeChange}
              onUpdate={(updates) =>
                updateCurrentRequest({ auth: { ...currentRequest.auth, ...updates } })
              }
            />
          </TabsContent>

          {/* Scripts */}
          <TabsContent value="scripts" className="p-4 m-0">
            <div className="space-y-4">
              <div>
                <Label>Pre-request Script</Label>
                <Textarea
                  placeholder="// JavaScript code to run before the request"
                  value={currentRequest.preRequestScript || ''}
                  onChange={(e) =>
                    updateCurrentRequest({ preRequestScript: e.target.value })
                  }
                  className="font-mono text-sm mt-2 min-h-[150px]"
                />
              </div>
              <div>
                <Label>Tests</Label>
                <Textarea
                  placeholder="// JavaScript assertions to validate the response"
                  value={currentRequest.tests || ''}
                  onChange={(e) => updateCurrentRequest({ tests: e.target.value })}
                  className="font-mono text-sm mt-2 min-h-[150px]"
                />
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

interface KeyValueEditorProps {
  items: KeyValue[];
  onUpdate: (
    index: number,
    field: 'key' | 'value' | 'enabled' | 'description',
    value: any
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function KeyValueEditor({ items, onUpdate, onAdd, onRemove }: KeyValueEditorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 text-sm font-medium text-muted-foreground mb-2">
        <div className="w-10"></div>
        <div>KEY</div>
        <div>VALUE</div>
        <div className="w-10"></div>
      </div>

      {items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 items-center">
          <Checkbox
            checked={item.enabled}
            onCheckedChange={(checked) =>
              onUpdate(index, 'enabled', checked === true)
            }
          />
          <Input
            placeholder="Key"
            value={item.key}
            onChange={(e) => onUpdate(index, 'key', e.target.value)}
          />
          <Input
            placeholder="Value"
            value={item.value}
            onChange={(e) => onUpdate(index, 'value', e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={onAdd} className="mt-2">
        <Plus className="h-4 w-4 mr-2" />
        Add Parameter
      </Button>
    </div>
  );
}

interface BodyEditorProps {
  body: any;
  onTypeChange: (type: BodyType) => void;
  onContentChange: (content: string) => void;
}

function BodyEditor({ body, onTypeChange, onContentChange }: BodyEditorProps) {
  return (
    <div className="space-y-4">
      <Select value={body.type} onValueChange={onTypeChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="raw">Raw</SelectItem>
          <SelectItem value="form-data">Form Data</SelectItem>
          <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
        </SelectContent>
      </Select>

      {body.type === 'json' && (
        <Textarea
          placeholder='{\n  "key": "value"\n}'
          value={body.json || ''}
          onChange={(e) => onContentChange(e.target.value)}
          className="font-mono text-sm min-h-[300px]"
        />
      )}

      {body.type === 'raw' && (
        <Textarea
          placeholder="Enter raw body content..."
          value={body.raw || ''}
          onChange={(e) => onContentChange(e.target.value)}
          className="font-mono text-sm min-h-[300px]"
        />
      )}

      {body.type === 'none' && (
        <div className="text-center text-muted-foreground py-8">
          This request does not have a body
        </div>
      )}
    </div>
  );
}

interface AuthEditorProps {
  auth: any;
  onTypeChange: (type: AuthType) => void;
  onUpdate: (updates: any) => void;
}

function AuthEditor({ auth, onTypeChange, onUpdate }: AuthEditorProps) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <Label>Auth Type</Label>
        <Select value={auth.type} onValueChange={onTypeChange} className="mt-2">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
            <SelectItem value="api-key">API Key</SelectItem>
            <SelectItem value="oauth2">OAuth 2.0</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {auth.type === 'bearer' && (
        <div>
          <Label>Token</Label>
          <div className="relative mt-2">
            <Input
              type={showSecret ? 'text' : 'password'}
              placeholder="Enter bearer token"
              value={auth.bearer?.token || ''}
              onChange={(e) =>
                onUpdate({ bearer: { token: e.target.value } })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {auth.type === 'basic' && (
        <div className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input
              placeholder="Enter username"
              value={auth.basic?.username || ''}
              onChange={(e) =>
                onUpdate({
                  basic: { ...auth.basic, username: e.target.value },
                })
              }
              className="mt-2"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Enter password"
              value={auth.basic?.password || ''}
              onChange={(e) =>
                onUpdate({
                  basic: { ...auth.basic, password: e.target.value },
                })
              }
              className="mt-2"
            />
          </div>
        </div>
      )}

      {auth.type === 'api-key' && (
        <div className="space-y-4">
          <div>
            <Label>Key</Label>
            <Input
              placeholder="e.g., X-API-Key"
              value={auth.apiKey?.key || ''}
              onChange={(e) =>
                onUpdate({
                  apiKey: { ...auth.apiKey, key: e.target.value },
                })
              }
              className="mt-2"
            />
          </div>
          <div>
            <Label>Value</Label>
            <Input
              type="password"
              placeholder="Enter API key"
              value={auth.apiKey?.value || ''}
              onChange={(e) =>
                onUpdate({
                  apiKey: { ...auth.apiKey, value: e.target.value },
                })
              }
              className="mt-2"
            />
          </div>
          <div>
            <Label>Add To</Label>
            <Select
              value={auth.apiKey?.addTo || 'header'}
              onValueChange={(value: 'header' | 'query') =>
                onUpdate({
                  apiKey: { ...auth.apiKey, addTo: value },
                })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query Params</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {auth.type === 'none' && (
        <div className="text-center text-muted-foreground py-8">
          This request does not use any authentication
        </div>
      )}
    </div>
  );
}
