'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import styles from './AdminLogin.module.css';
import Button from '@/components/UI/Button';

export default function AdminLoginPage() {
    const [credentials, setCredentials] = useState({ id: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await signIn('admin', {
            username: credentials.id,
            password: credentials.password,
            redirect: false,
        });

        if (result?.ok) {
            // Hard navigation so AdminGuard reads a freshly-synced session
            // instead of a stale client-side cache from before sign-in.
            window.location.href = '/admin/dashboard';
        } else {
            setError('Invalid Admin ID or Password. Access Restricted.');
            setLoading(false);
        }
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
