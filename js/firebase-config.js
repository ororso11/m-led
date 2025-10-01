// Firebase 설정값
const firebaseConfig = {
    apiKey: "AIzaSyD8VMGmpxgZlzseyFQvoVRhYNcOnt5UvHc",
    authDomain: "catalog-led.firebaseapp.com",
    projectId: "catalog-led",
    storageBucket: "catalog-led.appspot.com", // ✅ 수정됨
    databaseURL: "https://catalog-led-default-rtdb.firebaseio.com",
    messagingSenderId: "318647402713",
    appId: "1:318647402713:web:517a01d812cee038897ec8"
};

// Firebase 초기화
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase 초기화 성공');
    } else {
        firebase.app();
        console.log('✅ Firebase 이미 초기화됨');
    }
} catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
}

// Firebase 서비스 인스턴스
const database = firebase.database();

// Storage 초기화 확인
let storage = null;
try {
    if (firebase.storage) {
        storage = firebase.storage();
        console.log('✅ Firebase Storage 초기화 성공');
    } else {
        console.error('❌ Firebase Storage SDK가 로드되지 않았습니다');
    }
} catch (error) {
    console.error('❌ Firebase Storage 초기화 실패:', error);
}

// 연결 상태 모니터링
database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === true) {
        console.log('✅ Firebase Realtime Database 연결됨');
    } else {
        console.log('⚠️ Firebase 연결 끊김');
    }
});

// 디버그 정보
console.log('Firebase Config:', {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    databaseURL: firebaseConfig.databaseURL
});