import React, { useState } from 'react';
import styles from './BookingSidebar.module.css';
import Button from '../UI/Button';

interface BookingDetails {
    empId: string;
    empName: string;
    scholarId: string;
    scholarName: string;
    email: string; // Added email
    meetingType: string;
}

interface BookingSidebarProps {
    selectedDate: Date | null;
    selectedSlotId: string | null;
    selectedTime: string | null;
    onConfirm: (details: BookingDetails) => void;
}

const BookingSidebar: React.FC<BookingSidebarProps> = ({ selectedDate, selectedSlotId, selectedTime, onConfirm }) => {
    const [step, setStep] = useState<'summary' | 'details'>('summary');
    const [formData, setFormData] = useState<BookingDetails>({
        empId: '',
        empName: '',
        scholarId: '',
        scholarName: '',
        email: '',
        meetingType: 'Synopsis'
    });

    // Auto-fetch user details when mounting or changing slots
    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await import('@/utils/supabase').then(m => m.supabase.auth.getUser());
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    email: user.email || '',
                    // The logged in user is the FACULTY (Employee), so pre-fill Emp Name
                    empName: prev.empName || user.user_metadata?.full_name || '',
                    // Scholar details are entered manually by the faculty
                    scholarName: prev.scholarName || ''
                }));
            }
        };
        fetchUser();
    }, [selectedSlotId]);
    // Note: Dependencies here ensure we check when sidebar opens/resets

    // Reset step when slot changes
    React.useEffect(() => {
        setStep('summary');
        // We preserve the fetched user data, only reset if needed. 
        // Actually, let's keep the user data if already fetched.
        setFormData(prev => ({
            ...prev,
            meetingType: 'Synopsis'
            // Keep name/email populated
        }));
    }, [selectedSlotId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInitialConfirm = () => {
        setStep('details');
    };

    const handleFinalSubmit = () => {
        if (formData.empId && formData.empName && formData.scholarId && formData.scholarName && formData.email) {
            onConfirm(formData);
        }
    };

    // If no slot is selected, show placeholder
    if (!selectedDate || !selectedSlotId) {
        return (
            <div className={styles.sidebar}>
                <h3 className={styles.sectionTitle}>Booking Details</h3>
                <div className={styles.placeholder}>
                    <span className={styles.placeholderIcon}>👈</span> Select a time slot to proceed.
                </div>
            </div>
        );
    }

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <h3 className={styles.sectionTitle}>
                    {step === 'summary' ? 'Booking Summary' : 'Enter Details'}
                </h3>
            </div>

            {/* Step 1: Summary */}
            {step === 'summary' && (
                <>
                    <div className={styles.selectedInfo}>
                        <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Date</div>
                            <div className={styles.infoValue}>
                                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                        <div className={styles.separator}></div>
                        <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Time Slot</div>
                            <div className={styles.infoValueHighlight}>{selectedTime}</div>
                        </div>
                    </div>

                    <div className={styles.confirmWrapper}>
                        <Button
                            variant="primary"
                            className={styles.confirmBtn}
                            onClick={handleInitialConfirm}
                        >
                            Proceed to Book
                        </Button>
                    </div>
                </>
            )}

            {/* Step 2: User Details Form */}
            {step === 'details' && (
                <div className={styles.formContainer}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Emp Email ID</label>
                        <input
                            type="email"
                            name="email"
                            className={styles.input}
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your.email@vit.ac.in"
                            readOnly
                            style={{ backgroundColor: '#f0f4f8', cursor: 'not-allowed' }}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Emp ID</label>
                        <input
                            type="text"
                            name="empId"
                            className={styles.input}
                            value={formData.empId}
                            onChange={handleInputChange}
                            placeholder="e.g. 10023"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Emp Name</label>
                        <input
                            type="text"
                            name="empName"
                            className={styles.input}
                            value={formData.empName}
                            onChange={handleInputChange}
                            placeholder="Faculty Name"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Scholar ID</label>
                        <input
                            type="text"
                            name="scholarId"
                            className={styles.input}
                            value={formData.scholarId}
                            onChange={handleInputChange}
                            placeholder="e.g. 21PHD0045"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Scholar Name</label>
                        <input
                            type="text"
                            name="scholarName"
                            className={styles.input}
                            value={formData.scholarName}
                            onChange={handleInputChange}
                            placeholder="Scholar Name"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Type of Meeting</label>
                        <select
                            name="meetingType"
                            className={styles.input}
                            value={formData.meetingType}
                            onChange={handleInputChange}
                        >
                            <option value="Synopsis">Synopsis</option>
                            <option value="DC Meeting 1">DC Meeting 1</option>
                            <option value="DC Meeting 2">DC Meeting 2</option>
                            <option value="Oral Viva">Oral Viva</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            variant="secondary"
                            className={styles.backBtn}
                            onClick={() => setStep('summary')}
                        >
                            Back
                        </Button>
                        <Button
                            variant="primary"
                            className={styles.submitBtn}
                            disabled={!formData.empId || !formData.empName || !formData.scholarId || !formData.scholarName}
                            onClick={handleFinalSubmit}
                        >
                            Confirm & Book
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingSidebar;
