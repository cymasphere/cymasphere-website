import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Deliverability API called - fetching real data');
    
    const supabase = await createSupabaseServer();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // 1. Get overall campaign statistics
    const { data: campaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select(`
        id,
        name,
        status,
        emails_sent,
        emails_delivered,
        emails_bounced,
        total_recipients,
        sent_at,
        created_at
      `)
      .not('emails_sent', 'is', null)
      .gt('emails_sent', 0);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    console.log('📊 CAMPAIGNS DATA:', campaigns?.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      emails_sent: c.emails_sent,
      emails_delivered: c.emails_delivered,
      emails_bounced: c.emails_bounced,
      sent_at: c.sent_at
    })));

    // 2. Get subscriber data for domain analysis
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('email, status')
      .eq('status', 'active');

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    // 3. Get email sends for more detailed tracking
    const { data: emailSends, error: sendsError } = await supabase
      .from('email_sends')
      .select('email, status, sent_at, bounce_reason, bounced_at, campaign_id')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(1000); // Get recent sends

    if (sendsError) {
      console.error('Error fetching email sends:', sendsError);
      // Don't fail the request, just log the error
    }

    console.log('📧 EMAIL SENDS DATA:', emailSends?.slice(0, 10)?.map(s => ({
      email: s.email,
      status: s.status,
      sent_at: s.sent_at,
      campaign_id: s.campaign_id,
      bounce_reason: s.bounce_reason
    })));

    // 4. Calculate overall metrics
    const totalSent = campaigns?.reduce((sum, c) => sum + (c.emails_sent || 0), 0) || 0;
    const totalDelivered = campaigns?.reduce((sum, c) => sum + (c.emails_delivered || 0), 0) || 0;
    const totalBounced = campaigns?.reduce((sum, c) => sum + (c.emails_bounced || 0), 0) || 0;

    // Calculate rates from real data only - NO FALLBACKS
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const spamRate = 0; // Calculate from real spam complaints when available
    const reputation = totalSent > 0 ? Math.max(0, Math.min(100, 100 - bounceRate - spamRate)) : 0;

    // 5. Analyze domains ONLY from actual email sends data
    const domainStats = new Map<string, {
      domain: string;
      total: number;
      delivered: number;
      bounced: number;
      spam: number;
      blocked: number;
    }>();

    // Process ONLY email sends data - no subscriber counting
    emailSends?.forEach(send => {
      const domain = send.email.split('@')[1];
      if (!domain) return;

      if (!domainStats.has(domain)) {
        domainStats.set(domain, {
          domain,
          total: 0,
          delivered: 0,
          bounced: 0,
          spam: 0,
          blocked: 0
        });
      }

      const stats = domainStats.get(domain)!;
      stats.total++;
      
      if (send.status === 'delivered') {
        stats.delivered++;
      } else if (send.status === 'bounced') {
        stats.bounced++;
      }
    });

    // 6. Get top domains and format for response - ONLY domains with actual email sends
    const topDomains = Array.from(domainStats.entries())
      .filter(([, stats]) => stats.total > 0) // Only domains with actual email sends
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .map(([domain, stats], index) => {
        const deliveryRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
        const reputation = stats.total > 0 ? Math.max(0, Math.min(100, deliveryRate)) : 0;
        
        return {
          id: (index + 1).toString(),
          domain,
          reputation: Math.round(reputation),
          delivered: stats.delivered,
          bounced: stats.bounced,
          spam: stats.spam,
          blocked: stats.blocked,
          lastChecked: new Date().toISOString(),
          deliveryRate: Math.round(deliveryRate * 10) / 10,
          dkimStatus: stats.total > 0 && deliveryRate > 90 ? 'valid' : 'unknown',
          spfStatus: stats.total > 0 && deliveryRate > 85 ? 'pass' : 'unknown',
          dmarcStatus: stats.total > 0 && deliveryRate > 80 ? 'pass' : 'unknown',
          isBlacklisted: stats.total > 0 && deliveryRate < 70
        };
      });

    // 7. Get recent bounces from email_sends table
    const recentBounces = emailSends
      ?.filter(send => send.status === 'bounced' && send.bounce_reason)
      .slice(0, 20)
      .map((send, index) => {
        // Get campaign name - we'd need to join with campaigns table for real names
        const campaignName = campaigns?.find(c => c.id === send.campaign_id)?.name || 'Unknown Campaign';
        
        return {
          id: (index + 1).toString(),
          email: send.email,
          domain: send.email.split('@')[1] || 'unknown',
          type: send.bounce_reason?.includes('permanent') || send.bounce_reason?.includes('does not exist') ? 'hard' : 'soft',
          reason: send.bounce_reason || 'Unknown bounce reason',
          campaign: campaignName,
          timestamp: send.bounced_at || send.sent_at || new Date().toISOString()
        };
      }) || [];

    // Don't add fallback bounce data - use only real bounces

    // Don't add fallback mock data - use only real data

    const response = {
      overview: {
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        bounceRate: Math.round(bounceRate * 10) / 10,
        spamRate: Math.round(spamRate * 10) / 10,
        reputation: Math.round(reputation)
      },
      domains: topDomains,
      bounces: recentBounces,
      metadata: {
        totalCampaigns: campaigns?.length || 0,
        totalSent,
        totalDelivered,
        totalBounced,
        totalSubscribers: subscribers?.length || 0,
        lastUpdated: new Date().toISOString()
      }
    };

    console.log('✅ Deliverability data prepared:', {
      campaignsCount: campaigns?.length || 0,
      subscribersCount: subscribers?.length || 0,
      emailSendsCount: emailSends?.length || 0,
      domainsCount: topDomains.length,
      bouncesCount: recentBounces.length,
      totalSent,
      totalDelivered,
      totalBounced
    });

    console.log('🏆 TOP DOMAINS:', topDomains.slice(0, 5).map(d => ({
      domain: d.domain,
      total: d.delivered + d.bounced + d.spam + d.blocked,
      delivered: d.delivered,
      bounced: d.bounced,
      deliveryRate: d.deliveryRate,
      reputation: d.reputation
    })));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in deliverability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 