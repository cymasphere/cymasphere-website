import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const campaignType = searchParams.get('campaignType') || 'all';

    const supabase = await createSupabaseServer();

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch campaign analytics
    let campaignsQuery = supabase
      .from('email_campaigns')
      .select(`
        id,
        name,
        status,
        emails_sent,
        emails_delivered,
        emails_opened,
        emails_clicked,
        emails_bounced,
        total_recipients,
        sent_at,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .order('sent_at', { ascending: false, nullsFirst: false });

    const { data: campaigns, error: campaignsError } = await campaignsQuery;

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    // Calculate overall metrics
    const totalSent = campaigns?.reduce((sum, c) => sum + (c.emails_sent || 0), 0) || 0;
    const totalDelivered = campaigns?.reduce((sum, c) => sum + (c.emails_delivered || 0), 0) || 0;
    const totalOpened = campaigns?.reduce((sum, c) => sum + (c.emails_opened || 0), 0) || 0;
    const totalClicked = campaigns?.reduce((sum, c) => sum + (c.emails_clicked || 0), 0) || 0;
    const totalBounced = campaigns?.reduce((sum, c) => sum + (c.emails_bounced || 0), 0) || 0;

    // Calculate rates
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    // Get subscriber count
    const { count: activeSubscribers } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Format campaign data
    const formattedCampaigns = campaigns?.map(campaign => {
      const emailsSent = campaign.emails_sent || 0;
      return {
        id: campaign.id,
        name: campaign.name,
        type: 'Campaign', // We can add a type field later
        status: campaign.status,
        sent: emailsSent,
        delivered: campaign.emails_delivered || 0,
        opens: campaign.emails_opened || 0,
        clicks: campaign.emails_clicked || 0,
        openRate: emailsSent > 0 ? ((campaign.emails_opened || 0) / emailsSent) * 100 : 0,
        clickRate: emailsSent > 0 ? ((campaign.emails_clicked || 0) / emailsSent) * 100 : 0,
        sentDate: campaign.sent_at || campaign.created_at
      };
    }) || [];

    // Prepare metrics response
    const metrics = [
      {
        label: "Total Emails Sent",
        value: totalSent.toLocaleString(),
        change: "+0%", // TODO: Calculate compared to previous period
        positive: null,
        icon: "FaEnvelope",
        variant: "primary"
      },
      {
        label: "Open Rate",
        value: `${openRate.toFixed(1)}%`,
        change: "+0%", // TODO: Calculate compared to previous period
        positive: null,
        icon: "FaEnvelopeOpen",
        variant: "success"
      },
      {
        label: "Click Rate",
        value: `${clickRate.toFixed(1)}%`,
        change: "+0%", // TODO: Calculate compared to previous period
        positive: null,
        icon: "FaMousePointer",
        variant: "warning"
      },
      {
        label: "Unsubscribe Rate",
        value: "0.0%", // TODO: Track unsubscribes
        change: "+0%",
        positive: null,
        icon: "FaUserTimes",
        variant: "danger"
      },
      {
        label: "Bounce Rate",
        value: `${bounceRate.toFixed(1)}%`,
        change: "+0%", // TODO: Calculate compared to previous period
        positive: null,
        icon: "FaExclamationTriangle",
        variant: "info"
      },
      {
        label: "Active Subscribers",
        value: (activeSubscribers || 0).toLocaleString(),
        change: "+0", // TODO: Calculate compared to previous period
        positive: null,
        icon: "FaUsers",
        variant: "success"
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        campaigns: formattedCampaigns,
        summary: {
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          totalBounced,
          openRate,
          clickRate,
          bounceRate,
          activeSubscribers: activeSubscribers || 0
        }
      }
    });

  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 