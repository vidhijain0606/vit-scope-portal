'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Button from '@/components/UI/Button';
import { supabase } from '@/utils/supabase';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error);
      alert('Error logging in with Google. Please check console for details.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Image
              src="/images/vit_favicon.jpg"
              alt="VIT Logo"
              width={24}
              height={24}
            />
          </div>
          <span className={styles.logoText}>VIT SCOPE</span>
        </div>
        <Link href="/help" className={styles.helpLink}>
          Help & Support
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.leftColumn}>
            <div className={styles.badge}>RESEARCH PORTAL</div>
            <h1 className={styles.title}>
              VIT SCOPE <br />
              RESEARCH <br />
              PORTAL
            </h1>
            <p className={styles.description}>
              Streamlining research appointments for faculty and administration.
              Efficiently manage schedules with our centralized secure portal.
            </p>

            <div className={styles.loginBox}>
              <h2 className={styles.loginTitle}>Sign In</h2>
              <p className={styles.loginSubtitle}>Use your institutional account to continue.</p>

              <div style={{ width: '100%' }}>
                <Button
                  variant="outline"
                  className={styles.googleBtn}
                  size="lg"
                  onClick={handleLogin}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.googleIcon}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              <div className={styles.divider}>
                <span>FOR ADMINS</span>
              </div>

              <Link href="/admin-login" className={styles.adminLink}>
                Login with Admin Credentials
              </Link>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.heroTextContainer}>
              <h1 className={styles.heroTitle}>
                VIT SCOPE<br />
                RESEARCH<br />
                PORTAL
              </h1>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Terms of Service</Link>
          <Link href="#">Faculty Guidelines</Link>
        </div>
        <div className={styles.copyright}>© 2024 VIT SCOPE. All rights reserved.</div>
      </footer>
    </div>
  );
}
