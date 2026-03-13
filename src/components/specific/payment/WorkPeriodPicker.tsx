import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, addMonths } from "date-fns";
import { ko } from "date-fns/locale";
import "react-day-picker/style.css";
import { media } from "../../../styles/breakpoints";

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
    width: 100%;
    height: 100%;
    min-height: 100vh;
    min-height: -webkit-fill-available;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    cursor: pointer;
`;

const CalendarModal = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
    z-index: 10000;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    width: 1062px;
    max-width: calc(100vw - 24px);
    height: 600px;
    max-height: 90vh;
    border-radius: 69px;
    filter: drop-shadow(2.121px 2.121px 14.5px rgba(0, 0, 0, 0.3));
    background-color: #ffffff;
    padding: 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    overflow: hidden;

    ${media.tablet} {
        width: calc(100vw - 32px);
        max-height: 85vh;
        border-radius: 24px;
        padding: 24px;
    }

    ${media.mobile} {
        width: calc(100vw - 24px);
        height: auto;
        max-height: 88vh;
        border-radius: 16px;
        padding: 16px;
        overflow-y: auto;
    }
`;

const TopRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding-bottom: 16px;
    flex-shrink: 0;

    ${media.mobile} {
        gap: 8px;
        padding-bottom: 12px;
    }
`;

const NavButton = styled.button`
    width: 36px;
    height: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #00ccc7;
    background: transparent;
    border: none;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
        opacity: 0.85;
    }

    &:focus {
        outline: none;
    }

    ${media.mobile} {
        width: 32px;
        height: 32px;
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
    color: #000;
    text-align: center;

    ${media.mobile} {
        font-size: 14px;
    }
`;

const CalendarContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 24px;
    flex: 1;
    min-height: 0;
    align-items: flex-start;
    justify-content: center;
    padding: 0;

    ${media.mobile} {
        flex-direction: column;
        gap: 16px;
        flex: 1 1 auto;
        overflow-y: auto;
    }
`;

const MonthBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-width: 0;

    ${media.mobile} {
        flex: 0 0 auto;
        width: 100%;
    }
`;

const MonthWrapper = styled.div`
    .rdp-month_caption,
    .rdp-caption_label,
    .rdp-nav {
        display: none !important;
    }

    .rdp-month {
        width: 100%;
    }

    .rdp-weekday {
        font-size: 12px;
    }

    ${media.mobile} {
        width: 100%;
        .rdp-weekday {
            font-size: 11px;
        }
    }
`;

const CustomDayPicker = styled(DayPicker)`
    --rdp-accent-color: #ffffff;
    --rdp-range_middle-background-color: rgba(0, 203, 199, 0.35);
    --rdp-range_start-color: #000000;
    --rdp-selected-border: 9px solid #00ccc7;
    --rdp-range_middle-color: #000;

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

    ${media.tablet} {
        .rdp-day {
            width: 44px;
            height: 44px;
        }
        .rdp-day_button {
            width: 44px;
            height: 44px;
            font-size: 14px;
        }
    }

    ${media.mobile} {
        .rdp-day {
            width: 36px;
            height: 36px;
        }
        .rdp-day_button {
            width: 36px;
            height: 36px;
            font-size: 13px;
        }
        --rdp-selected-border: 6px solid #00ccc7;
    }
`;

const CalendarActions = styled.div`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 20px;
    margin-top: 20px;
    border-top: 1px solid #e0e0e0;
    flex-shrink: 0;

    ${media.mobile} {
        padding-top: 16px;
        margin-top: 16px;
        gap: 8px;
    }
`;

const CancelButton = styled.button`
    padding: 10px 24px;
    font-size: 16px;
    font-weight: 600;
    color: #000;
    background: white;
    border: 1.5px solid #000;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #f5f5f5;
        border-color: #000;
    }

    ${media.mobile} {
        padding: 10px 20px;
        font-size: 15px;
    }
`;

const ConfirmButton = styled.button`
    padding: 10px 24px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    background: #00ccc7;
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

    ${media.mobile} {
        padding: 10px 20px;
        font-size: 15px;
    }
`;
