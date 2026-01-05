'use client';
import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import { supabase } from '@/utils/supabase';

export default function FacultyDocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setDocuments(data);
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Important Documents</h1>
                <p className={styles.subtitle}>Access guidelines, forms, and research materials shared by the administration.</p>
            </header>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>Loading documents...</div>
                ) : documents.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>📂</div>
                        <h3>No documents available</h3>
                        <p>When the admin uploads documents, they will appear here.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {documents.map(doc => (
                            <a
                                key={doc.id}
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.docCard}
                            >
                                <div className={styles.docIconWrapper}>
                                    <span className={styles.docIcon}>📄</span>
                                </div>
                                <div className={styles.docBody}>
                                    <h3 className={styles.docTitle}>{doc.title}</h3>
                                    <p className={styles.docDesc}>{doc.description || 'No description available.'}</p>
                                    <span className={styles.statusBadge}>Available for Download</span>
                                </div>
                                <div className={styles.actionArrow}>→</div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
