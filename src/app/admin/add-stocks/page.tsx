'use client';
import React, { useState } from 'react';
import styles from './AddStocks.module.css';
import Button from '@/components/UI/Button';
import { supabase } from '@/utils/supabase';

export default function AddStocksPage() {
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('Equipment');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!itemName || !quantity) {
            setMessage({ type: 'error', text: 'Please fill all fields' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('stocks')
                .insert([
                    { item_name: itemName, quantity: parseInt(quantity), category, status: 'In Stock' }
                ]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Stock added successfully!' });
            setItemName('');
            setQuantity('');
        } catch (err) {
            console.error('Error adding stock:', err);
            setMessage({ type: 'error', text: 'Failed to add stock. Did you run the schema.sql?' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Add Stocks</h1>
            <p className={styles.subtitle}>Add new equipment or resources to the inventory.</p>

            <div className={styles.formCard}>
                {message && (
                    <div className={`${styles.alert} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Item Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={itemName}
                            onChange={e => setItemName(e.target.value)}
                            placeholder="e.g. Arduino Uno"
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Quantity</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            <select
                                className={styles.select}
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                <option value="Equipment">Equipment</option>
                                <option value="Consumables">Consumables</option>
                                <option value="Software">Software</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            Add to Inventory
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
