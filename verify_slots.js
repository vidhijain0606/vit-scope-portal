
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local with UTF-16LE support
const envPath = path.resolve(__dirname, '.env.local');
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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    // console.log('Found keys:', Object.keys(envConfig)); // Debug if needed
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySlots() {
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`Checking slots for date >= ${todayStr}`);

    const { data, error } = await supabase
        .from('slots')
        .select('*')
        .gte('date', todayStr);

    if (error) {
        console.error('Error fetching slots:', error);
    } else {
        const total = data.length;
        const available = data.filter(s => s.is_available).length;
        const booked = total - available;

        console.log(`Summary for date >= ${todayStr}:`);
        console.log(`Total Slots: ${total}`);
        console.log(`Available: ${available}`);
        console.log(`Booked/Unavailable: ${booked}`);

        if (booked > 0) {
            console.log('Sample Unavailable Slots:', data.filter(s => !s.is_available).slice(0, 3));
        }
    }
}

verifySlots();
