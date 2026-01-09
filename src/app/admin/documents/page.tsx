'use client';
import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import { supabase } from '@/utils/supabase';
import Button from '@/components/UI/Button';
import { FileText, Trash2, ExternalLink } from 'lucide-react';

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) {
            alert('Please select a file and enter a title.');
            return;
        }

        setSubmitting(true);

        try {
            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${title.replace(/\s+/g, '_')}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // 3. Save metadata to Database
            const { error: dbError } = await supabase.from('documents').insert([
                {
                    title,
                    file_url: publicUrl,
                    description
                }
            ]);

            if (dbError) throw dbError;

            // Success cleanup
            setTitle('');
            setFile(null);
            setDescription('');
            // Reset file input manually if needed, or rely on state key
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            fetchDocuments();

        } catch (error: any) {
            console.error('Upload error:', error);
            alert('Error adding document: ' + (error.message || 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        // Ideally navigate to find the file path to delete from storage too, 
        // but for now we just delete the record.
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
                    <h2 className={styles.cardTitle}>Upload New Document</h2>
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
                            <label>Select File</label>
                            <input
                                id="fileInput"
                                type="file"
                                onChange={handleFileChange}
                                required
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
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
                            {submitting ? 'Uploading...' : 'Upload Document'}
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
                                    <div className={styles.docIcon}>
                                        <FileText size={24} color="#0d6efd" />
                                    </div>
                                    <div className={styles.docContent}>
                                        <h3 className={styles.docTitle}>{doc.title}</h3>
                                        <p className={styles.docDesc}>{doc.description || 'No description provided.'}</p>
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
                                            Open Link <ExternalLink size={14} style={{ marginLeft: '4px' }} />
                                        </a>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(doc.id)} title="Delete">
                                        <Trash2 size={18} />
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
