import { useState, useEffect } from "react";
import { mypageCompaniesApi, mypageWorkerApi, mypageAdvanceRequestApi } from "../utils/mypageApi";
import type { MyPageAdvanceRequest } from "../types/mypage";

export function useMypageAdvanceRequests() {
    const [requests, setRequests] = useState<MyPageAdvanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchAllAdvanceRequests = async () => {
        try {
            setLoading(true);
            setError(null);

            const companies = await mypageCompaniesApi.getCompanies();
            const allRequests: MyPageAdvanceRequest[] = [];

            for (const company of companies) {
                try {
                    const workers = await mypageWorkerApi.getWorkers(company.companyId);

                    for (const worker of workers) {
                        try {
                            const workerRequests = await mypageAdvanceRequestApi.getAdvanceRequests(company.companyId, worker.id);

                            const requestsWithInfo = workerRequests.map((req) => ({
                                ...req,
                                companyId: company.companyId,
                                salaryTargetId: worker.id,
                                workerName: worker.workerName,
                                companyName: company.name,
                            }));

                            allRequests.push(...requestsWithInfo);
                        } catch (err) {
                            console.error(`Failed to fetch requests for worker ${worker.id}:`, err);
                        }
                    }
                } catch (err) {
                    console.error(`Failed to fetch workers for company ${company.companyId}:`, err);
                }
            }

            setRequests(allRequests);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAdvanceRequests();
    }, []);

    const approveRequest = async (request: MyPageAdvanceRequest) => {
        try {
            await mypageAdvanceRequestApi.approveAdvanceRequest(request.companyId, request.salaryTargetId, request.requestId);
            await fetchAllAdvanceRequests();
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    const rejectRequest = async (request: MyPageAdvanceRequest) => {
        try {
            await mypageAdvanceRequestApi.rejectAdvanceRequest(request.companyId, request.salaryTargetId, request.requestId);
            await fetchAllAdvanceRequests();
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    return {
        requests,
        loading,
        error,
        approveRequest,
        rejectRequest,
        refresh: fetchAllAdvanceRequests,
    };
}
