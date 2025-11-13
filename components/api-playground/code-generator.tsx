'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlaygroundStore } from '@/lib/api-playground/store';
import {
  getAllCodeSnippets,
  type CodeLanguage,
} from '@/lib/api-playground/code-generator';
import { Copy, Check, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CodeGenerator() {
  const { currentRequest } = usePlaygroundStore();
  const [selectedLanguage, setSelectedLanguage] =
    useState<CodeLanguage>('javascript-fetch');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const snippets = getAllCodeSnippets(currentRequest);
  const currentSnippet = snippets.find((s) => s.language === selectedLanguage);

  const handleCopy = async () => {
    if (!currentSnippet) return;

    try {
      await navigator.clipboard.writeText(currentSnippet.code);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Code snippet copied successfully',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy code to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Code Generation</h3>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedLanguage}
            onValueChange={(value) => setSelectedLanguage(value as CodeLanguage)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {snippets.map((snippet) => (
                <SelectItem key={snippet.language} value={snippet.language}>
                  {snippet.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {currentSnippet ? (
            <pre className="bg-muted p-4 rounded-lg overflow-auto font-mono text-sm">
              <code>{currentSnippet.code}</code>
            </pre>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No code snippet available
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4 bg-muted/30">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">About Code Generation</p>
          <p>
            The code snippets generated here are ready to use in your application.
            They include all headers, authentication, query parameters, and request
            body configured in the request builder.
          </p>
        </div>
      </div>
    </div>
  );
}
