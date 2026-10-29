'use client';
import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import { FolderOpen, FileText, ArrowRight } from 'lucide-react';
import DocumentViewerModal from '@/components/UI/DocumentViewerModal';

interface Doc {
    id: string;
    title: string;
    description: string | null;
    blob_url: string;
}

export default function FacultyDocumentsPage() {
    const [documents, setDocuments] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        const res = await fetch('/api/documents');
        if (res.ok) setDocuments(await res.json());
        setLoading(false);
    };

    const handleViewDocument = (doc: Doc) => {
        setSelectedDoc(doc);
    };

    const handleCloseModal = () => {
        setSelectedDoc(null);
    };

    return (
        <div className={styles.container}>
            {selectedDoc && (
                <DocumentViewerModal
                    isOpen={!!selectedDoc}
                    onClose={handleCloseModal}
                    title={selectedDoc.title}
                    fileUrl={selectedDoc.blob_url}
                    isOffice={!!selectedDoc.blob_url.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i)}
                />
            )}
            <header className={styles.header}>
                <h1 className={styles.title}>Important Documents</h1>
                <p className={styles.subtitle}>Access guidelines, forms, and research materials shared by the administration.</p>
            </header>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>Loading documents...</div>
                ) : documents.length === 0 ? (
                    <div className={styles.empty}>
                        <FolderOpen size={48} className={styles.emptyIcon} />
                        <h3>No documents available</h3>
                        <p>When the admin uploads documents, they will appear here.</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {documents.map(doc => {
                            // The isOffice check is now primarily for the modal, but can be used for display if needed.
                            // For this change, the status badge is simplified to "View Document".
                            // const isOffice = doc.file_url.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);

                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => handleViewDocument(doc)}
                                    className={styles.docCard}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.docIconWrapper}>
                                        <FileText size={24} className={styles.docIcon} />
                                    </div>
                                    <div className={styles.docBody}>
                                        <h3 className={styles.docTitle}>{doc.title}</h3>
                                        <p className={styles.docDesc}>{doc.description || 'No description available.'}</p>
                                        <span className={styles.statusBadge}>
                                            View Document
                                        </span>
                                    </div>
                                    <div className={styles.actionArrow}>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
