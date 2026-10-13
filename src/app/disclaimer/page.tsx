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
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Built by</h2>
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
                    <li>NextAuth.js with Google OAuth</li>
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
