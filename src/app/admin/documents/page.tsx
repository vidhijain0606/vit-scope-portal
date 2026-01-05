'use client';
import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import { supabase } from '@/utils/supabase';
import Button from '@/components/UI/Button';

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setDocuments(data);
        setLoading(false);
    };

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const { error } = await supabase.from('documents').insert([
            { title, file_url: url, description }
        ]);

        if (error) {
            alert('Error adding document: ' + error.message);
        } else {
            setTitle('');
            setUrl('');
            setDescription('');
            fetchDocuments();
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (!error) {
            setDocuments(prev => prev.filter(d => d.id !== id));
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Document Repository</h1>
                <p className={styles.subtitle}>Upload and manage research documents for faculty.</p>
            </header>

            <div className={styles.content}>
                {/* Upload Form */}
                <div className={styles.uploadCard}>
                    <h2 className={styles.cardTitle}>Add New Document Link</h2>
                    <form onSubmit={handleAddDocument} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Document Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Research Ethics Guidelines"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Document URL</label>
                            <input
                                type="url"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Brief description of the document..."
                            />
                        </div>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? 'Adding...' : 'Add Document'}
                        </Button>
                    </form>
                </div>

                {/* Documents List */}
                <div className={styles.listSection}>
                    <h2 className={styles.sectionTitle}>Existing Documents</h2>
                    {loading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : documents.length === 0 ? (
                        <div className={styles.empty}>No documents added yet.</div>
                    ) : (
                        <div className={styles.grid}>
                            {documents.map(doc => (
                                <div key={doc.id} className={styles.docCard}>
                                    <div className={styles.docIcon}>📄</div>
                                    <div className={styles.docContent}>
                                        <h3 className={styles.docTitle}>{doc.title}</h3>
                                        <p className={styles.docDesc}>{doc.description || 'No description provided.'}</p>
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
                                            Open Link ↗
                                        </a>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(doc.id)} title="Delete">
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
