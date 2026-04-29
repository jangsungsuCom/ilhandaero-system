import { useState } from "react";
import styled from "styled-components";
import { updateWorkLog } from "../../../utils/workLog";
import { getAccessCode, getLoginMethod } from "../../../utils/auth";
import { updateWorkLogForEmail } from "../../../utils/mypageApi";
import type { WorkLog } from "../../../types/workLog";
import type { SalaryTarget } from "../../../types/salaryTarget";
import { IosAmPmWheelPicker, IosTwelveHourHourPicker, IosWheelPicker, type WheelOption } from "../../common/IosWheelPicker.tsx";
import { format } from "date-fns";

const MINUTE_OPTIONS: WheelOption<number>[] = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i}분` }));

type Props = {
    open: boolean;
    onClose: () => void;
    workLogs: { workLog: WorkLog; salaryTarget?: SalaryTarget }[];
    onComplete: () => void;
    /** email 로그인 시 선택된 companyId (mypage API용) */
    companyIdForEmail?: number | null;
};

export default function BulkEditModal({ open, onClose, workLogs, onComplete, companyIdForEmail }: Props) {
    const loginMethod = getLoginMethod();
    const [startHour, setStartHour] = useState(9);
    const [startMinute, setStartMinute] = useState(0);
    const [endHour, setEndHour] = useState(18);
    const [endMinute, setEndMinute] = useState(0);
    const [editingTime, setEditingTime] = useState<"start" | "end" | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(0);

    if (!open || workLogs.length === 0) return null;

    const toTimeString = (hour: number, minute: number) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const formatTimeDisplay = (hour: number, minute: number) => `${hour}시 ${minute}분`;

    const handleSave = async () => {
        setIsLoading(true);
        setError("");
        setProgress(0);

        const startTime = toTimeString(startHour, startMinute);
        const endTime = toTimeString(endHour, endMinute);
        let successCount = 0;
        let failCount = 0;

        for (const { workLog, salaryTarget } of workLogs) {
            try {
                if (loginMethod === "email") {
                    if (!salaryTarget || !companyIdForEmail) {
                        failCount++;
                    } else {
                        await updateWorkLogForEmail(
                            companyIdForEmail,
                            salaryTarget.id,
                            workLog.workLogId,
                            {
                                workDate: format(new Date(workLog.workDate), "yyyy-MM-dd"),
                                startTime,
                                endTime,
                            }
                        );
                        successCount++;
                    }
                } else {
                    const ac = getAccessCode() || undefined;
                    await updateWorkLog(
                        workLog.workLogId,
                        format(new Date(workLog.workDate), "yyyy-MM-dd"),
                        startTime,
                        endTime,
                        ac
                    );
                    successCount++;
                }
            } catch {
                failCount++;
            }
            setProgress(successCount + failCount);
        }

        setIsLoading(false);

        if (failCount > 0) {
            setError(`${successCount}개 성공, ${failCount}개 실패`);
        } else {
            onComplete();
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h3>일괄 시간 수정</h3>
                    <CloseButton onClick={onClose}>×</CloseButton>
                </ModalHeader>
                <ModalBody>
                    <InfoText>{workLogs.length}개의 근무 기록을 동일한 시간으로 수정합니다.</InfoText>

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
                                <IosTwelveHourHourPicker value={startHour} onChange={setStartHour} />
                                <MinutePickerWrap>
                                    <IosWheelPicker options={MINUTE_OPTIONS} value={startMinute} onChange={setStartMinute} allowDirectInput={false} />
                                </MinutePickerWrap>
                                <IosAmPmWheelPicker value={startHour} onChange={setStartHour} />
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
                                <IosTwelveHourHourPicker value={endHour} onChange={setEndHour} />
                                <MinutePickerWrap>
                                    <IosWheelPicker options={MINUTE_OPTIONS} value={endMinute} onChange={setEndMinute} allowDirectInput={false} />
                                </MinutePickerWrap>
                                <IosAmPmWheelPicker value={endHour} onChange={setEndHour} />
                            </TimePickerRow>
                        )}
                    </TimeRow>

                    {isLoading && <ProgressText>{progress} / {workLogs.length} 처리 중...</ProgressText>}
                    {error && <ErrorText>{error}</ErrorText>}
                </ModalBody>
                <ModalFooter>
                    <SaveButton onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "수정 중..." : "일괄 수정"}
                    </SaveButton>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
}

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
    min-height: 500px;
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

const InfoText = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #00ccc7;
    margin-bottom: 24px;
    padding: 12px 16px;
    background: #f0faf9;
    border-radius: 10px;
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
    &:hover { background: #f0f9f8; }
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

const ProgressText = styled.div`
    font-size: 14px;
    color: #00ccc7;
    margin-top: 12px;
    font-weight: 600;
`;

const ErrorText = styled.div`
    font-size: 14px;
    color: #e57373;
    margin-top: 12px;
    padding: 8px;
    background: #fff;
    border-radius: 8px;
    border-left: 3px solid #000;
`;

const ModalFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 40px;
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
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
