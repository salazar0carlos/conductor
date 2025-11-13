'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, ExternalLink, Github, Cloud, Database, Key, Zap, MessageSquare, Bell, FileText, CreditCard, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

type IntegrationType =
  | 'github'
  | 'vercel'
  | 'supabase'
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'slack'
  | 'discord'
  | 'linear'
  | 'notion'
  | 'stripe'

interface IntegrationConfig {
  type: IntegrationType
  name: string
  description: string
  icon: React.ElementType
  authType: 'oauth' | 'api_key' | 'hybrid'
  color: string
  fields: {
    name: string
    label: string
    type: 'text' | 'password' | 'url'
    placeholder: string
    required: boolean
    description?: string
  }[]
  docsUrl: string
  setupInstructions: string[]
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    type: 'github',
    name: 'GitHub',
    description: 'Connect repositories, automate workflows, and deploy with GitHub Actions',
    icon: Github,
    authType: 'oauth',
    color: 'from-gray-600 to-gray-800',
    fields: [],
    docsUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
    setupInstructions: [
      'Click "Connect with GitHub" to authorize',
      'Select repositories you want Conductor to access',
      'Grant necessary permissions for automation'
    ]
  },
  {
    type: 'vercel',
    name: 'Vercel',
    description: 'Deploy and manage your applications with Vercel\'s platform',
    icon: Cloud,
    authType: 'api_key',
    color: 'from-black to-gray-900',
    fields: [
      {
        name: 'api_key',
        label: 'Vercel Token',
        type: 'password',
        placeholder: 'vercel_••••••••••••',
        required: true,
        description: 'Get your token from Account Settings → Tokens'
      },
      {
        name: 'team_id',
        label: 'Team ID (Optional)',
        type: 'text',
        placeholder: 'team_••••••••',
        required: false,
        description: 'Required for team projects'
      }
    ],
    docsUrl: 'https://vercel.com/docs/rest-api#creating-an-access-token',
    setupInstructions: [
      'Go to Vercel Account Settings → Tokens',
      'Create a new token with deployment permissions',
      'Copy and paste the token below'
    ]
  },
  {
    type: 'supabase',
    name: 'Supabase',
    description: 'Connect to Supabase databases and manage backend services',
    icon: Database,
    authType: 'api_key',
    color: 'from-emerald-600 to-teal-700',
    fields: [
      {
        name: 'project_url',
        label: 'Project URL',
        type: 'url',
        placeholder: 'https://your-project.supabase.co',
        required: true,
        description: 'Your Supabase project URL'
      },
      {
        name: 'api_key',
        label: 'Service Role Key',
        type: 'password',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        required: true,
        description: 'Service role key from Project Settings → API'
      }
    ],
    docsUrl: 'https://supabase.com/docs/guides/api',
    setupInstructions: [
      'Open your Supabase project dashboard',
      'Go to Project Settings → API',
      'Copy the Project URL and service_role key'
    ]
  },
  {
    type: 'anthropic',
    name: 'Anthropic',
    description: 'Use Claude AI models for advanced agent capabilities',
    icon: Sparkles,
    authType: 'api_key',
    color: 'from-orange-500 to-amber-600',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-ant-api03-••••••••',
        required: true,
        description: 'Get your API key from console.anthropic.com'
      }
    ],
    docsUrl: 'https://console.anthropic.com/settings/keys',
    setupInstructions: [
      'Visit console.anthropic.com',
      'Navigate to API Keys',
      'Create a new API key'
    ]
  },
  {
    type: 'openai',
    name: 'OpenAI',
    description: 'Integrate GPT models for AI-powered features',
    icon: Zap,
    authType: 'api_key',
    color: 'from-green-600 to-emerald-700',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-••••••••••••',
        required: true,
        description: 'Get your API key from platform.openai.com'
      }
    ],
    docsUrl: 'https://platform.openai.com/api-keys',
    setupInstructions: [
      'Go to platform.openai.com',
      'Navigate to API keys section',
      'Create a new secret key'
    ]
  },
  {
    type: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    icon: MessageSquare,
    authType: 'oauth',
    color: 'from-purple-600 to-pink-600',
    fields: [
      {
        name: 'webhook_url',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://hooks.slack.com/services/...',
        required: true,
        description: 'Create a webhook in Slack App settings'
      }
    ],
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    setupInstructions: [
      'Create a Slack App at api.slack.com/apps',
      'Enable Incoming Webhooks',
      'Add webhook to workspace and copy URL'
    ]
  },
  {
    type: 'discord',
    name: 'Discord',
    description: 'Post updates and notifications to Discord servers',
    icon: Bell,
    authType: 'api_key',
    color: 'from-indigo-600 to-blue-700',
    fields: [
      {
        name: 'webhook_url',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://discord.com/api/webhooks/...',
        required: true,
        description: 'Create a webhook in Discord channel settings'
      }
    ],
    docsUrl: 'https://discord.com/developers/docs/resources/webhook',
    setupInstructions: [
      'Go to Discord channel settings',
      'Navigate to Integrations → Webhooks',
      'Create webhook and copy URL'
    ]
  },
  {
    type: 'linear',
    name: 'Linear',
    description: 'Sync issues and track project progress with Linear',
    icon: FileText,
    authType: 'api_key',
    color: 'from-blue-600 to-cyan-700',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'lin_api_••••••••',
        required: true,
        description: 'Generate a personal API key in Linear settings'
      }
    ],
    docsUrl: 'https://developers.linear.app/docs/graphql/working-with-the-graphql-api',
    setupInstructions: [
      'Open Linear settings',
      'Go to API section',
      'Create a new personal API key'
    ]
  },
  {
    type: 'notion',
    name: 'Notion',
    description: 'Connect to Notion databases and create documentation',
    icon: FileText,
    authType: 'oauth',
    color: 'from-gray-700 to-gray-900',
    fields: [
      {
        name: 'api_key',
        label: 'Integration Token',
        type: 'password',
        placeholder: 'secret_••••••••',
        required: true,
        description: 'Create an integration at notion.so/my-integrations'
      }
    ],
    docsUrl: 'https://developers.notion.com/docs/create-a-notion-integration',
    setupInstructions: [
      'Visit notion.so/my-integrations',
      'Create a new integration',
      'Copy the Internal Integration Token'
    ]
  },
  {
    type: 'stripe',
    name: 'Stripe',
    description: 'Process payments and manage subscriptions',
    icon: CreditCard,
    authType: 'api_key',
    color: 'from-violet-600 to-purple-700',
    fields: [
      {
        name: 'api_key',
        label: 'Secret Key',
        type: 'password',
        placeholder: 'sk_test_••••••••',
        required: true,
        description: 'Get your secret key from Stripe Dashboard'
      },
      {
        name: 'webhook_secret',
        label: 'Webhook Secret (Optional)',
        type: 'password',
        placeholder: 'whsec_••••••••',
        required: false,
        description: 'For webhook signature verification'
      }
    ],
    docsUrl: 'https://stripe.com/docs/keys',
    setupInstructions: [
      'Open Stripe Dashboard',
      'Go to Developers → API keys',
      'Copy the Secret key (use test key for testing)'
    ]
  }
]

