import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useMypageWorkers } from "../../hooks/useMypageWorkers";
import { useMypageStores } from "../../hooks/useMypageStores";
import { useAppDispatch } from "../../store/hooks";
import { fetchSalaryTargets } from "../../store/slices/salaryTargetSlice";
import { FormCard, Form, FieldGroup, Label, Input, SubmitButton } from "../../components/common/FormCard";
import type { CreateWorkerRequest } from "../../types/mypage";

export default function WorkerFormPage() {
    const dispatch = useAppDispatch();
    const { storeId, workerId } = useParams<{ storeId: string; workerId: string }>();
    const isEdit = !!workerId;
    const navigate = useNavigate();
    const { createWorker, updateWorker, workers } = useMypageWorkers(storeId ? Number(storeId) : undefined);
    const { stores } = useMypageStores();
    const store = stores.find((s) => s.companyId === Number(storeId));
    const [formData, setFormData] = useState<CreateWorkerRequest>({
        workerName: "",
        phoneNumber: "",
        hourlyWage: 0,
        payDay: 1,
        bankName: "",
        accountNumber: "",
        weeklyAllowanceEnabled: false,
        deductionType: "FOUR_INSURANCE",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && workerId && workers.length > 0) {
            const worker = workers.find((w) => w.id === Number(workerId));
            if (worker) {
                setFormData({
                    workerName: worker.workerName,
                    phoneNumber: worker.phoneNumber,
                    hourlyWage: worker.hourlyWage,
                    payDay: worker.payDay,
                    bankName: worker.bankName,
                    accountNumber: worker.accountNumber,
                    weeklyAllowanceEnabled: worker.weeklyAllowanceEnabled ?? false,
                    deductionType: worker.deductionType ?? "FOUR_INSURANCE",
                });
            }
        }
    }, [isEdit, workerId, workers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let result;
            if (isEdit && workerId) {
                result = await updateWorker(Number(workerId), formData);
            } else {
                result = await createWorker(formData);
            }
            if (result.success && storeId) {
                dispatch(fetchSalaryTargets(Number(storeId)));
                navigate(`/mypage/stores/${storeId}/workers`);
            } else {
                alert("저장에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error saving worker:", error);
            alert("저장에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <PageTitle>
                {store?.name || "업장"} - {isEdit ? "직원 수정" : "직원 등록"}
            </PageTitle>
            <ContentWrapper>
                <FormCard>
                    <Form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Label>이름</Label>
                            <Input type="text" value={formData.workerName} onChange={(e) => setFormData({ ...formData, workerName: e.target.value })} required placeholder="이름을 입력하세요" />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>전화번호</Label>
                            <Input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} required placeholder="전화번호를 입력하세요" />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>시급</Label>
                            <Input
                                type="number"
                                value={formData.hourlyWage || ""}
                                onChange={(e) => setFormData({ ...formData, hourlyWage: Number(e.target.value) })}
                                required
                                min={0}
                                placeholder="시급을 입력하세요"
                            />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>지급일</Label>
                            <Input
                                type="number"
                                value={formData.payDay || ""}
                                onChange={(e) => setFormData({ ...formData, payDay: Number(e.target.value) })}
                                required
                                min={1}
                                max={31}
                                placeholder="지급일을 입력하세요 (1-31)"
                            />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>은행</Label>
                            <Select value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} required>
                                <option value="">은행을 선택하세요</option>
                                <option value="KB국민은행">KB국민은행</option>
                                <option value="신한은행">신한은행</option>
                                <option value="우리은행">우리은행</option>
                                <option value="하나은행">하나은행</option>
                                <option value="NH농협은행">NH농협은행</option>
                                <option value="카카오뱅크">카카오뱅크</option>
                                <option value="토스뱅크">토스뱅크</option>
                                <option value="IBK기업은행">IBK기업은행</option>
                                <option value="SC제일은행">SC제일은행</option>
                                <option value="한국씨티은행">한국씨티은행</option>
                                <option value="케이뱅크">케이뱅크</option>
                                <option value="새마을금고">새마을금고</option>
                                <option value="신협">신협</option>
                                <option value="우체국">우체국</option>
                                <option value="수협은행">수협은행</option>
                                <option value="대구은행">대구은행</option>
                                <option value="부산은행">부산은행</option>
                                <option value="경남은행">경남은행</option>
                                <option value="광주은행">광주은행</option>
                                <option value="전북은행">전북은행</option>
                                <option value="제주은행">제주은행</option>
                            </Select>
                        </FieldGroup>

                        <FieldGroup>
                            <Label>계좌번호</Label>
                            <Input
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                required
                                placeholder="계좌번호를 입력하세요"
                            />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>주휴수당 적용</Label>
                            <CheckboxRow>
                                <CheckboxOption type="button" role="checkbox" aria-checked={formData.weeklyAllowanceEnabled} onClick={() => setFormData({ ...formData, weeklyAllowanceEnabled: true })}>
                                    <CheckboxCircle $checked={formData.weeklyAllowanceEnabled} />
                                    <span>적용</span>
                                </CheckboxOption>
                                <CheckboxOption
                                    type="button"
                                    role="checkbox"
                                    aria-checked={!formData.weeklyAllowanceEnabled}
                                    onClick={() => setFormData({ ...formData, weeklyAllowanceEnabled: false })}
                                >
                                    <CheckboxCircle $checked={!formData.weeklyAllowanceEnabled} />
                                    <span>미적용</span>
                                </CheckboxOption>
                            </CheckboxRow>
                        </FieldGroup>

                        <FieldGroup>
                            <Label>고용형태</Label>
                            <CheckboxRow>
                                <CheckboxOption
                                    type="button"
                                    role="checkbox"
                                    aria-checked={formData.deductionType === "FOUR_INSURANCE"}
                                    onClick={() => setFormData({ ...formData, deductionType: "FOUR_INSURANCE" })}
                                >
                                    <CheckboxCircle $checked={formData.deductionType === "FOUR_INSURANCE"} />
                                    <span>4대보험</span>
                                </CheckboxOption>
                                <CheckboxOption
                                    type="button"
                                    role="checkbox"
                                    aria-checked={formData.deductionType === "THREE_POINT_THREE"}
                                    onClick={() => setFormData({ ...formData, deductionType: "THREE_POINT_THREE" })}
                                >
                                    <CheckboxCircle $checked={formData.deductionType === "THREE_POINT_THREE"} />
                                    <span>3.3% 원천징수</span>
                                </CheckboxOption>
                            </CheckboxRow>
                        </FieldGroup>

                        <ButtonGroup>
                            <SubmitButton type="submit" disabled={loading} style={{ width: "100%" }}>
                                {loading ? "저장 중..." : isEdit ? "수정" : "등록"}
                            </SubmitButton>
                            <CancelButton type="button" onClick={() => navigate(`/mypage/stores/${storeId}/workers`)}>
                                취소
                            </CancelButton>
                        </ButtonGroup>
                    </Form>
                </FormCard>
            </ContentWrapper>
        </Container>
    );
}

