import Link from 'next/link';

export default function DisclaimerPage() {
    return (
        <main style={{
            maxWidth: '760px',
            margin: '0 auto',
            padding: '3rem 1.5rem',
            fontFamily: 'sans-serif',
            lineHeight: 1.7,
            color: '#1f2937',
        }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Disclaimer</h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>VIT SCOPE Research Portal</p>

            <section style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>About this portal</h2>
                <p>
                    This portal was built to streamline DAC meeting, synopsis, colloquium, oral exam, and
                    comprehensive viva scheduling for VIT SCOPE faculty and research scholars.
                </p>
            </section>

            <section style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Features</h2>
                <ul style={{ paddingLeft: '1.25rem' }}>
                    <li>Slot booking for DC Meeting, Comprehensive Viva, Colloquium, Synopsis Meeting, and Oral Exam, each with its own allowed times and spacing rules.</li>
                    <li>Google sign-in (restricted to an allow-listed faculty/scholar list) for booking, plus a separate admin login for managing slots and bookings.</li>
                    <li>Admin dashboard with both a list view and a weekly calendar view of all booked slots, booking confirmation/cancellation, and CSV export.</li>
                    <li>Personal dashboard for faculty to track their own bookings as a list or on a calendar, filterable by meeting type and status.</li>
                    <li>Document upload and viewing for research-related files, stored in Azure Blob Storage.</li>
                    <li>Automated email notifications: the admin is notified when a faculty member books a slot, and the faculty member is notified once the admin confirms it — with a reminder to also complete the booking on VTOP.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI usage &amp; incorporation</h2>
                <p>
                    This portal uses Azure OpenAI (a GPT-5-mini deployment) in two places:
                </p>
                <ul style={{ paddingLeft: '1.25rem' }}>
                    <li><strong>Suggest best slot:</strong> when booking, faculty can ask the assistant to recommend the best open slot for a chosen meeting type; it reasons over the real list of currently available slots and picks one, preferring the soonest sensible time.</li>
                    <li><strong>Portal chatbot:</strong> the chat widget answers questions about booking, meeting-type rules, and existing bookings, can recommend open slots on request, and lets admins create new slots with a single typed command (e.g. &quot;add slot 2026-10-20 10:00-11:00&quot;).</li>
                </ul>
                <p>
                    AI suggestions are always grounded in real database availability (the model never invents a slot that doesn&apos;t exist), and AI-assisted actions are logged the same way as manual ones.
                </p>
            </section>

            <section style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Developed by</h2>
                <p>
                    Vidhi Prashant J, with development assistance from Claude (Anthropic) via Claude Code.
                </p>
            </section>

            <section style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tools &amp; technologies used</h2>
                <ul style={{ paddingLeft: '1.25rem' }}>
                    <li>Next.js (React framework)</li>
                    <li>Azure Database for PostgreSQL</li>
                    <li>Azure Blob Storage</li>
                    <li>Azure App Service (hosting)</li>
                    <li>Azure OpenAI (GPT-5-mini) for AI-assisted scheduling and chat</li>
                    <li>NextAuth.js with Google OAuth</li>
                    <li>Nodemailer (Gmail SMTP) for booking notification emails</li>
                    <li>Claude Code (AI-assisted development)</li>
                </ul>
            </section>

            <section style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Official VIT scheduling reference</h2>
                <p>
                    For the official university scheduling system, please refer to{' '}
                    <a
                        href="https://moovit.vit.ac.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'underline' }}
                    >
                        moovit.vit.ac.in
                    </a>
                    . This portal is an independently built scheduling tool and is not affiliated with or
                    endorsed by that system.
                </p>
            </section>

            <Link href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                ← Back to Portal
            </Link>
        </main>
    );
}
