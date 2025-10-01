# INTECH LIGHTING 웹사이트 사용 설명서

## 📁 파일 구조

```
프로젝트폴더/
├── index.html          ← 메인 HTML 파일
├── style.css           ← 디자인 스타일 파일
├── script.js           ← 기능 작동 파일
├── products.js         ← 제품 데이터 파일 (여기만 수정하면 됩니다!)
└── images/             ← 이미지 폴더
    ├── product1.jpg
    ├── product1-detail1.jpg
    ├── product1-detail2.jpg
    └── ...
```

---

## 🚀 시작하기

1. **파일 다운로드**: 위의 5개 파일을 모두 다운로드하세요
   - `index.html`
   - `style.css`
   - `script.js`
   - `products.js`
   - `README.md` (이 파일)

2. **폴더 생성**: `images` 폴더를 만드세요

3. **파일 배치**: 모든 파일을 같은 폴더에 넣으세요

4. **실행**: `index.html` 파일을 더블클릭하면 웹사이트가 열립니다!

---

## ✏️ 제품 추가/수정 방법

### ⚠️ 중요: `products.js` 파일만 수정하세요!

다른 파일(index.html, style.css, script.js)은 건드리지 마세요.

### 1️⃣ 제품 추가하기

1. `products.js` 파일을 메모장으로 열기
2. 맨 아래 주석 처리된 템플릿 복사하기
3. 정보 입력하기:

```javascript
,{
    name: '제품명을 입력하세요',
    specs: '간단한 설명\n두번째 줄',
    thumbnail: 'images/새제품썸네일.jpg',
    detailImages: [
        'images/새제품-상세1.jpg',
        'images/새제품-상세2.jpg'
    ],
    specsList: [
        '스펙 1',
        '스펙 2',
        '스펙 3'
    ],
    tableData: {
        item: '제품명',
        voltage: '전압',
        current: '전류',
        maxOutput: '최대출력',
        efficiency: '효율',
        dimension: '크기',
        guarantee: '보증기간'
    }
}
```

4. 저장하기
5. 웹사이트 새로고침하기

### 2️⃣ 이미지 추가하기

1. 제품 이미지를 `images` 폴더에 저장
2. 파일명은 영어로 (예: `product-new.jpg`)
3. `products.js`에서 이미지 경로 입력

```javascript
thumbnail: 'images/product-new.jpg',
detailImages: [
    'images/product-new-detail1.jpg',
    'images/product-new-detail2.jpg'
]
```

### 3️⃣ 제품 수정하기

1. `products.js` 열기
2. 수정할 제품 찾기
3. 필요한 부분만 수정
4. 저장하고 새로고침

### 4️⃣ 제품 삭제하기

1. `products.js` 열기
2. 삭제할 제품 전체를 지우기 (중괄호 `{...}` 전체)
3. 저장하고 새로고침

---

## 📝 항목별 설명

### `name` (제품명)
- 제품의 이름
- 예: `'LCA 17 one4all SC PRE'`

### `specs` (간단한 스펙)
- 리스트 페이지에 표시되는 간단한 설명
- 줄바꿈은 `\n` 사용
- 예: `'1000LM/M\n98LM/W'`

### `thumbnail` (썸네일)
- 리스트 페이지에 보이는 작은 이미지
- 예: `'images/product1.jpg'`

### `detailImages` (상세 이미지들)
- 상세 페이지에 보이는 큰 이미지들
- 여러 개 가능
- 예:
```javascript
detailImages: [
    'images/product1-detail1.jpg',
    'images/product1-detail2.jpg',
    'images/product1-detail3.jpg'
]
```

### `specsList` (스펙 리스트)
- 상세 페이지 오른쪽에 나오는 스펙들
- 각 항목은 따옴표로 감싸기
- 예:
```javascript
specsList: [
    'Dimmable built-in',
    'Max. output: 17W',
    'Warranty: 5 years'
]
```

### `tableData` (테이블 데이터)
- 상세 페이지 테이블에 들어갈 정보
- 예:
```javascript
tableData: {
    item: 'LCA 17',
    voltage: '15-50V',
    current: '250-700mA',
    maxOutput: '17.0W',
    efficiency: '86.0%',
    dimension: '130 X 43 X 30mm',
    guarantee: '5 Year'
}
```

