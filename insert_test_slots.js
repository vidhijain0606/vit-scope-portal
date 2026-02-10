
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
let envContent;

try {
    envContent = fs.readFileSync(envPath, 'utf16le');
} catch (e) {
    console.error('Failed to read .env.local:', e.message);
    process.exit(1);
}

const envConfig = {};
envContent.split(/\r?\n/).forEach(line => {
    // Basic line parsing, skipping comments
    if (line.trim().startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        envConfig[key] = value;
    }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    console.log('Available Keys:', Object.keys(envConfig));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestSlots() {
    const today = new Date();
    const daysToGenerate = 30; // Generate for next 30 days
    let allSlots = [];

    console.log(`Generating slots for the next ${daysToGenerate} days...`);

    for (let i = 1; i <= daysToGenerate; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) continue; // Skip Sundays

        const dateStr = date.toISOString().split('T')[0];

        // Define daily schedule
        const dailySchedule = [
            { start: '09:00:00', end: '10:00:00' },
            { start: '10:00:00', end: '11:00:00' },
            { start: '11:30:00', end: '12:30:00' },
            { start: '14:00:00', end: '15:00:00' },
            { start: '15:00:00', end: '16:00:00' },
            { start: '16:00:00', end: '17:00:00' }
        ];

        dailySchedule.forEach(slot => {
            allSlots.push({
                date: dateStr,
                start_time: slot.start,
                end_time: slot.end,
                is_available: true,
                created_at: new Date().toISOString()
            });
        });
    }

    console.log(`Preparing to insert ${allSlots.length} slots...`);

    // Insert in chunks of 50 to be safe
    const chunkSize = 50;
    for (let i = 0; i < allSlots.length; i += chunkSize) {
        const chunk = allSlots.slice(i, i + chunkSize);
        const { error } = await supabase
            .from('slots')
            .insert(chunk);

        if (error) {
            console.error(`Error inserting chunk ${i / chunkSize + 1}:`, error);
        } else {
            console.log(`Inserted chunk ${i / chunkSize + 1}`);
        }
    }

    console.log('Finished inserting slots.');
}

insertTestSlots();
