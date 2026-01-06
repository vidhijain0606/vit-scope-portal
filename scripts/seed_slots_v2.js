
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for immediate execution as per previous tool output
const supabaseUrl = 'https://oqgbgfaxsgitfkclrsoy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ2JnZmF4c2dpdGZrY2xyc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTg3MzgsImV4cCI6MjA4Mjg5NDczOH0.OZM4OmnmkqY1LGKhjCa5Y_XV898xQXIho3_NN-9tZDk';

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
