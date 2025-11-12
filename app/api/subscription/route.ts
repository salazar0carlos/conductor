/**
 * GET /api/subscription - Get current user subscription
 * POST /api/subscription - Upgrade/downgrade subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription with usage summary
    const { data: subscription, error } = await supabase
      .from('user_usage_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Failed to fetch subscription:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    // Get recent usage
    const { data: recentUsage } = await supabase
      .from('daily_token_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    return NextResponse.json({
      subscription,
      recent_usage: recentUsage || [],
    });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, stripe_subscription_id } = body;

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

    // Validate plan
    const validPlans = ['free', 'pro', 'business', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Upgrade subscription
    const { data: result, error } = await supabase.rpc('upgrade_subscription', {
      p_user_id: user.id,
      p_new_plan: plan,
      p_stripe_subscription_id: stripe_subscription_id || null,
    });

    if (error) {
      console.error('Failed to upgrade subscription:', error);
      return NextResponse.json(
        { error: 'Failed to upgrade subscription', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: result,
    });
  } catch (error: any) {
    console.error('Subscription upgrade error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
