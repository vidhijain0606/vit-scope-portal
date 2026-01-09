'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { FileText, Download } from 'lucide-react';

// Shared styles can be reused or we can create new ones.
// For simplicity, let's use inline/utility classes or a new module.
import styles from './Documents.module.css';

export default function FacultyDocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocuments = async () => {
            const { data } = await supabase
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setDocuments(data);
            setLoading(false);
        };
        fetchDocuments();
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Research Documents</h1>
                <p className={styles.subtitle}>Access important guidelines, templates, and circulars.</p>
            </header>

            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.loading}>Loading documents...</div>
                ) : documents.length === 0 ? (
                    <div className={styles.empty}>No documents available at this time.</div>
                ) : (
                    documents.map(doc => (
                        <div key={doc.id} className={styles.card}>
                            <div className={styles.iconWrapper}>
                                <FileText size={32} color="#0d6efd" className={styles.icon} />
                            </div>
                            <div className={styles.content}>
                                <h3 className={styles.docTitle}>{doc.title}</h3>
                                <p className={styles.docDesc}>{doc.description || 'No description available.'}</p>
                                <div className={styles.meta}>
                                    <span>Added on {new Date(doc.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.downloadBtn}
                                >
                                    <Download size={18} style={{ marginRight: '8px' }} />
                                    Download / View
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
