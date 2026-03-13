import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

export interface WheelOption<T = number | string> {
    value: T;
    label: string;
}

type Props<T = number | string> = {
    options: WheelOption<T>[];
    value: T;
    onChange: (value: T) => void;
    optionHeight?: number;
    visibleCount?: number;
    /** 직접 입력 필드 표시 (스크롤 + 입력 모두 가능) */
    allowDirectInput?: boolean;
    directInputPlaceholder?: string;
    /** 직접 입력 파싱 (미주면 value와 같은 타입으로 Number/문자열 시도) */
    parseDirectInput?: (text: string) => T | null;
    /** 중앙 입력 모드: true면 휠 중앙에 input이 오버레이됨 */
    centerInputMode?: boolean;
    /** 중앙 입력 모드에서 input 뒤에 표시할 접미사 (예: "년", "월") */
    centerInputSuffix?: string;
};

const DEFAULT_OPTION_HEIGHT = 44;
const DEFAULT_VISIBLE_COUNT = 5;

function IosWheelPickerInner<T = number | string>({
    options,
    value,
    onChange,
    optionHeight = DEFAULT_OPTION_HEIGHT,
    visibleCount = DEFAULT_VISIBLE_COUNT,
    allowDirectInput = true,
    directInputPlaceholder,
    parseDirectInput,
    centerInputMode = false,
    centerInputSuffix,
}: Props<T>) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [directInput, setDirectInput] = useState("");
    const isScrollingProgrammatically = useRef(false);

    const paddingVertical = ((visibleCount - 1) / 2) * optionHeight;
    const containerHeight = visibleCount * optionHeight;

    const currentIndex = options.findIndex((o) => o.value === value);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;

    // label에서 숫자만 추출하는 헬퍼
    const extractNumberFromLabel = useCallback(
        (val: T): string => {
            const opt = options.find((o) => o.value === val);
            if (!opt) return String(val);
            const match = opt.label.match(/\d+/);
            return match ? match[0] : String(val);
        },
        [options]
    );

    // centerInputMode에서 input에 표시할 값 (label 기반)
    const getDisplayValue = useCallback(
        (val: T): string => {
            if (centerInputMode) {
                return extractNumberFromLabel(val);
            }
            return String(val);
        },
        [centerInputMode, extractNumberFromLabel]
    );

    /** 인덱스 i인 항목이 뷰포트 가운데 오도록 scrollTop 계산 (상단 패딩 반영) */
    const scrollToIndex = useCallback(
        (index: number) => {
            const el = scrollRef.current;
            if (!el) return;
            const clamped = Math.max(0, Math.min(index, options.length - 1));
            const top = paddingVertical + (clamped + 0.5) * optionHeight - containerHeight / 2;
            isScrollingProgrammatically.current = true;
            el.scrollTo({ top, behavior: "smooth" });
        },
        [optionHeight, options.length, paddingVertical, containerHeight]
    );

    useEffect(() => {
        scrollToIndex(safeIndex);
    }, [safeIndex, scrollToIndex]);

    useEffect(() => {
        setDirectInput(getDisplayValue(value));
    }, [value, getDisplayValue]);

    const handleScroll = useCallback(() => {
        if (isScrollingProgrammatically.current) return;
        const el = scrollRef.current;
        if (!el) return;
        const centerView = el.scrollTop + containerHeight / 2;
        const rawIndex = (centerView - paddingVertical - optionHeight / 2) / optionHeight;
        const index = Math.round(rawIndex);
        const clamped = Math.max(0, Math.min(index, options.length - 1));
        const chosen = options[clamped];
        if (chosen && chosen.value !== value) {
            onChange(chosen.value);
            setDirectInput(getDisplayValue(chosen.value));
        }
    }, [optionHeight, visibleCount, options, value, onChange, paddingVertical, containerHeight, getDisplayValue]);

    const handleScrollEnd = useCallback(() => {
        isScrollingProgrammatically.current = false;
        handleScroll();
    }, [handleScroll]);

    /** 휠/트랙패드: 한 칸씩만 이동 (passive: false로 등록해야 preventDefault 동작) */
    const handleWheel = useCallback(
        (e: WheelEvent) => {
            const el = scrollRef.current;
            if (!el || options.length === 0) return;
            e.preventDefault();
            const currentTop = el.scrollTop;
            const rawIndex = Math.round((currentTop + containerHeight / 2 - paddingVertical - optionHeight / 2) / optionHeight);
            const currentIndex = Math.max(0, Math.min(rawIndex, options.length - 1));
            const delta = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
            if (delta === 0) return;
            const nextIndex = Math.max(0, Math.min(currentIndex + delta, options.length - 1));
            if (nextIndex !== currentIndex) {
                scrollToIndex(nextIndex);
                onChange(options[nextIndex].value);
                setDirectInput(getDisplayValue(options[nextIndex].value));
            }
        },
        [options, optionHeight, paddingVertical, containerHeight, scrollToIndex, onChange, getDisplayValue]
    );

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        let timeoutId: ReturnType<typeof setTimeout>;
        const onScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleScrollEnd, 100);
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            el.removeEventListener("scroll", onScroll);
            clearTimeout(timeoutId);
        };
    }, [handleScrollEnd]);

    const defaultParse = useCallback(
        (text: string): T | null => {
            const t = text.trim();
            const num = Number(t);
            if (!Number.isNaN(num)) {
                // centerInputMode일 때는 label의 숫자와 매칭
                if (centerInputMode) {
                    const found = options.find((o) => {
                        const match = o.label.match(/\d+/);
                        return match && Number(match[0]) === num;
                    });
                    if (found) return found.value;
                }
                const found = options.find((o) => Number(o.value) === num || String(o.value) === t);
                return found ? found.value : (num as T);
            }
            const found = options.find((o) => String(o.value) === t || o.label === t);
            return found ? found.value : null;
        },
        [options, centerInputMode]
    );

    const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDirectInput(e.target.value);
    };

    const handleDirectInputBlur = () => {
        const parse = parseDirectInput ?? defaultParse;
        const parsed = parse(directInput);
        if (parsed != null) {
            const idx = options.findIndex((o) => o.value === parsed);
            if (idx >= 0) {
                onChange(parsed);
                scrollToIndex(idx);
                setDirectInput(getDisplayValue(parsed));
                return;
            }
            onChange(parsed);
            setDirectInput(getDisplayValue(parsed));
        } else {
            setDirectInput(getDisplayValue(value));
        }
    };

    const handleDirectInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    };

    if (options.length === 0) return null;

    // 현재 선택된 옵션의 label 가져오기
    const currentOption = options.find((o) => o.value === value);
    const currentLabel = currentOption?.label || String(value);

    return (
        <Column>
            <WheelWrapper>
                <WheelMask height={containerHeight}>
                    <WheelContainer ref={scrollRef} height={containerHeight} onScroll={handleScroll}>
                        <Padding height={paddingVertical} />
                        {options.map((opt, idx) => (
                            <WheelItem
                                key={idx}
                                height={optionHeight}
                                $selected={opt.value === value}
                                $hidden={centerInputMode && opt.value === value}
                                onClick={() => {
                                    onChange(opt.value);
                                    scrollToIndex(idx);
                                    setDirectInput(getDisplayValue(opt.value));
                                }}
                            >
                                {opt.label}
                            </WheelItem>
                        ))}
                        <Padding height={paddingVertical} />
                    </WheelContainer>
                </WheelMask>
                {centerInputMode && (
                    <CenterInputWrapper height={optionHeight}>
                        <CenterInput
                            type="text"
                            inputMode="decimal"
                            value={directInput}
                            onChange={handleDirectInputChange}
                            onBlur={handleDirectInputBlur}
                            onKeyDown={handleDirectInputKeyDown}
                            placeholder={directInputPlaceholder || currentLabel}
                        />
                        {centerInputSuffix && <CenterInputSuffix>{centerInputSuffix}</CenterInputSuffix>}
                    </CenterInputWrapper>
                )}
            </WheelWrapper>
            {allowDirectInput && !centerInputMode && (
                <DirectInput
                    type="text"
                    inputMode="decimal"
                    value={directInput}
                    onChange={handleDirectInputChange}
                    onBlur={handleDirectInputBlur}
                    onKeyDown={handleDirectInputKeyDown}
                    placeholder={directInputPlaceholder}
                />
            )}
        </Column>
    );
}

