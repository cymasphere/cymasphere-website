require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkCampaignsInDatabase() {
  console.log('🔍 CHECKING CAMPAIGNS IN DATABASE\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (campaignsError) {
      console.log('❌ Error fetching campaigns:', campaignsError.message);
      return;
    }

    console.log(`📊 TOTAL CAMPAIGNS: ${campaigns?.length || 0}\n`);

    if (!campaigns || campaigns.length === 0) {
      console.log('❌ NO CAMPAIGNS FOUND IN DATABASE');
      return;
    }

    // Show all campaigns
    campaigns.forEach((campaign, i) => {
      console.log(`${i + 1}. Campaign: ${campaign.name || 'Unnamed'}`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   Subject: ${campaign.subject || 'No subject'}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Created: ${campaign.created_at}`);
      console.log(`   Sent: ${campaign.emails_sent || 0}`);
      console.log(`   Opens: ${campaign.emails_opened || 0}`);
      console.log(`   Clicks: ${campaign.emails_clicked || 0}`);
      console.log(`   HTML Content: ${campaign.html_content ? campaign.html_content.length + ' chars' : 'None'}`);
      console.log(`   Audience Type: ${campaign.audience_type || 'None'}`);
      console.log('');
    });

    // Count by status
    const statusCounts = campaigns.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 CAMPAIGNS BY STATUS:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Check email sends
    console.log('\n📨 CHECKING EMAIL SENDS...');
    const { data: sends, error: sendsError } = await supabase
      .from('email_sends')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10);

    if (sendsError) {
      console.log('❌ Error fetching sends:', sendsError.message);
    } else {
      console.log(`   Total recent sends: ${sends?.length || 0}`);
      if (sends && sends.length > 0) {
        sends.forEach((send, i) => {
          console.log(`   ${i + 1}. ${send.email} - ${send.sent_at} (Campaign: ${send.campaign_id})`);
        });
      }
    }

    // Check email opens
    console.log('\n👁️ CHECKING EMAIL OPENS...');
    const { data: opens, error: opensError } = await supabase
      .from('email_opens')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(10);

    if (opensError) {
      console.log('❌ Error fetching opens:', opensError.message);
    } else {
      console.log(`   Total recent opens: ${opens?.length || 0}`);
      if (opens && opens.length > 0) {
        opens.forEach((open, i) => {
          console.log(`   ${i + 1}. ${open.opened_at} - IP: ${open.ip_address} - Campaign: ${open.campaign_id}`);
        });
      }
    }

    // Check email clicks
    console.log('\n🖱️ CHECKING EMAIL CLICKS...');
    const { data: clicks, error: clicksError } = await supabase
      .from('email_clicks')
      .select('*')
      .order('clicked_at', { ascending: false })
      .limit(10);

    if (clicksError) {
      console.log('❌ Error fetching clicks:', clicksError.message);
    } else {
      console.log(`   Total recent clicks: ${clicks?.length || 0}`);
      if (clicks && clicks.length > 0) {
        clicks.forEach((click, i) => {
          console.log(`   ${i + 1}. ${click.clicked_at} - URL: ${click.url} - Campaign: ${click.campaign_id}`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkCampaignsInDatabase().catch(console.error); 