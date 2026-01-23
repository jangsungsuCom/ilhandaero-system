import { useState, useEffect } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { updateWorkLog } from "../../../utils/workLog";
import { getAccessCode, getLoginMethod } from "../../../utils/auth";
import type { WorkLog } from "../../../types/workLog";
import type { SalaryTarget } from "../../../types/salaryTarget";

type Props = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editingWorkLog: WorkLog;
    salaryTarget?: SalaryTarget;
    onWorkLogUpdated?: () => void;
};

export default function EditModal({ isModalOpen, setIsModalOpen, editingWorkLog, salaryTarget, onWorkLogUpdated }: Props) {
    const loginMethod = getLoginMethod();
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // 수정 모드일 때 기존 데이터로 초기화
    useEffect(() => {
        if (isModalOpen && editingWorkLog) {
            const totalMinutes = editingWorkLog.workedMinutes;
            setHour(Math.floor(totalMinutes / 60));
            setMinute(totalMinutes % 60);
            setError("");
        }
    }, [isModalOpen, editingWorkLog]);

    if (!isModalOpen) return null;

    const handleSave = async () => {
        const totalMinutes = hour * 60 + minute;
        if (totalMinutes < 30) {
            setError("근무시간은 최소 30분 이상이어야 합니다.");
            return;
        }

        if (minute % 30 !== 0) {
            setError("분은 30분 단위로 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            let accessCode: string | undefined;
            if (loginMethod === "email") {
                // email 유저인 경우 salaryTarget의 accessCode 사용
                if (!salaryTarget) {
                    setError("직원 정보를 찾을 수 없습니다.");
                    setIsLoading(false);
                    return;
                }
                accessCode = salaryTarget.accessCode;
            } else {
                // accessCode 유저인 경우 저장된 accessCode 사용
                const savedAccessCode = getAccessCode();
                if (!savedAccessCode) {
                    setError("접근 코드를 찾을 수 없습니다.");
                    setIsLoading(false);
                    return;
                }
                accessCode = savedAccessCode;
            }
            await updateWorkLog(editingWorkLog.workLogId, format(new Date(editingWorkLog.workDate), "yyyy-MM-dd"), totalMinutes, accessCode);
            onWorkLogUpdated?.();
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.response?.data?.message || "수정에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h3>근무 기록 수정</h3>
                    <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
                </ModalHeader>

                <ModalBody>
                    <SectionTitle>근무시간 (30분 단위)</SectionTitle>
                    <Row>
                        <NumberInput value={hour} onChange={setHour} label="시간" />
                        <NumberInput value={minute} onChange={setMinute} label="분" max={59} step={30} />
                    </Row>
                    <HelperText>분은 30분 단위로 입력해주세요 (0, 30)</HelperText>

                    {error && <ErrorText>{error}</ErrorText>}
                </ModalBody>

                <ModalFooter>
                    <SaveButton onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "수정 중..." : "수정하기"}
                    </SaveButton>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
}

type NumberInputProps = {
    value: number;
    onChange: (v: number) => void;
    label?: string;
    max?: number;
    step?: number;
};

const NumberInput = ({ value, onChange, label, max, step }: NumberInputProps) => {
    const [localValue, setLocalValue] = useState(value.toString());

    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleBlur = () => {
        let v = Number(localValue);
        if (isNaN(v)) v = 0;
        if (max !== undefined) v = Math.min(max, v);
        if (v < 0) v = 0;
        if (step && v % step !== 0) {
            v = Math.round(v / step) * step;
        }
        onChange(v);
        setLocalValue(v.toString());
    };

    return (
        <InputWrapper>
            <Input
                type="number"
                value={localValue}
                step={step}
                min={0}
                onChange={(e) => {
                    setLocalValue(e.target.value);
                }}
                onBlur={handleBlur}
            />
            {label && <Label>{label}</Label>}
        </InputWrapper>
    );
};

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

const Row = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 30px;
`;

const InputWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const Label = styled.div`
    font-size: 18px;
`;

const Input = styled.input`
    width: 120px;
    padding: 8px;
    border: 1px solid #00ccc7;
    border-radius: 6px;
`;

const HelperText = styled.div`
    font-size: 14px;
    color: #666;
    margin-top: -20px;
    margin-bottom: 20px;
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
