
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqgbgfaxsgitfkclrsoy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ2JnZmF4c2dpdGZrY2xyc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTg3MzgsImV4cCI6MjA4Mjg5NDczOH0.OZM4OmnmkqY1LGKhjCa5Y_XV898xQXIho3_NN-9tZDk';
// Determine if we have a service role key for bypassing RLS
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

// User standard client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookings() {
    console.log("--- Checking Bookings (Anon Key) ---");
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) {
        console.error("Error fetching bookings:", error);
    } else {
        console.log(`Found ${data.length} bookings.`);
        if (data.length > 0) console.log("Sample:", data[0]);
    }

    if (serviceRoleKey) {
        console.log("\n--- Checking Bookings (Service Role - Bypass RLS) ---");
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const { data: adminData, error: adminError } = await supabaseAdmin.from('bookings').select('*');
        if (adminError) {
            console.error("Error fetching (Admin):", adminError);
        } else {
            console.log(`Found ${adminData.length} bookings (Admin).`);
            if (adminData.length > 0) console.log("Sample:", adminData[0]);
        }
    } else {
        console.log("\nNo Service Role Key found in .env.local - cannot bypass RLS for check.");
    }
}

checkBookings();
