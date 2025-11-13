import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

// Dangerous SQL keywords that require confirmation
const DANGEROUS_KEYWORDS = ['DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'UPDATE'];
const DDL_KEYWORDS = ['CREATE', 'ALTER', 'DROP'];

interface QueryRequest {
  query: string;
  readOnly?: boolean;
  dryRun?: boolean;
  confirmed?: boolean;
}

interface QueryResult {
  data?: any[];
  error?: string;
  rowCount?: number;
  executionTime?: number;
  explain?: any;
  requiresConfirmation?: boolean;
  dangerousOperation?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<QueryResult>> {
  try {
    const body: QueryRequest = await request.json();
    const { query, readOnly = false, dryRun = false, confirmed = false } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for dangerous operations
    const upperQuery = query.trim().toUpperCase();
    const isDangerous = DANGEROUS_KEYWORDS.some(keyword =>
      upperQuery.startsWith(keyword) || upperQuery.includes(` ${keyword} `)
    );

    if (isDangerous && !confirmed) {
      const dangerousOp = DANGEROUS_KEYWORDS.find(keyword =>
        upperQuery.startsWith(keyword) || upperQuery.includes(` ${keyword} `)
      );
      return NextResponse.json({
        requiresConfirmation: true,
        dangerousOperation: dangerousOp,
        error: `This query contains a dangerous ${dangerousOp} operation. Please confirm execution.`
      }, { status: 400 });
    }

    // Read-only mode check
    if (readOnly) {
      const isReadOnly = upperQuery.startsWith('SELECT') ||
                        upperQuery.startsWith('EXPLAIN') ||
                        upperQuery.startsWith('SHOW') ||
                        upperQuery.startsWith('DESCRIBE');

      if (!isReadOnly) {
        return NextResponse.json(
          { error: 'Read-only mode is enabled. Only SELECT queries are allowed.' },
          { status: 403 }
        );
      }
    }

    const startTime = Date.now();

    // Dry run mode - use EXPLAIN ANALYZE
    if (dryRun) {
      const explainQuery = `EXPLAIN ANALYZE ${query}`;
      const { data, error } = await supabase.rpc('execute_sql', {
        query_text: explainQuery
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        explain: data,
        executionTime: Date.now() - startTime
      });
    }

    // Execute the query
    const { data, error } = await supabase.rpc('execute_sql', {
      query_text: query
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      data: data || [],
      rowCount: Array.isArray(data) ? data.length : 0,
      executionTime
    });

  } catch (error: any) {
    console.error('Query execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
}

// Get query history
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('query_history')
      .select('*')
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (search) {
      query = query.ilike('query', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });

  } catch (error: any) {
    console.error('Failed to fetch query history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch query history' },
      { status: 500 }
    );
  }
}
