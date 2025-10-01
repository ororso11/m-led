// admin.js - Firebase 버전

// Firebase는 firebase-config.js에서 이미 초기화됨
// database와 storage 변수도 firebase-config.js에서 정의됨

// 전역 변수
let products = [];
let specsList = [];
let editingIndex = null;
let editingKey = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initializing...');
    
    // 로딩 메시지 숨기기
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) loadingMessage.style.display = 'none';
    
    const successMessage = document.getElementById('successMessage');
    if (successMessage) successMessage.style.display = 'none';
    
    // Firebase 연결 상태 모니터링
    if (typeof database !== 'undefined') {
        database.ref('.info/connected').on('value', function(snapshot) {
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                if (snapshot.val() === true) {
                    syncStatus.textContent = '✅ Firebase 실시간 연결됨';
                    syncStatus.className = 'sync-status connected';
                } else {
                    syncStatus.textContent = '❌ Firebase 연결 끊김';
                    syncStatus.className = 'sync-status disconnected';
                }
            }
        });
        
        // Firebase에서 실시간 제품 데이터 가져오기
        database.ref('products').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Firebase 데이터를 배열로 변환
                products = [];
                const keys = Object.keys(data);
                keys.forEach(key => {
                    products.push({
                        ...data[key],
                        _key: key
                    });
                });
                
                console.log('✅ Firebase 데이터 로드:', products.length, '개 제품');
                
                // 현재 활성 탭 새로고침
                const activeTab = document.querySelector('.tab.active');
                if (activeTab) {
                    const tabName = activeTab.getAttribute('data-tab');
                    if (tabName === 'list') loadProductList();
                    if (tabName === 'manage') loadManagementList();
                }
            } else {
                products = [];
                console.log('제품 데이터 없음');
                
                // 빈 상태 표시
                const activeTab = document.querySelector('.tab.active');
                if (activeTab) {
                    const tabName = activeTab.getAttribute('data-tab');
                    if (tabName === 'list') loadProductList();
                    if (tabName === 'manage') loadManagementList();
                }
            }
        }, (error) => {
            console.error('Firebase 데이터 로드 실패:', error);
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                syncStatus.textContent = '❌ 데이터 로드 실패';
                syncStatus.className = 'sync-status disconnected';
            }
        });
    } else {
        console.error('Firebase database not initialized');
    }
    
    // 폼 제출 이벤트 리스너
    const form = document.getElementById('productForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

// Firebase Storage에 이미지 업로드 (수정됨)
async function uploadImageToFirebase(file, folder) {
    try {
        if (!storage) {
            throw new Error('Firebase Storage가 초기화되지 않았습니다');
        }
        
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        
        // ✅ 올바른 방식: firebase.storage()를 통해 ref 생성
        const storageRef = firebase.storage().ref(`${folder}/${filename}`);
        
        console.log('📤 업로드 시작:', folder, filename);
        
        // 업로드 실행
        const uploadTask = storageRef.put(file);
        
        // 업로드 완료 대기
        await uploadTask;
        
        // ✅ getDownloadURL()로 공개 URL 가져오기 (CORS 문제 해결)
        const downloadURL = await storageRef.getDownloadURL();
        
        console.log('✅ 업로드 완료:', downloadURL);
        return downloadURL;
        
    } catch (error) {
        console.error('❌ 업로드 실패:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse
        });
        throw error;
    }
}

// 제품 수정
window.editProduct = function(index) {
    if (!products || !products[index]) return;
    
    const product = products[index];
    editingIndex = index;
    editingKey = product._key;
    
    // 폼에 기존 데이터 채우기
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productSpecs').value = product.specs || '';
    
    // 테이블 데이터
    if (product.tableData) {
        document.getElementById('tableItem').value = product.tableData.item || '';
        document.getElementById('tableVoltage').value = product.tableData.voltage || '';
        document.getElementById('tableCurrent').value = product.tableData.current || '';
        document.getElementById('tableMaxOutput').value = product.tableData.maxOutput || '';
        document.getElementById('tableEfficiency').value = product.tableData.efficiency || '';
        document.getElementById('tableDimension').value = product.tableData.dimension || '';
        document.getElementById('tableGuarantee').value = product.tableData.guarantee || '';
    }
    
    // 카테고리
    if (product.categories) {
        document.getElementById('categoryWatt').value = product.categories.watt || '';
        document.getElementById('categoryCCT').value = product.categories.cct || '';
        document.getElementById('categoryIP').value = product.categories.ip || '';
    }
    
    // 스펙 리스트
    specsList = product.specsList || [];
    updateSpecsList();
    
    // 파일 입력 필수 속성 제거 (수정 시에는 선택사항)
    document.getElementById('thumbnailInput').removeAttribute('required');
    document.getElementById('detailImagesInput').removeAttribute('required');
    
    // 제출 버튼 텍스트 변경
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = '제품 수정 완료';
    
    // 추가 탭으로 이동
    showTab('add');
    
    alert('제품 정보를 수정한 후 "제품 수정 완료" 버튼을 클릭하세요.\n(이미지를 변경하지 않으려면 파일을 선택하지 마세요)');
}

