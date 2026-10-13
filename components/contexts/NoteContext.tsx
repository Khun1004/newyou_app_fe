import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTES_URL } from '@/config';
import { Alert } from 'react-native';
import { useAuth } from '@/components/contexts/AuthProvider';

// 서버에서 받은 Note 객체 타입
interface Note {
    id: number;
    title: string;
    content: string;
    category?: string;
    design?: string; // 디자인 필드
    locked?: boolean;   // 🔒 잠긴 메모
    unlocked?: boolean; // 이번에 PIN으로 열어서 내용이 들어 있는지
    createdAt: string;
    updatedAt: string;
}

type Result = { ok: boolean; message?: string };

interface NoteContextType {
    notes: Note[];
    loadNotes: () => Promise<void>;
    addNote: (title: string, content: string, category: string, design: string) => Promise<void>;
    deleteNote: (id: number) => Promise<void>;
    updateNote: (id: number, newTitle: string, newContent: string, newCategory: string, newDesign: string) => Promise<void>;

    // 🔒 메모 잠금
    hasPin: boolean | null;                       // 메모 PIN을 만들었는지 (모르면 null)
    refreshPinStatus: () => Promise<boolean | null>;
    createPin: (pin: string) => Promise<Result>;
    resetPin: (password: string, pin: string) => Promise<Result>;
    unlockNote: (id: number, pin: string) => Promise<Result>; // PIN 확인 → 내용 받아오기
    setNoteLocked: (id: number, locked: boolean, pin?: string) => Promise<Result>;
    relockAll: () => void;                        // 열어 둔 잠긴 메모를 다시 잠가요
}

export const NoteContext = createContext<NoteContextType | undefined>(undefined);

interface NoteProviderProps {
    children: ReactNode;
}

const getAuthToken = async (): Promise<string | null> => {
    return AsyncStorage.getItem('userToken');
};

