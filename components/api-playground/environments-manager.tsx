'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePlaygroundStore } from '@/lib/api-playground/store';
import { generateId } from '@/lib/api-playground/utils';
import type { EnvironmentVariable } from '@/lib/api-playground/types';
import { Plus, Trash2, Eye, EyeOff, Globe, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EnvironmentsManager() {
  const {
    environments,
    activeEnvironmentId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
  } = usePlaygroundStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const activeEnv = environments.find((env) => env.id === activeEnvironmentId);

  const handleCreateEnvironment = () => {
    if (!newEnvName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter an environment name',
        variant: 'destructive',
      });
      return;
    }

    createEnvironment(newEnvName);
    setShowCreateDialog(false);
    setNewEnvName('');
    toast({
      title: 'Environment created',
      description: `"${newEnvName}" has been created`,
    });
  };

  const handleDeleteEnvironment = (id: string, name: string) => {
    if (id === 'default') {
      toast({
        title: 'Cannot delete',
        description: 'The default environment cannot be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteEnvironment(id);
      toast({
        title: 'Environment deleted',
        description: `"${name}" has been deleted`,
      });
    }
  };

  const handleAddVariable = () => {
    if (!activeEnv) return;

    const newVariable: EnvironmentVariable = {
      id: generateId(),
      key: '',
      value: '',
      enabled: true,
      secret: false,
    };

    updateEnvironment(activeEnv.id, {
      variables: [...activeEnv.variables, newVariable],
    });
  };

  const handleUpdateVariable = (
    index: number,
    field: keyof EnvironmentVariable,
    value: any
  ) => {
    if (!activeEnv) return;

    const variables = [...activeEnv.variables];
    variables[index] = { ...variables[index], [field]: value };
    updateEnvironment(activeEnv.id, { variables });
  };

  const handleRemoveVariable = (index: number) => {
    if (!activeEnv) return;

    const variables = activeEnv.variables.filter((_, i) => i !== index);
    updateEnvironment(activeEnv.id, { variables });
  };

  const toggleShowSecret = (variableId: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [variableId]: !prev[variableId],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Environments</h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Environment
        </Button>
      </div>

      <div className="flex items-center gap-4 p-4 border-b">
        <Label>Active Environment:</Label>
        <Select
          value={activeEnvironmentId || undefined}
          onValueChange={setActiveEnvironment}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent>
            {environments.map((env) => (
              <SelectItem key={env.id} value={env.id}>
                {env.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeEnv && activeEnv.id !== 'default' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteEnvironment(activeEnv.id, activeEnv.name)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {activeEnv ? (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Variables are used with {'{{'} key {'}}'}syntax in requests
                </p>
                <Button variant="outline" size="sm" onClick={handleAddVariable}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </div>

              {activeEnv.variables.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                  No variables defined
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[auto,150px,1fr,auto,auto] gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <div className="w-10"></div>
                    <div>KEY</div>
                    <div>VALUE</div>
                    <div className="w-20 text-center">SECRET</div>
                    <div className="w-10"></div>
                  </div>

                  {activeEnv.variables.map((variable, index) => (
                    <div
                      key={variable.id}
                      className="grid grid-cols-[auto,150px,1fr,auto,auto] gap-2 items-center"
                    >
                      <Checkbox
                        checked={variable.enabled}
                        onCheckedChange={(checked) =>
                          handleUpdateVariable(index, 'enabled', checked === true)
                        }
                      />
                      <Input
                        placeholder="Key"
                        value={variable.key}
                        onChange={(e) =>
                          handleUpdateVariable(index, 'key', e.target.value)
                        }
                        className="font-mono text-sm"
                      />
                      <div className="relative">
                        <Input
                          type={
                            variable.secret && !showSecrets[variable.id]
                              ? 'password'
                              : 'text'
                          }
                          placeholder="Value"
                          value={variable.value}
                          onChange={(e) =>
                            handleUpdateVariable(index, 'value', e.target.value)
                          }
                          className="font-mono text-sm pr-10"
                        />
                        {variable.secret && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => toggleShowSecret(variable.id)}
                          >
                            {showSecrets[variable.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUpdateVariable(index, 'secret', !variable.secret)
                          }
                        >
                          <Lock
                            className={`h-4 w-4 ${variable.secret ? 'text-orange-600' : 'text-muted-foreground'}`}
                          />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariable(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Variable Scoping</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  • <strong>Environment variables</strong> are specific to the
                  selected environment
                </p>
                <p>
                  • Use <code className="bg-muted px-1 py-0.5 rounded">
                    {'{{'} variableName {'}}'}</code> to reference variables in your
                  requests
                </p>
                <p>
                  • Secret variables are masked in the UI for security
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            Select an environment to manage variables
          </div>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Environment</DialogTitle>
            <DialogDescription>
              Environments help you organize variables for different contexts (dev,
              staging, production)
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Name</Label>
            <Input
              placeholder="e.g., Production"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEnvironment}>Create Environment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
