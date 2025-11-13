'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePlaygroundStore } from '@/lib/api-playground/store';
import { getMethodColor } from '@/lib/api-playground/utils';
import type { Collection, ApiRequest } from '@/lib/api-playground/types';
import {
  Search,
  Plus,
  FolderPlus,
  MoreVertical,
  Star,
  Clock,
  Trash2,
  Edit,
  FileText,
  ChevronRight,
  ChevronDown,
  Download,
  Upload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CollectionsSidebar() {
  const [activeTab, setActiveTab] = useState('collections');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-80 border-r flex flex-col h-full bg-muted/10">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="collections">
              <FolderPlus className="h-4 w-4 mr-2" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="collections" className="m-0 p-4">
            <CollectionsTab searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="history" className="m-0 p-4">
            <HistoryTab searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="favorites" className="m-0 p-4">
            <FavoritesTab searchQuery={searchQuery} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function CollectionsTab({ searchQuery }: { searchQuery: string }) {
  const { collections, createCollection } = usePlaygroundStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const { toast } = useToast();

  const filteredCollections = collections.filter(
    (col) =>
      col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.requests.some((req) =>
        req.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a collection name',
        variant: 'destructive',
      });
      return;
    }

    createCollection(newCollectionName, newCollectionDesc);
    setShowCreateDialog(false);
    setNewCollectionName('');
    setNewCollectionDesc('');
    toast({
      title: 'Collection created',
      description: `"${newCollectionName}" has been created`,
    });
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setShowCreateDialog(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        New Collection
      </Button>

      {filteredCollections.length === 0 && (
        <div className="text-center text-muted-foreground py-8 text-sm">
          {searchQuery ? 'No collections found' : 'No collections yet'}
        </div>
      )}

      {filteredCollections.map((collection) => (
        <CollectionItem
          key={collection.id}
          collection={collection}
          searchQuery={searchQuery}
        />
      ))}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Collections help you organize your API requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="My API Collection"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Describe this collection..."
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection}>Create Collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollectionItem({
  collection,
  searchQuery,
}: {
  collection: Collection;
  searchQuery: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    deleteCollection,
    loadRequestFromCollection,
    deleteRequestFromCollection,
    exportCollection,
  } = usePlaygroundStore();
  const { toast } = useToast();

  const filteredRequests = collection.requests.filter((req) =>
    req.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const col = exportCollection(collection.id);
    if (!col) return;

    const json = JSON.stringify(col, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Collection exported',
      description: 'Collection saved successfully',
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      deleteCollection(collection.id);
      toast({
        title: 'Collection deleted',
        description: `"${collection.name}" has been deleted`,
      });
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-2 bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{collection.name}</div>
          <div className="text-xs text-muted-foreground">
            {collection.requests.length} requests
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div className="p-2 space-y-1">
          {filteredRequests.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">
              No requests in this collection
            </div>
          ) : (
            filteredRequests.map((request) => (
              <RequestItem
                key={request.id}
                request={request}
                collectionId={collection.id}
                onLoad={() => loadRequestFromCollection(collection.id, request.id)}
                onDelete={() => {
                  if (confirm(`Delete "${request.name}"?`)) {
                    deleteRequestFromCollection(collection.id, request.id);
                    toast({
                      title: 'Request deleted',
                      description: `"${request.name}" has been deleted`,
                    });
                  }
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RequestItem({
  request,
  collectionId,
  onLoad,
  onDelete,
}: {
  request: ApiRequest;
  collectionId: string;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const { toggleFavorite, isFavorite } = usePlaygroundStore();
  const favorite = isFavorite(`${collectionId}-${request.id}`);

  return (
    <div
      className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer group"
      onClick={onLoad}
    >
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded ${getMethodColor(request.method)}`}
      >
        {request.method}
      </span>
      <span className="flex-1 text-sm truncate">{request.name}</span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(`${collectionId}-${request.id}`);
          }}
        >
          <Star
            className={`h-3 w-3 ${favorite ? 'fill-yellow-500 text-yellow-500' : ''}`}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function HistoryTab({ searchQuery }: { searchQuery: string }) {
  const { history, loadFromHistory, clearHistory } = usePlaygroundStore();
  const { toast } = useToast();

  const filteredHistory = history.filter((item) =>
    item.request.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearHistory();
      toast({
        title: 'History cleared',
        description: 'All history items have been removed',
      });
    }
  };

  return (
    <div className="space-y-2">
      {history.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleClearHistory}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      )}

      {filteredHistory.length === 0 && (
        <div className="text-center text-muted-foreground py-8 text-sm">
          {searchQuery ? 'No history found' : 'No requests in history'}
        </div>
      )}

      {filteredHistory.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-3 rounded border hover:bg-muted/50 cursor-pointer"
          onClick={() => loadFromHistory(item.id)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${getMethodColor(item.request.method)}`}
              >
                {item.request.method}
              </span>
              <span className="text-sm font-medium truncate">
                {item.request.name}
              </span>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {item.request.url}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(item.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FavoritesTab({ searchQuery }: { searchQuery: string }) {
  const { collections, favorites, loadRequestFromCollection } =
    usePlaygroundStore();

  const favoriteRequests = collections.flatMap((col) =>
    col.requests
      .filter((req) => favorites.includes(`${col.id}-${req.id}`))
      .map((req) => ({ request: req, collectionId: col.id, collectionName: col.name }))
  );

  const filteredFavorites = favoriteRequests.filter((item) =>
    item.request.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {filteredFavorites.length === 0 && (
        <div className="text-center text-muted-foreground py-8 text-sm">
          {searchQuery ? 'No favorites found' : 'No favorite requests yet'}
        </div>
      )}

      {filteredFavorites.map((item) => (
        <div
          key={`${item.collectionId}-${item.request.id}`}
          className="flex items-center gap-2 p-3 rounded border hover:bg-muted/50 cursor-pointer"
          onClick={() =>
            loadRequestFromCollection(item.collectionId, item.request.id)
          }
        >
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${getMethodColor(item.request.method)}`}
              >
                {item.request.method}
              </span>
              <span className="text-sm font-medium truncate">
                {item.request.name}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {item.collectionName}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
