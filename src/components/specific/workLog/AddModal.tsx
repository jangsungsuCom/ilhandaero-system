import { useState, useEffect } from "react";
import styled from "styled-components";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { createWorkLog } from "../../../utils/workLog";
import { getLoginMethod } from "../../../utils/auth";
import { createWorkLogForEmail } from "../../../utils/mypageApi";
import type { SalaryTarget } from "../../../types/salaryTarget";
import { IosAmPmWheelPicker, IosTwelveHourHourPicker, IosWheelPicker, type WheelOption } from "../../common/IosWheelPicker.tsx";
import CustomSelect from "../../common/CustomSelect";

const MINUTE_OPTIONS: WheelOption<number>[] = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i}분` }));

type Props = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedDate: Date;
    onWorkLogCreated?: () => void;
    salaryTargets?: SalaryTarget[];
    /** email 로그인 시 선택된 companyId (mypage API용) */
    companyIdForEmail?: number | null;
};

const toTimeString = (hour: number, minute: number) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

export default function AddModal({ isModalOpen, setIsModalOpen, selectedDate, onWorkLogCreated, salaryTargets = [], companyIdForEmail }: Props) {
    const loginMethod = getLoginMethod();
    const [selectedTargetId, setSelectedTargetId] = useState<number | "">("");
    const [startHour, setStartHour] = useState(9);
    const [startMinute, setStartMinute] = useState(0);
    const [endHour, setEndHour] = useState(18);
    const [endMinute, setEndMinute] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [additionalDates, setAdditionalDates] = useState<Date[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (isModalOpen) {
            setStartHour(9);
            setStartMinute(0);
            setEndHour(18);
            setEndMinute(0);
            setSelectedTargetId("");
            setError("");
            setAdditionalDates([]);
            setShowDatePicker(false);
        }
    }, [isModalOpen]);

    // 모든 선택된 날짜 (초기 날짜 + 추가 날짜)
    const allSelectedDates = [selectedDate, ...additionalDates];

    // 날짜 표시 텍스트
    const dateDisplayText =
        additionalDates.length > 0 ? `${format(selectedDate, "yyyy년 M월 d일 (E)", { locale: ko })} 외 ${additionalDates.length}개` : format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko });

    // 날짜 토글 (추가/제거)
    const handleDateToggle = (date: Date) => {
        // 초기 날짜는 제거 불가
        if (isSameDay(date, selectedDate)) return;

        setAdditionalDates((prev) => {
            const exists = prev.some((d) => isSameDay(d, date));
            if (exists) {
                return prev.filter((d) => !isSameDay(d, date));
            } else {
                return [...prev, date];
            }
        });
    };

    if (!isModalOpen) return null;

    const handleSave = async () => {
        if (loginMethod === "email") {
            if (!selectedTargetId) {
                setError("직원을 선택해주세요.");
                return;
            }
        }

        setIsLoading(true);
        setError("");

        try {
            // 모든 선택된 날짜에 대해 API 호출
            const startTime = toTimeString(startHour, startMinute);
            const endTime = toTimeString(endHour, endMinute);

            if (loginMethod === "email") {
                if (!companyIdForEmail || !selectedTargetId) {
                    setError("업장 또는 직원을 선택해주세요.");
                    setIsLoading(false);
                    return;
                }
                const selectedTarget = salaryTargets.find((target) => target.id === selectedTargetId);
                if (!selectedTarget) {
                    setError("선택한 직원을 찾을 수 없습니다.");
                    setIsLoading(false);
                    return;
                }

                for (const date of allSelectedDates) {
                    await createWorkLogForEmail(companyIdForEmail, selectedTarget.id, {
                        workDate: format(date, "yyyy-MM-dd"),
                        startTime,
                        endTime,
                    });
                }
            } else {
                // accessCode 로그인: 기존 /pud/{accessCode} API 사용
                for (const date of allSelectedDates) {
                    await createWorkLog(
                        {
                            workDate: format(date, "yyyy-MM-dd"),
                            startTime,
                            endTime,
                        },
                        undefined
                    );
                }
            }

            onWorkLogCreated?.();
            setIsModalOpen(false);
            setStartHour(9);
            setStartMinute(0);
            setEndHour(18);
            setEndMinute(0);
            setSelectedTargetId("");
            setAdditionalDates([]);
        } catch (err: any) {
            setError(err.response?.data?.message || "기록에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h3>일정 추가</h3>
                    <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
                </ModalHeader>

                <ModalBody>
                    {loginMethod === "email" && salaryTargets.length > 0 && (
                        <>
                            <SectionTitle>직원 선택</SectionTitle>
                            <Select
                                value={selectedTargetId}
                                placeholder="직원을 선택하세요"
                                options={salaryTargets
                                    .filter((target) => target.codeStatus === "ACTIVE")
                                    .map((target) => ({ value: target.id, label: target.workerName }))}
                                onChange={(value) => setSelectedTargetId(value ? Number(value) : "")}
                            />
                        </>
                    )}

                    <TimeRow>
                        <SectionTitle>선택 날짜</SectionTitle>
                        <TimeDisplayRow>
                            <TimeDisplay>{dateDisplayText}</TimeDisplay>
                            <EditTimeButton type="button" onClick={() => setShowDatePicker(!showDatePicker)}>
                                {showDatePicker ? "완료" : "추가"}
                            </EditTimeButton>
                        </TimeDisplayRow>
                        {showDatePicker && (
                            <DatePickerWrapper>
                                <DayPicker
                                    mode="multiple"
                                    selected={allSelectedDates}
                                    onDayClick={handleDateToggle}
                                    locale={ko}
                                    defaultMonth={selectedDate}
                                    modifiers={{
                                        primary: [selectedDate],
                                    }}
                                    modifiersClassNames={{
                                        primary: "primary-date",
                                    }}
                                />
                            </DatePickerWrapper>
                        )}
                    </TimeRow>

                    <TimeRow>
                        <SectionTitle>시작 시간</SectionTitle>
                        <TimePickerRow>
                            <IosTwelveHourHourPicker value={startHour} onChange={setStartHour} allowDirectInput />
                            <MinutePickerWrap>
                                <IosWheelPicker options={MINUTE_OPTIONS} value={startMinute} onChange={setStartMinute} allowDirectInput />
                            </MinutePickerWrap>
                            <IosAmPmWheelPicker value={startHour} onChange={setStartHour} />
                        </TimePickerRow>
                    </TimeRow>
                    <TimeRow>
                        <SectionTitle>종료 시간</SectionTitle>
                        <TimePickerRow>
                            <IosTwelveHourHourPicker value={endHour} onChange={setEndHour} allowDirectInput />
                            <MinutePickerWrap>
                                <IosWheelPicker options={MINUTE_OPTIONS} value={endMinute} onChange={setEndMinute} allowDirectInput />
                            </MinutePickerWrap>
                            <IosAmPmWheelPicker value={endHour} onChange={setEndHour} />
                        </TimePickerRow>
                    </TimeRow>

                    {error && <ErrorText>{error}</ErrorText>}
                </ModalBody>

                <ModalFooter>
                    <SaveButton onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "기록 중..." : "기록하기"}
                    </SaveButton>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
}

/* =================== styled-components =================== */

const ModalOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
`;

