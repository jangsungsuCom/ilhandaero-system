import { useState, useEffect } from "react";
import { mypageWorkerApi } from "../utils/mypageApi";
import type { MyPageWorker, CreateWorkerRequest } from "../types/mypage";

export function useMypageWorkers(companyId?: number) {
    const [workers, setWorkers] = useState<MyPageWorker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchWorkers = async () => {
        if (!companyId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await mypageWorkerApi.getWorkers(companyId);
            setWorkers(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, [companyId]);

    const createWorker = async (data: CreateWorkerRequest) => {
        if (!companyId) {
            return { success: false, error: "업체 ID가 필요합니다." };
        }

        try {
            await mypageWorkerApi.createWorker(companyId, data);
            await fetchWorkers();
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    const updateWorker = async (salaryTargetId: number, data: CreateWorkerRequest) => {
        if (!companyId) {
            return { success: false, error: "업체 ID가 필요합니다." };
        }

        try {
            await mypageWorkerApi.updateWorker(companyId, salaryTargetId, data);
            await fetchWorkers();
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    return {
        workers,
        loading,
        error,
        createWorker,
        updateWorker,
        refresh: fetchWorkers,
    };
}
