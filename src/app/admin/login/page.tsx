'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AdminLogin.module.css';
import Button from '@/components/UI/Button';

export default function AdminLoginPage() {
    const router = useRouter();
    const [credentials, setCredentials] = useState({ id: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
        setError(''); // Clear error on change
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulated Admin Check
        // In a real app, this should confirm with the backend
        setTimeout(() => {
            if (credentials.id === 'admin' && credentials.password === 'admin123') {
                // Success: Set a session token (cookie or localStorage)
                // For simplicity/demo: localStorage + basic cookie logic would be handled in AdminGuard
                // Let's set a strictly verifiable flag for the Client Component Guard
                localStorage.setItem('admin_verified', 'true');

                // Also set a temporary expiration if we wanted, but for now kept simple
                router.push('/admin/dashboard');
            } else {
                setError('Invalid Admin ID or Password. Access Restricted.');
                setLoading(false);
            }
        }, 800);
    };

    return (
        <main className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Admin Access</h1>
                    <p className={styles.subtitle}>Restricted Area. Authorized Personnel Only.</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="id">Admin ID</label>
                        <input
                            type="text"
                            id="id"
                            name="id"
                            value={credentials.id}
                            onChange={handleInputChange}
                            placeholder="Enter Admin ID"
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleInputChange}
                            placeholder="Enter Password"
                            className={styles.input}
                            required
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <Button
                        type="submit"
                        variant="primary"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Verifying...' : 'Authenticate & Enter'}
                    </Button>
                </form>

                <div className={styles.footer}>
                    <a href="/" className={styles.backLink}>← Back to Portal</a>
                </div>
            </div>
        </main>
    );
}
