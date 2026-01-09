import React from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'error' | 'success' | 'info';
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
    if (!isOpen) return null;

    const styles = {
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
        },
        modal: {
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative' as const,
            animation: 'slideUp 0.3s ease-out',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
        },
        title: {
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1f2937',
        },
        message: {
            color: '#4b5563',
            lineHeight: 1.5,
            marginBottom: '24px',
        },
        button: {
            width: '100%',
            padding: '10px 16px',
            backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
        }
    };

    const getIcon = () => {
        if (type === 'error') return <AlertCircle size={28} color="#ef4444" />;
        if (type === 'success') return <CheckCircle size={28} color="#10b981" />;
        return <Info size={28} color="#3b82f6" />;
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    {getIcon()}
                    <h3 style={styles.title}>{title}</h3>
                </div>
                <p style={styles.message}>{message}</p>
                <button
                    style={styles.button}
                    onClick={onClose}
                >
                    Okay, understood
                </button>
            </div>
            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AlertModal;
