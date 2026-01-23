import { useState, useEffect } from "react";
import { mypageCompaniesApi } from "../utils/mypageApi";
import type { MyPageCompany } from "../types/mypage";

export function useMypageStores() {
    const [stores, setStores] = useState<MyPageCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStores = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await mypageCompaniesApi.getCompanies();
            setStores(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const createStore = async (name: string) => {
        try {
            await mypageCompaniesApi.createCompany({ name });
            await fetchStores();
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    const updateStore = async (id: number, name: string) => {
        try {
            await mypageCompaniesApi.updateCompany(id, { name });
            await fetchStores();
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    const deleteStore = async (id: number) => {
        try {
            await mypageCompaniesApi.deleteCompany(id);
            await fetchStores();
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    return {
        stores,
        loading,
        error,
        createStore,
        updateStore,
        deleteStore,
        refresh: fetchStores,
    };
}
