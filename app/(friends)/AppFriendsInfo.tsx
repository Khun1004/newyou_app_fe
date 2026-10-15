import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

// 예전 '친구 정보' 화면은 없애고, 친구를 누르면 바로 '우리 공간'으로 가요.
// (이 주소로 오는 곳이 여러 군데라서 주소는 남겨 두고 바로 넘겨줘요)
export default function AppFriendsInfoRedirect() {
    const { friendId } = useLocalSearchParams<{ friendId?: string }>();
    return <Redirect href={{ pathname: '/FriendSpace', params: { friendId: friendId ?? '' } }} />;
}
