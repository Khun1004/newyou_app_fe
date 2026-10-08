import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RequireLogin } from '@/components/RequireLogin';

/**
 * app 폴더의 화면 파일을 짧게 만들어 주는 도우미.
 *
 * 화면 컴포넌트를 흰 배경의 전체 화면으로 감싸고,
 * requireLogin을 주면 로그인하지 않은 사용자에게 로그인 안내 화면을 보여줍니다.
 *
 * 사용 예)
 *   export default screen(Birthday);                               // 누구나 볼 수 있는 화면
 *   export default screen(Note, { requireLogin: '노트' });         // 로그인이 필요한 화면
 */
export function screen(
    Component: React.ComponentType<any>,
    options: { requireLogin?: string } = {}
) {
    function Screen() {
        const content = <Component />;
        return (
            <View style={styles.container}>
                {options.requireLogin ? (
                    <RequireLogin feature={options.requireLogin}>{content}</RequireLogin>
                ) : (
                    content
                )}
            </View>
        );
    }
    Screen.displayName = `Screen(${Component.displayName || Component.name || 'Component'})`;
    return Screen;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
