'use client';
import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface ChatEntry {
    role: 'user' | 'assistant';
    content: string;
}

export default function AiChatWidget() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<ChatEntry[]>([
        { role: 'assistant', content: 'Hi! I can help you with booking slots, meeting-type rules, or finding your bookings. Try asking "suggest a DC MEETING slot". Admins can type commands like "add slot 2026-10-20 10:00-11:00".' },
    ]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        const message = input.trim();
        if (!message || loading) return;

        setHistory(prev => [...prev, { role: 'user', content: message }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            const data = await res.json();
            setHistory(prev => [...prev, { role: 'assistant', content: res.ok ? data.reply : (data.error || 'Something went wrong.') }]);
        } catch {
            setHistory(prev => [...prev, { role: 'assistant', content: 'Could not reach the assistant. Please try again later.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000 }}>
            {open && (
                <div style={{
                    width: '320px',
                    height: '420px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '0.75rem',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                }}>
                    <div style={{ padding: '0.75rem 1rem', background: '#2563eb', color: 'white', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Portal Assistant
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {history.map((entry, i) => (
                            <div key={i} style={{
                                alignSelf: entry.role === 'user' ? 'flex-end' : 'flex-start',
                                background: entry.role === 'user' ? '#2563eb' : '#f3f4f6',
                                color: entry.role === 'user' ? 'white' : '#111827',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '10px',
                                maxWidth: '85%',
                                fontSize: '0.875rem',
                            }}>
                                {entry.content}
                            </div>
                        ))}
                        {loading && <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Thinking...</div>}
                    </div>
                    <div style={{ display: 'flex', borderTop: '1px solid #e5e7eb' }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask a question..."
                            style={{ flex: 1, border: 'none', padding: '0.75rem', fontSize: '0.875rem', outline: 'none' }}
                        />
                        <button onClick={sendMessage} style={{ border: 'none', background: 'none', padding: '0 0.75rem', cursor: 'pointer', color: '#2563eb' }}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
            <button
                onClick={() => setOpen(prev => !prev)}
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <MessageCircle size={24} />
            </button>
        </div>
    );
}
