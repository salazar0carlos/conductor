import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/marketplace/install - Install a template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { template_id, configuration = {} } = body

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('marketplace_templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check if already installed
    const { data: existingInstallation } = await supabase
      .from('template_installations')
      .select('id')
      .eq('template_id', template_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingInstallation) {
      return NextResponse.json(
        { error: 'Template already installed' },
        { status: 400 }
      )
    }

    // Create installation record
    const { data: installation, error: installError } = await supabase
      .from('template_installations')
      .insert({
        template_id,
        user_id: user.id,
        installed_version: template.version,
        configuration,
        status: 'active'
      })
      .select()
      .single()

    if (installError) {
      console.error('Failed to create installation:', installError)
      return NextResponse.json({ error: 'Failed to install template' }, { status: 500 })
    }

    // Increment install count
    await supabase
      .from('marketplace_templates')
      .update({ install_count: template.install_count + 1 })
      .eq('id', template_id)

    // Create the actual entity based on template type
    let entityId = null
    const entityType = template.type

    try {
      switch (template.type) {
        case 'workflow':
          // Create workflow from template
          const { data: workflow } = await supabase
            .from('workflows')
            .insert({
              name: `${template.name} (from template)`,
              description: template.description,
              config: { ...template.template_data, ...configuration }
            })
            .select()
            .single()
          entityId = workflow?.id
          break

        case 'task':
          // Create task from template - need project_id in configuration
          if (configuration.project_id) {
            const { data: task } = await supabase
              .from('tasks')
              .insert({
                project_id: configuration.project_id,
                title: `${template.name} (from template)`,
                description: template.description,
                type: configuration.task_type || 'feature',
                ...template.template_data
              })
              .select()
              .single()
            entityId = task?.id
          }
          break

        case 'agent':
          // Create agent from template
          const { data: agent } = await supabase
            .from('agents')
            .insert({
              name: `${template.name} (from template)`,
              type: template.template_data.agent_type || 'llm',
              capabilities: template.template_data.capabilities || [],
              config: { ...template.template_data.config, ...configuration }
            })
            .select()
            .single()
          entityId = agent?.id
          break

        case 'project':
          // Create project from template
          const { data: project } = await supabase
            .from('projects')
            .insert({
              name: `${template.name} (from template)`,
              description: template.description,
              metadata: { ...template.template_data, ...configuration }
            })
            .select()
            .single()
          entityId = project?.id
          break

        default:
          // For other types, just store the configuration
          break
      }

      // Update installation with entity reference
      if (entityId) {
        await supabase
          .from('template_installations')
          .update({
            entity_type: entityType,
            entity_id: entityId
          })
          .eq('id', installation.id)
      }
    } catch (entityError) {
      console.error('Failed to create entity from template:', entityError)
      // Continue anyway - installation record exists
    }

    return NextResponse.json({
      installation,
      entity_id: entityId,
      entity_type: entityType,
      success: true,
      message: `${template.name} installed successfully!`
    })
  } catch (error) {
    console.error('Failed to install template:', error)
    return NextResponse.json({ error: 'Failed to install template' }, { status: 500 })
  }
}