export function IosWheelPicker<T = number | string>(props: Props<T>) {
    return <IosWheelPickerInner {...(props as unknown as Props<number | string>)} />;
}

// --- Styled ------------------------------------

const Column = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
`;

const WheelWrapper = styled.div`
    position: relative;
`;

const WheelMask = styled.div<{ height: number }>`
    height: ${(p) => p.height}px;
    position: relative;
    overflow: hidden;
    mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
`;

const CenterInputWrapper = styled.div<{ height: number }>`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: ${(p) => p.height}px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
`;

const CenterInput = styled.input`
    width: 60px;
    padding: 4px 8px;
    font-size: 16px;
    font-weight: 400;
    text-align: center;
    border: 1.5px solid #00ccc7;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.95);
    color: #000;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 2px rgba(0, 204, 199, 0.2);
    }

    &::placeholder {
        color: #000;
    }
`;

const CenterInputSuffix = styled.span`
    font-size: 20px;
    font-weight: 600;
    color: #000;
    margin-left: 4px;
`;

const WheelContainer = styled.div<{ height: number }>`
    height: ${(p) => p.height}px;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        width: 0;
        display: none;
    }
    scrollbar-width: none;
`;

const Padding = styled.div<{ height: number }>`
    height: ${(p) => p.height}px;
    flex-shrink: 0;
`;

const WheelItem = styled.div<{ height: number; $selected: boolean; $hidden?: boolean }>`
    height: ${(p) => p.height}px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    scroll-snap-align: center;
    scroll-snap-stop: always;
    font-size: ${(p) => (p.$selected ? 20 : 16)}px;
    font-weight: ${(p) => (p.$selected ? 600 : 400)};
    color: ${(p) => (p.$selected ? "#000" : "#000")};
    cursor: pointer;
    transition: font-size 0.15s ease, color 0.15s ease;
    user-select: none;
    opacity: ${(p) => (p.$hidden ? 0 : 1)};
`;

const DirectInput = styled.input`
    width: 72px;
    padding: 6px 10px;
    font-size: 15px;
    text-align: center;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fafafa;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        background: #fff;
    }
`;
