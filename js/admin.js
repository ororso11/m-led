// admin.js - Firebase 버전 (완전 동적 + 유효성 검증)

// 전역 변수
let products = [];
let specsList = [];
let editingIndex = null;
let editingKey = null;

// 기본 카테고리 및 테이블 컬럼 설정
let categories = {
    productType: {
        label: '대분류',
        values: ['ALL', '원형매입', '사각매입', '레일', '마그네틱']
    },
    watt: {
        label: 'WATT',
        values: ['0-5W', '6-10W', '11-15W', '16-20W', '21-25W', '26-30W', '30W+']
    },
    cct: {
        label: 'CCT',
        values: ['2400K', '2700K', '3000K', '3500K', '4000K', '5700K', '6000K', '6500K', 'TW', 'RGB', 'RGBW']
    },
    ip: {
        label: 'IP등급',
        values: ['IP20', 'IP44', 'IP54', 'IP65', 'IP66', 'IP67', 'IP68']
    }
};

let tableColumns = [
    { id: 'item', label: '품목', placeholder: 'LED 다운라이트' },
    { id: 'voltage', label: '전압', placeholder: 'AC 220V' },
    { id: 'current', label: '전류', placeholder: '0.05A' },
    { id: 'maxOutput', label: '최대출력', placeholder: '10W' },
    { id: 'efficiency', label: '효율', placeholder: '100lm/W' },
    { id: 'dimension', label: '크기', placeholder: 'Ø90 x H50mm' },
    { id: 'guarantee', label: '보증기간', placeholder: '2년' }
];

// Firebase에서 카테고리 및 테이블 설정 로드
async function loadSettings() {
    try {
        const snapshot = await database.ref('settings').once('value');
        const data = snapshot.val();
        
        if (data) {
            if (data.categories) {
                const migratedCategories = {};
                let needsMigration = false;
                
                Object.keys(data.categories).forEach(key => {
                    if (data.categories[key].label && data.categories[key].values) {
                        migratedCategories[key] = data.categories[key];
                    } else if (Array.isArray(data.categories[key])) {
                        needsMigration = true;
                        const labelMap = {
                            'productType': '대분류',
                            'watt': 'WATT',
                            'cct': 'CCT',
                            'ip': 'IP등급'
                        };
                        migratedCategories[key] = {
                            label: labelMap[key] || key.toUpperCase(),
                            values: data.categories[key]
                        };
                    }
                });
                
                categories = migratedCategories;
                
                if (needsMigration) {
                    console.log('카테고리 데이터 마이그레이션 중...');
                    await saveSettings();
                }
            }
            
            if (data.tableColumns) tableColumns = data.tableColumns;
        }
        
        if (!categories.productType) {
            console.log('대분류 카테고리 기본값 생성');
            categories.productType = {
                label: '대분류',
                values: ['ALL', '원형매입', '사각매입', '레일', '마그네틱']
            };
            await saveSettings();
        }
        
        renderCategoryTypes();
        renderTableColumns();
    } catch (error) {
        console.error('설정 로드 실패:', error);
        
        if (!categories.productType) {
            categories.productType = {
                label: '대분류',
                values: ['ALL', '원형매입', '사각매입', '레일', '마그네틱']
            };
        }
        
        renderCategoryTypes();
        renderTableColumns();
    }
}

