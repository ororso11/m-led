// admin.js - Firebase 버전 (제품별 마크 관리) - 수정본
// --------------------------------------------------
// tableData 구조 보존 및 업데이트 로직 수정
// --------------------------------------------------

// 전역 변수
let products = [];
let specsList = [];
let editingIndex = null;
let editingKey = null;
let productMarks = [];

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

// ========================================
// Firebase에서 설정 로드
// ========================================
async function loadSettings() {
    try {
        const snapshot = await database.ref('settings').once('value');
        const data = snapshot.val();

        if (data) {
            if (data.categories) {
                const migratedCategories = {};
                let needsMigration = false;

                Object.keys(data.categories).forEach(key => {
                    const val = data.categories[key];
                    if (val && typeof val === 'object' && Array.isArray(val.values)) {
                        migratedCategories[key] = val;
                    } else if (Array.isArray(val)) {
                        needsMigration = true;
                        const labelMap = {
                            'productType': '대분류',
                            'watt': 'WATT',
                            'cct': 'CCT',
                            'ip': 'IP등급'
                        };
                        migratedCategories[key] = {
                            label: labelMap[key] || key.toUpperCase(),
                            values: val
                        };
                    } else if (val && typeof val === 'object') {
                        migratedCategories[key] = {
                            label: val.label || key.toUpperCase(),
                            values: Array.isArray(val.values) ? val.values : []
                        };
                    }
                });

                if (Object.keys(migratedCategories).length > 0) {
                    categories = migratedCategories;
                }

                if (needsMigration) {
                    console.log('카테고리 데이터 마이그레이션 중...');
                    await saveSettings();
                }
            }

            if (data.tableColumns && Array.isArray(data.tableColumns)) {
                tableColumns = data.tableColumns;
            }
        }

        if (!categories.productType) {
            categories.productType = {
                label: '대분류',
                values: ['ALL', '원형매입', '사각매입', '레일', '마그네틱']
            };
            await saveSettings();
        }

        renderCategoryTypes();
        renderTableColumns();
        renderProductMarks();
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
        renderProductMarks();
    }
}

