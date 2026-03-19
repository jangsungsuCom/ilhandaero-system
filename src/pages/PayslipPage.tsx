import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { getPayslip, type SalaryPayout } from "../utils/paymentApi";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const formatDateWithDay = (dateStr: string): string => {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}.${dd}(${DAY_LABELS[d.getDay()]})`;
};

const formatShortDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
};

const getDeductionTypeLabel = (type?: string) => {
    switch (type) {
        case "FOUR_INSURANCE":
            return "4대보험";
        case "THREE_POINT_THREE":
            return "3.3%";
        default:
            return "";
    }
};

export default function PayslipPage() {
    const [params] = useSearchParams();
    const companyId = Number(params.get("companyId")) || 0;
    const companyName = params.get("companyName") || "";
    const salaryTargetId = Number(params.get("salaryTargetId")) || 0;
    const paymentId = Number(params.get("paymentId")) || 0;
    const advanceAmount = Number(params.get("advanceAmount")) || 0;

    const [data, setData] = useState<SalaryPayout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!companyId || !salaryTargetId || !paymentId) {
            setError("잘못된 접근입니다.");
            setLoading(false);
            return;
        }

        getPayslip(companyId, salaryTargetId, paymentId)
            .then((res) => setData(res))
            .catch(() => setError("명세서를 불러올 수 없습니다."))
            .finally(() => setLoading(false));
    }, [companyId, salaryTargetId, paymentId]);

    if (loading) return <Wrapper><Card><CenterText>로딩 중...</CenterText></Card></Wrapper>;
    if (error || !data) return <Wrapper><Card><CenterText>{error || "데이터 없음"}</CenterText></Card></Wrapper>;

    const totalPay = (data.amount ?? 0) + advanceAmount;
    const paidAtDate = data.paidAt ? new Date(data.paidAt) : null;

    const deductionLabel = getDeductionTypeLabel(data.deductionDetail?.appliedType);
    const fourIns = data.deductionDetail?.fourInsuranceDetail;
    const threeThree = data.deductionDetail?.threePointThreeDetail;

    interface LineItem {
        label: string;
        sub?: string;
        value: number;
    }

    const payLines: LineItem[] = [];
    if (data.basePay) payLines.push({ label: "근무 수당", value: data.basePay });
    if (data.weeklyAllowance) payLines.push({ label: "주휴수당", value: data.weeklyAllowance });
    if (data.extraPay) payLines.push({ label: `추가지급액${data.extraMemo ? ` (${data.extraMemo})` : ""}`, value: data.extraPay });

    const deductionLines: LineItem[] = [];
    if (deductionLabel && data.deduction) {
        deductionLines.push({ label: `공제 (${deductionLabel})`, value: -data.deduction });

        if (fourIns) {
            if (fourIns.pension) deductionLines.push({ label: "  국민연금", value: -fourIns.pension });
            if (fourIns.health) deductionLines.push({ label: "  건강보험", value: -fourIns.health });
            if (fourIns.longTermCare) deductionLines.push({ label: "  장기요양보험", value: -fourIns.longTermCare });
            if (fourIns.employment) deductionLines.push({ label: "  고용보험", value: -fourIns.employment });
        }
        if (threeThree) {
            if (threeThree.businessIncomeTax) deductionLines.push({ label: "  사업소득세", value: -threeThree.businessIncomeTax });
            if (threeThree.localIncomeTax) deductionLines.push({ label: "  지방소득세", value: -threeThree.localIncomeTax });
        }
    }

    return (
        <Wrapper>
            <Card>
                <Header>
                    <HeaderLeft>
                        <HeaderSub>
                            {companyName} | {data.periodFrom && data.periodTo ? `${formatShortDate(data.periodFrom)} ~ ${formatShortDate(data.periodTo)}` : "-"}
                        </HeaderSub>
                        <HeaderAmount>{totalPay.toLocaleString()}원 <NetBadge>실수령액</NetBadge></HeaderAmount>
                        {paidAtDate && (
                            <HeaderPayday>급여 지급일 {formatDateWithDay(data.paidAt)}</HeaderPayday>
                        )}
                    </HeaderLeft>
                </Header>

                <Divider />

                <Section>
                    <SectionTitle>
                        <TitleIcon>+</TitleIcon>
                        <span>지급 합계</span>
                        <SectionAmount>{totalPay.toLocaleString()}원</SectionAmount>
                    </SectionTitle>

                    <DetailList>
                        {payLines.map((line, i) => (
                            <DetailRow key={i}>
                                <DetailLabel>{line.label}</DetailLabel>
                                <DetailValue>{line.value.toLocaleString()}원</DetailValue>
                            </DetailRow>
                        ))}

                        {deductionLines.map((line, i) => (
                            <DetailRow key={`d-${i}`} $indent={line.label.startsWith("  ")}>
                                <DetailLabel $sub={line.label.startsWith("  ")}>{line.label.trimStart()}</DetailLabel>
                                <DetailValue $negative>{line.value.toLocaleString()}원</DetailValue>
                            </DetailRow>
                        ))}
                    </DetailList>

                    {advanceAmount > 0 && (
                        <>
                            <InnerDivider />
                            <DetailRow>
                                <DetailLabel $bold>비고</DetailLabel>
                                <div />
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>선지급</DetailLabel>
                                <DetailValue>{advanceAmount.toLocaleString()}원</DetailValue>
                            </DetailRow>
                        </>
                    )}
                </Section>
            </Card>
        </Wrapper>
    );
}

const Wrapper = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 24px 16px;
    background: #f5f5f5;
`;

const Card = styled.div`
    width: 420px;
    max-width: 100%;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    overflow: hidden;
`;

const Header = styled.div`
    padding: 28px 28px 20px;
`;

const HeaderLeft = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const HeaderSub = styled.div`
    font-size: 14px;
    color: #888;
    font-weight: 500;
`;

const HeaderAmount = styled.div`
    font-size: 32px;
    font-weight: 800;
    color: #111;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const NetBadge = styled.span`
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    background: #222;
    color: #fff;
    vertical-align: middle;
`;

const HeaderPayday = styled.div`
    font-size: 14px;
    color: #6b8bf5;
    font-weight: 500;
`;

const Divider = styled.div`
    height: 8px;
    background: #f2f2f2;
`;

const InnerDivider = styled.div`
    height: 1px;
    background: #e8e8e8;
    margin: 16px 0;
`;

const Section = styled.div`
    padding: 24px 28px 32px;
`;

const SectionTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 700;
    color: #111;
    margin-bottom: 20px;
`;

const TitleIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #6b8bf5;
    color: #fff;
    font-size: 16px;
    font-weight: 800;
`;

const SectionAmount = styled.span`
    margin-left: auto;
    font-size: 20px;
    font-weight: 800;
    color: #111;
`;

const DetailList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const DetailRow = styled.div<{ $indent?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-left: ${({ $indent }) => ($indent ? "16px" : "0")};
`;

const DetailLabel = styled.div<{ $sub?: boolean; $bold?: boolean }>`
    font-size: ${({ $sub }) => ($sub ? "13px" : "15px")};
    font-weight: ${({ $bold, $sub }) => ($bold ? 700 : $sub ? 400 : 500)};
    color: ${({ $sub }) => ($sub ? "#999" : "#333")};
`;

const DetailValue = styled.div<{ $negative?: boolean }>`
    font-size: 15px;
    font-weight: 600;
    color: ${({ $negative }) => ($negative ? "#d32f2f" : "#111")};
    text-align: right;
`;

const CenterText = styled.div`
    padding: 60px 20px;
    text-align: center;
    font-size: 16px;
    color: #888;
`;
