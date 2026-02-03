import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getCalendarSettings, setCalendarStartDay, setCalendarWorkTimeFormat, type CalendarStartDay, type WorkTimeDisplayFormat } from "../../../utils/calendarSettings";

type Props = {
    open: boolean;
    onClose: () => void;
    onSettingsChange?: () => void;
};

const START_DAY_OPTIONS: { value: CalendarStartDay; label: string }[] = [
    { value: 1, label: "월요일" },
    { value: 2, label: "화요일" },
    { value: 3, label: "수요일" },
    { value: 4, label: "목요일" },
    { value: 5, label: "금요일" },
    { value: 6, label: "토요일" },
    { value: 0, label: "일요일" },
];

const WORK_TIME_FORMAT_OPTIONS: { value: WorkTimeDisplayFormat; label: string }[] = [
    { value: "hours", label: "nn h (예: 2h, 8.5h)" },
    { value: "range", label: "hh:mm~hh:mm (예: 09:00~18:00)" },
];

const CalendarSettingModal: React.FC<Props> = ({ open, onClose, onSettingsChange }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [startDay, setStartDayState] = useState<CalendarStartDay>(0);
    const [workTimeFormat, setWorkTimeFormatState] = useState<WorkTimeDisplayFormat>("hours");

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open) {
            const settings = getCalendarSettings();
            setStartDayState(settings.startDay);
            setWorkTimeFormatState(settings.workTimeFormat);
            dialog.showModal();
        } else {
            dialog.close();
        }
    }, [open]);

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === dialogRef.current) {
            handleClose();
        }
    };

    const handleStartDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStartDayState(Number(e.target.value) as CalendarStartDay);
    };

    const handleWorkTimeFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setWorkTimeFormatState(e.target.value as WorkTimeDisplayFormat);
    };

    const handleApply = () => {
        setCalendarStartDay(startDay);
        setCalendarWorkTimeFormat(workTimeFormat);
        onSettingsChange?.();
        handleClose();
    };

    return (
        <StyledDialog ref={dialogRef} onClick={handleBackdropClick} onCancel={handleClose}>
            <DialogInner>
                <DialogHeader>
                    <DialogTitle>달력 설정</DialogTitle>
                    <CloseButton type="button" onClick={handleClose} aria-label="닫기">
                        ×
                    </CloseButton>
                </DialogHeader>
                <DialogBody>
                    <SettingRow>
                        <Label>시작 요일</Label>
                        <Select value={startDay} onChange={handleStartDayChange}>
                            {START_DAY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </Select>
                    </SettingRow>
                    <SettingRow>
                        <Label>근무시간 표시</Label>
                        <Select value={workTimeFormat} onChange={handleWorkTimeFormatChange}>
                            {WORK_TIME_FORMAT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </Select>
                    </SettingRow>
                    <Footer>
                        <ApplyButton type="button" onClick={handleApply}>
                            적용
                        </ApplyButton>
                    </Footer>
                </DialogBody>
            </DialogInner>
        </StyledDialog>
    );
};

export default CalendarSettingModal;

const StyledDialog = styled.dialog`
    margin: auto;
    padding: 0;
    border: none;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 90vw;
    width: 420px;

    &::backdrop {
        background: rgba(0, 0, 0, 0.4);
    }
`;

const DialogInner = styled.div`
    padding: 0;
`;

const DialogHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e8e8e8;
`;

const DialogTitle = styled.h2`
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
`;

const CloseButton = styled.button`
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: none;
    font-size: 24px;
    line-height: 1;
    color: #666;
    cursor: pointer;
    border-radius: 8px;

    &:hover {
        background: #f0f0f0;
        color: #1a1a1a;
    }
`;

const DialogBody = styled.div`
    padding: 20px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const SettingRow = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Label = styled.label`
    font-size: 14px;
    font-weight: 600;
    color: #333;
`;

const Select = styled.select`
    padding: 10px 12px;
    font-size: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    color: #1a1a1a;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: #11d0c9;
    }
`;

const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    padding-top: 8px;
`;

const ApplyButton = styled.button`
    padding: 10px 24px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    background: #11d0c9;
    border: none;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
        opacity: 0.9;
    }
`;
