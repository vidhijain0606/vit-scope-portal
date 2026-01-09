
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oqgbgfaxsgitfkclrsoy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ2JnZmF4c2dpdGZrY2xyc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTg3MzgsImV4cCI6MjA4Mjg5NDczOH0.OZM4OmnmkqY1LGKhjCa5Y_XV898xQXIho3_NN-9tZDk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed30MinSlots() {
    console.log("Seeding 30-Minute Slots...");
    console.log("Attempting to clear old slots (this might fail if RLS prevents it)...");

    // Try to delete future slots to avoid clutter
    const today = new Date().toISOString().split('T')[0];
    const { error: deleteError } = await supabase.from('slots').delete().gte('date', today);
    if (deleteError) {
        console.warn("Could not delete existing slots (RLS likely). You will see duplicate/overlapping slots.");
    } else {
        console.log("Existing future slots cleared.");
    }

    const startDate = new Date();
    const daysToSeed = 30;
    let insertedCount = 0;

    for (let i = 0; i < daysToSeed; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);

        const dayOfWeek = d.getDay(); // 0-6
        // Mon-Fri
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const dateStr = d.toISOString().split('T')[0];
            const slotsToAdd = [];

            // Helper to add range of 30 min slots
            const addSlots = (startHour, endHour) => {
                for (let h = startHour; h < endHour; h++) {
                    // Slot 1: HH:00 - HH:30
                    slotsToAdd.push({
                        date: dateStr,
                        start_time: `${h}:00`,
                        end_time: `${h}:30`,
                        is_available: true
                    });
                    // Slot 2: HH:30 - (H+1):00
                    slotsToAdd.push({
                        date: dateStr,
                        start_time: `${h}:30`,
                        end_time: `${h + 1}:00`,
                        is_available: true
                    });
                }
            };

            // Morning: 10:00 - 13:00
            addSlots(10, 13);

            // Afternoon: 14:00 - 17:00 (Includes 14:30 start, 16:00 start)
            addSlots(14, 17);

            // Insert
            const { error } = await supabase.from('slots').insert(slotsToAdd);
            if (error) {
                console.error(`Error inserting for ${dateStr}:`, error.message);
            } else {
                insertedCount += slotsToAdd.length;
            }
        }
    }

    console.log(`Seeding complete. Inserted ${insertedCount} 30-minute slots.`);
}

seed30MinSlots();
