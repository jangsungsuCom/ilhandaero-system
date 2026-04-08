import { useState } from "react";
import styled from "styled-components";
import { media } from "../../styles/breakpoints";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, respondToUpdate } =
        useNotifications();
    const [open, setOpen] = useState(false);

    return (
        <BellWrapper>
            <BellButton
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setOpen((v) => !v)}
                aria-label="알림"
            >
                <svg
                    width="29"
                    height="29"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <Badge>{unreadCount > 99 ? "99+" : unreadCount}</Badge>
                )}
            </BellButton>
            {open && (
                <NotificationPanel
                    notifications={notifications}
                    onClose={() => setOpen(false)}
                    onMarkRead={(item) => {
                        if (!item.isRead) markAsRead(item);
                    }}
                    onMarkAllRead={() => {
                        markAllAsRead();
                    }}
                    onRespondUpdate={async (item, decision) => {
                        try {
                            await respondToUpdate(item, decision);
                        } catch {
                            alert("요청 처리에 실패했습니다.");
                        }
                    }}
                />
            )}
        </BellWrapper>
    );
}

const BellWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

const BellButton = styled.button`
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    color: #fff;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    ${media.mobile} {
        padding: 4px;
        svg {
            width: 24px;
            height: 24px;
        }
    }
`;

const Badge = styled.span`
    position: absolute;
    top: 0;
    right: 0;
    min-width: 22px;
    height: 22px;
    padding: 0 5px;
    border-radius: 11px;
    background: #00ccc7;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transform: translate(4px, -4px);

    ${media.mobile} {
        min-width: 19px;
        height: 19px;
        font-size: 12px;
    }
`;
