import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import styled from "styled-components";
import { media } from "../../styles/breakpoints";
import type { NotificationItem } from "../../types/notification";

type TabType = "unread" | "read";

interface Props {
    notifications: NotificationItem[];
    onClose: () => void;
    onMarkRead: (item: NotificationItem) => void;
    onMarkAllRead: () => void;
    onRespondUpdate: (item: NotificationItem, decision: "accept" | "reject") => Promise<void>;
}

function parseUTC(dateStr: string): Date {
    if (/[Zz]$/.test(dateStr) || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
        return new Date(dateStr);
    }
    return new Date(dateStr + "Z");
}

/** 근무 시간 문자열을 로컬 시간으로 파싱 (UTC 변환 없이) */
function parseLocal(dateStr: string): Date {
    return new Date(dateStr);
}

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - parseUTC(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "방금";
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return parseUTC(dateStr).toLocaleDateString("ko-KR");
}

function formatTime(dateTimeStr: string | null): string {
    if (!dateTimeStr) return "--:--";
    const d = parseLocal(dateTimeStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(dateTimeStr: string | null): string {
    if (!dateTimeStr) return "";
    const d = parseLocal(dateTimeStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const ACTION_LABELS: Record<string, string> = {
    CREATED: "등록",
    UPDATED: "수정",
    DELETED: "삭제",
};

export default function NotificationPanel({ notifications, onClose, onMarkRead, onMarkAllRead, onRespondUpdate }: Props) {
    const panelRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const [activeTab, setActiveTab] = useState<TabType>("unread");

    const unreadList = useMemo(() => notifications.filter((n) => !n.isRead), [notifications]);
    const readList = useMemo(() => notifications.filter((n) => n.isRead), [notifications]);

    const visibleList = activeTab === "unread" ? unreadList : readList;

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClick);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClick);
        };
    }, [onClose]);

    const scrollToNextUnread = useCallback(
        (currentId: number) => {
            const currentIdx = unreadList.findIndex((n) => n.id === currentId);
            const next = unreadList[currentIdx + 1];
            if (next) {
                const el = itemRefs.current.get(next.id);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        },
        [unreadList],
    );

    const handleReadClick = useCallback(
        (item: NotificationItem) => {
            if (!item.isRead) {
                onMarkRead(item);
                setTimeout(() => scrollToNextUnread(item.id), 200);
            }
        },
        [onMarkRead, scrollToNextUnread],
    );

    return (
        <PanelContainer ref={panelRef}>
            <PanelHeader>
                <PanelTitle>알림</PanelTitle>
                {activeTab === "unread" && unreadList.length > 0 && <MarkAllButton onClick={onMarkAllRead}>전체 읽음</MarkAllButton>}
            </PanelHeader>
            <TabBar>
                <Tab $active={activeTab === "unread"} onClick={() => setActiveTab("unread")}>
                    안읽음
                    {unreadList.length > 0 && <TabCount>{unreadList.length}</TabCount>}
                </Tab>
                <Tab $active={activeTab === "read"} onClick={() => setActiveTab("read")}>
                    읽음
                </Tab>
            </TabBar>
            <PanelBody>
                {visibleList.length === 0 ? (
                    <EmptyMessage>{activeTab === "unread" ? "읽지 않은 알림이 없습니다" : "읽은 알림이 없습니다"}</EmptyMessage>
                ) : (
                    visibleList.map((item) => (
                        <NotifItem
                            key={item.id}
                            ref={(el) => {
                                if (el) itemRefs.current.set(item.id, el);
                            }}
                            $unread={!item.isRead}
                        >
                            <ActionIcon $type={item.actionType}>{item.actionType === "CREATED" ? "+" : item.actionType === "DELETED" ? "×" : "✎"}</ActionIcon>
                            <NotifContent>
                                <NotifText>
                                    <CompanyTag>{item.companyName}</CompanyTag> {item.workerName}님이 근무기록을 {ACTION_LABELS[item.actionType]}했습니다
                                </NotifText>
                                {item.actionType === "UPDATED" && (
                                    <ChangeDetail>
                                        {formatDate(item.beforeStartAt)}
                                        {formatDate(item.beforeStartAt) && " "}
                                        {formatTime(item.beforeStartAt)}~{formatTime(item.beforeEndAt)}
                                        {" → "}
                                        {formatDate(item.afterStartAt)}
                                        {formatDate(item.afterStartAt) && " "}
                                        {formatTime(item.afterStartAt)}~{formatTime(item.afterEndAt)}
                                    </ChangeDetail>
                                )}
                                {item.actionType === "CREATED" && item.afterStartAt && (
                                    <ChangeDetail>
                                        {formatDate(item.afterStartAt)}
                                        {formatDate(item.afterStartAt) && " "}
                                        {formatTime(item.afterStartAt)}~{formatTime(item.afterEndAt)}
                                    </ChangeDetail>
                                )}
                                {item.actionType === "DELETED" && (item.beforeStartAt || item.beforeEndAt) && (
                                    <ChangeDetail>
                                        {formatDate(item.beforeStartAt || item.beforeEndAt)}
                                        {(item.beforeStartAt || item.beforeEndAt) && " "}
                                        {formatTime(item.beforeStartAt)}~{formatTime(item.beforeEndAt)}
                                    </ChangeDetail>
                                )}
                                <NotifTime>{formatRelativeTime(item.occurredAt)}</NotifTime>
                            </NotifContent>
                            {!item.isRead && (
                                <RightArea>
                                    <UnreadDot />
                                    {item.actionType === "UPDATED" ? (
                                        <ActionButtons>
                                            <RejectButton
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRespondUpdate(item, "reject");
                                                }}
                                            >
                                                거절
                                            </RejectButton>
                                            <AcceptButton
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRespondUpdate(item, "accept");
                                                }}
                                            >
                                                수락
                                            </AcceptButton>
                                        </ActionButtons>
                                    ) : (
                                        <ReadButton
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReadClick(item);
                                            }}
                                        >
                                            읽음
                                        </ReadButton>
                                    )}
                                </RightArea>
                            )}
                        </NotifItem>
                    ))
                )}
            </PanelBody>
        </PanelContainer>
    );
}

