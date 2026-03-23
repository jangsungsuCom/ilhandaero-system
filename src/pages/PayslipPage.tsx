import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import html2canvas from "html2canvas";
import { getAccessCode } from "../utils/auth";
import { getAccessCodePayslip, getPayslip, type SalaryPayout } from "../utils/paymentApi";
import { getWorkLogsByDateRange } from "../utils/workLog";
import type { WorkLog } from "../types/workLog";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function fmtDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateWithDay(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtBirthDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function fmtWorkDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}월 ${String(d.getDate()).padStart(2, "0")}일 (${DAY_LABELS[d.getDay()]})`;
}

function fmtTime(timeStr?: string): string {
    if (!timeStr) return "--:--";
    const parts = timeStr.split(":");
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}

function fmtHours(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m > 0) return `${h}시간 ${m}분`;
    return `${h}시간`;
}

function fmtMoney(n: number): string {
    return n.toLocaleString();
}

function getDeductionTypeLabel(type?: string) {
    switch (type) {
        case "FOUR_INSURANCE":
            return "4대보험";
        case "THREE_POINT_THREE":
            return "3.3%";
        default:
            return "";
    }
}

export default function PayslipPage() {
    const [params] = useSearchParams();
    const mode = params.get("mode") || "email";
    const companyId = Number(params.get("companyId")) || 0;
    const salaryTargetId = Number(params.get("salaryTargetId")) || 0;
    const paymentId = Number(params.get("paymentId")) || 0;
    const advanceAmount = Number(params.get("advanceAmount")) || 0;
    const urlAccessCode = params.get("accessCode") || "";

    const cardRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<SalaryPayout | null>(null);
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!cardRef.current) return;
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true,
            });
            const link = document.createElement("a");
            link.download = `payslip_${paymentId}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch {
            alert("이미지 저장에 실패했습니다.");
        }
    };

    useEffect(() => {
        if (!paymentId) {
            setError("잘못된 접근입니다.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const fetchPayslip =
            mode === "accessCode"
                ? () => {
                      const ac = getAccessCode();
                      if (!ac) return Promise.reject(new Error("접근 코드 없음"));
                      return getAccessCodePayslip(ac, paymentId);
                  }
                : () => {
                      if (!companyId || !salaryTargetId) return Promise.reject(new Error("잘못된 접근"));
                      return getPayslip(companyId, salaryTargetId, paymentId);
                  };

        fetchPayslip()
            .then((res) => {
                setData(res);
                if (res.periodFrom && res.periodTo) {
                    const ac = mode === "accessCode" ? getAccessCode() : urlAccessCode;
                    if (ac) {
                        getWorkLogsByDateRange(res.periodFrom, res.periodTo, ac)
                            .then(setWorkLogs)
                            .catch(() => setWorkLogs([]));
                    }
                }
            })
            .catch(() => setError("명세서를 불러올 수 없습니다."))
            .finally(() => setLoading(false));
    }, [mode, companyId, salaryTargetId, paymentId, urlAccessCode]);

    if (loading)
        return (
            <Wrapper>
                <Card>
                    <CenterText>로딩 중...</CenterText>
                </Card>
            </Wrapper>
        );
    if (error || !data)
        return (
            <Wrapper>
                <Card>
                    <CenterText>{error || "데이터 없음"}</CenterText>
                </Card>
            </Wrapper>
        );

    const grossTotal = (data.basePay ?? 0) + (data.weeklyAllowance ?? 0) + (data.extraPay ?? 0);
    const deductionLabel = getDeductionTypeLabel(data.deductionDetail?.appliedType);
    const fourIns = data.deductionDetail?.fourInsuranceDetail;
    const threeThree = data.deductionDetail?.threePointThreeDetail;
    const displayName = data.workerName || params.get("companyName") || "";
    const displayCompanyName = data.companyName || params.get("companyName") || "";

    return (
        <Wrapper>
            <Card ref={cardRef}>
                {/* 급여명세서 */}
                <SectionBlock>
                    <SectionTitle>급여명세서</SectionTitle>
                    <SectionDivider />
                    <SmallLabel>실 지급액</SmallLabel>
                    <BigAmount>{fmtMoney((data.amount ?? 0) + advanceAmount)}원</BigAmount>
                    <InfoLine>
                        정산기간{" "}
                        <DateText>
                            {data.periodFrom && data.periodTo ? `${fmtDate(data.periodFrom)} ~ ${fmtDate(data.periodTo)}` : "-"}
                        </DateText>
                    </InfoLine>
                    <InfoLine>
                        급여일 <DateText>{data.paidAt ? fmtDateWithDay(data.paidAt) : "-"}</DateText>
                    </InfoLine>
                </SectionBlock>

                {/* 직원정보 */}
                <SectionBlock>
                    <SectionTitle>직원정보</SectionTitle>
                    <SectionDivider />
                    <InfoRow>
                        <InfoLabel>회사명</InfoLabel>
                        <InfoValue>{displayCompanyName || "-"}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>이름</InfoLabel>
                        <InfoValue>{displayName || "-"}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>생년월일</InfoLabel>
                        <InfoValue>{data.birthDate ? fmtBirthDate(data.birthDate) : "-"}</InfoValue>
                    </InfoRow>
                </SectionBlock>

                {/* 지급내역 */}
                <SectionBlock>
                    <SectionTitle>지급내역</SectionTitle>
                    <SectionDivider />
                    <TotalRow>
                        <TotalLabel>총 지급액</TotalLabel>
                        <TotalValue>{fmtMoney(grossTotal)}원</TotalValue>
                    </TotalRow>
                    <PayRow>
                        <PayLabel>기본급</PayLabel>
                        <PayValue>{fmtMoney(data.basePay ?? 0)}원</PayValue>
                    </PayRow>
                    <PayRow>
                        <PayLabel>주휴수당</PayLabel>
                        <PayValue>{fmtMoney(data.weeklyAllowance ?? 0)}원</PayValue>
                    </PayRow>
                    {(data.extraPay ?? 0) > 0 && (
                        <PayRow>
                            <PayLabel>추가지급액{data.extraMemo ? ` (${data.extraMemo})` : ""}</PayLabel>
                            <PayValue>{fmtMoney(data.extraPay)}원</PayValue>
                        </PayRow>
                    )}
                </SectionBlock>

                {/* 공제내역 */}
                {(data.deduction ?? 0) > 0 && (
                    <SectionBlock>
                        <SectionTitle>공제내역</SectionTitle>
                        <SectionDivider />
                        <TotalRow>
                            <TotalLabel>총 공제액</TotalLabel>
                            <TotalValue>{fmtMoney(data.deduction ?? 0)}원</TotalValue>
                        </TotalRow>
                        {deductionLabel && (
                            <PayRow>
                                <PayLabel>{deductionLabel === "3.3%" ? "소득세" : deductionLabel}</PayLabel>
                                <PayValue>{fmtMoney(data.deduction ?? 0)}원</PayValue>
                            </PayRow>
                        )}
                        {threeThree && (
                            <>
                                {threeThree.businessIncomeTax != null && (
                                    <SubRow>
                                        <SubLabel>사업소득세 (3.0%)</SubLabel>
                                        <SubValue>{fmtMoney(threeThree.businessIncomeTax)}원</SubValue>
                                    </SubRow>
                                )}
                                {threeThree.localIncomeTax != null && (
                                    <SubRow>
                                        <SubLabel>지방소득세 (0.3%)</SubLabel>
                                        <SubValue>{fmtMoney(threeThree.localIncomeTax)}원</SubValue>
                                    </SubRow>
                                )}
                            </>
                        )}
                        {fourIns && (
                            <>
                                {fourIns.pension != null && fourIns.pension > 0 && (
                                    <SubRow>
                                        <SubLabel>국민연금 (4.5%)</SubLabel>
                                        <SubValue>{fmtMoney(fourIns.pension)}원</SubValue>
                                    </SubRow>
                                )}
                                {fourIns.health != null && fourIns.health > 0 && (
                                    <SubRow>
                                        <SubLabel>건강보험 (3.545%)</SubLabel>
                                        <SubValue>{fmtMoney(fourIns.health)}원</SubValue>
                                    </SubRow>
                                )}
                                {fourIns.longTermCare != null && fourIns.longTermCare > 0 && (
                                    <SubRow>
                                        <SubLabel>장기요양보험 (0.4591%)</SubLabel>
                                        <SubValue>{fmtMoney(fourIns.longTermCare)}원</SubValue>
                                    </SubRow>
                                )}
                                {fourIns.employment != null && fourIns.employment > 0 && (
                                    <SubRow>
                                        <SubLabel>고용보험 (0.9%)</SubLabel>
                                        <SubValue>{fmtMoney(fourIns.employment)}원</SubValue>
                                    </SubRow>
                                )}
                            </>
                        )}
                    </SectionBlock>
                )}

                {/* 근무내역 */}
                {workLogs.length > 0 && (
                    <SectionBlock>
                        <SectionTitle>근무내역</SectionTitle>
                        <SectionDivider />
                        <WorkLogList>
                            {[...workLogs]
                                .sort((a, b) => a.workDate.localeCompare(b.workDate))
                                .map((log) => (
                                    <WorkLogItem key={log.workLogId}>
                                        <WorkLogLeft>
                                            <WorkLogDate>{fmtWorkDate(log.workDate)}</WorkLogDate>
                                            <WorkLogTime>
                                                {fmtTime(log.startTime)} ~ {fmtTime(log.endTime)} ({fmtHours(log.workedMinutes)})
                                            </WorkLogTime>
                                        </WorkLogLeft>
                                        <WorkLogAmount>{fmtMoney(log.earnedAmount)}원</WorkLogAmount>
                                    </WorkLogItem>
                                ))}
                        </WorkLogList>
                    </SectionBlock>
                )}

                {/* 비고 */}
                {advanceAmount > 0 && (
                    <SectionBlock>
                        <SectionTitle>비고</SectionTitle>
                        <SectionDivider />
                        <PayRow>
                            <PayLabel>선지급</PayLabel>
                            <PayValue>{fmtMoney(advanceAmount)}원</PayValue>
                        </PayRow>
                    </SectionBlock>
                )}
            </Card>
            <SaveButton type="button" onClick={handleSave}>
                이미지로 저장
            </SaveButton>
        </Wrapper>
    );
}

const Wrapper = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px;
    background: #f5f5f5;
`;

const Card = styled.div`
    width: 460px;
    max-width: 100%;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.07);
    overflow: hidden;
    padding: 0 0 8px;