export const NoteProvider: React.FC<NoteProviderProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [hasPin, setHasPin] = useState<boolean | null>(null);

    // 로그인/로그아웃할 때마다 다시 불러오고, 로그아웃 상태면 비웁니다.
    useEffect(() => {
        if (isAuthenticated) {
            loadNotes();
            refreshPinStatus();
        } else {
            setNotes([]);
            setHasPin(null);
        }
    }, [isAuthenticated]);

    // 1. 노트 목록 로드 (READ)
    const loadNotes = async () => {
        const token = await getAuthToken();
        if (!token) {
            console.log("노트: 로그인 전이라 불러오지 않아요.");
            return;
        }

        try {
            const response = await fetch(NOTES_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data: Note[] = await response.json();
                // design 필드가 없는 노트는 기본 디자인 적용
                const notesWithDesign = data.map(note => ({
                    ...note,
                    design: note.design || 'ribbon_pink'
                }));
                setNotes(notesWithDesign);
                console.log("노트 목록 로드 성공:", notesWithDesign.length);
                console.log("첫 번째 노트 디자인:", notesWithDesign[0]?.design);
            } else if (response.status === 401) {
                console.error("인증 실패: 유효하지 않은 토큰");
                Alert.alert("오류", "로그인 세션이 만료되었습니다.");
            } else {
                console.error("노트 로드 실패:", response.status);
                Alert.alert("오류", "노트 목록을 불러오는 데 실패했습니다.");
            }
        } catch (e) {
            console.error('노트 로드 중 네트워크 오류:', e);
            Alert.alert("오류", "서버와 통신할 수 없습니다. IP 설정을 확인하세요.");
        }
    };

    // 2. 새 노트 추가 (CREATE)
    const addNote = async (title: string, content: string, category: string, design: string) => {
        const token = await getAuthToken();
        if (!token) return;

        console.log('노트 추가 요청:', { title, content, category, design });

        try {
            const response = await fetch(NOTES_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content, category, design }),
            });

            if (response.ok) {
                const newNote: Note = await response.json();
                console.log("서버 응답 노트:", newNote);
                console.log("저장된 디자인:", newNote.design);

                // design 필드가 없으면 요청한 design 사용
                const noteWithDesign = {
                    ...newNote,
                    design: newNote.design || design
                };

                await loadNotes(); // 전체 목록 다시 로드
                console.log("노트 추가 성공:", noteWithDesign.id);
            } else {
                console.error("노트 추가 실패:", response.status);
                const errorBody = await response.text();
                console.error("에러 상세:", errorBody);
                Alert.alert('오류', `노트 추가 실패: ${errorBody}`);
            }
        } catch (e) {
            console.error('노트 추가 중 네트워크 오류:', e);
            Alert.alert('오류', "노트 추가 중 서버 오류 발생.");
        }
    };

    // 3. 노트 수정 (UPDATE)
    const updateNote = async (id: number, newTitle: string, newContent: string, newCategory: string, newDesign: string) => {
        const token = await getAuthToken();
        if (!token) return;

        console.log('노트 수정 요청:', { id, newTitle, newContent, newCategory, newDesign });

        try {
            const response = await fetch(`${NOTES_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: newTitle, content: newContent, category: newCategory, design: newDesign }),
            });

            if (response.ok) {
                const updatedNote: Note = await response.json();
                console.log("수정된 노트:", updatedNote);
                console.log("수정된 디자인:", updatedNote.design);

                await loadNotes();
                console.log("노트 수정 성공:", id);
            } else if (response.status === 404) {
                Alert.alert('오류', '노트를 찾을 수 없거나 수정 권한이 없습니다.');
            } else {
                console.error("노트 수정 실패:", response.status);
                const errorBody = await response.text();
                console.error("에러 상세:", errorBody);
                Alert.alert('오류', "노트 수정에 실패했습니다.");
            }
        } catch (e) {
            console.error('노트 수정 중 네트워크 오류:', e);
            Alert.alert('오류', "노트 수정 중 서버 오류 발생.");
        }
    };

    // 4. 노트 삭제 (DELETE)
    const deleteNote = async (id: number) => {
        const token = await getAuthToken();
        if (!token) return;

        try {
            const response = await fetch(`${NOTES_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 204) {
                setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
                console.log("노트 삭제 성공:", id);
            } else if (response.status === 404) {
                Alert.alert('오류', '노트를 찾을 수 없거나 삭제 권한이 없습니다.');
            } else {
                console.error("노트 삭제 실패:", response.status);
                Alert.alert('오류', "노트 삭제에 실패했습니다.");
            }
        } catch (e) {
            console.error('노트 삭제 중 네트워크 오류:', e);
            Alert.alert('오류', "노트 삭제 중 서버 오류 발생.");
        }
    };

    // =======================================================================
    // 🔒 메모 잠금
    // =======================================================================
    const call = async (path: string, method: string, body?: any) => {
        const token = await getAuthToken();
        if (!token) return { ok: false, status: 401, data: { message: '로그인이 필요해요.' } as any };
        try {
            const response = await fetch(`${NOTES_URL}${path}`, {
                method,
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            });
            const text = await response.text();
            let data: any = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = { message: text };
            }
            return { ok: response.ok, status: response.status, data };
        } catch (e) {
            return { ok: false, status: 0, data: { message: '서버에 연결할 수 없어요.' } };
        }
    };

    const refreshPinStatus = async () => {
        const res = await call('/pin', 'GET');
        if (res.ok) {
            setHasPin(!!res.data?.hasPin);
            return !!res.data?.hasPin;
        }
        return null;
    };

    const createPin = async (pin: string): Promise<Result> => {
        const res = await call('/pin', 'POST', { pin });
        if (res.ok) setHasPin(true);
        return { ok: res.ok, message: res.data?.message };
    };

    const resetPin = async (password: string, pin: string): Promise<Result> => {
        const res = await call('/pin/reset', 'POST', { password, pin });
        if (res.ok) setHasPin(true);
        return { ok: res.ok, message: res.data?.message };
    };

    const unlockNote = async (id: number, pin: string): Promise<Result> => {
        const res = await call(`/${id}/unlock`, 'POST', { pin });
        if (res.ok && res.data) {
            setNotes((prev) =>
                prev.map((n) => (n.id === id ? { ...n, content: res.data.content, unlocked: true } : n))
            );
        }
        return { ok: res.ok, message: res.data?.message };
    };

    const setNoteLocked = async (id: number, locked: boolean, pin?: string): Promise<Result> => {
        const res = await call(`/${id}/lock`, 'PUT', { locked, pin });
        if (res.ok) {
            setNotes((prev) =>
                prev.map((n) =>
                    n.id === id
                        ? locked
                            ? { ...n, locked: true, unlocked: false, content: '' } // 잠그면 바로 내용 숨기기
                            : { ...n, locked: false, unlocked: false, content: res.data?.content ?? n.content }
                        : n
                )
            );
        }
        return { ok: res.ok, message: res.data?.message };
    };

    const relockAll = useCallback(() => {
        setNotes((prev) =>
            prev.some((n) => n.locked && n.unlocked)
                ? prev.map((n) => (n.locked && n.unlocked ? { ...n, unlocked: false, content: '' } : n))
                : prev
        );
    }, []);

    const contextValue: NoteContextType = {
        notes,
        loadNotes,
        addNote,
        deleteNote,
        updateNote,
        hasPin,
        refreshPinStatus,
        createPin,
        resetPin,
        unlockNote,
        setNoteLocked,
        relockAll,
    };

    return (
        <NoteContext.Provider value={contextValue}>
            {children}
        </NoteContext.Provider>
    );
};