const ModalContent = styled.div`
    background: white;
    width: 520px;
    max-height: 90vh;
    border-radius: 40px;
    overflow-y: auto;
    filter: drop-shadow(0 0 14px rgba(0, 0, 0, 0.2));
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 20px;
    background: #f8f9fa;
    font-weight: bold;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
`;

const ModalBody = styled.div`
    padding: 40px;
`;

const ModalFooter = styled.div`
    display: flex;
    justify-content: center;
    padding-bottom: 40px;
`;

const SectionTitle = styled.div`
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 12px;
`;

const TimeRow = styled.div`
    margin-bottom: 20px;
`;

const TimeDisplayRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
`;

const TimeDisplay = styled.span`
    font-size: 18px;
    font-weight: 600;
    color: #000;
`;

const EditTimeButton = styled.button`
    padding: 6px 14px;
    font-size: 14px;
    font-weight: 600;
    color: #00ccc7;
    background: #fff;
    border: 1.5px solid #00ccc7;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f0f9f8;
    }
`;

const TimePickerRow = styled.div`
    display: flex;
    gap: 24px;
    justify-content: center;
    margin-bottom: 24px;
`;

const DatePickerWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 12px;
    margin-bottom: 12px;

    .rdp {
        --rdp-accent-color: #00ccc7;
        --rdp-accent-background-color: #00ccc7;
    }

    .rdp-nav_button,
    .rdp-nav_button svg,
    .rdp-chevron {
        color: #00ccc7;
        fill: #00ccc7;
    }

    .rdp-day_button {
        border-radius: 8px;
    }

    .rdp-selected .rdp-day_button {
        background-color: #00ccc7;
        color: white;
        border: none;
        outline: none;
        border-radius: 50%;
    }

    .primary-date .rdp-day_button {
        background-color: #00ccc7;
        color: white;
        border: none;
        outline: none;
        border-radius: 50%;
    }
`;

const MinutePickerWrap = styled.div`
    min-width: 88px;
`;

const Select = styled(CustomSelect)`
    width: 100%;
    font-size: 16px;
    margin-bottom: 30px;
`;

const ErrorText = styled.div`
    font-size: 14px;
    color: #000;
    margin-top: 12px;
    padding: 8px;
    background: #fff;
    border-radius: 8px;
    border-left: 3px solid #000;
`;

const SaveButton = styled.button`
    width: 200px;
    height: 56px;
    border-radius: 10px;
    background: #00ccc7;
    border: none;
    color: white;
    font-size: 20px;
    font-weight: 800;
    cursor: pointer;
    transition: opacity 0.2s;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