// Firebase에 설정 저장
async function saveSettings() {
    try {
        await database.ref('settings').set({
            categories,
            tableColumns,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        console.log('설정 저장 완료');
    } catch (error) {
        console.error('설정 저장 실패:', error);
    }
}

// 카테고리 타입 렌더링
function renderCategoryTypes() {
    const mainContainer = document.getElementById('mainCategoryContainer');
    if (mainContainer) {
        if (categories.productType) {
            const cat = categories.productType;
            mainContainer.innerHTML = `
                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <label>${cat.label} 카테고리 선택 <span style="color: red;">*</span></label>
                    </div>
                    <select id="categoryproductType" style="width: 100%; padding: 8px; margin-bottom: 10px;">
                        <option value="">선택하세요</option>
                        ${cat.values.map(value => `<option value="${value}">${value}</option>`).join('')}
                    </select>
                    
                    <label style="margin-top: 15px; display: block; font-size: 13px; color: #666;">${cat.label} 카테고리 관리</label>
                    <div style="display: flex; gap: 5px; margin-bottom: 8px;">
                        <input type="text" id="newproductTypeCategory" placeholder="예: 벽등" style="flex: 1; padding: 6px; font-size: 13px;">
                        <button type="button" onclick="addCategoryValue('productType')" 
                                style="padding: 6px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            추가
                        </button>
                    </div>
                    <select id="categoryproductTypeDelete" size="4" style="width: 100%; font-size: 12px; margin-bottom: 5px;">
                        ${cat.values.map(value => `<option value="${value}">${value}</option>`).join('')}
                    </select>
                    <button type="button" onclick="deleteCategoryValue('productType')" 
                            style="width: 100%; padding: 5px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        선택 항목 삭제
                    </button>
                </div>
            `;
        } else {
            mainContainer.innerHTML = '<p style="color: #999;">대분류 카테고리 로딩 중...</p>';
        }
    }
    
    const container = document.getElementById('categoryTypesContainer');
    if (!container) return;
    
    const categoryKeys = Object.keys(categories).filter(key => key !== 'productType');
    
    container.innerHTML = categoryKeys.map(key => {
        const cat = categories[key];
        if (!cat || !cat.values) return '';
        
        return `
            <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label>${cat.label} 카테고리 선택</label>
                    <button type="button" onclick="deleteCategoryType('${key}')" 
                            style="padding: 2px 8px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        타입 삭제
                    </button>
                </div>
                <select id="category${key}" style="width: 100%; padding: 8px; margin-bottom: 10px;">
                    <option value="">선택하세요</option>
                    ${cat.values.map(value => `<option value="${value}">${value}</option>`).join('')}
                </select>
                
                <label style="margin-top: 15px; display: block; font-size: 13px; color: #666;">${cat.label} 카테고리 관리</label>
                <div style="display: flex; gap: 5px; margin-bottom: 8px;">
                    <input type="text" id="new${key}Category" placeholder="예: 새 값" style="flex: 1; padding: 6px; font-size: 13px;">
                    <button type="button" onclick="addCategoryValue('${key}')" 
                            style="padding: 6px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        추가
                    </button>
                </div>
                <select id="category${key}Delete" size="4" style="width: 100%; font-size: 12px; margin-bottom: 5px;">
                    ${cat.values.map(value => `<option value="${value}">${value}</option>`).join('')}
                </select>
                <button type="button" onclick="deleteCategoryValue('${key}')" 
                        style="width: 100%; padding: 5px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    선택 항목 삭제
                </button>
            </div>
        `;
    }).join('');
}

window.showAddCategoryTypeModal = function() {
    const modal = document.getElementById('addCategoryTypeModal');
    if (modal) modal.style.display = 'flex';
}

window.closeAddCategoryTypeModal = function() {
    const modal = document.getElementById('addCategoryTypeModal');
    if (modal) modal.style.display = 'none';
    document.getElementById('newCategoryTypeKey').value = '';
    document.getElementById('newCategoryTypeLabel').value = '';
}

window.addCategoryType = async function() {
    const keyInput = document.getElementById('newCategoryTypeKey');
    const labelInput = document.getElementById('newCategoryTypeLabel');
    
    const key = keyInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const label = labelInput.value.trim();
    
    if (!key || !label) {
        alert('카테고리 ID와 이름을 모두 입력하세요.');
        return;
    }
    
    if (key === 'producttype' || key === 'productType') {
        alert('productType은 대분류 카테고리로 예약되어 있습니다. 다른 ID를 사용하세요.');
        return;
    }
    
    if (categories[key]) {
        alert('이미 존재하는 카테고리 ID입니다.');
        return;
    }
    
    categories[key] = {
        label: label,
        values: []
    };
    
    await saveSettings();
    renderCategoryTypes();
    closeAddCategoryTypeModal();
    alert(`"${label}" 카테고리 타입이 추가되었습니다.`);
}

window.deleteCategoryType = async function(key) {
    if (key === 'productType') {
        alert('대분류 카테고리는 삭제할 수 없습니다.');
        return;
    }
    
    const cat = categories[key];
    
    if (!confirm(`"${cat.label}" 카테고리 타입을 완전히 삭제하시겠습니까?\n(모든 하위 값도 함께 삭제됩니다)`)) {
        return;
    }
    
    delete categories[key];
    await saveSettings();
    renderCategoryTypes();
    alert(`"${cat.label}" 카테고리 타입이 삭제되었습니다.`);
}

window.addCategoryValue = async function(key) {
    const input = document.getElementById(`new${key}Category`);
    const value = input.value.trim();
    
    if (!value) {
        alert('카테고리 값을 입력하세요.');
        return;
    }
    
    // 공백만 있는지 검증
    if (value.length === 0 || !value.replace(/\s/g, '')) {
        alert('공백만으로는 카테고리를 추가할 수 없습니다.');
        return;
    }
    
    if (categories[key].values.includes(value)) {
        alert('이미 존재하는 카테고리입니다.');
        return;
    }
    
    categories[key].values.push(value);
    await saveSettings();
    renderCategoryTypes();
    input.value = '';
    alert(`"${value}" 카테고리가 추가되었습니다.`);
}

window.deleteCategoryValue = async function(key) {
    const select = document.getElementById(`category${key}Delete`);
    const selectedValue = select.value;
    
    if (!selectedValue) {
        alert('삭제할 항목을 선택하세요.');
        return;
    }
    
    if (!confirm(`"${selectedValue}" 카테고리를 삭제하시겠습니까?`)) {
        return;
    }
    
    categories[key].values = categories[key].values.filter(v => v !== selectedValue);
    await saveSettings();
    renderCategoryTypes();
    alert(`"${selectedValue}" 카테고리가 삭제되었습니다.`);
}

function renderTableColumns() {
    const container = document.getElementById('tableDataContainer');
    if (!container) return;
    
    container.innerHTML = tableColumns.map(col => `
        <div class="form-group">
            <label for="table${col.id}">
                ${col.label}
                <button type="button" onclick="deleteTableColumn('${col.id}')" 
                        style="margin-left: 10px; padding: 2px 8px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                    삭제
                </button>
            </label>
            <input type="text" id="table${col.id}" placeholder="${col.placeholder}">
        </div>
    `).join('');
}

window.addTableColumn = async function() {
    const input = document.getElementById('newTableColumn');
    const label = input.value.trim();
    
    if (!label) {
        alert('항목명을 입력하세요.');
        return;
    }
    
    let id = label.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9가-힣]/g, '');
    
    if (!id || /^\d+$/.test(id)) {
        id = 'field' + Date.now();
    }
    
    if (/[가-힣]/.test(id)) {
        id = 'field' + Date.now();
    }
    
    if (tableColumns.find(col => col.id === id)) {
        alert('이미 존재하는 항목입니다.');
        return;
    }
    
    tableColumns.push({
        id: id,
        label: label,
        placeholder: ''
    });
    
    await saveSettings();
    renderTableColumns();
    input.value = '';
    alert(`"${label}" 항목이 추가되었습니다.`);
}

