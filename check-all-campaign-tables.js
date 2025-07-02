require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkAllCampaignTables() {
  console.log('🔍 COMPREHENSIVE DATABASE CHECK - LOOKING FOR ALL CAMPAIGN DATA\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // First, let's see what tables exist in the database
    console.log('📋 CHECKING ALL TABLES IN DATABASE...\n');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('⚠️ Cannot get table list, checking known tables manually...\n');
    } else if (tables) {
      console.log('📊 ALL TABLES FOUND:');
      tables.forEach((table, i) => {
        console.log(`   ${i + 1}. ${table.table_name}`);
      });
      console.log('');
    }

    // Check all possible campaign-related tables
    const campaignTables = [
      'email_campaigns',
      'campaigns', // possible duplicate
      'email_campaign', // singular version
      'campaign', // singular version
      'mail_campaigns',
      'email_marketing_campaigns',
      'marketing_campaigns'
    ];

    console.log('🔍 CHECKING CAMPAIGN TABLES...\n');

    for (const tableName of campaignTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.log(`❌ Table '${tableName}': ${error.message}`);
        } else {
          console.log(`✅ Table '${tableName}': ${data?.length || 0} records found`);
          if (data && data.length > 0) {
            console.log(`   Sample records:`);
            data.slice(0, 3).forEach((record, i) => {
              console.log(`   ${i + 1}. ID: ${record.id} | Name: ${record.name || record.subject || 'Unnamed'} | Status: ${record.status}`);
            });
          }
        }
      } catch (err) {
        console.log(`❌ Table '${tableName}': ${err.message}`);
      }
      console.log('');
    }

    // Check for email/marketing related tables
    const emailTables = [
      'email_sends',
      'email_send',
      'sends',
      'email_opens',
      'email_open',
      'opens',
      'email_clicks',
      'email_click',
      'clicks',
      'email_tracking',
      'tracking',
      'email_events',
      'events'
    ];

    console.log('📧 CHECKING EMAIL TRACKING TABLES...\n');

    for (const tableName of emailTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.log(`❌ Table '${tableName}': ${error.message}`);
        } else {
          console.log(`✅ Table '${tableName}': ${data?.length || 0} records found`);
          if (data && data.length > 0) {
            console.log(`   Sample records:`);
            data.slice(0, 2).forEach((record, i) => {
              console.log(`   ${i + 1}. ID: ${record.id} | Campaign: ${record.campaign_id} | Date: ${record.created_at || record.sent_at || record.opened_at || record.clicked_at}`);
            });
          }
        }
      } catch (err) {
        console.log(`❌ Table '${tableName}': ${err.message}`);
      }
      console.log('');
    }

    // Check for possible schema differences
    console.log('🔍 CHECKING EMAIL_CAMPAIGNS SCHEMA...\n');
    
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .from('email_campaigns')
        .select('*')
        .limit(1);

      if (!schemaError && schemaData && schemaData.length > 0) {
        console.log('📋 EMAIL_CAMPAIGNS COLUMNS:');
        const columns = Object.keys(schemaData[0]);
        columns.forEach((col, i) => {
          console.log(`   ${i + 1}. ${col}: ${typeof schemaData[0][col]} | Value: ${String(schemaData[0][col]).substring(0, 50)}`);
        });
      }
    } catch (err) {
      console.log('❌ Error checking schema:', err.message);
    }

    // Check for campaigns in different statuses
    console.log('\n📊 CHECKING ALL CAMPAIGN STATUSES...\n');
    
    try {
      const { data: allCampaigns, error: allError } = await supabase
        .from('email_campaigns')
        .select('id, name, subject, status, created_at, emails_sent, emails_opened')
        .order('created_at', { ascending: false });

      if (allError) {
        console.log('❌ Error fetching all campaigns:', allError.message);
      } else {
        console.log(`📊 ALL CAMPAIGNS (${allCampaigns?.length || 0} total):`);
        
        if (allCampaigns && allCampaigns.length > 0) {
          // Group by status
          const byStatus = allCampaigns.reduce((acc, campaign) => {
            const status = campaign.status || 'unknown';
            if (!acc[status]) acc[status] = [];
            acc[status].push(campaign);
            return acc;
          }, {});

          Object.entries(byStatus).forEach(([status, campaigns]) => {
            console.log(`\n   📋 ${status.toUpperCase()} (${campaigns.length}):`);
            campaigns.forEach((campaign, i) => {
              console.log(`      ${i + 1}. ${campaign.name || campaign.subject || 'Unnamed'}`);
              console.log(`         ID: ${campaign.id}`);
              console.log(`         Created: ${campaign.created_at}`);
              console.log(`         Sent: ${campaign.emails_sent || 0}, Opens: ${campaign.emails_opened || 0}`);
            });
          });
        } else {
          console.log('   No campaigns found');
        }
      }
    } catch (err) {
      console.log('❌ Error:', err.message);
    }

    // Final summary
    console.log('\n🎯 SUMMARY:');
    console.log('✅ Checked for duplicate campaign tables');
    console.log('✅ Checked for alternative naming schemes');
    console.log('✅ Checked email tracking tables');
    console.log('✅ Checked all campaign statuses');

  } catch (error) {
    console.log('❌ Critical Error:', error.message);
  }
}

checkAllCampaignTables().catch(console.error); 