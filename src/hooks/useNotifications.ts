import { useState, useEffect, useCallback, useRef } from "react";
import { getLoginMethod } from "../utils/auth";
import {
    getAccessCodeNotifications,
    getAllNotifications,
    markAccessCodeActivityAsRead,
    markActivityAsRead,
    markAllAccessCodeActivitiesAsRead,
    markAllActivitiesAsRead,
    acceptAccessCodeActivity,
    rejectAccessCodeActivity,
    acceptActivity,
    rejectActivity,
} from "../utils/notificationApi";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCompanies } from "../store/slices/companySlice";
import { fetchSalaryTargets } from "../store/slices/salaryTargetSlice";
import type { NotificationItem } from "../types/notification";

const POLL_INTERVAL = 60_000;

export function useNotifications() {
    const loginMethod = getLoginMethod();
    const isOwner = loginMethod === "email";
    const isAccessCode = loginMethod === "accessCode";
    const canUseNotifications = isOwner || isAccessCode;

    const dispatch = useAppDispatch();
    const companies = useAppSelector((s) => s.company.companies);
    const salaryTargetsByCompany = useAppSelector((s) => s.salaryTarget.salaryTargetsByCompany);

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasFetchedTargets = useRef(false);

    useEffect(() => {
        if (!isOwner) return;
        if (companies.length === 0) {
            dispatch(fetchCompanies());
        }
    }, [isOwner, companies.length, dispatch]);

    useEffect(() => {
        if (!isOwner || companies.length === 0 || hasFetchedTargets.current) return;
        hasFetchedTargets.current = true;
        for (const c of companies) {
            if (!salaryTargetsByCompany[c.companyId]) {
                dispatch(fetchSalaryTargets(c.companyId));
            }
        }
    }, [isOwner, companies, salaryTargetsByCompany, dispatch]);

    const load = useCallback(async () => {
        if (isAccessCode) {
            setIsLoading(true);
            try {
                const items = await getAccessCodeNotifications();
                setNotifications(items);
            } catch {
                // silent
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (!isOwner || companies.length === 0) return;

        const hasTargets = companies.some(
            (c) => (salaryTargetsByCompany[c.companyId] ?? []).length > 0
        );
        if (!hasTargets) return;

        setIsLoading(true);
        try {
            const items = await getAllNotifications(companies, salaryTargetsByCompany);
            setNotifications(items);
        } catch {
            // silent
        } finally {
            setIsLoading(false);
        }
    }, [isOwner, isAccessCode, companies, salaryTargetsByCompany]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!canUseNotifications) return;
        timerRef.current = setInterval(load, POLL_INTERVAL);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [canUseNotifications, load]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const markAsRead = useCallback(
        async (item: NotificationItem) => {
            setNotifications((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
            );
            if (isOwner) {
                await markActivityAsRead(item.companyId, item.salaryTargetId, item.id);
            } else if (isAccessCode) {
                await markAccessCodeActivityAsRead(item.id);
            }
        },
        [isOwner, isAccessCode]
    );

    const markAllAsRead = useCallback(async () => {
        const unreadItems = notifications.filter((n) => !n.isRead);
        if (unreadItems.length === 0) return;

        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

        if (isOwner) {
            for (const company of companies) {
                const targets = salaryTargetsByCompany[company.companyId] ?? [];
                for (const target of targets) {
                    await markAllActivitiesAsRead(company.companyId, target.id);
                }
            }
        } else if (isAccessCode) {
            await markAllAccessCodeActivitiesAsRead();
        }
    }, [notifications, isOwner, isAccessCode, companies, salaryTargetsByCompany]);

    const respondToUpdate = useCallback(
        async (item: NotificationItem, decision: "accept" | "reject") => {
            setNotifications((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
            );

            let actionOk = false;
            if (isOwner) {
                actionOk =
                    decision === "accept"
                        ? await acceptActivity(item.companyId, item.salaryTargetId, item.id)
                        : await rejectActivity(item.companyId, item.salaryTargetId, item.id);
            } else if (isAccessCode) {
                actionOk =
                    decision === "accept"
                        ? await acceptAccessCodeActivity(item.id)
                        : await rejectAccessCodeActivity(item.id);
            }

            if (!actionOk) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, isRead: item.isRead } : n))
                );
                throw new Error("처리에 실패했습니다.");
            }

            const readOk = isOwner
                ? await markActivityAsRead(item.companyId, item.salaryTargetId, item.id)
                : isAccessCode
                  ? await markAccessCodeActivityAsRead(item.id)
                  : false;

            if (!readOk) {
                await load();
                throw new Error("읽음 처리에 실패했습니다.");
            }

            if (decision === "reject") {
                await load();
                window.dispatchEvent(new Event("worklog:changed"));
            }
        },
        [isOwner, isAccessCode, load]
    );

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        respondToUpdate,
        refresh: load,
    };
}