window.deleteTableColumn = async function(id) {
    const column = tableColumns.find(col => col.id === id);
    
    if (!confirm(`"${column.label}" 항목을 삭제하시겠습니까?`)) {
        return;
    }
    
    tableColumns = tableColumns.filter(col => col.id !== id);
    await saveSettings();
    renderTableColumns();
    alert(`"${column.label}" 항목이 삭제되었습니다.`);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initializing...');
    
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) loadingMessage.style.display = 'none';
    
    const successMessage = document.getElementById('successMessage');
    if (successMessage) successMessage.style.display = 'none';
    
    setTimeout(() => {
        loadSettings();
    }, 100);
    
    if (typeof database !== 'undefined') {
        database.ref('.info/connected').on('value', function(snapshot) {
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                if (snapshot.val() === true) {
                    syncStatus.textContent = 'Firebase 실시간 연결됨';
                    syncStatus.className = 'sync-status connected';
                } else {
                    syncStatus.textContent = 'Firebase 연결 끊김';
                    syncStatus.className = 'sync-status disconnected';
                }
            }
        });
        
        database.ref('products').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                products = [];
                const keys = Object.keys(data);
                keys.forEach(key => {
                    products.push({
                        ...data[key],
                        _key: key
                    });
                });
                
                console.log('Firebase 데이터 로드:', products.length, '개 제품');
                
                const activeTab = document.querySelector('.tab.active');
                if (activeTab) {
                    const tabName = activeTab.getAttribute('data-tab');
                    if (tabName === 'list') loadProductList();
                    if (tabName === 'manage') loadManagementList();
                }
            } else {
                products = [];
                console.log('제품 데이터 없음');
                
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
                syncStatus.textContent = '데이터 로드 실패';
                syncStatus.className = 'sync-status disconnected';
            }
        });
    } else {
        console.error('Firebase database not initialized');
    }
    
    const form = document.getElementById('productForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

async function uploadImageToFirebase(file, folder) {
    try {
        if (!storage) {
            throw new Error('Firebase Storage가 초기화되지 않았습니다');
        }
        
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storageRef = firebase.storage().ref(`${folder}/${filename}`);
        
        console.log('업로드 시작:', folder, filename);
        
        const uploadTask = storageRef.put(file);
        await uploadTask;
        
        const downloadURL = await storageRef.getDownloadURL();
        
        console.log('업로드 완료:', downloadURL);
        return downloadURL;
        
    } catch (error) {
        console.error('업로드 실패:', error);
        throw error;
    }
}

window.editProduct = function(index) {
    if (!products || !products[index]) return;
    
    const product = products[index];
    editingIndex = index;
    editingKey = product._key;
    
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productNumber').value = product.productNumber || '';
    document.getElementById('productSpecs').value = product.specs || '';
    
    if (product.tableData) {
        tableColumns.forEach(col => {
            const input = document.getElementById(`table${col.id}`);
            if (input) {
                input.value = product.tableData[col.id] || '';
            }
        });
    }
    
    if (product.categories) {
        Object.keys(categories).forEach(key => {
            const select = document.getElementById(`category${key}`);
            if (select && product.categories[key]) {
                select.value = product.categories[key];
            }
        });
    }
    
    specsList = product.specsList || [];
    updateSpecsList();
    
    document.getElementById('thumbnailInput').removeAttribute('required');
    document.getElementById('detailImagesInput').removeAttribute('required');
    
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = '제품 수정 완료';
    
    showTab('add');
    
    alert('제품 정보를 수정한 후 "제품 수정 완료" 버튼을 클릭하세요.\n(이미지를 변경하지 않으려면 파일을 선택하지 마세요)');
}

window.deleteProduct = async function(index) {
    if (!confirm('정말로 이 제품을 삭제하시겠습니까?')) return;
    
    try {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) loadingMessage.style.display = 'block';
        
        const product = products[index];
        if (product._key) {
            await database.ref(`products/${product._key}`).remove();
            alert('제품이 삭제되었습니다!');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('삭제 실패: ' + error.message);
    } finally {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) loadingMessage.style.display = 'none';
    }
}

