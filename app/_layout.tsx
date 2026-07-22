import React from 'react';
import { Stack, router } from 'expo-router';
import { AuthProvider, useAuth } from '@/components/contexts/AuthProvider';
import { PlanProvider } from '@/components/Plan/PlanContext';
import { AlarmProvider } from '@/components/contexts/AlarmContext';
import { FriendProvider } from '@/components/contexts/FriendContext';
import { Text, View } from 'react-native';
import { NoteProvider } from "@/components/contexts/NoteContext";
import {AnniversaryProvider} from "@/components/contexts/AnniversaryContext";
import {ChatProvider} from "@/components/contexts/ChatContext";
import { BoardProvider } from '@/components/contexts/BoardContext';
import { LikedItemsProvider } from '@/components/contexts/LikedItemsContext';
import {BookProvider} from "@/components/contexts/BookContext";
import { OnlineClassProvider } from '@/components/contexts/OnlineClassContext';
import { OnlineClassReviewProvider } from '@/components/contexts/OnlineClassReviewContext';
import {SentGiftsProvider} from "@/components/contexts/SentGiftsContext";
import { ReelProvider } from '@/components/contexts/ReelContext';
import { AddressProvider } from '@/components/contexts/AddressManageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {AppFriendsProvider} from "@/components/contexts/UseAppFriendsContext";

// 모든 Provider들을 감싸는 컴포넌트
const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthProvider>
            <AppFriendsProvider>
                <AddressProvider>
                    <ReelProvider>
                        <SentGiftsProvider>
                            <OnlineClassReviewProvider>
                                <OnlineClassProvider>
                                    <BookProvider>
                                        <LikedItemsProvider>
                                            <BoardProvider>
                                                <ChatProvider>
                                                    <AnniversaryProvider>
                                                        <NoteProvider>
                                                            <PlanProvider>
                                                                <AlarmProvider>
                                                                    <FriendProvider>
                                                                        {children}
                                                                    </FriendProvider>
                                                                </AlarmProvider>
                                                            </PlanProvider>
                                                        </NoteProvider>
                                                    </AnniversaryProvider>
                                                </ChatProvider>
                                            </BoardProvider>
                                        </LikedItemsProvider>
                                    </BookProvider>
                                </OnlineClassProvider>
                            </OnlineClassReviewProvider>
                        </SentGiftsProvider>
                    </ReelProvider>
                </AddressProvider>
            </AppFriendsProvider>
        </AuthProvider>
    );
};

// 인증 상태에 따라 라우팅을 관리하는 핵심 컴포넌트 (Auth Guard)
function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();

    // 로딩 중일 때만 로딩 화면 표시
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: '600' }}>앱을 불러오는 중...</Text>
            </View>
        );
    }

    return (
        // ✅ Stack 네비게이터의 기본 옵션으로 헤더를 숨김
        <Stack screenOptions={{ headerShown: false }}>
            {/* 404 Not Found 화면 */}
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />

            {/* ✅ 비인증 상태일 때만 접근 가능한 화면 그룹 (로그인, 회원가입) */}
            {!isAuthenticated && (
                <Stack.Group>
                    {/* 루트 경로 ('index') 접근 시 /login으로 강제 리다이렉트 */}
                    <Stack.Screen
                        name="index"
                        options={{ redirect: '/login' }}
                    />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="signup" />
                </Stack.Group>
            )}

            {/* ✅ 인증된 상태일 때만 접근 가능한 화면 그룹 (메인 앱 콘텐츠) */}
            {isAuthenticated && (
                <Stack.Group>
                    {/* 루트 경로 ('index') 접근 시 /(tabs)로 강제 리다이렉트 */}
                    <Stack.Screen
                        name="index"
                        options={{ redirect: '/(tabs)' }}
                    />

                    {/* 탭 그룹: (tabs) 폴더 내부에서 헤더 숨김이 재확인됨 */}
                    <Stack.Screen name="(tabs)" />

                    {/* 기타 인증된 화면들 (전역 옵션이 적용됨) */}
                    <Stack.Screen name="ProfileEdit" />
                    <Stack.Screen name="friends" />
                    <Stack.Screen name="friendTimetable" />

                    {/*Plan*/}
                    <Stack.Screen name="Plan" />
                    <Stack.Screen name="MakePlan" />

                    <Stack.Screen name="Alarm" />
                    <Stack.Screen name="AlarmList" />
                    <Stack.Screen name="Schedule" />

                    {/*Birthday*/}
                    <Stack.Screen name="Birthday" />
                    <Stack.Screen name="AddFriBirthday" />
                    <Stack.Screen name="FriendBirthdayDetail" />

                    {/*Note*/}
                    <Stack.Screen name="Note" />
                    <Stack.Screen name="AddNote" />
                    <Stack.Screen name="NoteDetail" />
                    <Stack.Screen name="Notification" />

                    {/*Anniversary*/}
                    <Stack.Screen name="AnniversaryEdit" />
                    <Stack.Screen name="AnniversaryList" />
                    <Stack.Screen name="AnniversaryEditBackground" />

                    {/*Chats*/}
                    <Stack.Screen name="ChatMain" />
                    <Stack.Screen name="ChattingRoom" />
                    <Stack.Screen name="ChattingRoomDetail" />

                    {/*Boards*/}
                    <Stack.Screen name="AgreementMakeBoard" />
                    <Stack.Screen name="MakeBoard" />
                    <Stack.Screen name="MyBoard" />

                    {/*Presents*/}
                    <Stack.Screen name="Present" />
                    <Stack.Screen name="PresentStorage" />
                    <Stack.Screen name="ProductDetail" />
                    <Stack.Screen name="ProductPurchase" />
                    <Stack.Screen name="GiftPurchase" />
                    <Stack.Screen name="PaymentFinish" />

                    {/*Like*/}
                    <Stack.Screen name="Like" />

                    {/*Books*/}
                    <Stack.Screen name="Books" />
                    <Stack.Screen name="BooksDetail" />
                    <Stack.Screen name="ReadBook" />

                    {/*OnlineClass*/}
                    <Stack.Screen name="OnlineClass" />
                    <Stack.Screen name="MakeOnlineClass" />
                    <Stack.Screen name="OnlineClassPersonDetail" />
                    <Stack.Screen name="OnlineClassMakeVideo" />
                    <Stack.Screen name="OnlineClassPayment" />
                    <Stack.Screen name="OnlineClassMyDetail" />

                    {/*Review*/}
                    <Stack.Screen name="OnlineClassWriteReview" />

                    {/*Payment*/}
                    <Stack.Screen name="PaymentHistory" />
                    <Stack.Screen name="PaymentDetail" />
                    <Stack.Screen name="PaymentSubmit" />

                    {/*Reel*/}
                    <Stack.Screen name="MainReel" />
                    <Stack.Screen name="Reels" />
                    <Stack.Screen name="YourReel" />
                    <Stack.Screen name="CreateReel" />

                    {/*MyClass*/}
                    <Stack.Screen name="MyClass" />

                    {/*AppFriendsSelect*/}
                    <Stack.Screen name="AppFriendsSelect" />
                    <Stack.Screen name="AppFriendsInfo" />


                    {/*AddressManagement*/}
                    <Stack.Screen name="AddressManagement" />
                    <Stack.Screen name="AddAddress" />
                    <Stack.Screen name="SearchAddress" />
                </Stack.Group>
            )}
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <Providers>
                <AppContent />
            </Providers>
        </SafeAreaProvider>
    );
}