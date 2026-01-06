
import React from 'react';

interface SuccessModalProps {
    onClose: () => void;
    onVtop: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ onClose, onVtop }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                animation: 'slideIn 0.3s ease-out'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1a1a1a' }}>Slot Booked Successfully!</h2>
                <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.5' }}>
                    Your research consultation slot has been confirmed on the portal.
                    Would you like to open <strong>VTOP</strong> now?
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <button
                        onClick={onVtop}
                        style={{
                            padding: '0.75rem',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        Yes, Go to VTOP ↗
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem',
                            backgroundColor: 'white',
                            color: '#666',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        No, Back to Dashboard
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default SuccessModal;
