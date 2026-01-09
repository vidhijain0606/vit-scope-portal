
const { createClient } = require('@supabase/supabase-js');
// Hardcoded credentials from src/utils/supabase.ts
const supabaseUrl = 'https://oqgbgfaxsgitfkclrsoy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ2JnZmF4c2dpdGZrY2xyc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTg3MzgsImV4cCI6MjA4Mjg5NDczOH0.OZM4OmnmkqY1LGKhjCa5Y_XV898xQXIho3_NN-9tZDk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
    console.log("--- Testing Schema for user_id column ---");

    // Attempt to insert a row WITH user_id (using a random UUID)
    // We'll use a random dummy UUID.
    const dummyUserId = '00000000-0000-0000-0000-000000000001';

    const payload = {
        title: 'Schema Test',
        date: new Date().toISOString().split('T')[0],
        start_time: '00:00',
        end_time: '01:00',
        status: 'cancelled', // Immediately cancelled so it doesn't clutter (or we delete it)
        user_id: dummyUserId
    };

    const { data, error } = await supabase.from('bookings').insert([payload]).select();

    if (error) {
        console.error("Insert FAILED:", error.message);
        if (error.message.includes("column") && error.message.includes("does not exist")) {
            console.log("CONCLUSION: user_id column DOES NOT exist.");
        } else {
            console.log("CONCLUSION: Insert failed for another reason (RLS?):", error.message);
            // If RLS fails, it means the column likely exists but we aren't allowed to write to it?
            // Or maybe we can't write random user_ids.
        }
    } else {
        console.log("Insert SUCCEEDED. The 'user_id' column EXISTS.");
        console.log("Inserted:", data);
    }
}

testSchema();
