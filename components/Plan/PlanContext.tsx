// src/components/Plan/PlanContext.tsx

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/config';

const PLAN_URL: string = `${BASE_URL}/plans`;

// Plan 인터페이스 - planDate 필드를 추가합니다.
export interface Plan {
    id: string; // 서버의 Long ID를 클라이언트에서 string으로 처리
    title: string;
    content: string;
    date: string; // 서버의 createdAt을 ISO 8601 문자열로 받음
    planDate: string; // ⭐⭐ MakePlan에서 지정한 YYYY-MM-DD 형식의 날짜 (핵심) ⭐⭐
    color: string;
}

// Context 타입 정의
interface PlanContextType {
    plans: Plan[];
    isLoading: boolean;
    loadPlans: () => Promise<void>;
    addPlan: (newPlan: { title: string, content: string, color: string, planDate: string }) => Promise<void>;
    updatePlan: (id: string, updatedPlan: { title?: string, content?: string, color?: string, planDate?: string }) => Promise<void>;
    deletePlan: (id: string) => Promise<void>;
}

// Context 생성
const PlanContext = createContext<PlanContextType | undefined>(undefined);

// JWT 토큰을 가져오는 가상의 함수
const getAuthToken = async (): Promise<string | null> => {
    return AsyncStorage.getItem('userToken');
};

// PlanProvider 컴포넌트
export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 1. 계획 불러오기 (Read: GET /api/plans)
    const loadPlans = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                setPlans([]);
                return;
            }

            const response = await fetch(PLAN_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPlans(data.map((item: any) => ({
                    id: String(item.id),
                    title: item.title,
                    content: item.content,
                    date: item.date, // 서버의 createdAt
                    // ⭐⭐ 서버에서 planDate를 받아오거나, 없으면 date의 날짜 부분만 사용 ⭐⭐
                    planDate: item.planDate || item.date.split('T')[0],
                    color: item.color,
                })));
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            console.error("Error loading plans:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. 새로운 계획 추가 (Create: POST /api/plans)
    const addPlan = useCallback(async (newPlan: { title: string, content: string, color: string, planDate: string }) => {
        try {
            const token = await getAuthToken();
            if (!token) throw new Error("Authentication token not found.");

            const payload = {
                title: newPlan.title,
                content: newPlan.content,
                color: newPlan.color,
                planDate: newPlan.planDate, // ⭐⭐ planDate를 서버로 전송합니다. ⭐⭐
            };

            const response = await fetch(PLAN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const createdPlan = await response.json();
                const addedPlan: Plan = {
                    id: String(createdPlan.id),
                    title: createdPlan.title,
                    content: createdPlan.content,
                    date: createdPlan.date,
                    planDate: createdPlan.planDate || createdPlan.date.split('T')[0],
                    color: createdPlan.color,
                };
                setPlans((prevPlans) => [...prevPlans, addedPlan]);
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            console.error("Error adding plan:", error);
            throw error;
        }
    }, []);

    // 3. 계획 수정 (Update: PATCH /api/plans/{id})
    const updatePlan = useCallback(async (id: string, updatedPlan: { title?: string, content?: string, color?: string, planDate?: string }) => {
        try {
            const token = await getAuthToken();
            if (!token) throw new Error("Authentication token not found.");

            const planIdLong = parseInt(id, 10);
            const payload = updatedPlan;

            const response = await fetch(`${PLAN_URL}/${planIdLong}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const updatedPlanResponse = await response.json();

                setPlans((prevPlans) =>
                    prevPlans.map((plan) =>
                        plan.id === id ? {
                            ...plan,
                            title: updatedPlanResponse.title,
                            content: updatedPlanResponse.content,
                            color: updatedPlanResponse.color,
                            planDate: updatedPlanResponse.planDate || updatedPlanResponse.date.split('T')[0],
                        } : plan
                    )
                );
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            console.error("Error updating plan:", error);
            throw error;
        }
    }, []);

    // 4. 계획 삭제 (Delete: DELETE /api/plans/{id})
    const deletePlan = useCallback(async (id: string) => {
        try {
            const token = await getAuthToken();
            if (!token) throw new Error("Authentication token not found.");

            const planIdLong = parseInt(id, 10);

            const response = await fetch(`${PLAN_URL}/${planIdLong}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setPlans((prevPlans) => prevPlans.filter((plan) => plan.id !== id));
            } else {
                const errorText = await response.text();
                throw new Error(errorText);
            }
        } catch (error) {
            console.error("Error deleting plan:", error);
            throw error;
        }
    }, []);

    useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    return (
        <PlanContext.Provider value={{ plans, isLoading, loadPlans, addPlan, updatePlan, deletePlan }}>
            {children}
        </PlanContext.Provider>
    );
};

// Custom hook to use the plan context
export const usePlans = () => {
    const context = useContext(PlanContext);
    if (context === undefined) {
        throw new Error('usePlans must be used within a PlanProvider');
    }
    return context;
};