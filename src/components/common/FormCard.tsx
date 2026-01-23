import styled from "styled-components";

export const PageContainer = styled.div<{ width?: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    width: ${({ width }) => width || "auto"};
`;

export const FormCard = styled.div`
    background: white;
    width: 100%;
    max-width: 520px;
    overflow: hidden;
`;

export const Title = styled.h1`
    font-size: 28px;
    font-weight: bold;
    color: #00a8a5;
    text-align: center;
    margin: 0 0 40px 0;
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 28px;
`;

export const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const Label = styled.label`
    font-size: 16px;
    font-weight: 600;
    color: #333;
`;

export const Input = styled.input`
    width: 100%;
    height: 52px;
    padding: 0 16px;
    font-size: 17px;
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: #f9fbfc;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: #00a8a5;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &::placeholder {
        color: #aaa;
    }

    &:disabled {
        background: #f0f4f4;
        color: #555;
        cursor: not-allowed;
    }
`;

export const ReadOnlyInput = styled(Input)`
    background: #f0f4f4;
    color: #555;
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
    color: #00a8a5;
    font-weight: 600;
    pointer-events: none;
`;

export const SubmitButton = styled.button`
    margin-top: 20px;
    height: 62px;
    font-size: 22px;
    font-weight: bold;
    color: white;
    background: linear-gradient(135deg, #00cbc7 0%, #4dd0ae 100%);
    border: none;
    border-radius: 16px;
    cursor: pointer;
    box-shadow: 0 6px 12px rgba(0, 204, 199, 0.3);
    transition: all 0.2s ease;

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
`;

export const HelperText = styled.p`
    font-size: 13px;
    color: #e57373;
    margin: 4px 0 0 4px;
`;

export const Divider = styled.div`
    display: flex;
    align-items: center;
    text-align: center;
    margin: 20px 0;
    color: #999;
    font-size: 14px;

    &::before,
    &::after {
        content: "";
        flex: 1;
        border-bottom: 1px solid #ddd;
    }

    &::before {
        margin-right: 10px;
    }

    &::after {
        margin-left: 10px;
    }
`;

export const ToggleButton = styled.button<{ isActive: boolean }>`
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    border: 1.5px solid ${({ isActive }) => (isActive ? "#00a8a5" : "#ddd")};
    border-radius: 8px;
    background: ${({ isActive }) => (isActive ? "#00a8a5" : "white")};
    color: ${({ isActive }) => (isActive ? "white" : "#666")};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: #00a8a5;
        background: ${({ isActive }) => (isActive ? "#00a8a5" : "#f0f9f8")};
    }
`;
