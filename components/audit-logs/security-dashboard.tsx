'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface SecurityAlert {
  id: string
  alert_type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  description: string
  user_id?: string
  user_email?: string
  resource_type?: string
  resource_id?: string
  triggering_event_ids?: string[]
  event_count?: number
  time_window_minutes?: number
  ip_addresses?: string[]
  countries?: string[]
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  assigned_to?: string
  resolved_at?: string
  resolution_notes?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export function SecurityDashboard() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'investigating' | 'resolved'>('open')
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const statusParam = filter === 'all' ? '' : `?status=${filter}`
      const res = await fetch(`/api/audit/alerts${statusParam}`)
      const data = await res.json()

      if (data.success) {
        setAlerts(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch security alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAlertStatus = async (
    alertId: string,
    status: string,
    resolutionNotes?: string
  ) => {
    try {
      const res = await fetch('/api/audit/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: alertId,
          status,
          resolution_notes: resolutionNotes,
        }),
      })

      const data = await res.json()

      if (data.success) {
        await fetchAlerts()
        setSelectedAlert(null)
      }
    } catch (error) {
      console.error('Failed to update alert:', error)
      alert('Failed to update alert status')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
      default:
        return 'neutral'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error'
      case 'investigating':
        return 'warning'
      case 'resolved':
        return 'success'
      case 'false_positive':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  const formatAlertType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const openAlerts = alerts.filter(a => a.status === 'open').length
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Security Monitoring</h2>
        <div className="flex gap-4">
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-2">
            <div className="text-xs text-red-400">Open Alerts</div>
            <div className="text-2xl font-bold text-red-400">{openAlerts}</div>
          </div>
          <div className="bg-orange-900/20 border border-orange-800/30 rounded-lg px-4 py-2">
            <div className="text-xs text-orange-400">Critical</div>
            <div className="text-2xl font-bold text-orange-400">{criticalAlerts}</div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {['all', 'open', 'investigating', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-white text-black'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          <p className="text-neutral-400 mt-4">Loading security alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
          <p className="text-neutral-400">No security alerts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-colors cursor-pointer"
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                    <Badge variant={getStatusColor(alert.status) as any}>
                      {alert.status}
                    </Badge>
                    <span className="text-xs text-neutral-500">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {alert.title}
                  </h3>
                  <p className="text-sm text-neutral-400">{alert.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {alert.alert_type && (
                  <div>
                    <span className="text-neutral-500">Type:</span>{' '}
                    <span className="text-white">{formatAlertType(alert.alert_type)}</span>
                  </div>
                )}
                {alert.user_email && (
                  <div>
                    <span className="text-neutral-500">User:</span>{' '}
                    <span className="text-white">{alert.user_email}</span>
                  </div>
                )}
                {alert.ip_addresses && alert.ip_addresses.length > 0 && (
                  <div>
                    <span className="text-neutral-500">IPs:</span>{' '}
                    <span className="text-white font-mono text-xs">
                      {alert.ip_addresses.join(', ')}
                    </span>
                  </div>
                )}
                {alert.event_count && (
                  <div>
                    <span className="text-neutral-500">Events:</span>{' '}
                    <span className="text-white">{alert.event_count}</span>
                  </div>
                )}
              </div>

              {alert.status === 'open' && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateAlertStatus(alert.id, 'investigating')
                    }}
                  >
                    Investigate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      const notes = prompt('Resolution notes:')
                      if (notes) {
                        updateAlertStatus(alert.id, 'resolved', notes)
                      }
                    }}
                  >
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateAlertStatus(alert.id, 'false_positive')
                    }}
                  >
                    False Positive
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-neutral-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{selectedAlert.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityColor(selectedAlert.severity) as any}>
                    {selectedAlert.severity}
                  </Badge>
                  <Badge variant={getStatusColor(selectedAlert.status) as any}>
                    {selectedAlert.status}
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedAlert(null)}>
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-400 mb-2">Description</h3>
                <p className="text-white">{selectedAlert.description}</p>
              </div>

              {selectedAlert.user_email && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-2">User</h3>
                  <p className="text-white">{selectedAlert.user_email}</p>
                </div>
              )}

              {selectedAlert.ip_addresses && selectedAlert.ip_addresses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-2">IP Addresses</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.ip_addresses.map((ip) => (
                      <Badge key={ip} variant="neutral">{ip}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedAlert.countries && selectedAlert.countries.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-2">Countries</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.countries.map((country) => (
                      <Badge key={country} variant="neutral">{country}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedAlert.metadata && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-2">Additional Details</h3>
                  <pre className="text-xs text-neutral-300 bg-neutral-950 border border-neutral-800 rounded p-3 overflow-x-auto">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedAlert.resolution_notes && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-2">Resolution Notes</h3>
                  <p className="text-white">{selectedAlert.resolution_notes}</p>
                </div>
              )}

              {selectedAlert.status === 'open' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => updateAlertStatus(selectedAlert.id, 'investigating')}
                  >
                    Start Investigation
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const notes = prompt('Resolution notes:')
                      if (notes) {
                        updateAlertStatus(selectedAlert.id, 'resolved', notes)
                      }
                    }}
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateAlertStatus(selectedAlert.id, 'false_positive')}
                  >
                    False Positive
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
