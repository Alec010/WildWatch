import { useState, useEffect } from 'react';
import { officeAPI } from '../api/office_api';
import type { OfficeInfoDto } from '../models/OfficeModels';

export const useOffices = () => {
    const [offices, setOffices] = useState<OfficeInfoDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOffices = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await officeAPI.getOffices();
            setOffices(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch offices');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOffices();
    }, []);

    return {
        offices,
        isLoading,
        error,
        refresh: fetchOffices,
    };
};

