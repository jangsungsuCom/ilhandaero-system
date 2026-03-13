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
import { getWorkerInfo, getWorkAmount } from "../utils/workLog";
import { getCalendarSettings } from "../utils/calendarSettings";
import { format } from "date-fns";
import CalendarSettingModal from "../components/specific/workLog/CalendarSettingModal";
import { IosWheelPicker, type WheelOption } from "../components/common/IosWheelPicker";
import { media } from "../styles/breakpoints";

const YEAR_OPTIONS = (centerYear: number): WheelOption<number>[] => Array.from({ length: 21 }, (_, i) => centerYear - 10 + i).map((y) => ({ value: y, label: `${y}년` }));

const MONTH_OPTIONS: WheelOption<number>[] = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i + 1}월` }));

const WorkLogPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [workerName, setWorkerName] = useState<string>("");
    const [workerColorHex, setWorkerColorHex] = useState<string | undefined>(undefined);
    const [workAmountData, setWorkAmountData] = useState<{ grossAmount: number; totalAdvanced: number } | null>(null);
    const [workAmountRows, setWorkAmountRows] = useState<{ workerName: string; grossAmount: number; totalAdvanced: number }[]>([]);
    const [advanceDetails, setAdvanceDetails] = useState<{ date: string; amount: number; status: string }[]>([]);
    const [isCalendarSettingModalOpen, setIsCalendarSettingModalOpen] = useState(false);
    const [calendarSettings, setCalendarSettings] = useState(getCalendarSettings);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pendingYear, setPendingYear] = useState(currentYear);
    const [pendingMonth, setPendingMonth] = useState(currentMonth);

    const loginMethod = getLoginMethod();
    const { companies, selectedCompanyId, isLoading: companiesLoading, error: companiesError, hasFetched } = useAppSelector((state: RootState) => state.company);
    const salaryTargets = useAppSelector((state: RootState) => state.salaryTarget.salaryTargetsByCompany);
    const workLogsByAccessCode = useAppSelector((state: RootState) => state.workLog.workLogsByAccessCode);

    // 피커가 열릴 때 pending 값을 현재 값으로 동기화
    useEffect(() => {
        if (pickerOpen) {
            setPendingYear(currentYear);
            setPendingMonth(currentMonth);
        }
    }, [pickerOpen, currentYear, currentMonth]);

    const handleSelectMonthYear = (year: number, month: number) => {
        setCurrentYear(year);
        setCurrentMonth(month);
        setPickerOpen(false);
        // accessCode 로그인인 경우 재로드
        if (loginMethod === "accessCode") {
            const ac = getAccessCode();
            if (ac) {
                dispatch(fetchWorkLogsByAccessCode({ accessCode: ac, year, month }));
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
        // 총 급여 데이터도 다시 로드
        loadWorkAmountData(year, month);
    };

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

    // accessCode 로그인 시 근무기록 + work-amount 로드
    useEffect(() => {
        if (loginMethod === "accessCode") {
            const ac = getAccessCode();
            if (ac) {
                if (!workLogsByAccessCode[ac]) {
                    dispatch(fetchWorkLogsByAccessCode({ accessCode: ac, year: currentYear, month: currentMonth }));
                }
                const startDate = new Date(currentYear, currentMonth, 1);
                const endDate = new Date(currentYear, currentMonth + 1, 0);
                const from = format(startDate, "yyyy-MM-dd");
                const to = format(endDate, "yyyy-MM-dd");
                getWorkAmount(ac, from, to)
                    .then((res) => {
                        const data = res?.data;
                        console.log("work-amount full response:", res);
                        console.log("work-amount data:", data);
                        if (data) {
                            setWorkAmountData({ grossAmount: data.grossAmount ?? 0, totalAdvanced: data.totalAdvanced ?? data.totalAdvancedInPeriod ?? 0 });
                            const rawAny = data as any;
                            const details = rawAny.advanceRequests || rawAny.advances || rawAny.advanceDetails || rawAny.advancedDetails || [];
                            console.log("advance details from work-amount:", details);
                            if (Array.isArray(details) && details.length > 0) {
                                setAdvanceDetails(details.map((d: any) => ({
                                    date: d.requestDate || d.createdAt || d.date || d.requestedAt || "",
                                    amount: d.amount ?? 0,
                                    status: d.status ?? "",
                                })));
                            } else {
                                setAdvanceDetails([]);
                            }
                        }
                    })
                    .catch(() => {});
            }
        }
    }, [loginMethod, currentYear, currentMonth, dispatch, workLogsByAccessCode]);

    // workAmount 데이터를 로드하는 함수
    const loadWorkAmountData = (year: number, month: number) => {
        if (loginMethod === "email" && selectedCompanyId && salaryTargets[selectedCompanyId]) {
            const targets = salaryTargets[selectedCompanyId].filter((t: { codeStatus: string }) => t.codeStatus === "ACTIVE");
            if (targets.length === 0) {
                setWorkAmountData(null);
                setWorkAmountRows([]);
                return;
            }
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            const from = format(startDate, "yyyy-MM-dd");
            const to = format(endDate, "yyyy-MM-dd");
            Promise.all(targets.map((t: { accessCode: string; workerName: string }) => getWorkAmount(t.accessCode, from, to).then((res) => ({ workerName: t.workerName, data: res?.data }))))
                .then((results) => {
                    let sumGross = 0;
                    let sumAdvanced = 0;
                    const rows: { workerName: string; grossAmount: number; totalAdvanced: number }[] = [];
                    results.forEach((r, i) => {
                        const g = typeof r.data?.grossAmount === "number" ? r.data.grossAmount : 0;
                        const a = typeof (r.data?.totalAdvanced ?? r.data?.totalAdvancedInPeriod) === "number" ? (r.data?.totalAdvanced ?? r.data?.totalAdvancedInPeriod ?? 0) : 0;
                        sumGross += g;
                        sumAdvanced += a;
                        rows.push({ workerName: targets[i].workerName, grossAmount: g, totalAdvanced: a });
                    });
                    setWorkAmountData({ grossAmount: sumGross, totalAdvanced: sumAdvanced });
                    setWorkAmountRows(rows);
                })
                .catch(() => {
                    setWorkAmountData(null);
                    setWorkAmountRows([]);
                });
            return;
        }
        setWorkAmountData(null);
        setWorkAmountRows([]);
    };

    // email 로그인 시 work-amount 로드
    useEffect(() => {
        if (loginMethod === "email") {
            loadWorkAmountData(currentYear, currentMonth);
        }
    }, [loginMethod, currentYear, currentMonth, selectedCompanyId, salaryTargets]);

    // accessCode 로그인 시 worker 정보 로드
    useEffect(() => {
        if (loginMethod === "accessCode") {
            const accessCode = getAccessCode();
            if (accessCode) {
                getWorkerInfo(accessCode)
                    .then((response) => {
                        console.log("workerInfo full response:", response);
                        console.log("workerInfo data:", response.data);
                        setWorkerName(response.data?.workerName || "");
                        setWorkerColorHex(response.data?.colorHex);
                    })
                    .catch((error) => {
                        console.error("Failed to load worker info:", error);
                    });
            }
        } else {
            setWorkerName("");
            setWorkerColorHex(undefined);
        }
    }, [loginMethod]);

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
        // 총 급여 데이터도 다시 로드
        loadWorkAmountData(currentYear, currentMonth);
    };

    const currentSalaryTargets = selectedCompanyId ? salaryTargets[selectedCompanyId] || [] : [];

    // accessCode 로그인 시 companyName 가져오기
    const accessCode = loginMethod === "accessCode" ? getAccessCode() : null;
    const accessCodeWorkLogs = accessCode ? workLogsByAccessCode[accessCode] || [] : [];
    const companyName = accessCodeWorkLogs.length > 0 ? accessCodeWorkLogs[0].companyName : null;
    if (accessCodeWorkLogs.length > 0) {
        console.log("sample workLog full object:", accessCodeWorkLogs[0]);
    }

    // email 로그인 시 업장 로딩 중 (또는 아직 fetch 전)
    if (loginMethod === "email" && (companiesLoading || (!hasFetched && companies.length === 0))) {
        return (
            <PageWrapper>
                <EmptyStateContainer>
                    <EmptyStateText>업장 목록을 불러오는 중...</EmptyStateText>
                </EmptyStateContainer>
            </PageWrapper>
        );
    }

    // email 로그인 시 업장 목록 로드 실패 (재시도 가능)
    if (loginMethod === "email" && companiesError) {
        return (
            <PageWrapper>
                <EmptyStateContainer>
                    <EmptyStateText>{companiesError}</EmptyStateText>
                    <RegisterButton onClick={() => dispatch(fetchCompanies())}>
                        다시 시도
                    </RegisterButton>
                </EmptyStateContainer>
            </PageWrapper>
        );
    }

    // email 로그인이고 업장이 없는 경우 (fetch 완료 후 빈 결과)
    if (loginMethod === "email" && hasFetched && companies.length === 0) {
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

    const pageTitle = loginMethod === "accessCode" ? (workerName ? `${workerName}님의 근무 기록` : companyName ?? "나의 근무 기록하기") : undefined;

    return (
        <PageWrapper>
            <CalendarSettingModal open={isCalendarSettingModalOpen} onClose={() => setIsCalendarSettingModalOpen(false)} onSettingsChange={() => setCalendarSettings(getCalendarSettings())} />
            <Calendar
                workLogsByAccessCode={workLogsByAccessCode}
                salaryTargets={loginMethod === "email" ? currentSalaryTargets : []}
                currentYear={currentYear}
                currentMonth={currentMonth}
                onWorkLogCreated={handleWorkLogCreated}
                loginMethod={loginMethod || undefined}
                accessCode={accessCode || undefined}
                pageTitle={pageTitle}
                companies={loginMethod === "email" ? companies : []}
                selectedCompanyId={loginMethod === "email" ? selectedCompanyId : null}
                onCompanyChange={loginMethod === "email" ? (id) => dispatch(setSelectedCompany(id)) : undefined}
                workAmountData={workAmountData}
                workAmountRows={loginMethod === "email" ? workAmountRows : undefined}
                calendarStartDay={calendarSettings.startDay}
                workTimeDisplayFormat={calendarSettings.workTimeFormat}
                advanceDetails={loginMethod === "accessCode" ? advanceDetails : undefined}
                workerColorHex={loginMethod === "accessCode" ? workerColorHex : undefined}
                headerLeft={
                    <PickerButton onClick={() => setPickerOpen(!pickerOpen)}>
                        {currentYear}년 {currentMonth + 1}월 ˅
                    </PickerButton>
                }
                headerRight={
                    <IconGroup>
                        <GrayIcon src={DownloadImg} alt="download" />
                        <SettingButton type="button" onClick={() => setIsCalendarSettingModalOpen(true)} aria-label="달력 설정">
                            <img src={SettingImg} alt="setting" />
                        </SettingButton>
                    </IconGroup>
                }
                pickerSlot={pickerOpen ? (
                    <PickerBox>
                        <WheelPickerRow>
                            <IosWheelPicker options={YEAR_OPTIONS(currentYear)} value={pendingYear} onChange={(y: number) => setPendingYear(y)} centerInputMode centerInputSuffix="년" />
                            <IosWheelPicker options={MONTH_OPTIONS} value={pendingMonth} onChange={(m: number) => setPendingMonth(m)} centerInputMode centerInputSuffix="월" />
                        </WheelPickerRow>
                        <PickerConfirmRow>
                            <PickerConfirmButton type="button" onClick={() => handleSelectMonthYear(pendingYear, pendingMonth)}>
                                적용
                            </PickerConfirmButton>
                        </PickerConfirmRow>
                    </PickerBox>
                ) : null}
            />
        </PageWrapper>
    );
};

export default WorkLogPage;

const PageWrapper = styled.div`
    width: 1152px;
    max-width: 100%;

    ${media.desktop} {
        width: 100%;
    }
