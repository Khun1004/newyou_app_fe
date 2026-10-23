import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/components/contexts/AuthProvider';

// 저장 키 (앱을 껐다 켜도 내 수업이 남아 있게)
const CLASSES_KEY = 'onlineClasses';
const VIDEOS_KEY = 'onlineClassVideos';
const SEEDED_KEY = (phone: string) => `classSeeded_${phone}`;

// 로그인한 사용자가 처음 들어오면 넣어 주는 '내 수업' 예시
function makeMyClass(name: string, phone: string, profileImage: string | null) {
    return {
        id: `my-${phone}`,
        title: '왕초보 한국어 회화 첫걸음',
        instructor: name,
        createdBy: name,
        phoneNumber: phone,
        profileImage: profileImage || undefined,
        introduction: `안녕하세요, ${name}입니다! 외국인 친구들이 한국 생활에서 바로 쓸 수 있는 회화를 쉽고 재미있게 알려 드려요.`,
        description: '인사, 주문하기, 길 묻기처럼 매일 쓰는 표현을 짧은 영상으로 배우는 수업이에요. 영상마다 따라 말하기 연습이 있어요.',
    };
}

const MY_VIDEOS: VideoData[] = [
    { id: 'my-v1', videoTitle: '1강 · 처음 만났을 때 인사하기', classTitle: '왕초보 한국어 회화 첫걸음', duration: '8분', level: '초급', type: 'free' },
    { id: 'my-v2', videoTitle: '2강 · 카페에서 주문하기', classTitle: '왕초보 한국어 회화 첫걸음', duration: '10분', level: '초급', type: 'free' },
    { id: 'my-v3', videoTitle: '3강 · 길 묻고 대답하기 (MVP)', classTitle: '왕초보 한국어 회화 첫걸음', duration: '15분', level: '초급', type: 'mvp', price: 3000 },
];

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

export interface ClassData {
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

    const { isAuthenticated, currentUser } = useAuth();
    const loaded = useRef(false);

    // 1. 저장된 수업·영상 불러오기
    useEffect(() => {
        (async () => {
            try {
                const [c, v] = await Promise.all([AsyncStorage.getItem(CLASSES_KEY), AsyncStorage.getItem(VIDEOS_KEY)]);
                if (c) setClasses(JSON.parse(c));
                if (v) setVideos(JSON.parse(v));
            } catch (e) {
                console.log('온라인 수업 불러오기 실패:', e);
            } finally {
                loaded.current = true;
            }
        })();
    }, []);

    // 2. 로그인한 사용자가 처음이면 그 사람 이름으로 '내 수업' 넣기
    useEffect(() => {
        const phone = currentUser?.phoneNumber;
        const name = currentUser?.name;
        if (!isAuthenticated || !phone || !name) return;
        (async () => {
            try {
                for (let i = 0; i < 20 && !loaded.current; i++) {
                    await new Promise((r) => setTimeout(r, 50));
                }
                if (await AsyncStorage.getItem(SEEDED_KEY(phone))) return;
                await AsyncStorage.setItem(SEEDED_KEY(phone), '1');
                setClasses((cur) => [...cur.filter((c) => c.id !== `my-${phone}`), makeMyClass(name, phone, currentUser?.profileImage ?? null)]);
                setVideos((cur) => (cur.length ? cur : MY_VIDEOS));
            } catch (e) {
                console.log('예시 수업 넣기 실패:', e);
            }
        })();
    }, [isAuthenticated, currentUser?.phoneNumber, currentUser?.name]);

    // 3. 바뀔 때마다 저장
    useEffect(() => {
        if (!loaded.current) return;
        AsyncStorage.setItem(CLASSES_KEY, JSON.stringify(classes)).catch(() => {});
    }, [classes]);
    useEffect(() => {
        if (!loaded.current) return;
        AsyncStorage.setItem(VIDEOS_KEY, JSON.stringify(videos)).catch(() => {});
    }, [videos]);

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