import { Nav } from '@/components/ui/nav'
import { AdminSettings } from '@/components/admin/admin-settings'

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Settings</h1>
          <p className="text-neutral-400">
            Manage system-wide configuration and settings
          </p>
        </div>
        <AdminSettings />
      </main>
    </div>
  )
}
