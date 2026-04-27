import { useState } from "react";
import styled from "styled-components";
import { media } from "../../styles/breakpoints";
import CustomSelect from "./CustomSelect";

const EMAIL_DOMAINS = [
    { value: "naver.com", label: "naver.com" },
    { value: "gmail.com", label: "gmail.com" },
    { value: "daum.net", label: "daum.net" },
    { value: "hanmail.net", label: "hanmail.net" },
    { value: "kakao.com", label: "kakao.com" },
    { value: "nate.com", label: "nate.com" },
    { value: "", label: "직접입력" },
];

interface EmailInputProps {
    value: string;
    onChange: (email: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const EmailInput = ({ value, onChange, placeholder = "이메일", disabled = false }: EmailInputProps) => {
    // value에서 id와 domain 분리
    const atIndex = value.indexOf("@");
    const initialId = atIndex > -1 ? value.substring(0, atIndex) : value;
    const initialDomain = atIndex > -1 ? value.substring(atIndex + 1) : "";
    const isPresetDomain = EMAIL_DOMAINS.some((d) => d.value === initialDomain && d.value !== "");

    const [emailId, setEmailId] = useState(initialId);
    const [selectedDomain, setSelectedDomain] = useState(isPresetDomain ? initialDomain : initialDomain ? "" : "naver.com");
    const [customDomain, setCustomDomain] = useState(isPresetDomain ? "" : initialDomain);

    const updateEmail = (id: string, domain: string) => {
        if (id && domain) {
            onChange(`${id}@${domain}`);
        } else if (id) {
            onChange(id);
        } else {
            onChange("");
        }
    };

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newId = e.target.value;
        setEmailId(newId);
        const domain = selectedDomain || customDomain;
        updateEmail(newId, domain);
    };

    const handleDomainSelect = (domain: string) => {
        setSelectedDomain(domain);
        if (domain) {
            setCustomDomain("");
            updateEmail(emailId, domain);
        } else {
            updateEmail(emailId, customDomain);
        }
    };

    const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const domain = e.target.value;
        setCustomDomain(domain);
        updateEmail(emailId, domain);
    };

    return (
        <EmailInputContainer>
            <EmailIdInput type="text" value={emailId} onChange={handleIdChange} placeholder={placeholder} disabled={disabled} />
            <AtSymbol>@</AtSymbol>
            {selectedDomain === "" && <EmailDomainInput type="text" value={customDomain} onChange={handleCustomDomainChange} placeholder="도메인 입력" disabled={disabled} />}
            <EmailDomainSelect value={selectedDomain} options={EMAIL_DOMAINS} onChange={handleDomainSelect} disabled={disabled} />
        </EmailInputContainer>
    );
};

const EmailInputContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    ${media.mobile} {
        gap: 4px;
    }
`;

const EmailIdInput = styled.input`
    flex: 1;
    min-width: 100px;
    height: 52px;
    padding: 0 16px;
    font-size: 17px;
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: #ffffff;
    color: #000;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &::placeholder {
        color: #000;
    }

    &:disabled {
        background: #f5f5f5;
        color: #000;
        cursor: not-allowed;
    }

    ${media.mobile} {
        height: 46px;
        font-size: 14px;
        padding: 0 8px;
        flex: 1;
        min-width: 0;
    }
`;

const AtSymbol = styled.span`
    font-size: 17px;
    color: #000;
    flex-shrink: 0;

    ${media.mobile} {
        font-size: 14px;
    }
`;

const EmailDomainInput = styled.input`
    width: 120px;
    height: 52px;
    padding: 0 12px;
    font-size: 17px;
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: #ffffff;
    color: #000;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &::placeholder {
        color: #000;
    }

    &:disabled {
        background: #f5f5f5;
        color: #000;
        cursor: not-allowed;
    }

    ${media.mobile} {
        width: auto;
        min-width: 70px;
        flex: 1;
        height: 46px;
        font-size: 13px;
        padding: 0 6px;
    }
`;

const EmailDomainSelect = styled(CustomSelect)`
    width: 110px;
    height: 52px;
    font-size: 15px;
    flex-shrink: 0;

    ${media.mobile} {
        width: auto;
        min-width: 80px;
        height: 46px;
        font-size: 13px;
    }
`;

export const PageContainer = styled.div<{ width?: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    width: ${({ width }) => width || "auto"};

    ${media.mobile} {
        padding: 24px 16px;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        overflow-x: hidden;
    }
`;

export const FormCard = styled.div`
    background: white;
    width: 100%;
    max-width: 520px;
    overflow: hidden;

    ${media.mobile} {
        max-width: 100%;
    }
`;

export const Title = styled.h1`
    font-size: 28px;
    font-weight: bold;
    color: #00ccc7;
    text-align: center;
    margin: 0 0 40px 0;

    ${media.tablet} {
        font-size: 24px;
        margin-bottom: 30px;
    }

    ${media.mobile} {
        font-size: 22px;
        margin-bottom: 24px;
    }
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 28px;

    ${media.mobile} {
        gap: 20px;
    }
`;

export const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const Label = styled.label`
    font-size: 16px;
    font-weight: 600;
    color: #00ccc7;
`;

export const Input = styled.input`
    width: 100%;
    height: 52px;
    padding: 0 16px;
    font-size: 17px;
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: #ffffff;
    color: #000;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &::placeholder {
        color: #000;
    }

    &:disabled {
        background: #f5f5f5;
        color: #000;
        cursor: not-allowed;
    }

    /* number 타입 화살표 제거 (Chrome, Edge, Safari) */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* number 타입 화살표 제거 (Firefox) */
    &[type="number"] {
        -moz-appearance: textfield;
    }

    ${media.mobile} {
        height: 46px;
        font-size: 16px;
        padding: 0 14px;
    }
`;

export const ReadOnlyInput = styled(Input)`
    background: #f5f5f5;
    color: #000;
    cursor: default;
`;

export const InputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

export const Unit = styled.span`
    position: absolute;
    right: 16px;
    color: #00ccc7;
    font-weight: 600;
    pointer-events: none;
`;

export const SubmitButton = styled.button`
    margin-top: 20px;
    height: 62px;
    font-size: 22px;
    font-weight: bold;
    color: white;
    background: #00ccc7;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    box-shadow: 0 6px 12px rgba(0, 204, 199, 0.3);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(0, 204, 199, 0.4);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    ${media.mobile} {
        margin-top: 16px;
        height: 52px;
        font-size: 18px;
        border-radius: 12px;
    }
`;

export const HelperText = styled.p`
    font-size: 13px;
    color: #000;
    margin: 4px 0 0 4px;
`;

export const Divider = styled.div`
    display: flex;
    align-items: center;
    text-align: center;
    margin: 20px 0;
    color: #000;
    font-size: 14px;

    &::before,
    &::after {
        content: "";
        flex: 1;
        border-bottom: 1px solid #000;
    }

    &::before {
        margin-right: 10px;
    }

    &::after {
        margin-left: 10px;
    }
`;

export const ToggleButton = styled.button<{ isActive: boolean }>`
    flex: 1;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    border: 1.5px solid ${({ isActive }) => (isActive ? "#00ccc7" : "#000")};
    border-radius: 8px;
    background: ${({ isActive }) => (isActive ? "#00ccc7" : "white")};
    color: ${({ isActive }) => (isActive ? "white" : "#000")};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: #00ccc7;
        background: ${({ isActive }) => (isActive ? "#00ccc7" : "#fff")};
    }
`;
