import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { Client } from 'pg'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      project_ref,
      db_password,
      github_repo,
      github_branch = 'main',
      migrations_path = 'supabase/migrations'
    } = body

    if (!project_ref || !db_password) {
      return apiError('project_ref and db_password are required', 400)
    }

    if (!github_repo) {
      return apiError('github_repo is required', 400)
    }

    // Get GitHub token from session
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return apiError('Not authenticated', 401)
    }

    const githubToken = session.provider_token
    if (!githubToken) {
      return apiError('GitHub not connected', 400)
    }

    // 1. Fetch migration files from GitHub
    const migrationsResponse = await fetch(
      `https://api.github.com/repos/${github_repo}/contents/${migrations_path}?ref=${github_branch}`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    if (!migrationsResponse.ok) {
      if (migrationsResponse.status === 404) {
        return apiError('No migrations folder found in repository. Create a supabase/migrations directory first.', 404)
      }
      return apiError('Failed to fetch migrations from GitHub', migrationsResponse.status)
    }

    const files = await migrationsResponse.json()

    // Filter for .sql files and sort by name (typically timestamped)
    const sqlFiles = files
      .filter((file: any) => file.name.endsWith('.sql') && file.type === 'file')
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    if (sqlFiles.length === 0) {
      return apiSuccess({
        message: 'No SQL migration files found',
        migrations_applied: 0
      })
    }

    // 2. Fetch content of each migration file
    const migrations: Array<{ name: string; content: string }> = []

    for (const file of sqlFiles) {
      const contentResponse = await fetch(file.download_url, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
        },
      })

      if (contentResponse.ok) {
        const content = await contentResponse.text()
        migrations.push({ name: file.name, content })
      }
    }

    // 3. Connect to Supabase database and execute migrations
    const connectionString = `postgresql://postgres:${db_password}@db.${project_ref}.supabase.co:5432/postgres`

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })

    const results = []
    let successCount = 0
    let errorCount = 0

    try {
      await client.connect()

      // Create migrations tracking table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS _conductor_migrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)

      for (const migration of migrations) {
        try {
          // Check if migration was already applied
          const checkResult = await client.query(
            'SELECT name FROM _conductor_migrations WHERE name = $1',
            [migration.name]
          )

          if (checkResult.rows.length > 0) {
            results.push({
              name: migration.name,
              status: 'skipped',
              message: 'Already applied'
            })
            continue
          }

          // Execute migration
          await client.query(migration.content)

          // Record migration as applied
          await client.query(
            'INSERT INTO _conductor_migrations (name) VALUES ($1)',
            [migration.name]
          )

          results.push({
            name: migration.name,
            status: 'success',
            message: 'Applied successfully'
          })
          successCount++
        } catch (error: any) {
          results.push({
            name: migration.name,
            status: 'error',
            message: error.message
          })
          errorCount++
          // Continue with next migration even if one fails
        }
      }
    } finally {
      await client.end()
    }

    return apiSuccess({
      message: `Migrations completed: ${successCount} applied, ${errorCount} failed`,
      migrations_found: migrations.length,
      migrations_applied: successCount,
      migrations_failed: errorCount,
      results
    })
  } catch (error) {
    return handleApiError(error)
  }
}
