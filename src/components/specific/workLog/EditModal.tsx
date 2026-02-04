import { useState, useEffect } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { updateWorkLog, deleteWorkLogByAccessCode } from "../../../utils/workLog";
import { getAccessCode, getLoginMethod } from "../../../utils/auth";
import type { WorkLog } from "../../../types/workLog";
import type { SalaryTarget } from "../../../types/salaryTarget";
import { IosWheelPicker, type WheelOption } from "../../common/IosWheelPicker.tsx";

const HOUR_OPTIONS: WheelOption<number>[] = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i}시` }));
const MINUTE_OPTIONS: WheelOption<number>[] = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i}분` }));

/** "HH:mm" 또는 "HH:mm:ss" (API) 형식 파싱 */
function parseTimeHHmm(s: string | undefined): { hour: number; minute: number } {
    const t = typeof s === "string" ? s.trim() : "";
    if (!t) return { hour: 9, minute: 0 };
    const parts = t.split(":");
    if (parts.length < 2) return { hour: 9, minute: 0 };
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return { hour: 9, minute: 0 };
    return {
        hour: Math.min(23, Math.max(0, h)),
        minute: Math.min(59, Math.max(0, m)),
    };
}

type Props = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editingWorkLog: WorkLog;
    salaryTarget?: SalaryTarget;
    onWorkLogUpdated?: () => void;
};

export default function EditModal({ isModalOpen, setIsModalOpen, editingWorkLog, salaryTarget, onWorkLogUpdated }: Props) {
    const loginMethod = getLoginMethod();
    const [startHour, setStartHour] = useState(9);
    const [startMinute, setStartMinute] = useState(0);
    const [endHour, setEndHour] = useState(18);
    const [endMinute, setEndMinute] = useState(0);
    const [editingTime, setEditingTime] = useState<"start" | "end" | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isModalOpen || !editingWorkLog) return;
        setEditingTime(null);
        const hasStartEnd =
            typeof editingWorkLog.startTime === "string" && editingWorkLog.startTime.trim() !== "" && typeof editingWorkLog.endTime === "string" && editingWorkLog.endTime.trim() !== "";
        if (hasStartEnd) {
            const start = parseTimeHHmm(editingWorkLog.startTime);
            const end = parseTimeHHmm(editingWorkLog.endTime);
            setStartHour(start.hour);
            setStartMinute(start.minute);
            setEndHour(end.hour);
            setEndMinute(end.minute);
        } else {
            const totalMinutes = editingWorkLog.workedMinutes ?? 0;
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            setStartHour(9);
            setStartMinute(0);
            setEndHour(9 + h);
            setEndMinute(Math.min(59, m));
        }
        setError("");
    }, [isModalOpen, editingWorkLog]);

    if (!isModalOpen) return null;

    const toTimeString = (hour: number, minute: number) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const formatTimeDisplay = (hour: number, minute: number) => `${hour}시 ${minute}분`;

    const handleSave = async () => {
        const startMins = startHour * 60 + startMinute;
        const endMins = endHour * 60 + endMinute;
        if (endMins <= startMins) {
            setError("종료 시간은 시작 시간보다 늦어야 합니다.");
            return;
        }
        if (endMins - startMins < 30) {
            setError("근무시간은 최소 30분 이상이어야 합니다.");
            return;
        }
        if (startMinute % 30 !== 0 || endMinute % 30 !== 0) {
            setError("분은 30분 단위로 입력해주세요 (0, 30).");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            let accessCode: string | undefined;
            if (loginMethod === "email") {
                if (!salaryTarget) {
                    setError("직원 정보를 찾을 수 없습니다.");
                    setIsLoading(false);
                    return;
                }
                accessCode = salaryTarget.accessCode;
            } else {
                const savedAccessCode = getAccessCode();
                if (!savedAccessCode) {
                    setError("접근 코드를 찾을 수 없습니다.");
                    setIsLoading(false);
                    return;
                }
                accessCode = savedAccessCode;
            }
            await updateWorkLog(editingWorkLog.workLogId, format(new Date(editingWorkLog.workDate), "yyyy-MM-dd"), toTimeString(startHour, startMinute), toTimeString(endHour, endMinute), accessCode);
            onWorkLogUpdated?.();
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.response?.data?.message || "수정에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("이 근무 기록을 삭제하시겠습니까?")) return;
        setIsDeleting(true);
        setError("");
        try {
            let accessCode: string | undefined;
            if (loginMethod === "email") {
                if (!salaryTarget) {
                    setError("직원 정보를 찾을 수 없습니다.");
                    setIsDeleting(false);
                    return;
                }
                accessCode = salaryTarget.accessCode;
            } else {
                const savedAccessCode = getAccessCode();
                if (!savedAccessCode) {
                    setError("접근 코드를 찾을 수 없습니다.");
                    setIsDeleting(false);
                    return;
                }
                accessCode = savedAccessCode;
            }
            await deleteWorkLogByAccessCode(editingWorkLog.workLogId, accessCode);
            onWorkLogUpdated?.();
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.response?.data?.message || "삭제에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsDeleting(false);
        }
    };

    // email 유저는 salaryTarget 필요, accessCode 유저는 항상 삭제 가능
    const showDeleteButton = loginMethod === "accessCode" || (loginMethod === "email" && salaryTarget != null);

    return (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h3>근무 기록 수정</h3>
                    <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
                </ModalHeader>

                <ModalBody>
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
                        {isLoading ? "수정 중..." : "수정하기"}
                    </SaveButton>
                    {showDeleteButton && (
                        <DeleteButton type="button" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? "삭제 중..." : "삭제하기"}
                        </DeleteButton>
                    )}
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

const ErrorText = styled.div`
    font-size: 14px;
    color: #e57373;
    margin-top: 12px;
    padding: 8px;
    background: #ffebee;
    border-radius: 8px;
    border-left: 3px solid #e57373;
`;

const ModalFooter = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding-bottom: 40px;
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

const DeleteButton = styled.button`
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
