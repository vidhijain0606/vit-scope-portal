
const { createClient } = require('@supabase/supabase-js');

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let envContent;

try {
    envContent = fs.readFileSync(envPath, 'utf16le');
} catch (e) {
    try {
        envContent = fs.readFileSync(envPath, 'utf8');
    } catch (e2) {
        console.error('Failed to read .env.local');
        process.exit(1);
    }
}

const envConfig = {};
envContent.split(/\r?\n/).forEach(line => {
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSlots() {
    console.log("Seeding slots...");

    const startDate = new Date(); // Start from today
    const daysToSeed = 30;
    let insertedCount = 0;

    for (let i = 0; i < daysToSeed; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);

        const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        // Mon(1) to Fri(5) only
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const dateStr = d.toISOString().split('T')[0];

            const timeSlots = [
                { start: '10:00', end: '11:00' },
                { start: '11:00', end: '12:00' },
                { start: '12:00', end: '13:00' },
                { start: '15:00', end: '16:00' },
                { start: '16:00', end: '17:00' }
            ];

            const slotsToAdd = timeSlots.map(slot => ({
                date: dateStr,
                start_time: slot.start,
                end_time: slot.end,
                is_available: true
            }));

            // Insert for this day
            const { error } = await supabase.from('slots').insert(slotsToAdd);
            if (error) {
                console.error(`Error inserting for ${dateStr}:`, error.message);
            } else {
                insertedCount += slotsToAdd.length;
            }
        }
    }

    console.log(`Seeding complete. Inserted ${insertedCount} slots.`);
}

seedSlots();
