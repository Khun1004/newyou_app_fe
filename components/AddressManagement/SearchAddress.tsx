import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';

// Daum 우편번호 검색 결과 데이터 타입
interface DaumAddressData {
    zonecode: string;
    address: string;
    addressType: string;
    buildingName: string;
}

const SearchAddress = () => {
    const router = useRouter();
    // AddAddress에서 추가적인 상태를 전달받을 수 있으나, 현재 로직에서는 불필요하여 제거
    const { addressId } = useLocalSearchParams<{ addressId?: string }>();
    const insets = useSafeAreaInsets();

    // Daum 우편번호 검색 HTML
    const daumPostcodeHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>주소 검색</title>
            <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                }
            </style>
        </head>
        <body>
            <script>
                window.onload = function() {
                    new daum.Postcode({
                        oncomplete: function(data) {
                            // 결과를 ReactNativeWebView로 전달
                            window.ReactNativeWebView.postMessage(JSON.stringify(data));
                        },
                        width: '100%',
                        height: '100%'
                    }).embed(document.body);
                };
            </script>
        </body>
        </html>
    `;

    return (
        <View style={styles.container}>
            {/* 공통 헤더 */}
            <AppHeader title="주소 검색" />

            <WebView
                source={{ html: daumPostcodeHTML }}
                onMessage={(event) => {
                    if (event.nativeEvent.data) {
                        try {
                            const data: DaumAddressData = JSON.parse(event.nativeEvent.data);

                            // 주소 포맷팅
                            const fullAddress = data.buildingName && data.addressType === 'R' // 도로명 주소일 경우 건물명 추가
                                ? `${data.address} (${data.buildingName})`
                                : data.address;

                            // 💡 핵심: 현재 화면(SearchAddress)을 스택에서 제거하고 AddAddress로 대체 (복귀)
                            // 이로써 AddAddress -> SearchAddress -> AddAddress (주소 반영) 로직이 완성됨
                            router.replace({
                                pathname: '/AddAddress',
                                params: {
                                    zonecode: data.zonecode,
                                    fullAddress: fullAddress,
                                    // 수정 모드였다면 addressId도 함께 전달하여 AddAddress에서 상태를 유지하도록 함
                                    ...(addressId && { addressId: addressId }),
                                }
                            });

                        } catch (e) {
                            console.error('Failed to process Daum Postcode data:', e);
                        }
                    }
                }}
                style={styles.webView}
                injectedJavaScriptBeforeContentLoaded={Platform.OS === 'ios' ? 'true;' : undefined}
            />
        </View>
    );
};

// --- 스타일 시트 (이전과 동일) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webView: {
        flex: 1,
    }
});

export default SearchAddress;