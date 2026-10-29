import React, { useState } from 'react';
import { ArrowLeftCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './BookingSidebar.module.css';
import Button from '../UI/Button';

interface BookingDetails {
    empId: string;
    empName: string;
    scholarId: string;
    scholarName: string;
    email: string;
}

interface BookingSidebarProps {
    meetingType: string;
    selectedDate: Date | null;
    selectedSlotId: string | null;
    selectedTime: string | null;
    onConfirm: (details: BookingDetails) => void;
}

const BookingSidebar: React.FC<BookingSidebarProps> = ({ meetingType, selectedDate, selectedSlotId, selectedTime, onConfirm }) => {
    const [step, setStep] = useState<'summary' | 'details'>('summary');

    const [formData, setFormData] = useState<BookingDetails>({
        empId: '',
        empName: '',
        scholarId: '',
        scholarName: '',
        email: '',
    });

    const { data: session } = useSession();

    React.useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                email: session.user?.email || '',
                empName: prev.empName || session.user?.name || '',
            }));
        }
    }, [session, selectedSlotId]);

    React.useEffect(() => {
        setStep('summary');
        if (selectedSlotId) {
            const sidebar = document.getElementById('booking-sidebar');
            if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedSlotId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInitialConfirm = () => {
        setStep('details');
    };

    const handleFinalSubmit = () => {
        const email = formData.email || session?.user?.email || '';
        if (formData.empId && formData.empName && formData.scholarId && formData.scholarName && email) {
            onConfirm({ ...formData, email });
        } else {
            alert('Please make sure you are signed in and all fields are filled before booking.');
        }
    };

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

            {step === 'summary' && (
                <>
                    <div className={styles.selectedInfo}>
                        <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Meeting Type</div>
                            <div className={styles.infoValue}>{meetingType}</div>
                        </div>
                        <div className={styles.separator}></div>
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
                            variant="accent"
                            className={styles.confirmBtn}
                            onClick={handleInitialConfirm}
                        >
                            Proceed to Book
                        </Button>
                    </div>
                </>
            )}

            {step === 'details' && (
                <div className={styles.formContainer}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Emp Email ID</label>
                        <input
                            type="email"
                            name="email"
                            className={styles.input}
                            value={formData.email || session?.user?.email || ''}
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

                    <p className={styles.policyNote}>
                        By confirming, you agree to the portal&apos;s{' '}
                        <Link href="/disclaimer">Disclaimer &amp; Policies</Link>. Confirming here does not
                        replace your VTOP booking — complete both.
                    </p>

                    <div className={`${styles.actions} ${styles.stickyMobile}`}>
                        <Button
                            variant="secondary"
                            className={styles.backBtn}
                            onClick={() => setStep('summary')}
                        >
                            Back
                        </Button>
                        <Button
                            variant="accent"
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
