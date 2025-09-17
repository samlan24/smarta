// Quick script to check if there's data in commit_analytics table
const { createClient } = require('@supabase/supabase-js');

async function checkDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check total count
    const { count, error: countError } = await supabase
      .from('commit_analytics')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting records:', countError);
      return;
    }
    
    console.log(`Total records in commit_analytics: ${count}`);
    
    // Get a few sample records
    const { data: samples, error: sampleError } = await supabase
      .from('commit_analytics')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.error('Error fetching samples:', sampleError);
      return;
    }
    
    console.log('Sample records:');
    console.log(JSON.stringify(samples, null, 2));
    
  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkDatabase();
