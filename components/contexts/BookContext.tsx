import React, { createContext, useState, ReactNode, useContext } from 'react';

// Book 인터페이스 정의
interface Book {
    id: string;
    title: string;
    author: string;
    coverImage: string;
    description: string;
    pages: number;
    genre: string;
    rating: number;
    publishedYear: number;
}

// 컨텍스트에서 제공할 데이터의 타입 정의
interface BookContextType {
    currentBook: Book | null;
    setCurrentBook: (book: Book) => void;
    readingProgress: number;
    setReadingProgress: (progress: number) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
}

// BookContext 생성
export const BookContext = createContext<BookContextType | undefined>(undefined);

// Provider 컴포넌트 생성
interface BookProviderProps {
    children: ReactNode;
}

export const BookProvider: React.FC<BookProviderProps> = ({ children }) => {
    const [currentBook, setCurrentBook] = useState<Book | null>(null);
    const [readingProgress, setReadingProgress] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const value = {
        currentBook,
        setCurrentBook,
        readingProgress,
        setReadingProgress,
        currentPage,
        setCurrentPage,
    };

    return (
        <BookContext.Provider value={value}>
            {children}
        </BookContext.Provider>
    );
};

// 컨텍스트를 사용하기 위한 커스텀 훅
export const useBookContext = () => {
    const context = useContext(BookContext);
    if (context === undefined) {
        throw new Error('useBookContext must be used within a BookProvider');
    }
    return context;
};