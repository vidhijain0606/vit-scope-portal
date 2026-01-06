import React from 'react';
import styles from './AdminTable.module.css';

import { supabase } from '@/utils/supabase';

const AdminTable = () => {
    const [rows, setRows] = React.useState<any[]>([]); // simplified type
    const [loading, setLoading] = React.useState(true);

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
                    time: b.start_time,
                    status: (b.status || 'pending').charAt(0).toUpperCase() + (b.status || 'pending').slice(1)
                })));
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleExport = () => {
        if (rows.length === 0) return;

        // 1. Define CSV headers
        const headers = ['ID', 'Scholar Name', 'Reg No', 'Faculty Name', 'Date', 'Time', 'Status'];

        // 2. Format rows into CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => [
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

    return (
        <div className={styles.tableCard}>
            <header className={styles.header}>
                <h3 className={styles.title}>Booked Slot Records</h3>
                <p className={styles.subtitle}>Preview all booked research slots and download the data.</p>

                <div className={styles.actions}>

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
                    ) : rows.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No records found. Run schema.sql!</td></tr>
                    ) : (
                        rows.map(row => (
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
                                    <button className={styles.actionBtn}>👁️</button>
                                </td>
                            </tr>
                        )))}
                </tbody>
            </table>


        </div>
    );
};

export default AdminTable;
