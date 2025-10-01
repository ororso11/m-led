// Firebase 설정값 (Firebase Console에서 복사한 실제 값으로 교체)
const firebaseConfig = {
    apiKey: "AIzaSyD8VMGmpxgZlzseyFQvoVRhYNcOnt5UvHc",
    authDomain: "catalog-led.firebaseapp.com",
    projectId: "catalog-led",
    storageBucket: "catalog-led.firebasestorage.app",
    databaseURL: "https://catalog-led-default-rtdb.firebaseio.com",
    messagingSenderId: "318647402713",
    appId: "1:318647402713:web:517a01d812cee038897ec8"
};

// Firebase 초기화
try {
    // 이미 초기화되었는지 확인
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase 초기화 성공');
    } else {
        firebase.app(); // 이미 초기화된 앱 사용
        console.log('✅ Firebase 이미 초기화됨');
    }
} catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
}

// Firebase 서비스 인스턴스
const database = firebase.database();
const storage = firebase.storage ? firebase.storage() : null;

// 디버그 모드 (개발 시 true, 프로덕션 시 false)
const DEBUG_MODE = true;

if (DEBUG_MODE) {
    console.log('Firebase Config Loaded:', {
        projectId: firebaseConfig.projectId,
        databaseURL: firebaseConfig.databaseURL
    });
}