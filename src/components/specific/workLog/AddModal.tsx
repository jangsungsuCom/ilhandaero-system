import { useState, useEffect } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { createWorkLog } from "../../../utils/workLog";
import { getLoginMethod } from "../../../utils/auth";
import type { SalaryTarget } from "../../../types/salaryTarget";

type Props = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedDate: Date;
    onWorkLogCreated?: () => void;
    salaryTargets?: SalaryTarget[];
};

export default function AddModal({ isModalOpen, setIsModalOpen, selectedDate, onWorkLogCreated, salaryTargets = [] }: Props) {
    const loginMethod = getLoginMethod();
    const [selectedTargetId, setSelectedTargetId] = useState<number | "">("");
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isModalOpen) {
            setHour(0);
            setMinute(0);
            setSelectedTargetId("");
            setError("");
        }
    }, [isModalOpen]);

    if (!isModalOpen) return null;

    const handleSave = async () => {
        // email 로그인인 경우 직원 선택 필수
        if (loginMethod === "email") {
            if (!selectedTargetId) {
                setError("직원을 선택해주세요.");
                return;
            }
        }

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
                    workedMinutes: totalMinutes,
                },
                accessCode
            );
            onWorkLogCreated?.();
            setIsModalOpen(false);
            setHour(0);
            setMinute(0);
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
                        {isLoading ? "기록 중..." : "기록하기"}
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
