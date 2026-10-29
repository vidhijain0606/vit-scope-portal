'use client';
import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function OralExamToggle() {
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSetting = async () => {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setEnabled(data.oral_exam_enabled === 'true');
            }
        };
        fetchSetting();
    }, []);

    const toggle = async () => {
        if (enabled === null || saving) return;
        const next = !enabled;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'oral_exam_enabled', value: String(next) }),
            });
            if (res.ok) {
                setEnabled(next);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
        }}>
            <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', maxWidth: '640px' }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: enabled ? '#dcfce7' : '#fef3c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <AlertTriangle size={18} color={enabled ? '#15803d' : '#b45309'} />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                        Oral Exam Bookings
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', lineHeight: 1.5 }}>
                        When disabled, faculty cannot see or book Oral Exam slots — they stay hidden on the
                        Book a Slot page and are rejected if attempted directly. Oral Exam bookings are{' '}
                        <strong>disabled by default</strong>; turn this on only when you want to open that
                        meeting type up for booking.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <span style={{
                    fontSize: '0.8rem', fontWeight: 700,
                    color: enabled ? '#15803d' : '#92400e',
                }}>
                    {enabled === null ? 'Loading…' : enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={!!enabled}
                    onClick={toggle}
                    disabled={enabled === null || saving}
                    style={{
                        width: 52,
                        height: 28,
                        borderRadius: 999,
                        border: 'none',
                        background: enabled ? '#16a34a' : '#d1d5db',
                        position: 'relative',
                        cursor: enabled === null || saving ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                    }}
                >
                    <span style={{
                        position: 'absolute',
                        top: 3,
                        left: enabled ? 27 : 3,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        transition: 'left 0.2s',
                    }} />
                </button>
            </div>
        </div>
    );
}
