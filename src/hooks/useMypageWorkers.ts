import { useEffect, useState } from "react";
import type { CreateWorkerRequest, MyPageWorker } from "../types/mypage";
import { mypageWorkerApi } from "../utils/mypageApi";

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

    const deleteWorker = async (salaryTargetId: number) => {
        if (!companyId) {
            return { success: false, error: "업체 ID가 필요합니다." };
        }

        try {
            await mypageWorkerApi.deleteWorker(companyId, salaryTargetId);
            await fetchWorkers();
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    const toggleWorkerBlacklist = async (worker: MyPageWorker) => {
        if (!companyId) {
            return { success: false, error: "업체 ID가 필요합니다." };
        }

        try {
            if (worker.blacklisted) {
                await mypageWorkerApi.unblacklistWorker(companyId, worker.id);
            } else {
                await mypageWorkerApi.blacklistWorker(companyId, worker.id);
            }

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
        deleteWorker,
        toggleWorkerBlacklist,
        refresh: fetchWorkers,
    };
}
