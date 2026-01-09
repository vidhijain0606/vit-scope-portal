
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for immediate execution
const supabaseUrl = 'https://oqgbgfaxsgitfkclrsoy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ2JnZmF4c2dpdGZrY2xyc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTg3MzgsImV4cCI6MjA4Mjg5NDczOH0.OZM4OmnmkqY1LGKhjCa5Y_XV898xQXIho3_NN-9tZDk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedExtraSlots() {
    console.log("Seeding EXTRA slots (11:30, 14:30)...");

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

            // Specific requested slots:
            // 11:30 - 12:30
            // 14:30 - 15:30
            const timeSlots = [
                { start: '11:30', end: '12:30' },
                { start: '14:30', end: '15:30' }
            ];

            const slotsToAdd = timeSlots.map(slot => ({
                date: dateStr,
                start_time: slot.start,
                end_time: slot.end,
                is_available: true
            }));

            // Insert
            const { error } = await supabase.from('slots').insert(slotsToAdd);
            if (error) {
                console.error(`Error inserting for ${dateStr}:`, error.message);
            } else {
                insertedCount += slotsToAdd.length;
            }
        }
    }

    console.log(`Seeding complete. Inserted ${insertedCount} extra slots.`);
}

seedExtraSlots();
