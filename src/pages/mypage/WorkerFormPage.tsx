import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useMypageWorkers } from "../../hooks/useMypageWorkers";
import { useMypageStores } from "../../hooks/useMypageStores";
import { useAppDispatch } from "../../store/hooks";
import { fetchSalaryTargets } from "../../store/slices/salaryTargetSlice";
import { FormCard, Form, FieldGroup, Label, Input, SubmitButton } from "../../components/common/FormCard";
import CustomSelect from "../../components/common/CustomSelect";
import { mypageTitle, mypageSubtitle, mypageContent } from "../../styles/mypageTypography";
import type { CreateWorkerRequest } from "../../types/mypage";

const DEFAULT_COLOR = "#00ccc7";

const BANK_OPTIONS = [
    "KB국민은행",
    "신한은행",
    "우리은행",
    "하나은행",
    "NH농협은행",
    "카카오뱅크",
    "토스뱅크",
    "IBK기업은행",
    "SC제일은행",
    "한국씨티은행",
    "케이뱅크",
    "새마을금고",
    "신협",
    "우체국",
    "수협은행",
    "대구은행",
    "부산은행",
    "경남은행",
    "광주은행",
    "전북은행",
    "제주은행",
].map((bank) => ({ value: bank, label: bank }));

const COLOR_PALETTE: string[] = [
    "#fdfab7",
    "#fdde63",
    "#fdad68",
    "#ffd0d0",
    "#faa3a3",
    "#f6a9fd",
    "#c984f8",
    "#8fd3fd",
    "#dcf4ff",
    "#c4d3fa",
    "#defdd5",
    "#bdf8a4",
    "#98cc81",
    "#cccccc",
    "#eeeeee",
    "#edff3b",
    "#8cff68",
    "#79dfbc",
];

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
        birthDate: "",
        phoneNumber: "",
        hourlyWage: 0,
        payDay: 1,
        bankName: "",
        accountNumber: "",
        weeklyAllowanceEnabled: false,
        deductionType: "FOUR_INSURANCE",
        colorHex: DEFAULT_COLOR,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && workerId && workers.length > 0) {
            const worker = workers.find((w) => w.id === Number(workerId));
            if (worker) {
                setFormData({
                    workerName: worker.workerName,
                    birthDate: worker.birthDate || "",
                    phoneNumber: worker.phoneNumber,
                    hourlyWage: worker.hourlyWage,
                    payDay: worker.payDay,
                    bankName: worker.bankName,
                    accountNumber: worker.accountNumber,
                    weeklyAllowanceEnabled: worker.weeklyAllowanceEnabled ?? false,
                    deductionType: worker.deductionType ?? "FOUR_INSURANCE",
                    colorHex: worker.colorHex && /^#[0-9A-Fa-f]{6}$/.test(worker.colorHex) ? worker.colorHex : DEFAULT_COLOR,
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
                navigate(`/mypage/dashboard`);
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
                <TransparentFormCard>
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
                            <Label>생년월일</Label>
                            <Input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} required />
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
                            <Select
                                value={formData.bankName}
                                placeholder="은행을 선택하세요"
                                options={BANK_OPTIONS}
                                onChange={(value) => setFormData({ ...formData, bankName: value })}
                            />
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
                                    <span>3.3%</span>
                                </CheckboxOption>
                                <CheckboxOption
                                    type="button"
                                    role="checkbox"
                                    aria-checked={formData.deductionType === "NONE"}
                                    onClick={() => setFormData({ ...formData, deductionType: "NONE" })}
                                >
                                    <CheckboxCircle $checked={formData.deductionType === "NONE"} />
                                    <span>미적용</span>
                                </CheckboxOption>
                            </CheckboxRow>
                        </FieldGroup>

                        <FieldGroup>
                            <Label>표시 색상</Label>
                            <ColorPalette>
                                {COLOR_PALETTE.map((hex) => (
                                    <ColorSwatch
                                        key={hex}
                                        $color={hex}
                                        $selected={formData.colorHex === hex}
                                        type="button"
                                        aria-label={`색상 ${hex}`}
                                        title={hex}
                                        onClick={() => setFormData({ ...formData, colorHex: hex })}
                                    />
                                ))}
                            </ColorPalette>
                            {/* <ColorValue>{formData.colorHex}</ColorValue> */}
                        </FieldGroup>

                        <ButtonGroup>
                            <SubmitButton type="submit" disabled={loading} style={{ width: "100%", marginTop: 0 }}>
                                {loading ? "저장 중..." : isEdit ? "수정" : "등록"}
                            </SubmitButton>
                            <CancelButton type="button" onClick={() => navigate(`/mypage/dashboard`)}>
                                취소
                            </CancelButton>
                        </ButtonGroup>
                    </Form>
                </TransparentFormCard>
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
    ${mypageTitle}
    font-weight: 700;
    color: #00ccc7;
    margin: 0 0 30px 0;
    align-self: flex-start;
`;

const TransparentFormCard = styled(FormCard)`
    background: transparent;
`;

const ContentWrapper = styled.div`
    width: 922px;
    max-width: 100%;
`;

const ButtonGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
    width: 100%;
`;

const Select = styled(CustomSelect)`
    width: 100%;
    height: 52px;
    padding: 0 16px;
    ${mypageContent}
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: #ffffff;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%2300a8a5%22%20d%3D%22M287%20197.9L159.3%2069.2c-3.7-3.7-9.7-3.7-13.4%200L5.4%20197.9c-3.7%203.7-3.7%209.7%200%2013.4l13.4%2013.4c3.7%203.7%209.7%203.7%2013.4%200l110.7-110.7c3.7-3.7%209.7-3.7%2013.4%200l110.7%20110.7c3.7%203.7%209.7%203.7%2013.4%200l13.4-13.4c3.7-3.7%203.7-9.7%200-13.4z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    background-size: 12px;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }
&:disabled {
        background: #f5f5f5;
        color: #000;
        cursor: not-allowed;
    }
`;

const CancelButton = styled.button`
    ${mypageSubtitle}
    width: 100%;
    height: 62px;
    font-weight: bold;
    color: white;
    background: #000;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #000;
    }
`;

const CheckboxRow = styled.div`
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
`;

const CheckboxOption = styled.button`
    ${mypageContent}
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0;
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
    border: 1.5px solid #00ccc7;
    background: ${({ $checked }) => ($checked ? "#00ccc7" : "transparent")};
    transition: background 0.2s ease;
`;

const ColorPalette = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
`;

const ColorSwatch = styled.button<{ $color: string; $selected: boolean }>`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    border: 3px solid ${({ $selected }) => ($selected ? "#000" : "transparent")};
    cursor: pointer;
    padding: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition:
        transform 0.15s ease,
        box-shadow 0.15s ease;

    &:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
`;

