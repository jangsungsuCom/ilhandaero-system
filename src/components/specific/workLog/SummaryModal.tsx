import React, { useEffect, useRef } from "react";
import styled from "styled-components";

export interface SummaryRow {
    workerName: string;
    totalAmount: number;
    /** 선지급액 (원). 없으면 0으로 표시 */
    totalAdvanced?: number;
}

type Props = {
    open: boolean;
    onClose: () => void;
    title?: string;
    year: number;
    month: number; // 1-based (1 = January)
    rows: SummaryRow[];
};

const SummaryModal: React.FC<Props> = ({ open, onClose, title = "근무자 별 임금 확인", year, month, rows }) => {
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
                    <DialogTitle>{title}</DialogTitle>
                    <CloseButton type="button" onClick={handleClose} aria-label="닫기">
                        ×
                    </CloseButton>
                </DialogHeader>
                <DialogBody>
                    <PeriodText>
                        {year}년 {month}월
                    </PeriodText>
                    <TableWrap>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>근무자</Th>
                                    <Th alignRight>임금 (원)</Th>
                                    <Th alignRight>선지급 (원)</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <Td colSpan={3}>데이터가 없습니다.</Td>
                                    </tr>
                                ) : (
                                    rows.map((row, idx) => (
                                        <tr key={idx}>
                                            <Td>{row.workerName}</Td>
                                            <Td alignRight>{row.totalAmount.toLocaleString()}</Td>
                                            <Td alignRight>{(row.totalAdvanced ?? 0).toLocaleString()}</Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </TableWrap>
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
`;

const PeriodText = styled.p`
    margin: 0 0 16px;
    font-size: 14px;
    color: #666;
`;

const TableWrap = styled.div`
    overflow-x: auto;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
`;

const Th = styled.th<{ alignRight?: boolean }>`
    padding: 10px 12px;
    text-align: ${(p) => (p.alignRight ? "right" : "left")};
    font-size: 14px;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #e0e0e0;
`;

const Td = styled.td<{ alignRight?: boolean }>`
    padding: 12px;
    text-align: ${(p) => (p.alignRight ? "right" : "left")};
    font-size: 15px;
    color: #1a1a1a;
    border-bottom: 1px solid #eee;

    &:last-of-type {
        font-weight: 600;
    }
`;
