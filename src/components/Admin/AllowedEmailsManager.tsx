'use client';
import React, { useEffect, useState } from 'react';
import { UserPlus, X } from 'lucide-react';

export default function AllowedEmailsManager() {
    const [emails, setEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchEmails = async () => {
        const res = await fetch('/api/admin/allowed-emails');
        if (res.ok) setEmails(await res.json());
        setLoading(false);
    };

    useEffect(() => { fetchEmails(); }, []);

    const addEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.trim() || saving) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/allowed-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail.trim() }),
            });
            if (res.ok) {
                setNewEmail('');
                await fetchEmails();
            } else {
                const { error } = await res.json();
                alert(error || 'Failed to add email.');
            }
        } finally {
            setSaving(false);
        }
    };

    const removeEmail = async (email: string) => {
        if (!confirm(`Remove ${email} from the allowlist? They will no longer be able to sign in.`)) return;
        const res = await fetch(`/api/admin/allowed-emails?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
        if (res.ok) setEmails(prev => prev.filter(e => e !== email));
    };

    return (
        <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
            padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                Authorized Faculty Emails
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
                Only these Google accounts may sign in to the portal. Managed here instead of in source code.
            </p>

            <form onSubmit={addEmail} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="faculty@vit.ac.in"
                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.5rem 0.9rem', borderRadius: '8px', border: 'none',
                        background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '0.85rem',
                        cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                >
                    <UserPlus size={15} /> Add
                </button>
            </form>

            {loading ? (
                <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Loading...</div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {emails.map(email => (
                        <span key={email} style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            background: '#f1f5f9', borderRadius: '999px', padding: '0.3rem 0.4rem 0.3rem 0.75rem',
                            fontSize: '0.82rem', color: '#374151',
                        }}>
                            {email}
                            <button
                                type="button"
                                onClick={() => removeEmail(email)}
                                title="Remove"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 18, height: 18, borderRadius: '50%', border: 'none',
                                    background: '#e5e7eb', cursor: 'pointer', color: '#4b5563',
                                }}
                            >
                                <X size={11} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