`;

const SectionBlock = styled.div`
    padding: 22px 28px 16px;
`;

const SectionTitle = styled.div`
    font-size: 17px;
    font-weight: 800;
    color: #111;
    margin-bottom: 10px;
`;

const SectionDivider = styled.div`
    height: 1px;
    background: #e5e5e5;
    margin-bottom: 14px;
`;

const SmallLabel = styled.div`
    font-size: 13px;
    color: #888;
    font-weight: 500;
    margin-bottom: 2px;
`;

const BigAmount = styled.div`
    font-size: 28px;
    font-weight: 800;
    color: #111;
    margin-bottom: 10px;
`;

const InfoLine = styled.div`
    font-size: 13px;
    color: #555;
    margin-bottom: 2px;
`;

const DateText = styled.span`
    color: #111;
    font-weight: 700;
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 4px 0;
`;

const InfoLabel = styled.div`
    font-size: 14px;
    color: #888;
`;

const InfoValue = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #111;
`;

const TotalRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 12px;
`;

const TotalLabel = styled.div`
    font-size: 15px;
    font-weight: 800;
    color: #111;
`;

const TotalValue = styled.div`
    font-size: 17px;
    font-weight: 800;
    color: #111;
`;

const PayRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 3px 0;
`;

const PayLabel = styled.div`
    font-size: 14px;
    color: #333;
    font-weight: 500;
`;

const PayValue = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #111;
`;

const SubRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 2px 0;
`;

const SubLabel = styled.div`
    font-size: 13px;
    color: #999;
`;

const SubValue = styled.div`
    font-size: 13px;
    color: #999;
    font-weight: 500;
`;

const WorkLogList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const WorkLogItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
`;

const WorkLogLeft = styled.div`
    display: flex;
    flex-direction: column;
`;

const WorkLogDate = styled.div`
    font-size: 14px;
    font-weight: 700;
    color: #111;
`;

const WorkLogTime = styled.div`
    font-size: 13px;
    color: #888;
    margin-top: 1px;
`;

const WorkLogAmount = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #111;
    text-align: right;
`;

const CenterText = styled.div`
    padding: 60px 20px;
    text-align: center;
    font-size: 16px;
    color: #888;
`;

const SaveButton = styled.button`
    width: 460px;
    max-width: 100%;
    margin-top: 16px;
    padding: 14px 0;
    border: none;
    border-radius: 14px;
    background: #00ccc7;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 0.85;
    }

    &:active {
        opacity: 0.7;
    }
`;
