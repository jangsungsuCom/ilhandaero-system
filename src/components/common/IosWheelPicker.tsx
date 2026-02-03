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
}: Props<T>) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [directInput, setDirectInput] = useState("");
    const isScrollingProgrammatically = useRef(false);

    const paddingVertical = ((visibleCount - 1) / 2) * optionHeight;
    const containerHeight = visibleCount * optionHeight;

    const currentIndex = options.findIndex((o) => o.value === value);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;

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
        setDirectInput(String(value));
    }, [value]);

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
            setDirectInput(String(chosen.value));
        }
    }, [optionHeight, visibleCount, options, value, onChange, paddingVertical, containerHeight]);

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
                setDirectInput(String(options[nextIndex].value));
            }
        },
        [options, optionHeight, paddingVertical, containerHeight, scrollToIndex, onChange]
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
                const found = options.find((o) => Number(o.value) === num || String(o.value) === t);
                return found ? found.value : (num as T);
            }
            const found = options.find((o) => String(o.value) === t || o.label === t);
            return found ? found.value : null;
        },
        [options]
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
                setDirectInput(String(parsed));
                return;
            }
            onChange(parsed);
            setDirectInput(String(parsed));
        } else {
            setDirectInput(String(value));
        }
    };

    const handleDirectInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    };

    if (options.length === 0) return null;

    return (
        <Column>
            <WheelMask height={containerHeight}>
                <WheelContainer ref={scrollRef} height={containerHeight} onScroll={handleScroll}>
                    <Padding height={paddingVertical} />
                    {options.map((opt, idx) => (
                        <WheelItem
                            key={idx}
                            height={optionHeight}
                            $selected={opt.value === value}
                            onClick={() => {
                                onChange(opt.value);
                                scrollToIndex(idx);
                                setDirectInput(String(opt.value));
                            }}
                        >
                            {opt.label}
                        </WheelItem>
                    ))}
                    <Padding height={paddingVertical} />
                </WheelContainer>
            </WheelMask>
            {allowDirectInput && (
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

const WheelMask = styled.div<{ height: number }>`
    height: ${(p) => p.height}px;
    position: relative;
    overflow: hidden;
    mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
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

const WheelItem = styled.div<{ height: number; $selected: boolean }>`
    height: ${(p) => p.height}px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    scroll-snap-align: center;
    scroll-snap-stop: always;
    font-size: ${(p) => (p.$selected ? 20 : 16)}px;
    font-weight: ${(p) => (p.$selected ? 600 : 400)};
    color: ${(p) => (p.$selected ? "#1a1a1a" : "#999")};
    cursor: pointer;
    transition: font-size 0.15s ease, color 0.15s ease;
    user-select: none;
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
