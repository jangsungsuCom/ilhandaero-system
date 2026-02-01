import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import SettingImg from "../assets/images/workLog/setting.png";
import DownloadImg from "../assets/images/workLog/download.png";
import Calendar from "../components/specific/workLog/Calendar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import { fetchWorkLogsByAccessCode } from "../store/slices/workLogSlice";
import { setSelectedCompany, fetchCompanies } from "../store/slices/companySlice";
import { fetchSalaryTargets } from "../store/slices/salaryTargetSlice";
import { getLoginMethod, getAccessCode } from "../utils/auth";
import { getWorkerInfo } from "../utils/workLog";

const WorkLogPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [workerName, setWorkerName] = useState<string>("");

    const loginMethod = getLoginMethod();
    const { companies, selectedCompanyId, isLoading: companiesLoading } = useAppSelector((state: RootState) => state.company);
    const salaryTargets = useAppSelector((state: RootState) => state.salaryTarget.salaryTargetsByCompany);
    const workLogsByAccessCode = useAppSelector((state: RootState) => state.workLog.workLogsByAccessCode);

    // 이메일 로그인 시 업장 목록 로드
    useEffect(() => {
        if (loginMethod === "email" && companies.length === 0) {
            dispatch(fetchCompanies());
        }
    }, [loginMethod, dispatch, companies.length]);

    // 선택된 업장이 변경되면 직원 목록 로드
    useEffect(() => {
        if (loginMethod === "email" && selectedCompanyId && !salaryTargets[selectedCompanyId]) {
            dispatch(fetchSalaryTargets(selectedCompanyId));
        }
    }, [loginMethod, selectedCompanyId, dispatch, salaryTargets]);

    // 선택된 업장의 직원들의 근무기록 로드
    useEffect(() => {
        if (loginMethod === "email" && selectedCompanyId && salaryTargets[selectedCompanyId]) {
            const targets = salaryTargets[selectedCompanyId];
            targets.forEach((target: { codeStatus: string; accessCode: string }) => {
                if (target.codeStatus === "ACTIVE") {
                    // 항상 최신 데이터를 가져오기 위해 조건 제거
                    dispatch(fetchWorkLogsByAccessCode({ accessCode: target.accessCode, year: currentYear, month: currentMonth }));
                }
            });
        }
    }, [loginMethod, selectedCompanyId, salaryTargets, currentYear, currentMonth, dispatch]);

    // accessCode 로그인 시 근무기록 로드
    useEffect(() => {
        if (loginMethod === "accessCode") {
            const accessCode = getAccessCode();
            if (accessCode && !workLogsByAccessCode[accessCode]) {
                dispatch(fetchWorkLogsByAccessCode({ accessCode, year: currentYear, month: currentMonth }));
            }
        }
    }, [loginMethod, currentYear, currentMonth, dispatch, workLogsByAccessCode]);

    // accessCode 로그인 시 worker 정보 로드
    useEffect(() => {
        if (loginMethod === "accessCode") {
            const accessCode = getAccessCode();
            if (accessCode) {
                getWorkerInfo(accessCode)
                    .then((response) => {
                        setWorkerName(response.data?.workerName || "");
                    })
                    .catch((error) => {
                        console.error("Failed to load worker info:", error);
                    });
            }
        } else {
            setWorkerName("");
        }
    }, [loginMethod]);

    const handleMonthChange = (year: number, month: number) => {
        setCurrentYear(year);
        setCurrentMonth(month);
        // accessCode 로그인인 경우 재로드
        if (loginMethod === "accessCode") {
            const accessCode = getAccessCode();
            if (accessCode) {
                dispatch(fetchWorkLogsByAccessCode({ accessCode, year, month }));
            }
        }
        // email 로그인인 경우 선택된 업장의 모든 직원들의 근무기록 재로드
        else if (loginMethod === "email" && selectedCompanyId && salaryTargets[selectedCompanyId]) {
            const targets = salaryTargets[selectedCompanyId];
            targets.forEach((target: { codeStatus: string; accessCode: string }) => {
                if (target.codeStatus === "ACTIVE") {
                    dispatch(fetchWorkLogsByAccessCode({ accessCode: target.accessCode, year, month }));
                }
            });
        }
    };

    const handleWorkLogCreated = () => {
        // accessCode 로그인인 경우 재로드
        if (loginMethod === "accessCode") {
            const accessCode = getAccessCode();
            if (accessCode) {
                dispatch(fetchWorkLogsByAccessCode({ accessCode, year: currentYear, month: currentMonth }));
            }
        }
        // email 로그인인 경우 선택된 업장의 모든 직원들의 근무기록 재로드
        else if (loginMethod === "email" && selectedCompanyId && salaryTargets[selectedCompanyId]) {
            const targets = salaryTargets[selectedCompanyId];
            targets.forEach((target: { codeStatus: string; accessCode: string }) => {
                if (target.codeStatus === "ACTIVE") {
                    dispatch(fetchWorkLogsByAccessCode({ accessCode: target.accessCode, year: currentYear, month: currentMonth }));
                }
            });
        }
    };

    const currentSalaryTargets = selectedCompanyId ? salaryTargets[selectedCompanyId] || [] : [];

    // accessCode 로그인 시 companyName 가져오기
    const accessCode = loginMethod === "accessCode" ? getAccessCode() : null;
    const accessCodeWorkLogs = accessCode ? workLogsByAccessCode[accessCode] || [] : [];
    const companyName = accessCodeWorkLogs.length > 0 ? accessCodeWorkLogs[0].companyName : null;

    // email 로그인이고 업장이 없는 경우
    if (loginMethod === "email" && !companiesLoading && companies.length === 0) {
        return (
            <PageWrapper>
                <EmptyStateContainer>
                    <EmptyStateText>업장이 없습니다</EmptyStateText>
                    <RegisterButton onClick={() => navigate("/mypage")}>
                        등록하러가기 <Arrow>→</Arrow>
                    </RegisterButton>
                </EmptyStateContainer>
            </PageWrapper>
        );
    }

    const pageTitle =
        loginMethod === "accessCode"
            ? workerName
                ? `${workerName}님의 근무 기록`
                : companyName ?? "나의 근무 기록하기"
            : undefined;

    return (
        <PageWrapper>
            <Header>
                <div className="buttons">
                    <img src={DownloadImg} alt="download" />
                    <img src={SettingImg} alt="setting" />
                </div>
            </Header>
            <Calendar
                workLogsByAccessCode={workLogsByAccessCode}
                salaryTargets={loginMethod === "email" ? currentSalaryTargets : []}
                currentYear={currentYear}
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
                onWorkLogCreated={handleWorkLogCreated}
                loginMethod={loginMethod || undefined}
                accessCode={accessCode || undefined}
                pageTitle={pageTitle}
                companies={loginMethod === "email" ? companies : []}
                selectedCompanyId={loginMethod === "email" ? selectedCompanyId : null}
                onCompanyChange={loginMethod === "email" ? (id) => dispatch(setSelectedCompany(id)) : undefined}
            />
        </PageWrapper>
    );
};

export default WorkLogPage;

const PageWrapper = styled.div`
    width: 1152px;
`;

const Header = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 20px;

    .buttons {
        display: flex;
        align-items: center;
        gap: 40px;
        > img {
            width: 38px;
            height: 38px;
            object-fit: contain;
            cursor: pointer;
        }
    }
`;

const EmptyStateContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 24px;
`;

const EmptyStateText = styled.div`
    font-size: 32px;
    font-weight: 600;
    color: #666;
`;

const RegisterButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    font-size: 18px;
    font-weight: 600;
    color: #00a8a5;
    background: none;
    border: 1.5px solid #00a8a5;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #f0f9f8;
        color: #00cbc7;
        border-color: #00cbc7;
    }
`;

const Arrow = styled.span`
    font-size: 20px;
    font-weight: bold;
`;