// 제품 삭제
window.deleteProduct = async function(index) {
    if (!confirm('정말로 이 제품을 삭제하시겠습니까?')) return;
    
    try {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) loadingMessage.style.display = 'block';
        
        const product = products[index];
        if (product._key) {
            // Firebase에서 삭제
            await database.ref(`products/${product._key}`).remove();
            
            alert('✅ 제품이 삭제되었습니다! (즉시 반영)');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('삭제 실패: ' + error.message);
    } finally {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) loadingMessage.style.display = 'none';
    }
}

// 관리 리스트 로드
function loadManagementList() {
    const manageListEl = document.getElementById('productManageList');
    
    if (!manageListEl) {
        console.error('productManageList element not found');
        return;
    }
    
    if (products.length > 0) {
        manageListEl.innerHTML = products.map((product, index) => `
            <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: white;">
                <img src="${product.thumbnail}" alt="${product.name}" 
                     style="width: 100%; height: 200px; object-fit: cover;"
                     onerror="this.src='img/placeholder.jpg';">
                <div style="padding: 15px;">
                    <h4 style="margin: 0 0 10px 0;">${product.name}</h4>
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">${product.specs ? product.specs.replace(/\n/g, ' / ') : ''}</p>
                    <small style="color: #999; display: block; margin-bottom: 15px;">
                        ${product.categories ? `${product.categories.watt || ''} / ${product.categories.cct || ''} / ${product.categories.ip || ''}` : ''}
                    </small>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="editProduct(${index})" 
                                style="flex: 1; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            수정
                        </button>
                        <button onclick="deleteProduct(${index})" 
                                style="flex: 1; padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            삭제
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        manageListEl.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">등록된 제품이 없습니다.</p>';
    }
}

// 썸네일 업로드 미리보기
window.handleThumbnailUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('thumbnailPreview').innerHTML = 
            `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 5px;">`;
    };
    reader.readAsDataURL(file);
}

// 상세 이미지 업로드 미리보기
window.handleDetailImagesUpload = function(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    const previewContainer = document.getElementById('detailImagesPreview');
    previewContainer.innerHTML = '';
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML += 
                `<img src="${e.target.result}" style="max-width: 150px; max-height: 150px; margin: 5px; border-radius: 5px;">`;
        };
        reader.readAsDataURL(file);
    });
}

// 스펙 추가
window.addSpec = function() {
    const specInput = document.getElementById('specInput');
    const spec = specInput.value.trim();
    
    if (spec) {
        specsList.push(spec);
        updateSpecsList();
        specInput.value = '';
    }
}

// 스펙 리스트 업데이트
function updateSpecsList() {
    const specsListEl = document.getElementById('specsList');
    specsListEl.innerHTML = specsList.map((spec, index) => `
        <li style="padding: 5px 0;">
            ${spec}
            <button onclick="removeSpec(${index})" style="color: red; margin-left: 10px; cursor: pointer;">삭제</button>
        </li>
    `).join('');
}

// 스펙 삭제
window.removeSpec = function(index) {
    specsList.splice(index, 1);
    updateSpecsList();
}

