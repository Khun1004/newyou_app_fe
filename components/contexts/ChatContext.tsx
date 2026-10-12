import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { useAppFriendsContext } from '@/components/contexts/UseAppFriendsContext';

// Define TypeScript interfaces for your data
export interface Chat {
    id: string;
    name: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    avatar: string;
    colors?: string[]; // 사진이 없을 때 이름 첫 글자 동그라미 색
}

export interface Group {
    id: string;
    name: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    avatar: string;
    memberCount: number;
    members: Chat[];
}

// Define the shape of the context's value
interface ChatContextType {
    chatData: Chat[];
    setChatData: React.Dispatch<React.SetStateAction<Chat[]>>;
    groupData: Group[];
    setGroupData: React.Dispatch<React.SetStateAction<Group[]>>;
}

// ------------------------------------------------------------
// 채팅 목록은 '내 친구들'(생일 화면에 등록한 친구)로 만들어요.
// 친구마다 미리 보여줄 마지막 메시지 (순서대로 돌려 써요)
// ------------------------------------------------------------
const SAMPLE_MESSAGES = [
    { text: '내일 수업 끝나고 같이 밥 먹을래? 🍜', time: '오후 9:12', unread: 2 },
    { text: '캡스톤 발표 자료 보냈어! 확인해 줘 🙏', time: '오후 6:40', unread: 1 },
    { text: 'ㅋㅋㅋ 사진 너무 잘 나왔다', time: '오후 3:05', unread: 0 },
    { text: '주말에 한강 갈 사람~?', time: '어제', unread: 3 },
    { text: '생일 선물 고마워! 진짜 마음에 들어 💕', time: '어제', unread: 0 },
    { text: '과제 마감 언제였지?', time: '2일 전', unread: 0 },
];

const friendToChat = (f: { id: string; nickname: string; colors?: string[]; photo?: string | null }, i: number): Chat => {
    const m = SAMPLE_MESSAGES[i % SAMPLE_MESSAGES.length];
    return {
        id: `f-${f.id}`,
        name: f.nickname,
        lastMessage: m.text,
        timestamp: m.time,
        unreadCount: m.unread,
        avatar: f.photo || '',
        colors: f.colors,
    };
};

// Create the context with an initial undefined value
// The `as` keyword is used here because the value will be provided by the provider later
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Define the props for the provider component
interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
    // Use useState to manage the chat and group data
    const { friends } = useAppFriendsContext();
    const [chatData, setChatData] = useState<Chat[]>([]);
    const [groupData, setGroupData] = useState<Group[]>([]);

    // 내 친구 목록이 바뀌면 채팅 목록도 다시 만들어요.
    // (직접 추가한 채팅/그룹은 지우지 않고 그대로 둬요)
    useEffect(() => {
        const friendChats = friends.map(friendToChat);
        setChatData((cur) => [...cur.filter((c) => !c.id.startsWith('f-')), ...friendChats]);

        setGroupData((cur) => {
            const mine = cur.filter((g) => g.id !== 'g-friends');
            if (friendChats.length < 2) return mine;
            return [
                {
                    id: 'g-friends',
                    name: '우리 친구들 🎉',
                    lastMessage: `${friendChats[0].name}: 이번 주말에 다 같이 모이자!`,
                    timestamp: '오후 8:30',
                    unreadCount: 4,
                    avatar: '',
                    memberCount: friendChats.length + 1,
                    members: friendChats,
                },
                ...mine,
            ];
        });
    }, [friends]);

    // Create the value object to be passed to the context provider
    const value = {
        chatData,
        setChatData,
        groupData,
        setGroupData
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};