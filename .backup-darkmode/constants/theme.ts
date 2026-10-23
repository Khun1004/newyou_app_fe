/**
 * New You 앱 색깔 모음
 *
 * 앱 전체의 포인트 색은 여기 한 곳에서 정해요.
 * 이 파일의 값만 바꾸면 버튼, 헤더, 탭 바 등의 색이 함께 바뀌어요.
 *
 * 기본 색은 New You 로고에서 가져왔어요.
 *   초록 #3B5A24 (새싹, 성장)  ·  노랑 #F2B705 (햇살, 새로운 시작)
 */
export const THEME = {
    // 포인트 색 (버튼, 선택된 탭, 오늘 날짜 등)
    primary: '#4E7D32',
    primaryDark: '#3B5A24', // 로고 초록
    primarySoft: '#E8F2DE', // 연한 초록 (선택된 칩 배경 등)
    primaryTint: 'rgba(78, 125, 50, 0.06)', // 아주 연한 초록 (오늘 칸 배경 등)

    // 보조 색 (강조, D-day 등)
    accent: '#F2B705', // 로고 노랑
    accentSoft: '#FFF4CC',

    // 배경과 글자
    background: '#FBFAF4', // 따뜻한 아이보리
    card: '#FFFFFF',
    text: '#2E3326',
    subText: '#7C8070',
    line: '#E6E8DA',
    icon: '#A7AB98',
    placeholder: '#B9BCAA',

    // 그라데이션
    headerGradient: ['#FFF6D6', '#E8F2DE'] as [string, string], // 연한 노랑 → 연한 초록
    buttonGradient: ['#7BA84E', '#3B5A24'] as [string, string], // 초록 버튼
};
