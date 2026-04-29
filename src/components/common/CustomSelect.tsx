import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

export interface CustomSelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

interface CustomSelectProps {
    value: string | number | null;
    options: CustomSelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    embeddedInput?: {
        enabled: boolean;
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
}

export default function CustomSelect({ value, options, onChange, placeholder = "선택하세요", disabled = false, className, embeddedInput }: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const normalizedValue = value == null ? "" : String(value);
    const selectedOption = options.find((option) => String(option.value) === normalizedValue);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    return (
        <SelectRoot ref={rootRef} className={className}>
            <SelectButton
                className="custom-select-button"
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((current) => !current)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {embeddedInput?.enabled ? (
                    <EmbeddedInput
                        type="text"
                        value={embeddedInput.value}
                        placeholder={embeddedInput.placeholder ?? "직접 입력"}
                        disabled={disabled}
                        onChange={(e) => embeddedInput.onChange(e.target.value)}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <SelectText>{selectedOption?.label ?? placeholder}</SelectText>
                )}
                <SelectArrow className="custom-select-arrow" $open={open}>˅</SelectArrow>
            </SelectButton>
            {open && !disabled ? (
                <OptionList className="custom-select-list" role="listbox">
                    {options.map((option) => {
                        const optionValue = String(option.value);
                        const selected = optionValue === normalizedValue;

                        return (
                            <OptionButton
                                className="custom-select-option"
                                key={optionValue || option.label}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                disabled={option.disabled}
                                $selected={selected}
                                onClick={() => {
                                    if (option.disabled) return;
                                    onChange(optionValue);
                                    setOpen(false);
                                }}
                            >
                                {option.label}
                            </OptionButton>
                        );
                    })}
                </OptionList>
            ) : null}
        </SelectRoot>
    );
}

const SelectRoot = styled.div`
    position: relative;
    width: 100%;
`;

const SelectButton = styled.button`
    width: 100%;
    min-height: 44px;
    padding: 0 40px 0 16px;
    border: 1.5px solid #00ccc7;
    border-radius: 10px;
    background: #ffffff;
    color: #000;
    cursor: pointer;
    text-align: left;
    font: inherit;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &:disabled {
        background: #f5f5f5;
        color: #6b7280;
        cursor: not-allowed;
    }
`;

const SelectText = styled.span`
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const EmbeddedInput = styled.input`
    width: 100%;
    border: none;
    background: transparent;
    color: #000;
    font: inherit;
    padding-right: 10px;

    &:focus {
        outline: none;
    }

    &::placeholder {
        color: #6b7280;
    }
`;

const SelectArrow = styled.span<{ $open: boolean }>`
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%) rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
    color: #00a8a5;
    font-size: 14px;
    font-weight: 800;
    pointer-events: none;
    transition: transform 0.2s ease;
`;

const OptionList = styled.div`
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 4000;
    padding: 8px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(0, 204, 199, 0.22);
    box-shadow:
        0 24px 52px rgba(15, 23, 42, 0.18),
        0 8px 18px rgba(0, 204, 199, 0.12);
    backdrop-filter: blur(14px);
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 260px;
    overflow-y: auto;
`;

const OptionButton = styled.button<{ $selected: boolean }>`
    width: 100%;
    min-height: 40px;
    padding: 0 14px;
    border-radius: 13px;
    border: none;
    background: ${({ $selected }) => ($selected ? "linear-gradient(135deg, #00d7d1 0%, #00b9b5 100%)" : "transparent")};
    color: ${({ $selected }) => ($selected ? "#ffffff" : "#111827")};
    font-size: 14px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
    transition:
        background 0.18s ease,
        color 0.18s ease,
        transform 0.18s ease;

    &:hover:not(:disabled) {
        background: ${({ $selected }) => ($selected ? "linear-gradient(135deg, #00d7d1 0%, #00b9b5 100%)" : "rgba(0, 204, 199, 0.1)")};
        color: ${({ $selected }) => ($selected ? "#ffffff" : "#007f7c")};
        transform: translateX(2px);
    }

    &:disabled {
        color: #9ca3af;
        cursor: not-allowed;
    }
`;