`;

const IconGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;

    ${media.mobile} {
        gap: 6px;
    }
`;

const GrayIcon = styled.img`
    width: 22px;
    height: 22px;
    object-fit: contain;
    cursor: pointer;
    filter: grayscale(100%) brightness(0.6);

    ${media.mobile} {
        width: 18px;
        height: 18px;
    }
`;

const PickerButton = styled.div`
    width: 100%;
    height: 72px;
    background: #00ccc7;
    border-radius: 36px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 24px;
    font-size: 24px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        opacity: 0.95;
    }

    ${media.desktop} {
        height: 60px;
        font-size: 22px;
        padding: 0 20px;
    }

    ${media.tablet} {
        height: 48px;
        font-size: 17px;
        padding: 0 16px;
        border-radius: 24px;
    }

    ${media.mobile} {
        height: 40px;
        font-size: 13px;
        padding: 0 12px;
        border-radius: 20px;
    }
`;

const PickerBox = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    gap: 20px;
`;

const WheelPickerRow = styled.div`
    display: flex;
    gap: 40px;
    align-items: flex-start;
`;

const PickerConfirmRow = styled.div`
    margin-left: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const PickerConfirmButton = styled.button`
    width: 80px;
    height: 32px;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    background: #00ccc7;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.85;
    }
`;

const SettingButton = styled.button`
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    > img {
        width: 22px;
        height: 22px;
        object-fit: contain;
        filter: grayscale(100%) brightness(0.6);
    }

    ${media.mobile} {
        > img {
            width: 18px;
            height: 18px;
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

    ${media.mobile} {
        min-height: 300px;
        gap: 16px;
    }
`;

const EmptyStateText = styled.div`
    font-size: 32px;
    font-weight: 600;
    color: #000;

    ${media.tablet} {
        font-size: 24px;
    }

    ${media.mobile} {
        font-size: 20px;
    }
`;

const RegisterButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    font-size: 18px;
    font-weight: 600;
    color: #00ccc7;
    background: none;
    border: 1.5px solid #00ccc7;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #fff;
        color: #00ccc7;
        border-color: #00ccc7;
    }

    ${media.mobile} {
        padding: 10px 20px;
        font-size: 16px;
    }
`;

const Arrow = styled.span`
    font-size: 20px;
    font-weight: bold;

    ${media.mobile} {
        font-size: 18px;
    }
`;
