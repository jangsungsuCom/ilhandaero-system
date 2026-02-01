import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, addMonths } from "date-fns";
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
    const [baseMonth, setBaseMonth] = useState<Date>(() => {
        const date = selectedRange?.from || new Date();
        return new Date(date.getFullYear(), date.getMonth());
    });

    const month1 = baseMonth;
    const month2 = addMonths(baseMonth, 1);

    useEffect(() => {
        if (isOpen) {
            setTempRange(selectedRange);
            const startDate = selectedRange?.from || new Date();
            setBaseMonth(new Date(startDate.getFullYear(), startDate.getMonth()));
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

    const modalContent = (
        <>
            <ModalOverlay onClick={handleClose} />
            <CalendarModal>
                <TopRow>
                    <NavButton type="button" onClick={() => setBaseMonth((d) => addMonths(d, -1))} aria-label="이전 두 달">
                        <IoIosArrowBack size={28} />
                    </NavButton>
                    <MonthLabelCell>
                        <MonthLabel>{format(month1, "yyyy년 M월", { locale: ko })}</MonthLabel>
                    </MonthLabelCell>
                    <MonthLabelCell>
                        <MonthLabel>{format(month2, "yyyy년 M월", { locale: ko })}</MonthLabel>
                    </MonthLabelCell>
                    <NavButton type="button" onClick={() => setBaseMonth((d) => addMonths(d, 1))} aria-label="다음 두 달">
                        <IoIosArrowForward size={28} />
                    </NavButton>
                </TopRow>
                <CalendarContainer>
                    <MonthBlock>
                        <MonthWrapper>
                            <CustomDayPicker mode="range" selected={tempRange} onSelect={setTempRange} month={month1} locale={ko} showOutsideDays={false} />
                        </MonthWrapper>
                    </MonthBlock>
                    <MonthBlock>
                        <MonthWrapper>
                            <CustomDayPicker mode="range" selected={tempRange} onSelect={setTempRange} month={month2} locale={ko} showOutsideDays={false} />
                        </MonthWrapper>
                    </MonthBlock>
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

    return createPortal(modalContent, document.body);
}

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    cursor: pointer;
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

const TopRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding-bottom: 16px;
`;

const NavButton = styled.button`
    width: 36px;
    height: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2c3e50;
    background: transparent;
    border: none;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
        color: #00a8a5;
    }

    &:focus {
        outline: none;
    }
`;

const MonthLabelCell = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
`;

const MonthLabel = styled.span`
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    text-align: center;
`;

const CalendarContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 24px;
    flex: 1;
    align-items: flex-start;
    justify-content: center;
    padding: 0;
`;

const MonthBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-width: 0;
`;

const MonthWrapper = styled.div`
    .rdp-month_caption,
    .rdp-caption_label,
    .rdp-nav {
        display: none !important;
    }
`;

const CustomDayPicker = styled(DayPicker)`
    --rdp-accent-color: #ffffff; /* 메인 색상 */
    --rdp-range_middle-background-color: rgba(0, 203, 199, 0.35);
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