async function saveSettings() {
    try {
        await database.ref('settings').set({
            categories,
            tableColumns,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        console.log('✅ 설정 저장 완료');
    } catch (error) {
        console.error('설정 저장 실패:', error);
    }
}

// ========================================
// 마크 관리 기능
// ========================================
function renderProductMarks() {
    const container = document.getElementById('productMarksContainer');
    if (!container) return;

    console.log('📦 렌더링할 마크:', productMarks.length, '개');

    if (!productMarks || productMarks.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:40px 20px; color:#999; font-size:14px;">등록된 마크가 없습니다.<br>"+ 새 마크 추가" 버튼을 클릭하세요.</div>';
        return;
    }

    container.innerHTML = productMarks.map((mark, index) => {
        const safeName = mark && mark.name ? mark.name : `마크 ${index+1}`;
        const imgHtml = (mark && mark.imageUrl) ? `
            <img src="${mark.imageUrl}" 
                 style="width:60px;height:60px;object-fit:contain;border:1px solid #eee;padding:5px;border-radius:4px;margin-top:8px;"
                 onerror="this.style.display='none'">` : '';

        return `
            <div style="border:1px solid #ddd;padding:15px;border-radius:8px;background:white;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
                    <div style="flex:1;">
                        <div style="font-weight:bold;font-size:14px;margin-bottom:5px;">${safeName}</div>
                        ${imgHtml}
                    </div>
                    <button type="button" onclick="deleteMark(${index})" 
                            style="padding:6px 12px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                        삭제
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

window.showAddMarkModal = function() {
    const modal = document.getElementById('addMarkModal');
    if (modal) modal.style.display = 'flex';
}

window.closeAddMarkModal = function() {
    const modal = document.getElementById('addMarkModal');
    if (modal) modal.style.display = 'none';
    const nameInput = document.getElementById('newMarkName');
    const imageInput = document.getElementById('newMarkImage');
    if (nameInput) nameInput.value = '';
    if (imageInput) imageInput.value = '';
    const preview = document.getElementById('markImagePreview');
    if (preview) preview.innerHTML = '';
}

window.handleMarkImageUpload = function(event) {
    const file = event.target.files && event.target.files[0];
    const preview = document.getElementById('markImagePreview');

    if (!preview) return;

    if (!file) {
        preview.innerHTML = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `
            <img src="${e.target.result}" style="max-width:100px;max-height:100px;border:1px solid #ddd;padding:5px;border-radius:5px;">
        `;
    };
    reader.readAsDataURL(file);
}

async function uploadImageToFirebase(file, folder) {
    try {
        if (typeof storage === 'undefined' || !firebase || !firebase.storage) {
            throw new Error('Firebase Storage가 초기화되지 않았습니다');
        }

        const timestamp = Date.now();
        const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : 'file';
        const filename = `${timestamp}_${safeName}`;
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

window.addMark = async function() {
    const nameInput = document.getElementById('newMarkName');
    const imageInput = document.getElementById('newMarkImage');
    if (!nameInput || !imageInput) {
        alert('마크 입력 요소를 찾을 수 없습니다.');
        return;
    }

    const name = nameInput.value.trim();
    if (!name) {
        alert('마크 이름은 필수입니다.');
        return;
    }

    if (!imageInput.files || imageInput.files.length === 0) {
        alert('마크 이미지를 선택하세요.');
        return;
    }

    try {
        document.getElementById('loadingMessage').style.display = 'block';
        const imageUrl = await uploadImageToFirebase(imageInput.files[0], 'marks');

        const newMark = {
            name,
            imageUrl,
            createdAt: Date.now()
        };

        productMarks.push(newMark);
        console.log('✅ 마크 추가됨:', newMark);
        console.log('📦 현재 productMarks 배열:', productMarks);
        
        renderProductMarks();
        closeAddMarkModal();
        alert(`"${name}" 마크가 추가되었습니다.\n\n⚠️ 주의: "제품 수정 완료" 버튼을 눌러야 저장됩니다!`);
    } catch (error) {
        console.error('마크 추가 실패:', error);
        alert('마크 추가 실패: ' + (error.message || error));
    } finally {
        document.getElementById('loadingMessage').style.display = 'none';
    }
}

window.deleteMark = function(index) {
    if (!productMarks || index < 0 || index >= productMarks.length) return;
    const mark = productMarks[index];
    const markName = mark && mark.name ? mark.name : '선택된 마크';
    
    if (!confirm(`"${markName}" 마크를 삭제하시겠습니까?`)) return;
    
    // 배열에서 삭제
    productMarks.splice(index, 1);
    
    console.log('🗑️ 마크 삭제 후 배열:', productMarks);
    console.log('📦 남은 마크 개수:', productMarks.length);
    
    // 화면 업데이트
    renderProductMarks();
    
    alert(`"${markName}" 마크가 삭제되었습니다.\n\n⚠️ "제품 수정 완료" 버튼을 눌러야 최종 저장됩니다.`);
}

// ========================================
// 카테고리 관리
// ========================================
function renderCategoryTypes() {
    const mainContainer = document.getElementById('mainCategoryContainer');
    if (mainContainer) {
        if (categories.productType) {
            const cat = categories.productType;
            mainContainer.innerHTML = `
                <div class="form-group">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                        <label>${cat.label} 카테고리 선택 <span style="color:red;">*</span></label>
                    </div>
                    <select id="categoryproductType" style="width:100%;padding:8px;margin-bottom:10px;">
                        <option value="">선택하세요</option>
                        ${cat.values.map(value => `<option value="${value}">${value}</option>`).join('')}
                    </select>

                    <label style="margin-top:15px;display:block;font-size:13px;color:#666;">${cat.label} 카테고리 관리</label>
                    <div style="display:flex;gap:5px;margin-bottom:8px;">
                        <input type="text" id="newproductTypeCategory" placeholder="예: 벽등" style="flex:1;padding:6px;font-size:13px;">
                        <button type="button" onclick="addCategoryValue('productType')" 
                                style="padding:6px 10px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                            추가
                        </button>
                    </div>
                    <select id="categoryproductTypeDelete" size="4" style="width:100%;font-size:12px;margin-bottom:5px;">
                        ${cat.values.map(value => `<option value="${value}">${value}</option>`).join('')}
                    </select>
                    <button type="button" onclick="deleteCategoryValue('productType')" 
                            style="width:100%;padding:5px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                        선택 항목 삭제
                    </button>
                </div>
            `;
        } else {
            mainContainer.innerHTML = '<p style="color:#999;">대분류 카테고리 로딩 중...</p>';
        }
    }

    const container = document.getElementById('categoryTypesContainer');
    if (!container) return;

    const categoryKeys = Object.keys(categories).filter(key => key !== 'productType');

    container.innerHTML = categoryKeys.map(key => {
        const cat = categories[key];
        if (!cat || !Array.isArray(cat.values)) return '';
        return `
            <div class="form-group">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <label>${cat.label} 카테고리 선택</label>
                    <button type="button" onclick="deleteCategoryType('${key}')" 
                            style="padding:2px 8px;background:#f44336;color:white;border:none;border-radius:3px;cursor:pointer;font-size:11px;">
                        타입 삭제
                    </button>
                </div>
                <select id="category${key}" style="width:100%;padding:8px;margin-bottom:10px;">
                    <option value="">선택하세요</option>
                    ${cat.values.map(value => `<option value="${value}">${value}</option>`).join('')}
                </select>

                <label style="margin-top:15px;display:block;font-size:13px;color:#666;">${cat.label} 카테고리 관리</label>
                <div style="display:flex;gap:5px;margin-bottom:8px;">
                    <input type="text" id="new${key}Category" placeholder="예: 새 값" style="flex:1;padding:6px;font-size:13px;">
                    <button type="button" onclick="addCategoryValue('${key}')" 
                            style="padding:6px 10px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                        추가
                    </button>
                </div>
                <select id="category${key}Delete" size="4" style="width:100%;font-size:12px;margin-bottom:5px;">
                    ${cat.values.map(value => `<option value="${value}">${value}</option>`).join('')}
                </select>
                <button type="button" onclick="deleteCategoryValue('${key}')" 
                        style="width:100%;padding:5px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
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
    const a = document.getElementById('newCategoryTypeKey');
    const b = document.getElementById('newCategoryTypeLabel');
    if (a) a.value = '';
    if (b) b.value = '';
}

window.addCategoryType = async function() {
    const keyInput = document.getElementById('newCategoryTypeKey');
    const labelInput = document.getElementById('newCategoryTypeLabel');
    if (!keyInput || !labelInput) return alert('입력 요소를 찾을 수 없습니다.');

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

    categories[key] = { label: label, values: [] };
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
    if (!cat) return;
    if (!confirm(`"${cat.label}" 카테고리 타입을 완전히 삭제하시겠습니까?\n(모든 하위 값도 함께 삭제됩니다)`)) return;
    delete categories[key];
    await saveSettings();
    renderCategoryTypes();
    alert(`"${cat.label}" 카테고리 타입이 삭제되었습니다.`);
}

window.addCategoryValue = async function(key) {
    const input = document.getElementById(`new${key}Category`);
    if (!input) return alert('입력 요소를 찾을 수 없습니다.');
    const value = input.value.trim();
    if (!value) return alert('카테고리 값을 입력하세요.');
    if (!value.replace(/\s/g, '')) return alert('공백만으로는 카테고리를 추가할 수 없습니다.');
    if (!categories[key]) categories[key] = { label: key.toUpperCase(), values: [] };
    if (categories[key].values.includes(value)) return alert('이미 존재하는 카테고리입니다.');
    categories[key].values.push(value);
    await saveSettings();
    renderCategoryTypes();
    input.value = '';
    alert(`"${value}" 카테고리가 추가되었습니다.`);
}

window.deleteCategoryValue = async function(key) {
    const select = document.getElementById(`category${key}Delete`);
    if (!select) return alert('삭제할 항목을 선택하세요.');
    const selectedValue = select.value;
    if (!selectedValue) return alert('삭제할 항목을 선택하세요.');
    if (!confirm(`"${selectedValue}" 카테고리를 삭제하시겠습니까?`)) return;
    categories[key].values = categories[key].values.filter(v => v !== selectedValue);
    await saveSettings();
    renderCategoryTypes();
    alert(`"${selectedValue}" 카테고리가 삭제되었습니다.`);
}

// ========================================
// 테이블 관리
// ========================================
function renderTableColumns() {
    const container = document.getElementById('tableDataContainer');
    if (!container) return;

    container.innerHTML = tableColumns.map(col => `
        <div class="form-group">
            <label for="table${col.id}">
                ${col.label}
                <button type="button" onclick="deleteTableColumn('${col.id}')" 
                        style="margin-left:10px;padding:2px 8px;background:#f44336;color:white;border:none;border-radius:3px;cursor:pointer;font-size:11px;">
                    삭제
                </button>
            </label>
            <input type="text" id="table${col.id}" placeholder="${col.placeholder || ''}">
        </div>
    `).join('');
}

window.addTableColumn = async function() {
    const input = document.getElementById('newTableColumn');
    if (!input) return alert('입력 요소를 찾을 수 없습니다.');
    const label = input.value.trim();
    if (!label) return alert('항목명을 입력하세요.');

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

    tableColumns.push({ id: id, label: label, placeholder: '' });
    await saveSettings();
    renderTableColumns();
    input.value = '';
    alert(`"${label}" 항목이 추가되었습니다.`);
}

window.deleteTableColumn = async function(id) {
    const column = tableColumns.find(col => col.id === id);
    if (!column) return;
    if (!confirm(`"${column.label}" 항목을 삭제하시겠습니까?`)) return;
    tableColumns = tableColumns.filter(col => col.id !== id);
    await saveSettings();
    renderTableColumns();
    alert(`"${column.label}" 항목이 삭제되었습니다.`);
}

// ========================================
// 페이지 초기화
// ========================================
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
                Object.keys(data).forEach(key => {
                    const raw = data[key] || {};
                    let marks = raw.marks;
                    if (marks && !Array.isArray(marks) && typeof marks === 'object') {
                        marks = Object.keys(marks).map(k => marks[k]);
                    }
                    const product = {
                        ...raw,
                        marks: Array.isArray(marks) ? marks : (marks ? [marks] : []),
                        _key: key
                    };
                    products.push(product);
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

// ========================================
// 제품 편집
// ========================================
window.editProduct = function(index) {
    if (!products || !products[index]) return;
    const product = products[index];

    editingIndex = index;
    editingKey = product._key || null;

    document.getElementById('productName').value = product.name || '';
    document.getElementById('productNumber').value = product.productNumber || '';
    document.getElementById('productSpecs').value = product.specs || '';

    // tableData 로드
    if (product.tableData && typeof product.tableData === 'object') {
        tableColumns.forEach(col => {
            const input = document.getElementById(`table${col.id}`);
            if (input) input.value = product.tableData[col.id] || '';
        });
    } else {
        tableColumns.forEach(col => {
            const input = document.getElementById(`table${col.id}`);
            if (input) input.value = '';
        });
    }

    // categories 로드
    if (product.categories) {
        Object.keys(categories).forEach(key => {
            if (key === 'productType') {
                const mainSel = document.getElementById('categoryproductType');
                if (mainSel) mainSel.value = product.categories[key] || '';
            } else {
                const select = document.getElementById(`category${key}`);
                if (select) select.value = product.categories[key] || '';
            }
        });
    } else {
        Object.keys(categories).forEach(key => {
            if (key === 'productType') {
                const mainSel = document.getElementById('categoryproductType');
                if (mainSel) mainSel.value = '';
            } else {
                const select = document.getElementById(`category${key}`);
                if (select) select.value = '';
            }
        });
    }

    // specsList 로드
    specsList = Array.isArray(product.specsList) ? [...product.specsList] : [];
    updateSpecsList();

    // marks 로드
    let marks = product.marks;
    if (marks && !Array.isArray(marks) && typeof marks === 'object') {
        marks = Object.keys(marks).map(k => marks[k]);
    }
    productMarks = Array.isArray(marks) ? [...marks] : [];
    renderProductMarks();

    const thumbInput = document.getElementById('thumbnailInput');
    const detailInput = document.getElementById('detailImagesInput');
    if (thumbInput) thumbInput.removeAttribute('required');
    if (detailInput) detailInput.removeAttribute('required');

    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) submitBtn.textContent = '제품 수정 완료';

    showTab('add');

    alert('제품 정보를 수정한 후 "제품 수정 완료" 버튼을 클릭하세요.\n(이미지를 변경하지 않으려면 파일을 선택하지 마세요)');
}

window.deleteProduct = async function(index) {
    if (!confirm('정말로 이 제품을 삭제하시겠습니까?')) return;
    try {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) loadingMessage.style.display = 'block';
        const product = products[index];
        if (product && product._key) {
            await database.ref(`products/${product._key}`).remove();
            alert('제품이 삭제되었습니다!');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('삭제 실패: ' + (error.message || error));
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
            const categoryText = product.categories
                ? Object.keys(categories)
                      .map(key => product.categories[key] || '')
                      .filter(v => v)
                      .join(' / ')
                : '';

            return `
                <div style="border:1px solid #ddd;border-radius:8px;overflow:hidden;background:white;">
                    <img src="${product.thumbnail || 'img/placeholder.jpg'}" alt="${product.name || ''}" 
                         style="width:100%;height:200px;object-fit:cover;"
                         onerror="this.src='img/placeholder.jpg';">
                    <div style="padding:15px;">
                        <h4 style="margin:0 0 5px 0;">${product.name || ''}</h4>
                        ${product.productNumber ? `<p style="margin:0 0 10px 0;color:#999;font-size:12px;">${product.productNumber}</p>` : ''}
                        <p style="margin:0 0 10px 0;color:#666;font-size:13px;">${product.specs ? product.specs.replace(/\n/g, ' / ') : ''}</p>
                        <small style="color:#999;display:block;margin-bottom:15px;">${categoryText}</small>
                        <div style="display:flex;gap:10px;">
                            <button onclick="editProduct(${index})" 
                                    style="flex:1;padding:8px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">수정</button>
                            <button onclick="deleteProduct(${index})" 
                                    style="flex:1;padding:8px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">삭제</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        manageListEl.innerHTML = '<p style="color:#999;text-align:center;">등록된 제품이 없습니다.</p>';
    }
}

// ========================================
// 이미지 업로드 미리보기
// ========================================
window.handleThumbnailUpload = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('thumbnailPreview');
        if (preview) preview.innerHTML = `<img src="${e.target.result}" style="max-width:200px;max-height:200px;border-radius:5px;">`;
    };
    reader.readAsDataURL(file);
}

window.handleDetailImagesUpload = function(event) {
    const files = Array.from(event.target.files || []);
    const previewContainer = document.getElementById('detailImagesPreview');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML += `<img src="${e.target.result}" style="max-width:150px;max-height:150px;margin:5px;border-radius:5px;">`;
        };
        reader.readAsDataURL(file);
    });
}

// ========================================
// specs 리스트 관리
// ========================================
window.addSpec = function() {
    const specInput = document.getElementById('specInput');
    if (!specInput) return;
    const spec = specInput.value.trim();
    if (spec) {
        specsList.push(spec);
        updateSpecsList();
        specInput.value = '';
    }
}

function updateSpecsList() {
    const specsListEl = document.getElementById('specsList');
    if (!specsListEl) return;
    specsListEl.innerHTML = specsList.map((spec, index) => `
        <li style="padding:5px 0;">
            ${spec}
            <button onclick="removeSpec(${index})" style="color:red;margin-left:10px;cursor:pointer;border:none;background:none;">삭제</button>
        </li>
    `).join('');
}

window.removeSpec = function(index) {
    if (index < 0 || index >= specsList.length) return;
    specsList.splice(index, 1);
    updateSpecsList();
}

// ========================================
// 유효성 검증
// ========================================
function validateProductForm() {
    const errors = [];

    const productNameEl = document.getElementById('productName');
    const productName = productNameEl ? productNameEl.value.trim() : '';
    if (!productName) errors.push('제품명을 입력하세요.');

    const productTypeEl = document.getElementById('categoryproductType');
    const productType = productTypeEl ? productTypeEl.value : '';
    if (!productType) errors.push('대분류를 선택하세요.');

    if (editingIndex === null) {
        const thumbnailInput = document.getElementById('thumbnailInput');
        const detailImagesInput = document.getElementById('detailImagesInput');

        if (!thumbnailInput || !thumbnailInput.files || thumbnailInput.files.length === 0) {
            errors.push('썸네일 이미지를 업로드하세요.');
        }
        if (!detailImagesInput || !detailImagesInput.files || detailImagesInput.files.length === 0) {
            errors.push('상세 이미지를 업로드하세요.');
        }
    }

    if (errors.length > 0) {
        alert('다음 항목을 확인하세요:\n\n' + errors.map((e, i) => `${i+1}. ${e}`).join('\n'));
        return false;
    }
    return true;
}

// ========================================
// 폼 제출 (수정된 버전 - tableData 구조 보존)
// ========================================
async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('🚀 폼 제출 시작');
    console.log('📦 현재 productMarks:', productMarks);
    console.log('📦 productMarks 길이:', productMarks.length);

    if (!validateProductForm()) return;

    const thumbnailInput = document.getElementById('thumbnailInput');
    const detailImagesInput = document.getElementById('detailImagesInput');
    const form = document.getElementById('productForm');
    const loading = document.getElementById('loadingMessage');
    if (loading) loading.style.display = 'block';

    try {
        // 이미지 업로드
        let thumbnailPath = '';
        let detailPaths = [];

        if (editingIndex !== null && products[editingIndex]) {
            // ========== 수정 모드 ==========
            const currentProduct = products[editingIndex];

            // 썸네일
            if (thumbnailInput?.files?.length) {
                thumbnailPath = await uploadImageToFirebase(thumbnailInput.files[0], 'thumbnails');
            } else {
                thumbnailPath = currentProduct.thumbnail || '';
            }

            // 상세이미지
            if (detailImagesInput?.files?.length) {
                for (const file of detailImagesInput.files) {
                    const path = await uploadImageToFirebase(file, 'details');
                    detailPaths.push(path);
                }
            } else {
                detailPaths = Array.isArray(currentProduct.detailImages)
                    ? [...currentProduct.detailImages]
                    : [];
            }

            // 🔹 기존 tableData 복사 후 업데이트 (기존 필드 보존)
            const tableData = currentProduct.tableData ? {...currentProduct.tableData} : {};
            tableColumns.forEach(col => {
                const input = document.getElementById(`table${col.id}`);
                if (input) {
                    tableData[col.id] = input.value || '-';
                }
            });

            // 🔹 카테고리 객체 생성
            const productCategories = {};
            Object.keys(categories).forEach(key => {
                if (key === 'productType') {
                    const main = document.getElementById('categoryproductType');
                    productCategories[key] = main ? (main.value || '') : '';
                } else {
                    const select = document.getElementById(`category${key}`);
                    productCategories[key] = select ? (select.value || '') : '';
                }
            });

            // 🔹 기존 데이터를 기반으로 업데이트 (모든 필드 보존)
            const updatedProduct = {
                ...currentProduct,  // 🔥 기존 모든 필드 보존
                name: document.getElementById('productName').value || '',
                productNumber: document.getElementById('productNumber').value || '',
                thumbnail: thumbnailPath,
                detailImages: detailPaths,
                specs: document.getElementById('productSpecs').value || '',
                specsList: Array.isArray(specsList) ? specsList : [],
                categories: productCategories,
                tableData: tableData,
                marks: Array.isArray(productMarks) ? productMarks : [],
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };

            // 🔥 _key 필드는 Firebase에 저장하지 않음
            delete updatedProduct._key;

            console.log('🔄 업데이트할 데이터:', updatedProduct);
            console.log('📦 저장될 marks:', updatedProduct.marks);
            console.log('📦 marks 배열 길이:', updatedProduct.marks.length);

            // Firebase 업데이트
            await database.ref(`products/${editingKey}`).set(updatedProduct);

            alert('제품이 수정되었습니다!');

        } else {
            // ========== 추가 모드 ==========
            if (thumbnailInput?.files?.length) {
                thumbnailPath = await uploadImageToFirebase(thumbnailInput.files[0], 'thumbnails');
            }
            if (detailImagesInput?.files?.length) {
                for (const file of detailImagesInput.files) {
                    const path = await uploadImageToFirebase(file, 'details');
                    detailPaths.push(path);
                }
            }

            // 🔹 tableData 객체 생성
            const tableData = {};
            tableColumns.forEach(col => {
                const input = document.getElementById(`table${col.id}`);
                tableData[col.id] = input ? (input.value || '-') : '-';
            });

            // 🔹 카테고리 객체 생성
            const productCategories = {};
            Object.keys(categories).forEach(key => {
                if (key === 'productType') {
                    const main = document.getElementById('categoryproductType');
                    productCategories[key] = main ? (main.value || '') : '';
                } else {
                    const select = document.getElementById(`category${key}`);
                    productCategories[key] = select ? (select.value || '') : '';
                }
            });

            const productData = {
                name: document.getElementById('productName').value || '',
                productNumber: document.getElementById('productNumber').value || '',
                thumbnail: thumbnailPath,
                detailImages: detailPaths,
                specs: document.getElementById('productSpecs').value || '',
                specsList: Array.isArray(specsList) ? specsList : [],
                categories: productCategories,
                tableData: tableData,  // 🔹 tableData 구조로 저장
                marks: Array.isArray(productMarks) ? productMarks : [],
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            console.log('➕ 추가할 데이터:', productData);

            await database.ref('products').push(productData);
            alert('제품이 추가되었습니다!');
        }

        // 폼 초기화
        if (form) form.reset();
        document.getElementById('thumbnailPreview').innerHTML = '';
        document.getElementById('detailImagesPreview').innerHTML = '';
        specsList = [];
        updateSpecsList();
        productMarks = [];
        renderProductMarks();

        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.style.display = 'block';
            setTimeout(() => { successMessage.style.display = 'none'; }, 3000);
        }

        editingIndex = null;
        editingKey = null;
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) submitBtn.textContent = '제품 추가';

    } catch (error) {
        console.error('Error:', error);
        alert('오류 발생: ' + (error.message || error));
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// ========================================
// 탭 전환 및 제품 리스트
// ========================================
window.showTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) tabContent.classList.add('active');

    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabButton) tabButton.classList.add('active');

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
            const categoryText = product.categories ? Object.keys(categories).map(key => product.categories[key] || '').filter(v => v).join(' / ') : '';
            return `
                <div class="product-item" style="display:flex;align-items:center;padding:15px;border-bottom:1px solid #ddd;">
                    <img src="${product.thumbnail || 'img/placeholder.jpg'}" alt="${product.name || ''}" 
                         style="width:80px;height:80px;object-fit:cover;margin-right:20px;border-radius:5px;"
                         onerror="this.src='img/placeholder.jpg';">
                    <div>
                        <h4 style="margin:0 0 5px 0;">${product.name || ''}</h4>
                        ${product.productNumber ? `<p style="margin:0 0 5px 0;color:#999;font-size:12px;">${product.productNumber}</p>` : ''}
                        <p style="margin:0;color:#666;font-size:14px;">${product.specs ? product.specs.replace(/\n/g, ' / ') : ''}</p>
                        <small style="color:#999;">${categoryText}</small>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        productListEl.innerHTML = '<p style="text-align:center;color:#999;">등록된 제품이 없습니다.</p>';
    }
}