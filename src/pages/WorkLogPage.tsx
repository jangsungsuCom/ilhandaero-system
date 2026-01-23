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

    return (
        <PageWrapper>
            <Header>
                <div className="title-section">
                    {loginMethod === "accessCode" ? (
                        <div>
                            {workerName ? `${workerName}님의 근무 기록` : companyName ? companyName : "나의 근무 기록하기"}
                        </div>
                    ) : (
                        <TitleWithSelect>
                            
                            <Select value={selectedCompanyId || ""} onChange={(e) => dispatch(setSelectedCompany(Number(e.target.value) || null))}>
                                <option value="">업장을 선택하세요</option>
                                {companies.map((company: { companyId: number; name: string }) => (
                                    <option key={company.companyId} value={company.companyId}>
                                        {company.name}
                                    </option>
                                ))}
                            </Select>
                            <span>의 근무 기록하기</span>
                        </TitleWithSelect>
                    )}
                </div>
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
    font-size: 46px;
    font-weight: bold;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .title-section {
        display: flex;
        align-items: center;
    }

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

const TitleWithSelect = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 46px;
    font-weight: bold;

    span {
        white-space: nowrap;
    }
`;

const Select = styled.select`
    padding: 8px 12px;
    font-size: 46px;
    font-weight: bold;
    border: 1.5px solid #00ccc7;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    min-width: 200px;
    height: auto;
    appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%2300a8a5%22%20d%3D%22M287%20197.9L159.3%2069.2c-3.7-3.7-9.7-3.7-13.4%200L5.4%20197.9c-3.7%203.7-3.7%209.7%200%2013.4l13.4%2013.4c3.7%203.7%209.7%203.7%2013.4%200l110.7-110.7c3.7-3.7%209.7-3.7%2013.4%200l110.7%20110.7c3.7%203.7%209.7%203.7%2013.4%200l13.4-13.4c3.7-3.7%203.7-9.7%200-13.4z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;

    &:focus {
        outline: none;
        border-color: #00a8a5;
    }

    option[value=""] {
        display: none;
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