const PanelContainer = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    width: 380px;
    max-height: 480px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    ${media.desktopUp} {
        width: 760px;
        max-height: 960px;
        margin-top: 16px;
        border-radius: 24px;
        box-shadow: 0 8px 48px rgba(0, 0, 0, 0.15);
    }

    ${media.mobile} {
        position: fixed;
        top: 12px;
        right: 12px;
        left: 12px;
        width: auto;
        max-height: 70vh;
    }
`;

const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 8px;

    ${media.desktopUp} {
        padding: 32px 40px 16px;
    }
`;

const PanelTitle = styled.h3`
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #000;

    ${media.desktopUp} {
        font-size: 32px;
    }
`;

const MarkAllButton = styled.button`
    background: none;
    border: none;
    color: #00ccc7;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;

    ${media.desktopUp} {
        font-size: 26px;
        padding: 8px 16px;
        border-radius: 12px;
    }

    &:hover {
        background: #f0fffe;
    }
`;

const TabBar = styled.div`
    display: flex;
    border-bottom: 1px solid #f0f0f0;
    padding: 0 20px;

    ${media.desktopUp} {
        padding: 0 40px;
        border-bottom-width: 2px;
    }
`;

const Tab = styled.button<{ $active: boolean }>`
    flex: 1;
    background: none;
    border: none;
    border-bottom: 2px solid ${({ $active }) => ($active ? "#00ccc7" : "transparent")};
    color: ${({ $active }) => ($active ? "#00ccc7" : "#000")};
    font-size: 14px;
    font-weight: 600;
    padding: 10px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition:
        color 0.15s,
        border-color 0.15s;

    ${media.desktopUp} {
        font-size: 28px;
        padding: 20px 0;
        gap: 12px;
        border-bottom-width: 4px;
    }

    &:hover {
        color: #00ccc7;
    }
`;

