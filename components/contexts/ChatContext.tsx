import React, { createContext, useState, ReactNode } from 'react';

// Define TypeScript interfaces for your data
export interface Chat {
    id: string;
    name: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    avatar: string;
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

// Initial dummy data with types
const initialChatData: Chat[] = [
    {
        id: '1',
        name: '김민준',
        lastMessage: '네, 좋아요! 다음에 같이 봐요.',
        timestamp: '오전 11:30',
        unreadCount: 2,
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
        id: '2',
        name: '이서윤',
        lastMessage: '운동은 잘하고 계세요?',
        timestamp: '어제',
        unreadCount: 0,
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    {
        id: '3',
        name: '박지훈',
        lastMessage: '이번 주말에 시간 되세요?',
        timestamp: '2일 전',
        unreadCount: 1,
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    {
        id: '4',
        name: '최은지',
        lastMessage: '알겠습니다. 확인하고 다시 연락드릴게요!',
        timestamp: '3일 전',
        unreadCount: 0,
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    },
    {
        id: '5',
        name: '정현우',
        lastMessage: '혹시 그 자료 보내주셨나요?',
        timestamp: '지난주',
        unreadCount: 5,
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    },
    {
        id: '6',
        name: '로제',
        lastMessage: '안녕하세요',
        unreadCount: 1,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
        timestamp: '오후 2:30'
    },
];

const initialGroupData: Group[] = [
    {
        id: 'g1',
        name: '스터디 그룹',
        lastMessage: '이번 주 스터디 공지',
        unreadCount: 5,
        avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
        memberCount: 8,
        timestamp: '오후 3:20',
        members: []
    },
    {
        id: 'g2',
        name: '회사 동료',
        lastMessage: '점심 메뉴 결정!',
        unreadCount: 0,
        avatar: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80',
        memberCount: 12,
        timestamp: '오후 12:15',
        members: []
    },
];

// Create the context with an initial undefined value
// The `as` keyword is used here because the value will be provided by the provider later
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Define the props for the provider component
interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
    // Use useState to manage the chat and group data
    const [chatData, setChatData] = useState<Chat[]>(initialChatData);
    const [groupData, setGroupData] = useState<Group[]>(initialGroupData);

    // Create the value object to be passed to the context provider
    const value = {
        chatData,
        setChatData,
        groupData,
        setGroupData
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};