import { useState, useEffect } from "react";
import styled from "styled-components";
import { DayPicker, type DateRange } from "react-day-picker";
import { ko } from "date-fns/locale";
import "react-day-picker/style.css";

interface WorkPeriodPickerProps {
    isOpen: boolean;
    selectedRange: DateRange | undefined;
    onClose: () => void;
    onConfirm: (range: DateRange) => void;
}

export default function WorkPeriodPicker({ isOpen, selectedRange, onClose, onConfirm }: WorkPeriodPickerProps) {
    const [tempRange, setTempRange] = useState<DateRange | undefined>(selectedRange);
    const [month1, setMonth1] = useState<Date>(selectedRange?.from || new Date());
    const [month2, setMonth2] = useState<Date>(() => {
        const date = selectedRange?.from || new Date();
        return new Date(date.getFullYear(), date.getMonth() + 1);
    });

    useEffect(() => {
        if (isOpen) {
            setTempRange(selectedRange);
            const startDate = selectedRange?.from || new Date();
            setMonth1(startDate);
            setMonth2(new Date(startDate.getFullYear(), startDate.getMonth() + 1));
        }
    }, [isOpen, selectedRange]);

    const handleConfirm = () => {
        if (tempRange?.from && tempRange?.to) {
            onConfirm(tempRange);
            onClose();
        }
    };

    const handleClose = () => {
        setTempRange(selectedRange);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <ModalOverlay onClick={handleClose} />
            <CalendarModal>
                <CalendarContainer>
                    <MonthWrapper>
                        <CustomDayPicker
                            mode="range"
                            selected={tempRange}
                            onSelect={setTempRange}
                            month={month1}
                            onMonthChange={setMonth1}
                            locale={ko}
                            showOutsideDays={false}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={2030}
                        />
                    </MonthWrapper>
                    <MonthWrapper>
                        <CustomDayPicker
                            mode="range"
                            selected={tempRange}
                            onSelect={setTempRange}
                            month={month2}
                            onMonthChange={setMonth2}
                            locale={ko}
                            showOutsideDays={false}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={2030}
                        />
                    </MonthWrapper>
                </CalendarContainer>
                <CalendarActions>
                    <CancelButton type="button" onClick={handleClose}>
                        취소
                    </CancelButton>
                    <ConfirmButton type="button" onClick={handleConfirm} disabled={!tempRange?.from || !tempRange?.to}>
                        선택 완료
                    </ConfirmButton>
                </CalendarActions>
            </CalendarModal>
        </>
    );
}

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
`;

const CalendarModal = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    width: 1062px;
    height: 600px;
    border-radius: 69px;
    filter: drop-shadow(2.121px 2.121px 14.5px rgba(0, 0, 0, 0.3));
    background-color: #ffffff;
    padding: 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

const CalendarContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 24px;
    flex: 1;
    align-items: flex-start;
    justify-content: center;
    padding: 20px 0;
`;

const MonthWrapper = styled.div`
    /* 네비게이션 버튼 숨기기 */
    .rdp-nav {
        display: none;
    }

    /* 드롭다운 스타일 */
    .rdp-dropdown {
        font-size: 16px;
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        margin: 0 4px;
    }

    .rdp-dropdown:focus {
        outline: none;
        border-color: #00cbc7;
    }

    /* 연도 드롭다운 옆에 '년' 추가 */
    .rdp-dropdown_year {
        &::after {
            content: "년";
            margin-left: 2px;
        }
    }

    /* 월 드롭다운 옆에 '월' 추가 */
    .rdp-dropdown_month {
        &::after {
            content: "월";
            margin-left: 2px;
        }
    }
`;

const CustomDayPicker = styled(DayPicker)`
    --rdp-accent-color: #ffffff; /* 메인 색상 */
    --rdp-range_middle-background-color: #00cbc7;
    --rdp-range_start-color: #000000;
    --rdp-selected-border: 9px solid #00cbc7;
    --rdp-range_middle-color: #333; /* 중간 글자색 */

    .rdp-day {
        width: 54px;
        height: 54px;
        padding: 0;
    }
    .rdp-day_button {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        font-size: 16px;
    }
`;

const CalendarActions = styled.div`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 20px;
    margin-top: 20px;
    border-top: 1px solid #e0e0e0;
`;

const CancelButton = styled.button`
    padding: 10px 24px;
    font-size: 16px;
    font-weight: 600;
    color: #666;
    background: white;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #f5f5f5;
        border-color: #bbb;
    }
`;

const ConfirmButton = styled.button`
    padding: 10px 24px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #00cbc7 0%, #4dd0ae 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 204, 199, 0.3);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
