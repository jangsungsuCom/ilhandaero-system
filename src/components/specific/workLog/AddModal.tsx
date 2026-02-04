import { useState, useEffect } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { createWorkLog } from "../../../utils/workLog";
import { getLoginMethod } from "../../../utils/auth";
import type { SalaryTarget } from "../../../types/salaryTarget";
import { IosWheelPicker, type WheelOption } from "../../common/IosWheelPicker.tsx";

const HOUR_OPTIONS: WheelOption<number>[] = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i}시` }));
const MINUTE_OPTIONS: WheelOption<number>[] = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i}분` }));

type Props = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedDate: Date;
    onWorkLogCreated?: () => void;
    salaryTargets?: SalaryTarget[];
};

const toTimeString = (hour: number, minute: number) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

export default function AddModal({ isModalOpen, setIsModalOpen, selectedDate, onWorkLogCreated, salaryTargets = [] }: Props) {
    const loginMethod = getLoginMethod();
    const [selectedTargetId, setSelectedTargetId] = useState<number | "">("");
    const [startHour, setStartHour] = useState(9);
    const [startMinute, setStartMinute] = useState(0);
    const [endHour, setEndHour] = useState(18);
    const [endMinute, setEndMinute] = useState(0);
    const [editingTime, setEditingTime] = useState<"start" | "end" | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isModalOpen) {
            setStartHour(9);
            setStartMinute(0);
            setEndHour(18);
            setEndMinute(0);
            setEditingTime(null);
            setSelectedTargetId("");
            setError("");
        }
    }, [isModalOpen]);

    const formatTimeDisplay = (hour: number, minute: number) => `${hour}시 ${minute}분`;

    if (!isModalOpen) return null;

    const handleSave = async () => {
        if (loginMethod === "email") {
            if (!selectedTargetId) {
                setError("직원을 선택해주세요.");
                return;
            }
        }

        // const startMins = startHour * 60 + startMinute;
        // const endMins = endHour * 60 + endMinute;
        // if (endMins <= startMins) {
        //     setError("종료 시간은 시작 시간보다 늦어야 합니다.");
        //     return;
        // }
        // if (endMins - startMins < 30) {
        //     setError("근무시간은 최소 30분 이상이어야 합니다.");
        //     return;
        // }
        // if (startMinute % 30 !== 0 || endMinute % 30 !== 0) {
        //     setError("분은 30분 단위로 입력해주세요 (0, 30).");
        //     return;
        // }

        setIsLoading(true);
        setError("");

        try {
            let accessCode: string | undefined;
            if (loginMethod === "email") {
                const selectedTarget = salaryTargets.find((target) => target.id === selectedTargetId);
                if (!selectedTarget) {
                    setError("선택한 직원을 찾을 수 없습니다.");
                    setIsLoading(false);
                    return;
                }
                accessCode = selectedTarget.accessCode;
            }

            await createWorkLog(
                {
                    workDate: format(selectedDate, "yyyy-MM-dd"),
                    startTime: toTimeString(startHour, startMinute),
                    endTime: toTimeString(endHour, endMinute),
                },
                accessCode
            );
            onWorkLogCreated?.();
            setIsModalOpen(false);
            setStartHour(9);
            setStartMinute(0);
            setEndHour(18);
            setEndMinute(0);
            setSelectedTargetId("");
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
                            <Select value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value ? Number(e.target.value) : "")}>
                                <option value="">직원을 선택하세요</option>
                                {salaryTargets
                                    .filter((target) => target.codeStatus === "ACTIVE")
                                    .map((target) => (
                                        <option key={target.id} value={target.id}>
                                            {target.workerName}
                                        </option>
                                    ))}
                            </Select>
                        </>
                    )}

                    <TimeRow>
                        <SectionTitle>시작 시간</SectionTitle>
                        <TimeDisplayRow>
                            <TimeDisplay>{formatTimeDisplay(startHour, startMinute)}</TimeDisplay>
                            <EditTimeButton type="button" onClick={() => setEditingTime(editingTime === "start" ? null : "start")}>
                                {editingTime === "start" ? "완료" : "수정"}
                            </EditTimeButton>
                        </TimeDisplayRow>
                        {editingTime === "start" && (
                            <TimePickerRow>
                                <IosWheelPicker options={HOUR_OPTIONS} value={startHour} onChange={setStartHour} allowDirectInput={false} />
                                <MinutePickerWrap>
                                    <IosWheelPicker options={MINUTE_OPTIONS} value={startMinute} onChange={setStartMinute} allowDirectInput={false} />
                                </MinutePickerWrap>
                            </TimePickerRow>
                        )}
                    </TimeRow>
                    <TimeRow>
                        <SectionTitle>종료 시간</SectionTitle>
                        <TimeDisplayRow>
                            <TimeDisplay>{formatTimeDisplay(endHour, endMinute)}</TimeDisplay>
                            <EditTimeButton type="button" onClick={() => setEditingTime(editingTime === "end" ? null : "end")}>
                                {editingTime === "end" ? "완료" : "수정"}
                            </EditTimeButton>
                        </TimeDisplayRow>
                        {editingTime === "end" && (
                            <TimePickerRow>
                                <IosWheelPicker options={HOUR_OPTIONS} value={endHour} onChange={setEndHour} allowDirectInput={false} />
                                <MinutePickerWrap>
                                    <IosWheelPicker options={MINUTE_OPTIONS} value={endMinute} onChange={setEndMinute} allowDirectInput={false} />
                                </MinutePickerWrap>
                            </TimePickerRow>
                        )}
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
    min-height: 600px;
    border-radius: 40px;
    overflow: hidden;
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
    color: #2c3e50;
`;

const EditTimeButton = styled.button`
    padding: 6px 14px;
    font-size: 14px;
    font-weight: 600;
    color: #00a8a5;
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

const MinutePickerWrap = styled.div`
    min-width: 88px;
`;

const Select = styled.select`
    width: 100%;
    padding: 12px;
    border: 1.5px solid #00ccc7;
    border-radius: 8px;
    font-size: 16px;
    margin-bottom: 30px;
    background: white;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: #00cbc7;
    }

    option[value=""] {
        display: none;
    }
`;

const ErrorText = styled.div`
    font-size: 14px;
    color: #e57373;
    margin-top: 12px;
    padding: 8px;
    background: #ffebee;
    border-radius: 8px;
    border-left: 3px solid #e57373;
`;

const SaveButton = styled.button`
    width: 200px;
    height: 56px;
    border-radius: 10px;
    background-image: linear-gradient(-60deg, #00cbc7 0%, #75ec9d 100%);
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