interface AddIntegrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddIntegrationModal({ open, onOpenChange, onSuccess }: AddIntegrationModalProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const handleBack = () => {
    setSelectedIntegration(null)
    setFormData({})
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    if (!selectedIntegration) return

    // Validate required fields first
    const hasRequiredFields = selectedIntegration.fields
      .filter(f => f.required)
      .every(f => formData[f.name]?.trim())

    if (!hasRequiredFields) {
      toast.error('Please fill in all required fields')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedIntegration.type,
          credentials: formData
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult('success')
        toast.success(data.data.message || 'Connection test successful!')
      } else {
        throw new Error(data.error || 'Connection test failed')
      }
    } catch (error) {
      setTestResult('error')
      toast.error(error instanceof Error ? error.message : 'Connection test failed. Please check your credentials.')
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIntegration) return

    setLoading(true)

    try {
      // Handle OAuth flow
      if (selectedIntegration.authType === 'oauth' && selectedIntegration.type === 'github') {
        // Redirect to GitHub OAuth
        window.location.href = '/api/github/oauth?type=integration'
        return
      }

      // Validate required name field
      if (!formData.name?.trim()) {
        toast.error('Please enter a name for this integration')
        return
      }

      // Build config object without api_key and name
      const { api_key, name, ...configFields } = formData

      // Handle API key based integrations
      const response = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_type: selectedIntegration.type,
          integration_name: name,
          api_key: api_key,
          config: configFields
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add integration')
      }

      toast.success(`${selectedIntegration.name} integration added successfully!`)
      onSuccess?.()
      onOpenChange(false)
      handleBack()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add integration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {!selectedIntegration ? (
          <>
            <DialogHeader>
              <DialogTitle>Add Integration</DialogTitle>
              <DialogDescription>
                Connect external services to enhance Conductor&apos;s capabilities
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="popular" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              <TabsContent value="popular" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {INTEGRATIONS.filter(i => ['github', 'vercel', 'supabase', 'anthropic'].includes(i.type)).map((integration) => (
                    <IntegrationCard
                      key={integration.type}
                      integration={integration}
                      onClick={() => setSelectedIntegration(integration)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="development" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {INTEGRATIONS.filter(i => ['github', 'vercel', 'supabase', 'linear', 'stripe'].includes(i.type)).map((integration) => (
                    <IntegrationCard
                      key={integration.type}
                      integration={integration}
                      onClick={() => setSelectedIntegration(integration)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {INTEGRATIONS.filter(i => ['slack', 'discord', 'notion'].includes(i.type)).map((integration) => (
                    <IntegrationCard
                      key={integration.type}
                      integration={integration}
                      onClick={() => setSelectedIntegration(integration)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={loading}
                >
                  ← Back
                </Button>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedIntegration.color}`}>
                  <selectedIntegration.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle>Connect {selectedIntegration.name}</DialogTitle>
                  <DialogDescription>{selectedIntegration.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Setup Instructions */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Setup Instructions</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(selectedIntegration.docsUrl, '_blank')}
                  >
                    View Docs <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {selectedIntegration.setupInstructions.map((instruction, i) => (
                    <li key={i}>{instruction}</li>
                  ))}
                </ol>
              </div>

              {/* OAuth vs API Key */}
              {selectedIntegration.authType === 'oauth' && selectedIntegration.type === 'github' ? (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Github className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      You&apos;ll be redirected to GitHub to authorize Conductor
                    </p>
                    <Button type="submit" disabled={loading} className="gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Github className="w-4 h-4" />
                          Connect with GitHub
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Integration Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Integration Name
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={`My ${selectedIntegration.name} Integration`}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Give this integration a unique name (required)
                    </p>
                  </div>

                  {/* Dynamic Fields */}
                  {selectedIntegration.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Input
                        id={field.name}
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                      {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  ))}

                  {/* Test Connection */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={testing || loading}
                      className="gap-2"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                    {testResult === 'success' && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Connection successful
                      </div>
                    )}
                    {testResult === 'error' && (
                      <div className="flex items-center gap-1 text-destructive text-sm">
                        <XCircle className="w-4 h-4" />
                        Connection failed
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading || testing}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        'Add Integration'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function IntegrationCard({ integration, onClick }: { integration: IntegrationConfig; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all text-left hover:shadow-lg hover:scale-[1.02]"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${integration.color} shadow-lg`}>
          <integration.icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{integration.name}</h3>
            <Badge variant="outline" className="text-xs">
              {integration.authType === 'oauth' ? 'OAuth' : 'API Key'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {integration.description}
          </p>
        </div>
      </div>
    </button>
  )
}
