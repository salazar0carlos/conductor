'use client'

import { useEffect, useState } from 'react'
import { Line, Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AnalyticsData {
  timeSeries: Array<{ date: string; total: number; errors: number }>
  topUsers: Array<{ user_id: string; email: string; name?: string; count: number }>
  eventDistribution: Array<{ category: string; count: number }>
  hourlyDistribution: Array<{ hour: number; count: number }>
}

interface AnalyticsDashboardProps {
  days?: number
}

export function AnalyticsDashboard({ days = 7 }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState(days)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedDays])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/audit/analytics?days=${selectedDays}`)
      const data = await res.json()

      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        <p className="text-neutral-400 mt-4">Loading analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
        <p className="text-neutral-400">No analytics data available</p>
      </div>
    )
  }

  // Time series chart data
  const timeSeriesData = {
    labels: analytics.timeSeries.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Events',
        data: analytics.timeSeries.map(d => d.total),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Errors',
        data: analytics.timeSeries.map(d => d.errors),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Event distribution pie chart data
  const eventDistributionData = {
    labels: analytics.eventDistribution.map(e =>
      e.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    ),
    datasets: [
      {
        data: analytics.eventDistribution.map(e => e.count),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(251, 146, 60)',
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
          'rgb(156, 163, 175)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Hourly distribution bar chart data
  const hourlyData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Events by Hour',
        data: Array.from({ length: 24 }, (_, hour) => {
          const found = analytics.hourlyDistribution.find(h => h.hour === hour)
          return found ? found.count : 0
        }),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(229, 229, 229)',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(163, 163, 163)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
      y: {
        ticks: {
          color: 'rgb(163, 163, 163)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgb(229, 229, 229)',
          padding: 15,
        },
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDays === d
                  ? 'bg-white text-black'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-neutral-400 text-sm mb-1">Total Events</div>
          <div className="text-2xl font-bold text-white">
            {analytics.timeSeries.reduce((sum, d) => sum + d.total, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-neutral-400 text-sm mb-1">Total Errors</div>
          <div className="text-2xl font-bold text-red-400">
            {analytics.timeSeries.reduce((sum, d) => sum + d.errors, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-neutral-400 text-sm mb-1">Active Users</div>
          <div className="text-2xl font-bold text-white">
            {analytics.topUsers.length}
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-neutral-400 text-sm mb-1">Event Categories</div>
          <div className="text-2xl font-bold text-white">
            {analytics.eventDistribution.length}
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Event Trends Over Time</h3>
        <div className="h-80">
          <Line data={timeSeriesData} options={chartOptions} />
        </div>
      </div>

      {/* Event Distribution and Hourly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Event Distribution by Category</h3>
          <div className="h-80">
            <Pie data={eventDistributionData} options={pieOptions} />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Peak Usage Times (24h)</h3>
          <div className="h-80">
            <Bar data={hourlyData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="border-b border-neutral-800 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Most Active Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-6 py-3 text-neutral-400 font-medium text-sm">
                  Rank
                </th>
                <th className="text-left px-6 py-3 text-neutral-400 font-medium text-sm">
                  User
                </th>
                <th className="text-left px-6 py-3 text-neutral-400 font-medium text-sm">
                  Email
                </th>
                <th className="text-right px-6 py-3 text-neutral-400 font-medium text-sm">
                  Event Count
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.topUsers.slice(0, 10).map((user, index) => (
                <tr key={user.user_id} className="border-b border-neutral-800">
                  <td className="px-6 py-4 text-neutral-300">#{index + 1}</td>
                  <td className="px-6 py-4 text-white font-medium">
                    {user.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-neutral-300">{user.email}</td>
                  <td className="px-6 py-4 text-right text-white font-semibold">
                    {user.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
