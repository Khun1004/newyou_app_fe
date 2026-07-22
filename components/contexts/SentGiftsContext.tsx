import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SentGift {
    id: number;
    name: string;
    brand: string;
    price: string;
    image: string;
    recipient: string;
    date: string;
    status: string;
    message: string;
}

interface SentGiftsContextType {
    sentGifts: SentGift[];
    addSentGift: (gift: SentGift) => void;
}

const SentGiftsContext = createContext<SentGiftsContextType | undefined>(undefined);

export const SentGiftsProvider = ({ children }: { children: ReactNode }) => {
    const [sentGifts, setSentGifts] = useState<SentGift[]>([
        // 기존 샘플 데이터
        {
            id: 1,
            name: '샤넬 No.5',
            brand: 'CHANEL',
            price: '180,000원',
            image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            recipient: '김민지',
            date: '2024-12-15',
            status: '전달완료',
            message: '생일 축하해요! 🎉'
        },
        {
            id: 2,
            name: '나이키 운동화',
            brand: 'NIKE',
            price: '120,000원',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            recipient: '박서준',
            date: '2024-12-10',
            status: '배송중',
            message: '운동 열심히 하세요!'
        },
        {
            id: 3,
            name: '애플워치',
            brand: 'APPLE',
            price: '500,000원',
            image: 'https://images.unsplash.com/photo-1510017098667-27dfc7150acb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            recipient: '이지은',
            date: '2024-12-08',
            status: '전달완료',
            message: '승진 축하드려요! 🎊'
        }
    ]);

    const addSentGift = (gift: SentGift) => {
        setSentGifts(prevGifts => [gift, ...prevGifts]);
    };

    return (
        <SentGiftsContext.Provider value={{ sentGifts, addSentGift }}>
            {children}
        </SentGiftsContext.Provider>
    );
};

export const useSentGifts = () => {
    const context = useContext(SentGiftsContext);
    if (context === undefined) {
        throw new Error('useSentGifts must be used within a SentGiftsProvider');
    }
    return context;
};