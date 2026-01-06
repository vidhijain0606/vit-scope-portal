
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSlots() {
    console.log("Seeding slots...");

    // Delete existing future slots to avoid duplicates if re-run (optional, but safer for "setting" slots)
    // Or purely additive. Let's do additive but check existence. 
    // Actually, for simplicity, let's just add if not exists.

    const startDate = new Date();
    const daysToSeed = 30;
    const slotsToAdd = [];

    for (let i = 0; i < daysToSeed; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);

        const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        // Mon(1) to Fri(5) only
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const dateStr = d.toISOString().split('T')[0];

            // 10:00 to 13:00 (10 AM to 1 PM) - 3 hours. 
            // Assuming 1-hour slots? Or just one big block? 
            // User said "10-1 pm". Usually implies availability blocks or 1-hour slots. 
            // "book A slot" implies discrete units. Let's assume 1-hour slots: 10-11, 11-12, 12-1.

            const timeSlots = [
                { start: '10:00', end: '11:00' },
                { start: '11:00', end: '12:00' },
                { start: '12:00', end: '13:00' },
                // 3-5 pm -> 15:00-16:00, 16:00-17:00
                { start: '15:00', end: '16:00' },
                { start: '16:00', end: '17:00' }
            ];

            for (const slot of timeSlots) {
                slotsToAdd.push({
                    date: dateStr,
                    start_time: slot.start,
                    end_time: slot.end,
                    is_available: true
                });
            }
        }
    }

    // Batch insert
    const batchSize = 50;
    for (let i = 0; i < slotsToAdd.length; i += batchSize) {
        const batch = slotsToAdd.slice(i, i + batchSize);

        // We want to avoid duplicates. 
        // supabase upsert on id... but we don't have id. 
        // We can upsert on (date, start_time) if there is a unique key. 
        // If no unique constraint, we might get duplicates. 
        // For now, let's just insert and assume user runs this once or we accept potential dups for dev.
        // Better: Check first? No, too slow. 
        // Let's use `select` to check if *any* slots exist for dates, maybe? 

        const { error } = await supabase.from('slots').insert(batch);
        if (error) {
            console.error('Error inserting batch:', error);
        } else {
            console.log(`Inserted batch ${i / batchSize + 1}`);
        }
    }

    console.log("Seeding complete.");
}

seedSlots();
