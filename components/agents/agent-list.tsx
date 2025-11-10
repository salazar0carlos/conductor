'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Agent } from '@/types'

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [])

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      if (data.success) {
        setAgents(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-neutral-400">Loading agents...</div>
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'busy': return 'primary'
      case 'idle': return 'neutral'
      case 'offline': return 'warning'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'llm': return '🤖'
      case 'tool': return '🔧'
      case 'human': return '👤'
      case 'supervisor': return '👔'
      case 'analyzer': return '🔍'
      default: return '⚙️'
    }
  }

  const getHeartbeatStatus = (lastHeartbeat: string | null) => {
    if (!lastHeartbeat) return 'Never'
    const diff = Date.now() - new Date(lastHeartbeat).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {agents.length === 0 ? (
        <div className="col-span-2 text-center py-12 border border-neutral-800 rounded-lg">
          <p className="text-neutral-400">No agents registered</p>
        </div>
      ) : (
        agents.map((agent) => (
          <div
            key={agent.id}
            className="border border-neutral-800 rounded-lg p-5 hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeIcon(agent.type)}</span>
                <div>
                  <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                  <p className="text-xs text-neutral-500 capitalize">{agent.type}</p>
                </div>
              </div>
              <Badge variant={statusVariant(agent.status)}>{agent.status}</Badge>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map((cap, idx) => (
                  <Badge key={idx} variant="default">{cap}</Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Last heartbeat: {getHeartbeatStatus(agent.last_heartbeat)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
