'use client';
import React, { useState } from 'react';
import styles from './BookingView.module.css';
import FilterBar from './FilterBar';
import SlotGrid from './SlotGrid';
import BookingSidebar from './BookingSidebar';
import { supabase } from '@/utils/supabase';

// ... imports
import SuccessModal from '../UI/SuccessModal';

export default function BookingView() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSlotSelect = (id: string, dateStr: string, start: string, end: string) => {
        setSelectedSlotId(id);
        setSelectedDate(new Date(dateStr));
        setSelectedTime(`${start} - ${end}`);
    };

    const handleConfirmBooking = async (details: { empId: string; empName: string; scholarId: string; scholarName: string; meetingType: string; email: string }) => {
        if (!selectedSlotId) return;

        try {
            // Get current user for ID linkage
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to book.');

            // 1. Fetch slot details to get accurate time
            const { data: slotData, error: slotFetchError } = await supabase
                .from('slots')
                .select('*')
                .eq('id', selectedSlotId)
                .single();

            if (slotFetchError || !slotData) throw new Error('Slot not found');

            // 2. Create Booking
            const { error: bookingError } = await supabase.from('bookings').insert([
                {
                    title: details.meetingType, // Use meeting type as title
                    date: slotData.date,
                    start_time: slotData.start_time,
                    end_time: slotData.end_time,
                    location: 'TBD',
                    status: 'pending',

                    // New Fields
                    emp_id: details.empId,
                    emp_name: details.empName,
                    scholar_id: details.scholarId,
                    scholar_name: details.scholarName,
                    meeting_type: details.meetingType,

                    // Link to User
                    emp_email: details.email?.toLowerCase(),

                    // Fallback storage in old fields just in case
                    student_name: details.scholarName,
                    student_reg_no: details.scholarId
                }
            ]);

            if (bookingError) throw bookingError;

            // 3. Mark slot as unavailable
            const { error: slotError } = await supabase
                .from('slots')
                .update({ is_available: false })
                .eq('id', selectedSlotId);

            if (slotError) throw slotError;

            // 4. Success Message -> Custom Modal
            setShowSuccessModal(true);

            // window.location.href = '/dashboard'; // Move this to modal action
        } catch (err: any) {
            console.error('Booking failed', err);
            alert(`Failed to book slot: ${err.message || err.details || JSON.stringify(err)}`);
        }
    };

    return (
        <div className={styles.container}>
            {showSuccessModal && (
                <SuccessModal
                    onClose={() => window.location.href = '/dashboard'}
                    onVtop={() => {
                        window.open('https://vtop.vit.ac.in', '_blank');
                        window.location.href = '/dashboard';
                    }}
                />
            )}
            <h1 className={styles.pageTitle}>Book a DAC Meeting</h1>
            <p className={styles.pageSubtitle}>Select an available time slot below to schedule your meeting.</p>

            {/* Filter removed as per request */}

            <div className={styles.layout}>
                <div className={styles.gridCol}>
                    <SlotGrid
                        selectedSlotId={selectedSlotId}
                        onSlotSelect={handleSlotSelect}
                    />
                </div>

                <div className={styles.sidebarCol}>
                    <BookingSidebar
                        selectedDate={selectedDate}
                        selectedSlotId={selectedSlotId}
                        selectedTime={selectedTime}
                        onConfirm={handleConfirmBooking}
                    />
                </div>
            </div>
        </div>
    );
}
