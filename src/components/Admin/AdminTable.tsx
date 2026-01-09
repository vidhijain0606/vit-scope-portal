import React from 'react';
import { CheckCircle } from 'lucide-react';
import styles from './AdminTable.module.css';

import { supabase } from '@/utils/supabase';

const AdminTable = () => {
    const [rows, setRows] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'status_pending', direction: 'asc' });

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('bookings').select('*');

            if (data && !error) {
                setRows(data.map(b => ({
                    id: b.id,
                    name: b.scholar_name || b.student_name || 'Scholar',
                    course: 'N/A',
                    regNo: b.scholar_id || b.student_reg_no || 'N/A',
                    faculty: b.emp_name || 'Dr. Faculty',
                    date: new Date(b.date).toLocaleDateString(),
                    rawDate: b.date, // Store raw date for sorting
                    time: b.start_time,
                    status: (b.status || 'pending').charAt(0).toUpperCase() + (b.status || 'pending').slice(1),
                    createdAt: b.created_at // Store created_at for sorting
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

    const getSortedRows = () => {
        const sorted = [...rows];
        sorted.sort((a, b) => {
            if (sortConfig.key === 'date') {
                const dateA = new Date(a.rawDate + 'T' + a.time);
                const dateB = new Date(b.rawDate + 'T' + b.time);
                return sortConfig.direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
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
                const dateA = new Date(a.createdAt || 0); // Fallback to 0 if null
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
        const headers = ['ID', 'Scholar Name', 'Reg No', 'Faculty Name', 'Date', 'Time', 'Status'];

        // 2. Format rows into CSV string
        const csvContent = [
            headers.join(','),
            ...getSortedRows().map(row => [
                row.id,
                `"${row.name}"`, // Quote strings to handle commas
                row.regNo,
                `"${row.faculty}"`,
                row.date,
                row.time,
                row.status
            ].join(','))
        ].join('\n');

        // 3. Create a blob and trigger download
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
            <header className={styles.header}>
                <h3 className={styles.title}>Booked Slot Records</h3>
                <p className={styles.subtitle}>Preview all booked research slots and download the data.</p>

                <div className={styles.actions}>
                    <select className={styles.sortSelect} onChange={handleSortChange} defaultValue="status_pending">
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
                        <th>SCHOLAR NAME</th>
                        <th>REG NO.</th>
                        <th>FACULTY NAME</th>
                        <th>DATE & TIME</th>
                        <th>STATUS</th>
                        <th>DETAILS</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Loading data...</td></tr>
                    ) : sortedRows.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No records found. Run schema.sql!</td></tr>
                    ) : (
                        sortedRows.map(row => (
                            <tr key={row.id}>
                                <td>
                                    <div className={styles.studentCell}>
                                        <div className={styles.avatar}>{row.name ? row.name[0] : '?'}</div>
                                        <div>
                                            <div className={styles.studentName}>{row.name}</div>
                                            <div className={styles.studentCourse}>{row.course}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.mono}>{row.regNo}</td>
                                <td>{row.faculty}</td>
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
                                </td>
                            </tr>
                        )))}
                </tbody>
            </table>


        </div >
    );
};

export default AdminTable;
