import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import api from '@/components/utils/api';
import { useAuth } from '@/components/contexts/AuthProvider';

/**
 * 온라인 수업 저장소
 * - 수업과 영상은 서버(/api/classes)에 저장돼요.
 * - 목록은 로그인 없이도 볼 수 있고, 만들기·수정·삭제는 로그인이 필요해요.
 * - videos 는 '지금 만들고 있는(또는 내) 수업'의 영상 목록이에요.
 */

// Context에서 사용할 ID 타입 정의
type ClassId = string | number;

export interface VideoData {
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
    setClassData: (data: ClassData) => Promise<ClassData>;
    setCurrentClassData: (data: ClassData | null) => void;
    setVideos: (videos: VideoData[]) => void;
    addVideo: (video: VideoData) => void;
    updateVideo: (id: string, field: keyof VideoData, value: any) => void;
    removeVideo: (id: string) => void;
    setPaymentInfo: (info: PaymentInfo) => void;
    calculateFees: () => Fees;
    setFees: (fees: Fees) => void;
    addClass: (classData: ClassData) => Promise<ClassData>;
    deleteClass: (classId: string) => Promise<void>;
    reloadClasses: () => Promise<void>;
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

    // 서버에 저장된 수업인지 (서버 id 는 숫자예요)
    const isServerId = (id?: ClassId) => id !== undefined && /^\d+$/.test(String(id)) && String(id).length < 13;

    const normalize = (raw: any): ClassData & { videos?: VideoData[] } => ({
        id: String(raw.id),
        title: raw.title ?? '',
        instructor: raw.instructor ?? '',
        createdBy: raw.createdBy ?? raw.instructor,
        phoneNumber: raw.phoneNumber,
        profileImage: raw.profileImage ?? undefined,
        introduction: raw.introduction ?? '',
        description: raw.description ?? '',
        certificationImage: raw.certificationImage ?? undefined,
        videos: (raw.videos ?? []).map((v: any) => ({
            id: String(v.id),
            videoTitle: v.videoTitle ?? '',
            classTitle: v.classTitle ?? raw.title ?? '',
            duration: v.duration ?? '',
            level: v.level ?? '',
            type: v.type === 'mvp' ? 'mvp' : 'free',
            price: v.price ?? undefined,
            uri: v.uri ?? undefined,
        })),
    });

    // 1. 서버에서 수업 목록 불러오기 (켤 때, 로그인/로그아웃할 때)
    const reloadClasses = useCallback(async () => {
        try {
            const res = await api.get('/classes');
            const list = (res.data as any[]).map(normalize);
            setClasses(list);
            // 내 수업의 영상들을 videos 에 넣어 둬요 (내 클래스 화면에서 보여줘요)
            const mine = list.find((c) => c.phoneNumber && c.phoneNumber === currentUser?.phoneNumber);
            setVideos(mine?.videos ?? []);
        } catch (e) {
            console.warn('온라인 수업을 불러오지 못했어요:', e);
        }
    }, [currentUser?.phoneNumber]);

    useEffect(() => {
        reloadClasses();
    }, [isAuthenticated, reloadClasses]);

    // 서버에 저장 (새 수업이면 POST, 이미 있는 내 수업이면 PATCH)
    const saveToServer = useCallback(async (data: ClassData, withVideos?: VideoData[]) => {
        const body: any = {
            title: data.title,
            introduction: data.introduction,
            description: data.description,
            certificationImage: data.certificationImage,
        };
        if (withVideos) {
            body.videos = withVideos.map((v) => ({
                videoTitle: v.videoTitle, duration: v.duration, level: v.level,
                type: v.type, price: v.price, uri: v.uri,
            }));
        }
        const res = isServerId(data.id)
            ? await api.patch(`/classes/${data.id}`, body)
            : await api.post('/classes', body);
        const saved = normalize(res.data);
        setClasses((cur) => [saved, ...cur.filter((c) => String(c.id) !== saved.id)]);
        if (withVideos) setVideos(saved.videos ?? []);
        return saved;
    }, []);

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

    // 수업 만들기/수정 화면에서 저장 → 서버에 바로 저장해요
    const setClassData = useCallback(async (data: ClassData) => {
        const saved = await saveToServer(data);
        setCurrentClassData(saved);
        return saved;
    }, [saveToServer]);

    const addVideo = useCallback((video: VideoData) => {
        setVideos((prevVideos) => [...prevVideos, video]);
    }, []);

    // 결제까지 끝났을 때 → 영상 목록까지 같이 서버에 저장해요
    const addClass = useCallback(async (classData: ClassData) => {
        return saveToServer(classData, videos);
    }, [saveToServer, videos]);

    const deleteClass = useCallback(async (classId: string) => {
        if (isServerId(classId)) await api.delete(`/classes/${classId}`);
        setClasses((prevClasses) => prevClasses.filter(cls => String(cls.id) !== String(classId)));
        if (String(currentClassData?.id) === String(classId)) {
            setCurrentClassData(null);
            setVideos([]);
        }
    }, [currentClassData]);

    const updateVideo = useCallback((id: string, field: keyof VideoData, value: any) => {
        setVideos((prevVideos) =>
            prevVideos.map((video) => (video.id === id ? { ...video, [field]: value } : video))
        );
    }, []);

    // 영상 삭제 → 그 영상이 서버의 내 수업에 있으면 서버에서도 지워요
    const removeVideo = useCallback((id: string) => {
        const next = videos.filter((video) => video.id !== id);
        setVideos(next);
        const owner = classes.find((c: any) => (c.videos ?? []).some((v: VideoData) => v.id === id));
        if (owner && isServerId(owner.id)) {
            saveToServer(owner, next).catch((e) => console.warn('영상 삭제 저장 실패:', e));
        }
    }, [videos, classes, saveToServer]);

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
            reloadClasses,
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
            reloadClasses,
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