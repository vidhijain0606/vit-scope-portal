import React from 'react';
import { CheckCircle, Trash2 } from 'lucide-react'; // Added Trash2
import styles from './AdminTable.module.css';

import { supabase } from '@/utils/supabase';

const AdminTable = () => {
    const [rows, setRows] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    // Changed default to date/desc (Latest First)
    const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // Added server-side sort as well (Latest First)
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('date', { ascending: false })
                .order('start_time', { ascending: true });

            if (data && !error) {
                setRows(data.map(b => ({
                    id: b.id,
                    name: b.scholar_name || b.student_name || 'Scholar',
                    course: b.title || 'N/A', // Using title as Course/Meeting Type since 'course' was hardcoded N/A
                    meetingType: b.title || 'Meeting', // Explicit Meeting Type
                    regNo: b.scholar_id || b.student_reg_no || 'N/A',
                    faculty: b.emp_name || 'Dr. Faculty',
                    date: new Date(b.date).toLocaleDateString(),
                    rawDate: b.date,
                    time: b.start_time,
                    status: (b.status || 'pending').charAt(0).toUpperCase() + (b.status || 'pending').slice(1),
                    createdAt: b.created_at
                })));
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleConfirm = async (id: string) => {
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', id);

        if (!error) {
            setRows(prev => prev.map(row =>
                row.id === id ? { ...row, status: 'Confirmed' } : row
            ));
        } else {
            console.error('Error confirming booking:', error);
            alert('Failed to confirm booking');
        }
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'date_asc') setSortConfig({ key: 'date', direction: 'asc' });
        if (value === 'date_desc') setSortConfig({ key: 'date', direction: 'desc' });
        if (value === 'status_pending') setSortConfig({ key: 'status_pending', direction: 'asc' });
        if (value === 'status_confirmed') setSortConfig({ key: 'status_confirmed', direction: 'asc' });
        if (value === 'status_upcoming') setSortConfig({ key: 'status_upcoming', direction: 'asc' });
        if (value === 'created_desc') setSortConfig({ key: 'created', direction: 'desc' });
        if (value === 'created_asc') setSortConfig({ key: 'created', direction: 'asc' });
    };

    const handleDeleteBooking = async (id: string) => {
        if (!confirm('⚠️ Are you sure you want to PERMANENTLY DELETE this booking record?')) return;

        const { error } = await supabase.from('bookings').delete().eq('id', id);

        if (!error) {
            setRows(prev => prev.filter(row => row.id !== id));
            // Optional: We could also try to free the slot here, but usually a hard delete implies cleanup.
            // If the user wants to free the slot, they should normally use "Cancel". 
            // This Delete is for cleaning up bad data.
        } else {
            console.error('Error deleting booking:', error);
            alert('Failed to delete booking');
        }
    };

    const getSortedRows = () => {
        const sorted = [...rows];
        sorted.sort((a, b) => {
            if (sortConfig.key === 'date') {
                // Use string comparison on YYYY-MM-DD which is lexically sortable.
                // This avoids invalid Date parsing issues with time formats like "09:00 AM".
                const dateA = a.rawDate || '';
                const dateB = b.rawDate || '';
                const dateCompare = dateA.localeCompare(dateB);

                if (dateCompare !== 0) {
                    return sortConfig.direction === 'asc' ? dateCompare : -dateCompare;
                }

                // If dates are equal, fallback to simple string sort for time (best effort without strict parsing)
                const timeA = a.time || '';
                const timeB = b.time || '';
                return sortConfig.direction === 'asc'
                    ? timeA.localeCompare(timeB)
                    : timeB.localeCompare(timeA);
            }
            if (sortConfig.key === 'status_pending') {
                const getScore = (s: string) => s.toLowerCase() === 'pending' ? 0 : 1;
                return getScore(a.status) - getScore(b.status);
            }
            if (sortConfig.key === 'status_upcoming') {
                const getScore = (s: string) => s.toLowerCase() === 'upcoming' ? 0 : 1;
                return getScore(a.status) - getScore(b.status);
            }
            if (sortConfig.key === 'status_confirmed') {
                const getScore = (s: string) => s.toLowerCase() === 'confirmed' ? 0 : 1;
                return getScore(a.status) - getScore(b.status);
            }
            if (sortConfig.key === 'created') {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return sortConfig.direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
            }
            return 0;
        });
        return sorted;
    };

    const handleExport = () => {
        if (rows.length === 0) return;

        // 1. Define CSV headers
        const headers = ['ID', 'Scholar Name', 'Reg No', 'Faculty Name', 'Meeting Type', 'Date', 'Time', 'Status'];

        // 2. Format rows into CSV string
        const csvContent = [
            headers.join(','),
            ...getSortedRows().map(row => [
                row.id,
                `"${row.name}"`,
                row.regNo,
                `"${row.faculty}"`,
                `"${row.meetingType}"`,
                row.date,
                row.time,
                row.status
            ].join(','))
        ].join('\n');

        // ... (keep download logic)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'bookings_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const sortedRows = getSortedRows();

    return (
        <div className={styles.tableCard}>
            {/* ... (keep header) */}
            <header className={styles.header}>
                <h3 className={styles.title}>Booked Slot Records</h3>


                <div className={styles.actions}>
                    <select className={styles.sortSelect} onChange={handleSortChange} defaultValue="date_desc">
                        <option value="date_asc">Meeting Date (Earliest First)</option>
                        <option value="date_desc">Meeting Date (Latest First)</option>
                        <option value="status_upcoming">Status: Upcoming First</option>
                        <option value="status_pending">Status: Pending First</option>
                        <option value="status_confirmed">Status: Confirmed First</option>
                        <option value="created_desc">Booking Date (Newest First)</option>
                        <option value="created_asc">Booking Date (Oldest First)</option>
                    </select>

                    <button className={styles.exportBtn} onClick={handleExport}>Export All to CSV</button>
                </div>
            </header>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>FACULTY NAME</th>
                        <th>SCHOLAR NAME</th>
                        <th>REG NO.</th>
                        <th>MEETING TYPE</th>
                        <th>DATE & TIME</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>Loading data...</td></tr>
                    ) : sortedRows.length === 0 ? (
                        <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>No records found. Run schema.sql!</td></tr>
                    ) : (
                        sortedRows.map(row => (
                            <tr key={row.id}>
                                <td>{row.faculty}</td>
                                <td>
                                    <div className={styles.studentCell}>
                                        <div className={styles.avatar}>{row.name ? row.name[0] : '?'}</div>
                                        <div>
                                            <div className={styles.studentName}>{row.name}</div>
                                            {/* <div className={styles.studentCourse}>{row.course}</div> */}
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.mono}>{row.regNo}</td>
                                <td style={{ fontWeight: 500, color: '#4b5563' }}>{row.meetingType}</td>
                                <td>
                                    <div className={styles.dateCell}>
                                        <div>{row.date}</div>
                                        <div className={styles.timeSub}>{row.time}</div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[row.status.toLowerCase()]}`}>
                                        • {row.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {['pending', 'upcoming'].includes(row.status.toLowerCase()) && (
                                            <button
                                                className={styles.confirmBtn}
                                                onClick={() => handleConfirm(row.id)}
                                                title="Confirm Booking"
                                            >
                                                <CheckCircle size={18} />
                                                Confirm
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteBooking(row.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#ef4444', // Red
                                                padding: '4px',
                                                borderRadius: '4px',
                                            }}
                                            title="Delete Booking Record"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )))}
                </tbody>
            </table>


        </div >
    );
};

export default AdminTable;