const TabCount = styled.span`
    background: #00ccc7;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;

    ${media.desktopUp} {
        font-size: 22px;
        min-width: 36px;
        height: 36px;
        border-radius: 18px;
        padding: 0 10px;
    }
`;

const PanelBody = styled.div`
    overflow-y: auto;
    flex: 1;
`;

const EmptyMessage = styled.div`
    padding: 48px 20px;
    text-align: center;
    color: #000;
    font-size: 14px;

    ${media.desktopUp} {
        padding: 96px 40px;
        font-size: 28px;
    }
`;

const NotifItem = styled.div<{ $unread: boolean }>`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 20px;
    cursor: pointer;
    background: ${({ $unread }) => ($unread ? "#f0fffe" : "transparent")};
    border-bottom: 1px solid #f5f5f5;
    transition: background 0.15s;

    &:hover {
        background: ${({ $unread }) => ($unread ? "#e0faf9" : "#fafafa")};
    }

    &:last-child {
        border-bottom: none;
    }

    ${media.desktopUp} {
        gap: 24px;
        padding: 28px 40px;
    }
`;

const ActionIcon = styled.div<{ $type: string }>`
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    margin-top: 2px;
    color: #fff;
    background: ${({ $type }) => ($type === "CREATED" ? "#00ccc7" : $type === "UPDATED" ? "#f1c40f" : "#e74c3c")};

    ${media.desktopUp} {
        width: 56px;
        height: 56px;
        font-size: 32px;
        margin-top: 4px;
    }
`;

const NotifContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const NotifText = styled.div`
    font-size: 13px;
    color: #000;
    line-height: 1.5;
    word-break: keep-all;

    ${media.desktopUp} {
        font-size: 26px;
    }
`;

const CompanyTag = styled.span`
    display: inline;
    font-weight: 600;
    color: #00ccc7;
`;

const ChangeDetail = styled.div`
    font-size: 12px;
    color: #000;
    margin-top: 2px;
    font-family: "Pretendard", monospace;

    ${media.desktopUp} {
        font-size: 24px;
        margin-top: 4px;
    }
`;

const NotifTime = styled.div`
    font-size: 11px;
    color: #000;
    margin-top: 4px;

    ${media.desktopUp} {
        font-size: 22px;
        margin-top: 8px;
    }
`;

const UnreadDot = styled.div`
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00ccc7;
    margin-top: 6px;

    ${media.desktopUp} {
        width: 16px;
        height: 16px;
        margin-top: 12px;
    }
`;

const RightArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    ${media.desktopUp} {
        gap: 12px;
    }
`;

const ReadButton = styled.button`
    border: 1px solid #00ccc7;
    background: #ffffff;
    color: #00ccc7;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;

    ${media.desktopUp} {
        font-size: 22px;
        padding: 4px 12px;
        border-radius: 16px;
        border-width: 2px;
    }

    &:hover {
        background: #f0fffe;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 6px;

    ${media.desktopUp} {
        gap: 12px;
    }
`;

const RejectButton = styled.button`
    border: 1px solid #d9534f;
    background: #fff;
    color: #d9534f;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;

    ${media.desktopUp} {
        font-size: 22px;
        padding: 4px 12px;
        border-radius: 16px;
        border-width: 2px;
    }

    &:hover {
        background: #fff1f1;
    }
`;

const AcceptButton = styled.button`
    border: 1px solid #00ccc7;
    background: #fff;
    color: #00ccc7;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;

    ${media.desktopUp} {
        font-size: 22px;
        padding: 4px 12px;
        border-radius: 16px;
        border-width: 2px;
    }

    &:hover {
        background: #f0fffe;
    }
`;