---

## 🎨 디자인 수정 (선택사항)

디자인을 바꾸고 싶다면 `style.css` 파일을 수정하세요.

### 색상 변경
- 헤더 배경색: `header { background-color: #000; }`
- 푸터 배경색: `footer { background: #2a2a2a; }`

### 글자 크기 변경
- 제품명 크기: `.product-name { font-size: 14px; }`
- 페이지 제목 크기: `.page-title { font-size: 32px; }`

---

## 🐛 문제 해결

### 제품이 안 보여요
- `products.js` 파일이 같은 폴더에 있나요?
- 파일 이름이 정확한가요? (대소문자 구분)
- 쉼표(`,`)를 빠뜨리지 않았나요?

### 이미지가 안 보여요
- `images` 폴더가 있나요?
- 이미지 경로가 맞나요?
- 이미지 파일명이 정확한가요?

### 웹사이트가 이상해요
- `index.html`, `style.css`, `script.js`를 수정했나요?
- 원본 파일을 다시 다운로드하세요

---

## 📱 모바일 지원

이 웹사이트는 자동으로 모바일에 최적화됩니다!
- PC: 한 줄에 5개 제품 표시
- 모바일: 한 줄에 2개 제품 표시
- 햄버거 메뉴로 필터 접근

---

## 💡 팁

1. **백업하기**: 수정하기 전에 `products.js` 파일을 복사해두세요
2. **한 번에 하나씩**: 여러 개를 동시에 수정하지 말고 하나씩 테스트하세요
3. **이미지 크기**: 너무 큰 이미지는 웹사이트를 느리게 만들어요 (권장: 1MB 이하)
4. **파일명**: 한글보다는 영어로 저장하세요

---

## ❓ 자주 묻는 질문

**Q: 필터 기능이 작동하나요?**  
A: 현재는 디자인만 있고 실제 필터 기능은 없습니다. 필요하면 추가 개발이 필요합니다.

**Q: 다운로드 버튼이 작동하나요?**  
A: 현재는 버튼만 있습니다. 실제 파일 다운로드 기능은 추가 개발이 필요합니다.

**Q: 검색 기능이 있나요?**  
A: 현재는 디자인만 있습니다. 실제 검색 기능은 추가 개발이 필요합니다.

**Q: 제품을 100개 이상 추가해도 되나요?**  
A: 네! 원하는 만큼 추가할 수 있습니다.

---

## 📞 도움이 필요하신가요?

문제가 생기면:
1. 이 README 파일을 다시 읽어보세요
2. `products.js` 파일의 예시를 참고하세요
3. 원본 파일을 다시 다운로드해보세요

---

**만든 날짜**: 2025년  
**버전**: 1.0  

🎉 웹사이트 관리를 즐겨보세요!



    // 새 제품을 추가하려면 아래 형식을 복사해서 사용하세요:
    /*
    ,{
        name: '제품명을 입력하세요',
        specs: '간단한 설명\n두번째 줄',
        thumbnail: 'images/새제품썸네일.jpg',
        detailImages: [
            'images/새제품-상세1.jpg',
            'images/새제품-상세2.jpg'
        ],
        specsList: [
            '스펙 1',
            '스펙 2',
            '스펙 3'
        ],
        tableData: {
            item: '제품명',
            voltage: '전압',
            current: '전류',
            maxOutput: '최대출력',
            efficiency: '효율',
            dimension: '크기',
            guarantee: '보증기간'
        },
        categories: {
            watt: '6-10W',        // '0-5W', '6-10W', '11-15W', '16-20W', '21-25W', '26-30W', '30W+' 중 선택
            cct: '3000K',         // '2400K', '2700K', '3000K', '3500K', '4000K', '5700K', '6000K', '6500K', 'TW', 'RGB', 'RGBW' 중 선택
            ip: 'IP65'            // 'IP20', 'IP44', 'IP54', 'IP65', 'IP66', 'IP67', 'IP68' 중 선택
        }
    },,
    */