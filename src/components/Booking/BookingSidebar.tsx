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

        // Exact time matching strings
        const restrictedAllowedTimes = ['10:00', '11:30', '14:30', '16:00'];
        const standardAllowedTimes = ['10:00', '11:00', '11:30', '12:00', '15:00', '15:30', '16:00'];

        // Extract start time from "HH:mm - HH:mm" or just "HH:mm"
        // The SlotGrid passes "startTime" which is usually "HH:mm:ss" or "HH:mm". 
        // We need to normalize.
        let startTime = selectedTime.split(' - ')[0]?.trim();
        // Remove seconds if present
        if (startTime.split(':').length === 3) {
            startTime = startTime.split(':').slice(0, 2).join(':');
        }

        if (restrictedTypes.includes(formData.meetingType)) {
            if (!restrictedAllowedTimes.includes(startTime)) {
                alert(`⚠️ Restriction: ${formData.meetingType} can ONLY be booked at:\n10:00, 11:30, 14:30 (2:30 PM), or 16:00 (4:00 PM).\n\nCurrent Time Selected: ${startTime}`);
                return;
            }
        } else {
            // Optional: Check if "Other" meetings are allowed at restricted times? 
            // User said: "other slots go as : 10:300 11 , 11:30 ,12 3,3:3- 4:00"
            // Interpreting as: 10:00, 11:00, 11:30, 12:00, 15:00, 15:30, 16:00.
            // If they pick a time not in this list (e.g. 14:30) for a standard meeting, strictly speaking it wasn't in the list?
            // But usually restrictions are one-way. Let's enforce standard list too if desired, or just loose.
            // "other slots go as..." implies a definition. Let's warn if it matches none of the standard list.

            // Actually, let's keep it simple. If it's NOT restricted type, is it allowed to book 14:30?
            // "other slots go as: ..." list didn't include 14:30. 
            // So if I book "General Meeting" at 14:30, is it allowed?
            // User prompt: "other slots go as : 10:300 11 , 11:30 ,12 3,3:3- 4:00"
            // (10:00, 11:00, 11:30, 12:00, 15:00, 15:30, 16:00)
            // 14:30 is NOT in that list. So 14:30 is EXCLUSIVE to Synopsis? 
            // Let's enforce that logic.

            if (!standardAllowedTimes.includes(startTime) && !restrictedAllowedTimes.includes(startTime)) {
                // If the slot exists but isn't in EITHER list (weird), warn.
                // But specifically, if it is 14:30 and I am Standard?
                if (startTime === '14:30') {
                    alert(`⚠️ Restriction: 14:30 slot is reserved for Synopsis/Oral Exams.`);
                    return;
                }
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
                            Note: SYNOPSIS & ORAL EXAM only at 10:00, 11:30, 14:30, 16:00
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
