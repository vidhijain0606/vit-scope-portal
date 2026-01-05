'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuth = async () => {
            // Check if we have a session (Supabase client handles hash parsing automatically)
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error during auth callback:', error);
                // Redirect back to login on error after a delay
                setTimeout(() => router.push('/'), 2000);
            } else if (session) {
                // Successfully authenticated
                router.push('/dashboard');
            } else {
                // No session found, but maybe the hash hasn't been processed yet?
                // The onAuthStateChange event is safer for catching the initial session set
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        router.push('/dashboard');
                    }
                });

                return () => {
                    subscription.unsubscribe();
                };
            }
        };

        handleAuth();
    }, [router]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
            fontFamily: 'sans-serif'
        }}>
            <h2 style={{ marginBottom: '1rem', color: '#333' }}>Finalizing Login...</h2>
            <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