function loadManagementList() {
    const manageListEl = document.getElementById('productManageList');
    
    if (!manageListEl) return;
    
    if (products.length > 0) {
        manageListEl.innerHTML = products.map((product, index) => {
            const categoryText = product.categories ? 
                Object.keys(categories).map(key => product.categories[key] || '').filter(v => v).join(' / ') : '';
            
            return `
                <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: white;">
                    <img src="${product.thumbnail}" alt="${product.name}" 
                         style="width: 100%; height: 200px; object-fit: cover;"
                         onerror="this.src='img/placeholder.jpg';">
                    <div style="padding: 15px;">
                        <h4 style="margin: 0 0 5px 0;">${product.name}</h4>
                        ${product.productNumber ? `<p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">${product.productNumber}</p>` : ''}
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">${product.specs ? product.specs.replace(/\n/g, ' / ') : ''}</p>
                        <small style="color: #999; display: block; margin-bottom: 15px;">${categoryText}</small>
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
            `;
        }).join('');
    } else {
        manageListEl.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">등록된 제품이 없습니다.</p>';
    }
}

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

window.addSpec = function() {
    const specInput = document.getElementById('specInput');
    const spec = specInput.value.trim();
    
    if (spec) {
        specsList.push(spec);
        updateSpecsList();
        specInput.value = '';
    }
}

function updateSpecsList() {
    const specsListEl = document.getElementById('specsList');
    specsListEl.innerHTML = specsList.map((spec, index) => `
        <li style="padding: 5px 0;">
            ${spec}
            <button onclick="removeSpec(${index})" style="color: red; margin-left: 10px; cursor: pointer; border: none; background: none;">삭제</button>
        </li>
    `).join('');
}

window.removeSpec = function(index) {
    specsList.splice(index, 1);
    updateSpecsList();
}

// ====== 유효성 검증 함수 추가 ======
function validateProductForm() {
    const errors = [];
    
    // 제품명 검증
    const productName = document.getElementById('productName').value.trim();
    if (!productName) {
        errors.push('제품명을 입력하세요.');
    }
    
    // 대분류 필수 선택 검증
    const productType = document.getElementById('categoryproductType').value;
    if (!productType) {
        errors.push('대분류를 선택하세요.');
    }
    
    // 이미지 검증 (신규 등록 시에만)
    if (editingIndex === null) {
        const thumbnailInput = document.getElementById('thumbnailInput');
        const detailImagesInput = document.getElementById('detailImagesInput');
        
        if (!thumbnailInput.files.length) {
            errors.push('썸네일 이미지를 업로드하세요.');
        }
        
        if (!detailImagesInput.files.length) {
            errors.push('상세 이미지를 업로드하세요.');
        }
    }
    
    return errors;
}

// 폼 제출 처리 (유효성 검증 포함)
async function handleSubmit(e) {
    e.preventDefault();
    
    // 유효성 검증
    const errors = validateProductForm();
    if (errors.length > 0) {
        alert('다음 항목을 확인하세요:\n\n' + errors.map((err, i) => `${i + 1}. ${err}`).join('\n'));
        return;
    }
    
    const thumbnailInput = document.getElementById('thumbnailInput');
    const detailImagesInput = document.getElementById('detailImagesInput');
    
    document.getElementById('loadingMessage').style.display = 'block';
    
    try {
        let thumbnailPath, detailPaths = [];
        
        // 수정 모드
        if (editingIndex !== null) {
            const currentProduct = products[editingIndex];
            
            if (thumbnailInput.files.length > 0) {
                thumbnailPath = await uploadImageToFirebase(thumbnailInput.files[0], 'thumbnails');
            } else {
                thumbnailPath = currentProduct.thumbnail;
            }
            
            if (detailImagesInput.files.length > 0) {
                const detailFiles = Array.from(detailImagesInput.files);
                for (const file of detailFiles) {
                    const path = await uploadImageToFirebase(file, 'details');
                    detailPaths.push(path);
                }
            } else {
                detailPaths = currentProduct.detailImages;
            }
            
            const tableData = {};
            tableColumns.forEach(col => {
                const input = document.getElementById(`table${col.id}`);
                tableData[col.id] = input ? (input.value || '-') : '-';
            });
            
            const productCategories = {};
            Object.keys(categories).forEach(key => {
                const select = document.getElementById(`category${key}`);
                if (select) {
                    productCategories[key] = select.value;
                }
            });
            
            const updatedProduct = {
                name: document.getElementById('productName').value,
                productNumber: document.getElementById('productNumber').value || '',
                thumbnail: thumbnailPath,
                detailImages: detailPaths,
                specs: document.getElementById('productSpecs').value,
                specsList: specsList,
                tableData: tableData,
                categories: productCategories,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await database.ref(`products/${editingKey}`).update(updatedProduct);
            
            alert('제품이 수정되었습니다!');
            
            editingIndex = null;
            editingKey = null;
            document.querySelector('.submit-btn').textContent = '제품 추가';
            
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
            
            const tableData = {};
            tableColumns.forEach(col => {
                const input = document.getElementById(`table${col.id}`);
                tableData[col.id] = input ? (input.value || '-') : '-';
            });
            
            const productCategories = {};
            Object.keys(categories).forEach(key => {
                const select = document.getElementById(`category${key}`);
                if (select) {
                    productCategories[key] = select.value;
                }
            });
            
            const productData = {
                name: document.getElementById('productName').value,
                productNumber: document.getElementById('productNumber').value || '',
                thumbnail: thumbnailPath,
                detailImages: detailPaths,
                specs: document.getElementById('productSpecs').value,
                specsList: specsList,
                tableData: tableData,
                categories: productCategories,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await database.ref('products').push(productData);
            
            alert('제품이 추가되었습니다!');
        }
        
        document.getElementById('productForm').reset();
        document.getElementById('thumbnailPreview').innerHTML = '';
        document.getElementById('detailImagesPreview').innerHTML = '';
        specsList = [];
        updateSpecsList();
        
        document.getElementById('successMessage').style.display = 'block';
        setTimeout(() => {
            document.getElementById('successMessage').style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('Error:', error);
        alert('오류 발생: ' + error.message);
    } finally {
        document.getElementById('loadingMessage').style.display = 'none';
    }
}

window.showTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    if (tabName === 'list') {
        loadProductList();
    } else if (tabName === 'manage') {
        loadManagementList();
    }
}

function loadProductList() {
    const productListEl = document.getElementById('productList');
    
    if (!productListEl) return;
    
    if (products.length > 0) {
        productListEl.innerHTML = products.map((product, index) => {
            const categoryText = product.categories ? 
                Object.keys(categories).map(key => product.categories[key] || '').filter(v => v).join(' / ') : '';
            
            return `
                <div class="product-item" style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #ddd;">
                    <img src="${product.thumbnail}" alt="${product.name}" 
                         style="width: 80px; height: 80px; object-fit: cover; margin-right: 20px; border-radius: 5px;"
                         onerror="this.src='img/placeholder.jpg';">
                    <div>
                        <h4 style="margin: 0 0 5px 0;">${product.name}</h4>
                        ${product.productNumber ? `<p style="margin: 0 0 5px 0; color: #999; font-size: 12px;">${product.productNumber}</p>` : ''}
                        <p style="margin: 0; color: #666; font-size: 14px;">${product.specs ? product.specs.replace(/\n/g, ' / ') : ''}</p>
                        <small style="color: #999;">${categoryText}</small>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        productListEl.innerHTML = '<p style="text-align: center; color: #999;">등록된 제품이 없습니다.</p>';
    }
}