import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { media } from "../../../styles/breakpoints";

export interface SummaryRow {
    workerName: string;
    totalAmount: number;
    /** 선정산액 (원). 없으면 0으로 표시 */
    totalAdvanced?: number;
}

export type SummaryMode = "gross" | "advanced";

export interface AdvanceDetailRow {
    date: string;
    amount: number;
    status: string;
}

type Props = {
    open: boolean;
    onClose: () => void;
    title?: string;
    year: number;
    month: number; // 1-based (1 = January)
    rows: SummaryRow[];
    /** 'gross' = 총 급여만, 'advanced' = 선정산금만 */
    mode?: SummaryMode;
    /** 선정산 요청 상세 (날짜+금액). 있으면 advanced 모드에서 이걸 표시 */
    advanceDetails?: AdvanceDetailRow[];
};

const getAdvanceStatusLabel = (status: string): string => {
    switch (status) {
        case "PENDING":
            return "대기중";
        case "APPROVED":
            return "승인";
        case "REJECTED":
            return "거절";
        case "PAID":
            return "결제완료";
        default:
            return "대기중";
    }
};

const SummaryModal: React.FC<Props> = ({ open, onClose, title, year, month, rows, mode = "gross", advanceDetails }) => {
    const defaultTitle = mode === "gross" ? "누적급여 확인" : "지급된 선정산액 확인";
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open) {
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

    return (
        <StyledDialog ref={dialogRef} onClick={handleBackdropClick} onCancel={handleClose}>
            <DialogInner>
                <DialogHeader>
                    <DialogTitle>{title || defaultTitle}</DialogTitle>
                    <CloseButton type="button" onClick={handleClose} aria-label="닫기">
                        ×
                    </CloseButton>
                </DialogHeader>
                <DialogBody>
                    <PeriodText>
                        {year}년 {month}월
                    </PeriodText>

                    {mode === "gross" && (
                        <TableWrap>
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>근무자</Th>
                                        <Th $alignRight>임금 (원)</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <Td colSpan={2}>데이터가 없습니다.</Td>
                                        </tr>
                                    ) : (
                                        rows.map((row, idx) => (
                                            <tr key={idx}>
                                                <Td>{row.workerName}</Td>
                                                <Td $alignRight>{row.totalAmount.toLocaleString()}</Td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </TableWrap>
                    )}

                    {mode === "advanced" && advanceDetails ? (
                        <TableWrap>
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>요청일</Th>
                                        <Th $alignRight>금액 (원)</Th>
                                        <Th $alignRight>상태</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {advanceDetails.length === 0 ? (
                                        <tr>
                                            <Td colSpan={3}>선정산 요청 내역이 없습니다.</Td>
                                        </tr>
                                    ) : (
                                        advanceDetails.map((detail, idx) => (
                                            <tr key={idx}>
                                                <Td>{detail.date ? detail.date.slice(0, 10) : "-"}</Td>
                                                <Td $alignRight>{detail.amount.toLocaleString()}</Td>
                                                <Td $alignRight>{getAdvanceStatusLabel(detail.status)}</Td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </TableWrap>
                    ) : mode === "advanced" ? (
                        <TableWrap>
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>근무자</Th>
                                        <Th $alignRight>선정산 (원)</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <Td colSpan={2}>데이터가 없습니다.</Td>
                                        </tr>
                                    ) : (
                                        rows.map((row, idx) => (
                                            <tr key={idx}>
                                                <Td>{row.workerName}</Td>
                                                <Td $alignRight>{(row.totalAdvanced ?? 0).toLocaleString()}</Td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </TableWrap>
                    ) : null}
                </DialogBody>
            </DialogInner>
        </StyledDialog>
    );
};

export default SummaryModal;

// --- Styled (Dialog + content) ------------------------------------

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

    ${media.mobile} {
        width: calc(100vw - 32px);
        border-radius: 12px;
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

    ${media.mobile} {
        padding: 16px 20px;
    }
`;

const DialogTitle = styled.h2`
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #000;

    ${media.mobile} {
        font-size: 18px;
    }
`;

const CloseButton = styled.button`
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: none;
    font-size: 24px;
    line-height: 1;
    color: #000;
    cursor: pointer;
    border-radius: 8px;

    &:hover {
        background: #f0f0f0;
        color: #000;
    }
`;

const DialogBody = styled.div`
    padding: 20px 24px 24px;

    ${media.mobile} {
        padding: 16px 20px 20px;
    }
`;

const PeriodText = styled.p`
    margin: 0 0 16px;
    font-size: 14px;
    color: #000;

    ${media.mobile} {
        margin-bottom: 12px;
        font-size: 13px;
    }
`;

const TableWrap = styled.div`
    overflow-x: auto;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    min-width: 280px;
`;

const Th = styled.th<{ $alignRight?: boolean }>`
    padding: 10px 12px;
    text-align: ${(p) => (p.$alignRight ? "right" : "left")};
    font-size: 14px;
    font-weight: 600;
    color: #000;
    border-bottom: 2px solid #e0e0e0;
    white-space: nowrap;

    ${media.mobile} {
        padding: 8px;
        font-size: 12px;
    }
`;

const Td = styled.td<{ $alignRight?: boolean }>`
    padding: 12px;
    text-align: ${(p) => (p.$alignRight ? "right" : "left")};
    font-size: 15px;
    color: #000;
    border-bottom: 1px solid #eee;
    white-space: nowrap;

    &:last-of-type {
        font-weight: 600;
    }

    ${media.mobile} {
        padding: 8px;
        font-size: 13px;
    }
`;
