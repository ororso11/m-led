// Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyD8VMGmpxgZlzseyFQvoVRhYNcOnt5UvHc",
  authDomain: "catalog-led.firebaseapp.com",
  databaseURL: "https://catalog-led-default-rtdb.firebaseio.com",
  projectId: "catalog-led",
  storageBucket: "catalog-led.firebasestorage.app",
  messagingSenderId: "318647402713",
  appId: "1:318647402713:web:517a01d812cee038897ec8"
};

// Firebase 초기화
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    } else {
        firebase.app();
    }
} catch (error) {
    // Firebase 초기화 실패
}

// Firebase 서비스 인스턴스
const database = firebase.database();

// Storage 초기화 확인
let storage = null;
try {
    if (firebase.storage) {
        storage = firebase.storage();
    }
} catch (error) {
    // Storage 초기화 실패
}

// 연결 상태 모니터링
database.ref('.info/connected').on('value', (snapshot) => {
    // 연결 상태 변경 시 처리
});

// Auth 초기화
let auth = null;
try {
    if (firebase.auth) {
        auth = firebase.auth();
    }
} catch (error) {
    // Auth 초기화 실패
}