import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');

    // If specific table is requested, get its details
    if (tableName) {
      return getTableDetails(supabase, tableName);
    }

    // Get all tables in the public schema
    const tablesQuery = `
      SELECT
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const { data: tables, error: tablesError } = await supabase.rpc('execute_sql', {
      query_text: tablesQuery
    });

    if (tablesError) {
      return NextResponse.json(
        { error: tablesError.message },
        { status: 400 }
      );
    }

    // Get table row counts
    const tablesWithCounts = await Promise.all(
      (tables || []).map(async (table: any) => {
        const countQuery = `SELECT COUNT(*) as count FROM "${table.table_name}";`;
        const { data: countData } = await supabase.rpc('execute_sql', {
          query_text: countQuery
        });

        return {
          ...table,
          row_count: countData?.[0]?.count || 0
        };
      })
    );

    return NextResponse.json({
      tables: tablesWithCounts
    });

  } catch (error: any) {
    console.error('Failed to fetch schema:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}

async function getTableDetails(supabase: any, tableName: string): Promise<NextResponse> {
  try {
    // Get columns
    const columnsQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;

    // Get primary keys
    const primaryKeysQuery = `
      SELECT
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = '${tableName}';
    `;

    // Get foreign keys
    const foreignKeysQuery = `
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = '${tableName}';
    `;

    // Get indexes
    const indexesQuery = `
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = '${tableName}';
    `;

    const [columnsResult, primaryKeysResult, foreignKeysResult, indexesResult] = await Promise.all([
      supabase.rpc('execute_sql', { query_text: columnsQuery }),
      supabase.rpc('execute_sql', { query_text: primaryKeysQuery }),
      supabase.rpc('execute_sql', { query_text: foreignKeysQuery }),
      supabase.rpc('execute_sql', { query_text: indexesQuery })
    ]);

    if (columnsResult.error) {
      return NextResponse.json(
        { error: columnsResult.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      table_name: tableName,
      columns: columnsResult.data || [],
      primary_keys: primaryKeysResult.data || [],
      foreign_keys: foreignKeysResult.data || [],
      indexes: indexesResult.data || []
    });

  } catch (error: any) {
    console.error('Failed to fetch table details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch table details' },
      { status: 500 }
    );
  }
}
