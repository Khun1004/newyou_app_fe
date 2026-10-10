import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// Context에서 사용할 ID 타입 정의
type ClassId = string | number;

interface VideoData {
    id: string;
    videoTitle: string;
    classTitle: string;
    duration: string;
    level: string;
    type: 'free' | 'mvp';
    price?: number;
    uri?: string;
    fileName?: string;
}

interface PaymentInfo {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    fees?: Fees;
}

interface ClassData {
    id?: ClassId; // ID 타입을 ClassId로 변경
    title: string;
    instructor: string;
    description: string;
    introduction: string;
    createdBy?: string;
    profileImage?: string;
    phoneNumber?: string;
    certificationImage?: string;
    paymentStatus?: string;
    paymentDetails?: {
        method: string;
        amount: number;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    // 좋아요 상태를 Context의 likedClassIds로 관리할 것이므로, ClassData에는 추가하지 않습니다.
}

interface Fees {
    uploadFee: number;
    additionalVideoFee: number;
    total: number;
}

interface OnlineClassContextType {
    classes: ClassData[];
    currentClassData: ClassData | null;
    videos: VideoData[];
    paymentInfo: PaymentInfo | null;
    isPaymentComplete: boolean;
    fees: Fees;
    // ❤️ [추가] 좋아요 상태 및 토글 함수
    likedClassIds: ClassId[];
    toggleLike: (classId: ClassId) => void;
    // ---
    setClassData: (data: ClassData) => void;
    setCurrentClassData: (data: ClassData | null) => void;
    setVideos: (videos: VideoData[]) => void;
    addVideo: (video: VideoData) => void;
    updateVideo: (id: string, field: keyof VideoData, value: any) => void;
    removeVideo: (id: string) => void;
    setPaymentInfo: (info: PaymentInfo) => void;
    calculateFees: () => Fees;
    setFees: (fees: Fees) => void;
    addClass: (classData: ClassData) => void;
    deleteClass: (classId: string) => void;
    resetContext: () => void;
    setPaymentComplete: (isComplete: boolean) => void;
}

const OnlineClassContext = createContext<OnlineClassContextType | undefined>(undefined);

export const OnlineClassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [currentClassData, setCurrentClassData] = useState<ClassData | null>(null);
    const [videos, setVideos] = useState<VideoData[]>([]);
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [fees, setFees] = useState<Fees>({ uploadFee: 0, additionalVideoFee: 0, total: 0 });
    const [isPaymentComplete, setPaymentComplete] = useState(false);

    // ❤️ [추가] 좋아요 상태 저장 (클래스 ID 배열)
    const [likedClassIds, setLikedClassIds] = useState<ClassId[]>([]);

    // ❤️ [추가] 좋아요 상태 토글 함수
    const toggleLike = useCallback((classId: ClassId) => {
        setLikedClassIds(prevIds => {
            if (prevIds.includes(classId)) {
                // 이미 좋아요 상태면 제거
                return prevIds.filter(id => id !== classId);
            } else {
                // 좋아요 상태가 아니면 추가
                return [...prevIds, classId];
            }
        });
    }, []);
    // ---

    const setClassData = useCallback((data: ClassData) => {
        // ID가 없으면 Date.now()를 사용하여 고유 ID 생성
        const classWithId = { ...data, id: data.id || Date.now().toString() };
        setClasses((prevClasses) => [...prevClasses, classWithId]);
        setCurrentClassData(classWithId);
    }, []);

    const addVideo = useCallback((video: VideoData) => {
        setVideos((prevVideos) => [...prevVideos, video]);
    }, []);

    const addClass = useCallback((classData: ClassData) => {
        setClasses((prevClasses) => [...prevClasses, classData]);
    }, []);

    const deleteClass = useCallback((classId: string) => {
        setClasses((prevClasses) => prevClasses.filter(cls => cls.id !== classId));
        if (currentClassData?.id === classId) {
            setCurrentClassData(null);
        }
    }, [currentClassData]);

    const updateVideo = useCallback((id: string, field: keyof VideoData, value: any) => {
        setVideos((prevVideos) =>
            prevVideos.map((video) => (video.id === id ? { ...video, [field]: value } : video))
        );
    }, []);

    const removeVideo = useCallback((id: string) => {
        setVideos((prevVideos) => prevVideos.filter((video) => video.id !== id));
    }, []);

    const calculateFees = useCallback((): Fees => {
        const baseUploadFee = 10000;
        const videoCount = videos.length;
        const additionalVideoFee = Math.max(0, videoCount - 1) * 5000;
        const totalFee = baseUploadFee + additionalVideoFee;

        return {
            uploadFee: baseUploadFee,
            additionalVideoFee,
            total: totalFee,
        };
    }, [videos.length]);

    const resetContext = useCallback(() => {
        setClasses([]);
        setCurrentClassData(null);
        setVideos([]);
        setPaymentInfo(null);
        setFees({ uploadFee: 0, additionalVideoFee: 0, total: 0 });
        setPaymentComplete(false);
        setLikedClassIds([]); // ❤️ [추가] 좋아요 상태 초기화
    }, []);

    const contextValue = useMemo(
        () => ({
            classes,
            currentClassData,
            videos,
            paymentInfo,
            isPaymentComplete,
            fees,
            likedClassIds, // ❤️ [추가]
            toggleLike,     // ❤️ [추가]
            setClassData,
            setCurrentClassData,
            setVideos,
            addVideo,
            updateVideo,
            removeVideo,
            setPaymentInfo,
            calculateFees,
            setFees,
            addClass,
            deleteClass,
            resetContext,
            setPaymentComplete,
        }),
        [
            classes,
            currentClassData,
            videos,
            paymentInfo,
            isPaymentComplete,
            fees,
            likedClassIds, // ❤️ [추가]
            toggleLike,     // ❤️ [추가]
            setClassData,
            setCurrentClassData,
            setVideos,
            addVideo,
            updateVideo,
            removeVideo,
            setPaymentInfo,
            calculateFees,
            setFees,
            addClass,
            deleteClass,
            resetContext,
            setPaymentComplete,
        ]
    );

    return (
        <OnlineClassContext.Provider value={contextValue}>
            {children}
        </OnlineClassContext.Provider>
    );
};

export const useOnlineClass = () => {
    const context = useContext(OnlineClassContext);
    if (context === undefined) {
        throw new Error('useOnlineClass must be used within an OnlineClassProvider');
    }
    return context;
};