const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;

const PageTitle = styled.h1`
    font-size: 32px;
    font-weight: 700;
    color: #00a8a5;
    margin: 0 0 30px 0;
    align-self: flex-start;
`;

const ContentWrapper = styled.div`
    width: 922px; /* 1152px * 0.8 = 921.6px */
    max-width: 100%;
`;

const ButtonGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
    width: 100%;
`;

const Select = styled.select`
    width: 100%;
    height: 52px;
    padding: 0 16px;
    font-size: 17px;
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: #f9fbfc;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%2300a8a5%22%20d%3D%22M287%20197.9L159.3%2069.2c-3.7-3.7-9.7-3.7-13.4%200L5.4%20197.9c-3.7%203.7-3.7%209.7%200%2013.4l13.4%2013.4c3.7%203.7%209.7%203.7%2013.4%200l110.7-110.7c3.7-3.7%209.7-3.7%2013.4%200l110.7%20110.7c3.7%203.7%209.7%203.7%2013.4%200l13.4-13.4c3.7-3.7%203.7-9.7%200-13.4z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    background-size: 12px;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: #00a8a5;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    option[value=""] {
        display: none;
    }

    &:disabled {
        background: #f0f4f4;
        color: #555;
        cursor: not-allowed;
    }
`;

const CancelButton = styled.button`
    width: 100%;
    height: 62px;
    font-size: 22px;
    font-weight: bold;
    color: white;
    background: #95a5a6;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #7f8c8d;
    }
`;

const CheckboxRow = styled.div`
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
`;

const CheckboxOption = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0;
    font-size: 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 0.8;
    }
`;

const CheckboxCircle = styled.span<{ $checked: boolean }>`
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1.5px solid #009a96;
    background: ${({ $checked }) => ($checked ? "#00ccc7" : "transparent")};
    transition: background 0.2s ease;
`;
