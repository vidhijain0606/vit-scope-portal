import React, { useState } from 'react';
import { ArrowLeftCircle } from 'lucide-react';
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


// ... (imports)

const BookingSidebar: React.FC<BookingSidebarProps> = ({ selectedDate, selectedSlotId, selectedTime, onConfirm }) => {
    const [step, setStep] = useState<'summary' | 'details'>('summary');
    const [vtopChecked, setVtopChecked] = useState(false); // New state for checkbox

    const [formData, setFormData] = useState<BookingDetails>({
        empId: '',
        empName: '',
        scholarId: '',
        scholarName: '',
        email: '',
        meetingType: ''
    });

    // ... (useEffect for user fetch same as before)
    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await import('@/utils/supabase').then(m => m.supabase.auth.getUser());
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    email: user.email || '',
                    empName: prev.empName || user.user_metadata?.full_name || '',
                    scholarName: prev.scholarName || ''
                }));
            }
        };
        fetchUser();
    }, [selectedSlotId]);

    // Reset step AND scroll to top when slot changes
    React.useEffect(() => {
        setStep('summary');
        setVtopChecked(false); // Reset checkbox
        setFormData(prev => ({
            ...prev,
            meetingType: ''
        }));

        // Scroll to sidebar on mobile/smaller screens if needed, or just focus
        if (selectedSlotId) {
            const sidebar = document.getElementById('booking-sidebar');
            if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedSlotId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInitialConfirm = () => {
        setStep('details');
    };

    const handleFinalSubmit = () => {
        if (!selectedTime) return;

        // Validation Logic
        const restrictedTypes = ['SYNOPSIS MEETING', 'ORAL EXAM'];
        const allowedStartTimes = ['11:30', '14:30', '16:00'];

        // Extract start time from "HH:mm - HH:mm"
        const startTime = selectedTime.split(' - ')[0]?.trim();

        if (restrictedTypes.includes(formData.meetingType)) {
            if (!allowedStartTimes.includes(startTime)) {
                alert(`⚠️ Restriction: ${formData.meetingType} can ONLY be booked at 11:30, 14:30, or 16:00.\n\nCurrent Time Selected: ${startTime}`);
                return;
            }
        }

        if (formData.empId && formData.empName && formData.scholarId && formData.scholarName && formData.email) {
            onConfirm(formData);
        }
    };

    // If no slot is selected, show placeholder
    if (!selectedDate || !selectedSlotId) {
        return (
            <div id="booking-sidebar" className={styles.sidebar}>
                <h3 className={styles.sectionTitle}>Booking Details</h3>
                <div className={styles.placeholder}>
                    <ArrowLeftCircle size={24} className={styles.placeholderIcon} /> Select a time slot to proceed.
                </div>
            </div>
        );
    }

    return (
        <div id="booking-sidebar" className={styles.sidebar}>
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
                    {/* ... (Existing input fields) ... */}

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
                            <option value="" disabled>-- Select Meeting Type --</option>
                            <option value="DC MEETING">DC MEETING</option>
                            <option value="COMPREHENSIVE VIVA">COMPREHENSIVE VIVA</option>
                            <option value="COLLOQUIUM">COLLOQUIUM</option>
                            <option value="SYNOPSIS MEETING">SYNOPSIS MEETING</option>
                            <option value="ORAL EXAM">ORAL EXAM</option>
                        </select>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                            Note: SYNOPSIS & ORAL EXAM only at 11:30, 14:30, 16:00
                        </p>
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
                            disabled={!formData.empId || !formData.empName || !formData.scholarId || !formData.scholarName || !formData.meetingType}
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
