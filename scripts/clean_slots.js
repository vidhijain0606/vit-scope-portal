
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanSlots() {
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`Cleaning slots for date >= ${todayStr}...`);

    const { error } = await supabase
        .from('slots')
        .delete()
        .gte('date', todayStr);

    if (error) {
        console.error('Error cleaning slots:', error);
    } else {
        console.log('Successfully removed future slots.');
    }
}

cleanSlots();
