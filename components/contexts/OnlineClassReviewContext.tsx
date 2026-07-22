import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnlineClassReviewContext = createContext(null);

export const useOnlineClassReviews = () => {
    const context = useContext(OnlineClassReviewContext);
    if (!context) {
        throw new Error('useOnlineClassReviews must be used within an OnlineClassReviewProvider');
    }
    return context;
};

export const OnlineClassReviewProvider = ({ children }) => {
    const [reviews, setReviews] = useState({});

    // AsyncStorage에서 리뷰를 불러오는 함수
    const fetchReviews = useCallback(async (classId) => {
        try {
            const storedReviews = await AsyncStorage.getItem(`reviews_${classId}`);
            if (storedReviews) {
                setReviews(prev => ({
                    ...prev,
                    [classId]: JSON.parse(storedReviews),
                }));
            } else {
                setReviews(prev => ({
                    ...prev,
                    [classId]: [],
                }));
            }
        } catch (e) {
            console.error('Failed to fetch reviews:', e);
        }
    }, []);

    // 새 리뷰를 추가하고 AsyncStorage에 저장하는 함수
    const addReview = useCallback(async (classId, newReview) => {
        try {
            const storedReviews = await AsyncStorage.getItem(`reviews_${classId}`);
            let currentReviews = storedReviews ? JSON.parse(storedReviews) : [];
            currentReviews.push(newReview);
            await AsyncStorage.setItem(`reviews_${classId}`, JSON.stringify(currentReviews));
            setReviews(prev => ({
                ...prev,
                [classId]: currentReviews,
            }));
        } catch (e) {
            console.error('Failed to add review:', e);
        }
    }, []);

    const value = {
        reviews,
        fetchReviews,
        addReview,
    };

    return (
        <OnlineClassReviewContext.Provider value={value}>
            {children}
        </OnlineClassReviewContext.Provider>
    );
};