// 폼 제출 처리
async function handleSubmit(e) {
    e.preventDefault();
    
    const thumbnailInput = document.getElementById('thumbnailInput');
    const detailImagesInput = document.getElementById('detailImagesInput');
    
    // 수정 모드가 아닌 경우에만 파일 필수 체크
    if (editingIndex === null) {
        if (!thumbnailInput.files.length || !detailImagesInput.files.length) {
            alert('썸네일과 상세 이미지를 모두 업로드해주세요.');
            return;
        }
    }
    
    document.getElementById('loadingMessage').style.display = 'block';
    
    try {
        let thumbnailPath, detailPaths = [];
        
        // 수정 모드
        if (editingIndex !== null) {
            const currentProduct = products[editingIndex];
            
            // 새 썸네일이 있으면 업로드
            if (thumbnailInput.files.length > 0) {
                thumbnailPath = await uploadImageToFirebase(thumbnailInput.files[0], 'thumbnails');
            } else {
                thumbnailPath = currentProduct.thumbnail;
            }
            
            // 새 상세 이미지가 있으면 업로드
            if (detailImagesInput.files.length > 0) {
                const detailFiles = Array.from(detailImagesInput.files);
                for (const file of detailFiles) {
                    const path = await uploadImageToFirebase(file, 'details');
                    detailPaths.push(path);
                }
            } else {
                detailPaths = currentProduct.detailImages;
            }
            
            // 제품 데이터 업데이트
            const updatedProduct = {
                name: document.getElementById('productName').value,
                thumbnail: thumbnailPath,
                detailImages: detailPaths,
                specs: document.getElementById('productSpecs').value,
                specsList: specsList,
                tableData: {
                    item: document.getElementById('tableItem').value || document.getElementById('productName').value,
                    voltage: document.getElementById('tableVoltage').value || '-',
                    current: document.getElementById('tableCurrent').value || '-',
                    maxOutput: document.getElementById('tableMaxOutput').value || '-',
                    efficiency: document.getElementById('tableEfficiency').value || '-',
                    dimension: document.getElementById('tableDimension').value || '-',
                    guarantee: document.getElementById('tableGuarantee').value || '-'
                },
                categories: {
                    watt: document.getElementById('categoryWatt').value,
                    cct: document.getElementById('categoryCCT').value,
                    ip: document.getElementById('categoryIP').value
                },
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Firebase에 업데이트
            await database.ref(`products/${editingKey}`).update(updatedProduct);
            
            alert('✅ 제품이 수정되었습니다! (즉시 반영)');
            
            // 수정 모드 종료
            editingIndex = null;
            editingKey = null;
            document.querySelector('.submit-btn').textContent = '제품 추가';
            
            // 파일 입력 다시 필수로
            thumbnailInput.setAttribute('required', 'required');
            detailImagesInput.setAttribute('required', 'required');
            
        } else {
            // 신규 추가 모드
            thumbnailPath = await uploadImageToFirebase(thumbnailInput.files[0], 'thumbnails');
            
            const detailFiles = Array.from(detailImagesInput.files);
            for (const file of detailFiles) {
                const path = await uploadImageToFirebase(file, 'details');
                detailPaths.push(path);
            }
            
            const productData = {
                name: document.getElementById('productName').value,
                thumbnail: thumbnailPath,
                detailImages: detailPaths,
                specs: document.getElementById('productSpecs').value,
                specsList: specsList,
                tableData: {
                    item: document.getElementById('tableItem').value || document.getElementById('productName').value,
                    voltage: document.getElementById('tableVoltage').value || '-',
                    current: document.getElementById('tableCurrent').value || '-',
                    maxOutput: document.getElementById('tableMaxOutput').value || '-',
                    efficiency: document.getElementById('tableEfficiency').value || '-',
                    dimension: document.getElementById('tableDimension').value || '-',
                    guarantee: document.getElementById('tableGuarantee').value || '-'
                },
                categories: {
                    watt: document.getElementById('categoryWatt').value,
                    cct: document.getElementById('categoryCCT').value,
                    ip: document.getElementById('categoryIP').value
                },
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Firebase에 추가
            await database.ref('products').push(productData);
            
            alert('✅ 제품이 추가되었습니다! (즉시 반영)');
        }
        
        // 폼 초기화
        document.getElementById('productForm').reset();
        document.getElementById('thumbnailPreview').innerHTML = '';
        document.getElementById('detailImagesPreview').innerHTML = '';
        specsList = [];
        updateSpecsList();
        
        // 성공 메시지 표시
        document.getElementById('successMessage').style.display = 'block';
        setTimeout(() => {
            document.getElementById('successMessage').style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ 오류 발생: ' + error.message);
    } finally {
        document.getElementById('loadingMessage').style.display = 'none';
    }
}

// 탭 전환 함수
window.showTab = function(tabName) {
    // 모든 탭 내용 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 선택한 탭 활성화
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // 선택한 버튼 활성화
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    // 각 탭별 추가 동작
    if (tabName === 'list') {
        loadProductList();
    } else if (tabName === 'manage') {
        loadManagementList();
    }
}

// 제품 목록 로드
function loadProductList() {
    const productListEl = document.getElementById('productList');
    
    if (!productListEl) {
        console.error('productList element not found');
        return;
    }
    
    console.log('Loading product list, products available:', products.length);
    
    if (products.length > 0) {
        productListEl.innerHTML = products.map((product, index) => `
            <div class="product-item" style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #ddd;">
                <img src="${product.thumbnail}" alt="${product.name}" 
                     style="width: 80px; height: 80px; object-fit: cover; margin-right: 20px; border-radius: 5px;"
                     onerror="this.src='img/placeholder.jpg';">
                <div>
                    <h4 style="margin: 0 0 10px 0;">${product.name}</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">${product.specs ? product.specs.replace(/\n/g, ' / ') : ''}</p>
                    <small style="color: #999;">
                        ${product.categories ? `${product.categories.watt || ''} / ${product.categories.cct || ''} / ${product.categories.ip || ''}` : ''}
                    </small>
                </div>
            </div>
        `).join('');
    } else {
        productListEl.innerHTML = '<p style="text-align: center; color: #999;">등록된 제품이 없습니다.</p>';
    }
}