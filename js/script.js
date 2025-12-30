// ========================================
// 전역 변수
// ========================================
let selectedFilters = {
    productType: 'ALL',
};
let searchKeyword = '';
let currentPage = 1;
const itemsPerPage = 30;

// Firebase에서 로드한 카테고리와 테이블 설정
let loadedCategories = {};
let loadedTableColumns = [];

// ========================================
// 제품 필터링 함수
// ========================================
function filterProducts() {
    return products.filter(product => {
        // 검색어 필터
        if (searchKeyword) {
            const keyword = searchKeyword.toLowerCase();
            const nameMatch = product.name.toLowerCase().includes(keyword);
            const specsMatch = product.specs && product.specs.toLowerCase().includes(keyword);
            const numberMatch = product.productNumber && product.productNumber.toLowerCase().includes(keyword);
            if (!nameMatch && !specsMatch && !numberMatch) {
                return false;
            }
        }

        // 대분류 필터
        if (selectedFilters.productType && selectedFilters.productType !== 'ALL') {
            if (!product.categories || product.categories.productType !== selectedFilters.productType) {
                return false;
            }
        }

        // 동적 카테고리 필터
        for (let key in selectedFilters) {
            if (key === 'productType') continue;
            
            if (Array.isArray(selectedFilters[key]) && selectedFilters[key].length > 0) {
                if (!product.categories || !selectedFilters[key].includes(product.categories[key])) {
                    return false;
                }
            }
        }

        return true;
    });
}

// ========================================
// 페이지네이션 HTML 생성
// ========================================
function createPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return '';
    
    let paginationHTML = '<div class="pagination">';
    
    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentPage - 1})" class="page-btn">이전</button>`;
    }
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button onclick="changePage(1)" class="page-btn">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="page-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="changePage(${i})" class="page-btn">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
        paginationHTML += `<button onclick="changePage(${totalPages})" class="page-btn">${totalPages}</button>`;
    }
    
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentPage + 1})" class="page-btn">다음</button>`;
    }
    
    paginationHTML += '</div>';
    return paginationHTML;
}

function changePage(page) {
    currentPage = page;
    createProductCards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// 제품 카드 생성 (카테고리 버튼 포함)
// ========================================
function createProductCards() {
    const productGrid = document.getElementById('productGrid');
    const mainContent = document.querySelector('.main-content');
    
    let paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer) {
        paginationContainer.remove();
    }
    
    productGrid.innerHTML = '';
    
    const filteredProducts = filterProducts();

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #999;">
                <h3 style="font-size: 20px; margin-bottom: 10px;">검색 결과가 없습니다</h3>
                <p>다른 조건으로 검색해 보세요</p>
            </div>
        `;
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    paginatedProducts.forEach((product) => {
        const originalIndex = products.indexOf(product);
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => showDetail(originalIndex);
        
        // 카테고리 버튼 HTML 생성
        let categoryButtonsHTML = '';
        if (product.categories) {
            const categoryButtons = [];
            
            Object.keys(loadedCategories).forEach(key => {
                if (key !== 'productType' && product.categories[key]) {
                    const value = product.categories[key];
                    const colors = {
                        watt: { bg: '#e3f2fd', border: '#2196F3', color: '#2196F3' },
                        cct: { bg: '#fff3e0', border: '#FF9800', color: '#FF9800' },
                        ip: { bg: '#e8f5e9', border: '#4CAF50', color: '#4CAF50' }
                    };
                    
                    const colorScheme = colors[key] || { bg: '#f5f5f5', border: '#999', color: '#666' };
                    
                    categoryButtons.push(`
                        <button class="category-btn" 
                                onclick="event.stopPropagation(); filterByCategory('${key}', '${value}')" 
                                style="padding: 3px 8px; font-size: 11px; 
                                       background: ${colorScheme.bg}; 
                                       border: 1px solid ${colorScheme.border}; 
                                       border-radius: 3px; cursor: pointer; 
                                       color: ${colorScheme.color};">
                            ${value}
                        </button>
                    `);
                }
            });
            
            if (categoryButtons.length > 0) {
                categoryButtonsHTML = `
                    <div class="category-buttons" style="display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap;">
                        ${categoryButtons.join('')}
                    </div>
                `;
            }
        }
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.thumbnail}" 
                     alt="${product.name}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-specs">${product.specs ? product.specs.replace(/\n/g, '<br>') : ''}</div>
                ${categoryButtonsHTML}
            </div>
        `;
        
        productGrid.appendChild(card);
    });
    
    paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    paginationContainer.innerHTML = createPagination(filteredProducts.length);
    mainContent.appendChild(paginationContainer);
}

function resetToFirstPage() {
    currentPage = 1;
    createProductCards();
}

function setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchKeyword = this.value.trim();
                resetToFirstPage();
            }
        });

        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchKeyword = this.value.trim();
                resetToFirstPage();
            }, 500);
        });
    }

    const searchIcon = document.querySelector('.search-box span');
    if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', function() {
            searchKeyword = searchInput.value.trim();
            resetToFirstPage();
        });
    }
}

// ========================================
// 상세 페이지 (Firebase 연동 + 제품별 마크)
// ========================================
function showDetail(index) {
    const product = products[index];
    const detailContent = document.getElementById('detailContent');
    if (!product || !detailContent) return;

    // 브라우저 히스토리에 상태 추가 (뒤로가기 지원)
    history.pushState({ page: 'detail', productIndex: index }, '', `#product-${index}`);

    console.log('🔍 상세 페이지 제품 데이터:', product);
    console.log('📦 제품 마크:', product.marks);

    // -----------------------------
    // 썸네일 이미지 (메인 + 상세)
    // -----------------------------
    let thumbnailsHTML = `
        <div class="thumbnail-item active" onclick="changeMainImage('${product.thumbnail}', event)">
            <img src="${product.thumbnail}" alt="Main">
        </div>
    `;

    if (product.detailImages && product.detailImages.length > 0) {
        product.detailImages.forEach(img => {
            thumbnailsHTML += `
                <div class="thumbnail-item" onclick="changeMainImage('${img}', event)">
                    <img src="${img}" alt="Detail">
                </div>
            `;
        });
    }

    // -----------------------------
    // 제품 정보 테이블
    // -----------------------------
    let tableRowsHTML = '';
    if (product.tableData && loadedTableColumns && loadedTableColumns.length > 0) {
        tableRowsHTML = loadedTableColumns.map(col => `
            <tr>
                <td class="spec-label">${col.label}</td>
                <td class="spec-value">${product.tableData[col.id] || '-'}</td>
            </tr>
        `).join('');
    }

    // -----------------------------
    // 제품별 마크 생성
    // -----------------------------
    let marksHTML = '';
    if (product.marks && Array.isArray(product.marks) && product.marks.length > 0) {
        console.log('✅ 마크 렌더링 시작:', product.marks.length, '개');
        marksHTML = product.marks.map(mark => {
            if (!mark) return '';
            console.log('🖼️ 마크:', mark.name, '이미지:', mark.imageUrl);
            return `
                <div class="icon-wrapper">
                    <div class="icon-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px;">
                        ${mark.imageUrl ? `
                            <img src="${mark.imageUrl}" 
                                 style="width: 50px; height: 50px; object-fit: contain;"
                                 onerror="this.style.display='none'">
                        ` : ''}
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');
    } else {
        console.log('⚠️ 마크 없음');
        marksHTML = '';
    }

    // -----------------------------
    // 전체 HTML 구성
    // -----------------------------
    detailContent.innerHTML = `
        <div class="detail-header-bar">
            <h1 class="detail-title-text">${product.name}</h1>
            <div class="detail-header-buttons">
                <button class="btn-back" onclick="goBack()">◀ BACK TO LIST</button>
                <button class="btn-specsheet" onclick="downloadPDF(${index})">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF 다운로드
                </button>
            </div>
        </div>

        <div class="divider-line"></div>

        <div class="detail-main-layout">
            <!-- 왼쪽: 마크 + 스펙 테이블 -->
            <div class="detail-left-section">
                <div class="icon-grid">
                    ${marksHTML}
                </div>

                <div class="spec-table-section">
                    <h2 class="spec-title">제품 정보</h2>
                    <table class="spec-table">
                        ${tableRowsHTML}
                    </table>
                </div>
            </div>

            <!-- 오른쪽: 메인 이미지 + 썸네일 (크기 고정) -->
            <div class="detail-right-section" style="flex-shrink: 0; width: 600px;">
                <div class="main-product-image" style="width: 100%; height: 500px; display: flex; align-items: center; justify-content: center; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; position: relative;">
                    <img id="mainProductImg" src="${product.thumbnail}" alt="${product.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <div class="thumbnails-scroll">
                    ${thumbnailsHTML}
                </div>
            </div>
        </div>
    `;

    document.getElementById('listPage').classList.add('hidden');
    document.getElementById('detailPage').classList.add('active');
    window.scrollTo(0, 0);
}

// ========================================
// 메인 이미지 변경
// ========================================
window.changeMainImage = function (src, event) {
    const mainImg = document.getElementById('mainProductImg');
    if (mainImg) mainImg.src = src;

    document.querySelectorAll('.thumbnail-item').forEach(item => item.classList.remove('active'));
    if (event?.currentTarget) event.currentTarget.classList.add('active');
};

function goBack() {
    document.getElementById('detailPage').classList.remove('active');
    document.getElementById('listPage').classList.remove('hidden');
    window.scrollTo(0, 0);

    // URL 해시 제거
    if (window.location.hash) {
        history.pushState({ page: 'list' }, '', window.location.pathname);
    }
}

// 브라우저 뒤로가기/앞으로가기 버튼 처리
window.addEventListener('popstate', function(event) {
    const detailPage = document.getElementById('detailPage');
    const listPage = document.getElementById('listPage');

    if (event.state && event.state.page === 'detail') {
        // 앞으로 가기로 상세페이지 접근
        if (typeof event.state.productIndex === 'number') {
            showDetailWithoutHistory(event.state.productIndex);
        }
    } else {
        // 뒤로가기: 리스트 페이지로 복귀
        detailPage.classList.remove('active');
        listPage.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
});

// 히스토리 추가 없이 상세페이지 표시 (popstate용)
function showDetailWithoutHistory(index) {
    const product = products[index];
    const detailContent = document.getElementById('detailContent');
    if (!product || !detailContent) return;

    // showDetail과 동일한 렌더링 로직 (history.pushState 제외)
    // 기존 showDetail 함수 내용 재사용
    let thumbnailsHTML = `
        <div class="thumbnail-item active" onclick="changeMainImage('${product.thumbnail}', event)">
            <img src="${product.thumbnail}" alt="Main">
        </div>
    `;

    if (product.detailImages && product.detailImages.length > 0) {
        product.detailImages.forEach(img => {
            thumbnailsHTML += `
                <div class="thumbnail-item" onclick="changeMainImage('${img}', event)">
                    <img src="${img}" alt="Detail">
                </div>
            `;
        });
    }

    let tableRowsHTML = '';
    if (product.tableData && loadedTableColumns && loadedTableColumns.length > 0) {
        tableRowsHTML = loadedTableColumns.map(col => `
            <tr>
                <td class="spec-label">${col.label}</td>
                <td class="spec-value">${product.tableData[col.id] || '-'}</td>
            </tr>
        `).join('');
    }

    let marksHTML = '';
    if (product.marks && Array.isArray(product.marks) && product.marks.length > 0) {
        marksHTML = product.marks.map(mark => {
            if (!mark) return '';
            return `
                <div class="icon-wrapper">
                    <div class="icon-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px;">
                        ${mark.imageUrl ? `
                            <img src="${mark.imageUrl}"
                                 style="width: 50px; height: 50px; object-fit: contain;"
                                 onerror="this.style.display='none'">
                        ` : ''}
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');
    }

    detailContent.innerHTML = `
        <div class="detail-header-bar">
            <h1 class="detail-title-text">${product.name}</h1>
            <div class="detail-header-buttons">
                <button class="btn-back" onclick="goBack()">◀ BACK TO LIST</button>
                <button class="btn-specsheet" onclick="downloadPDF(${index})">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF 다운로드
                </button>
            </div>
        </div>

        <div class="divider-line"></div>

        <div class="detail-main-layout">
            <div class="detail-left-section">
                <div class="icon-grid">
                    ${marksHTML}
                </div>

                <div class="spec-table-section">
                    <h2 class="spec-title">제품 정보</h2>
                    <table class="spec-table">
                        ${tableRowsHTML}
                    </table>
                </div>
            </div>

            <div class="detail-right-section" style="flex-shrink: 0; width: 600px;">
                <div class="main-product-image" style="width: 100%; height: 500px; display: flex; align-items: center; justify-content: center; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; position: relative;">
                    <img id="mainProductImg" src="${product.thumbnail}" alt="${product.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <div class="thumbnails-scroll">
                    ${thumbnailsHTML}
                </div>
            </div>
        </div>
    `;

    document.getElementById('listPage').classList.add('hidden');
    document.getElementById('detailPage').classList.add('active');
    window.scrollTo(0, 0);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function toggleFilterGroup(element) {
    element.classList.toggle('collapsed');
    const content = element.nextElementSibling;
    content.classList.toggle('collapsed');
}

function addResetButton() {
    const sidebar = document.querySelector('.sidebar');
    const existingBtn = sidebar.querySelector('.reset-filter-btn');
    if (existingBtn) existingBtn.remove();
    
    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-filter-btn';
    resetBtn.textContent = '필터 초기화';
    resetBtn.style.cssText = `width: 100%; padding: 12px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; font-size: 14px;`;
    
    resetBtn.addEventListener('click', function() {
        document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) searchInput.value = '';
        
        selectedFilters = { productType: 'ALL' };
        Object.keys(loadedCategories).forEach(key => {
            if (key !== 'productType') selectedFilters[key] = [];
        });
        searchKeyword = '';
        
        if (typeof selectProductType === 'function') {
            selectProductType('ALL');
        }
        
        resetToFirstPage();
    });
    
    sidebar.appendChild(resetBtn);
}

function extractUniqueCategories() {
    const categories = {};
    
    Object.keys(loadedCategories).forEach(key => {
        if (key !== 'productType') categories[key] = new Set();
    });
    
    if (typeof products !== 'undefined' && products.length > 0) {
        products.forEach(product => {
            if (product.categories) {
                Object.keys(loadedCategories).forEach(key => {
                    if (key !== 'productType' && product.categories[key]) {
                        categories[key].add(product.categories[key]);
                    }
                });
            }
        });
    }
    
    const result = {};
    Object.keys(categories).forEach(key => {
        result[key] = Array.from(categories[key]).sort((a, b) => {
            if (key === 'watt') {
                const aNum = parseInt(a.split('-')[0]);
                const bNum = parseInt(b.split('-')[0]);
                if (a === '30W+') return 1;
                if (b === '30W+') return -1;
                return aNum - bNum;
            } else if (key === 'cct') {
                const aNum = parseInt(a);
                const bNum = parseInt(b);
                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                if (!isNaN(aNum)) return -1;
                if (!isNaN(bNum)) return 1;
                return a.localeCompare(b);
            } else {
                return a.localeCompare(b);
            }
        });
    });
    
    return result;
}

function generateDynamicFilters() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const categories = extractUniqueCategories();
    sidebar.querySelectorAll('.filter-group, .reset-filter-btn').forEach(el => el.remove());
    
    let filterHTML = '<h3>제품</h3>';
    
    Object.keys(categories).forEach(key => {
        if (categories[key].length > 0) {
            const label = loadedCategories[key]?.label || key.toUpperCase();
            
            filterHTML += `
                <div class="filter-group">
                    <h4 onclick="toggleFilterGroup(this)">${label}</h4>
                    <div class="filter-group-content">
                        ${categories[key].map(value => `
                            <label>
                                <input type="checkbox" value="${value}" data-filter-type="${key}">
                                ${value}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
            
            if (!selectedFilters[key]) selectedFilters[key] = [];
        }
    });
    
    sidebar.innerHTML = filterHTML;
    addResetButton();
    setupDynamicFilterListeners();
}

function setupDynamicFilterListeners() {
    document.addEventListener('change', function(e) {
        if (e.target.matches('.filter-group input[type="checkbox"]')) {
            const checkbox = e.target;
            const filterType = checkbox.getAttribute('data-filter-type');
            const value = checkbox.value;
            
            if (!filterType) return;
            if (!selectedFilters[filterType]) selectedFilters[filterType] = [];
            
            if (checkbox.checked) {
                if (!selectedFilters[filterType].includes(value)) {
                    selectedFilters[filterType].push(value);
                }
            } else {
                const index = selectedFilters[filterType].indexOf(value);
                if (index > -1) selectedFilters[filterType].splice(index, 1);
            }
            
            resetToFirstPage();
        }
    });
}

function filterByCategory(filterType, value) {
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    const checkbox = document.querySelector(`input[data-filter-type="${filterType}"][value="${value}"]`);
    if (checkbox) {
        checkbox.checked = true;
        
        Object.keys(loadedCategories).forEach(key => {
            if (key !== 'productType') selectedFilters[key] = [];
        });
        
        selectedFilters[filterType] = [value];
        resetToFirstPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function refreshFilters() {
    generateDynamicFilters();
}

// ========================================
// 이미지 확대 기능 (전자상거래 스타일)
// ========================================
function initImageZoom() {
    console.log('🔍 initImageZoom 호출됨');
    
    // 모바일/태블릿에서는 확대 기능 비활성화
    if (window.innerWidth <= 1024) {
        console.log('📱 모바일/태블릿 화면 - 확대 기능 비활성화');
        return;
    }
    
    const mainImage = document.querySelector('.main-product-image img');
    const imageContainer = document.querySelector('.main-product-image');
    
    console.log('🖼️ 이미지 컨테이너:', imageContainer);
    console.log('🖼️ 메인 이미지:', mainImage);
    
    if (!mainImage || !imageContainer) {
        console.log('❌ 이미지 요소를 찾을 수 없음');
        return;
    }
    
    // 기존 요소 제거
    const oldLens = document.querySelector('.zoom-lens');
    const oldResult = document.querySelector('.zoom-result');
    if (oldLens) {
        console.log('🗑️ 기존 렌즈 제거');
        oldLens.remove();
    }
    if (oldResult) {
        console.log('🗑️ 기존 결과창 제거');
        oldResult.remove();
    }
    
    // 확대 렌즈 생성
    const zoomLens = document.createElement('div');
    zoomLens.className = 'zoom-lens';
    imageContainer.appendChild(zoomLens);
    console.log('✅ 확대 렌즈 생성됨');
    
    // 확대 결과 영역 생성
    const zoomResult = document.createElement('div');
    zoomResult.className = 'zoom-result';
    imageContainer.parentElement.appendChild(zoomResult);
    console.log('✅ 확대 결과 영역 생성됨');
    
    function setupZoom() {
        const cx = zoomResult.offsetWidth / zoomLens.offsetWidth;
        const cy = zoomResult.offsetHeight / zoomLens.offsetHeight;
        
        zoomResult.style.backgroundImage = `url('${mainImage.src}')`;
        zoomResult.style.backgroundSize = `${mainImage.width * cx}px ${mainImage.height * cy}px`;
        
        console.log('🔧 줌 설정 완료:', {
            cx: cx,
            cy: cy,
            imageWidth: mainImage.width,
            imageHeight: mainImage.height,
            backgroundSize: zoomResult.style.backgroundSize
        });
    }
    
    // 이미지 로드 완료 후 설정
    if (mainImage.complete) {
        console.log('✅ 이미지 이미 로드됨');
        setupZoom();
    } else {
        console.log('⏳ 이미지 로딩 대기 중...');
        mainImage.addEventListener('load', setupZoom);
    }
    
    // 마우스 이벤트
    imageContainer.addEventListener('mouseenter', function() {
        console.log('🖱️ 마우스 진입');
        zoomLens.style.display = 'block';
        zoomResult.style.display = 'block';
        setupZoom();
    });
    
    imageContainer.addEventListener('mouseleave', function() {
        console.log('🖱️ 마우스 나감');
        zoomLens.style.display = 'none';
        zoomResult.style.display = 'none';
    });
    
    imageContainer.addEventListener('mousemove', function(e) {
        e.preventDefault();
        
        const rect = imageContainer.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        // 렌즈 위치 조정
        x = x - (zoomLens.offsetWidth / 2);
        y = y - (zoomLens.offsetHeight / 2);
        
        // 경계 체크
        if (x > imageContainer.offsetWidth - zoomLens.offsetWidth) {
            x = imageContainer.offsetWidth - zoomLens.offsetWidth;
        }
        if (x < 0) x = 0;
        if (y > imageContainer.offsetHeight - zoomLens.offsetHeight) {
            y = imageContainer.offsetHeight - zoomLens.offsetHeight;
        }
        if (y < 0) y = 0;
        
        // 렌즈 이동
        zoomLens.style.left = x + 'px';
        zoomLens.style.top = y + 'px';
        
        // 확대 영역 배경 위치 조정
        const cx = zoomResult.offsetWidth / zoomLens.offsetWidth;
        const cy = zoomResult.offsetHeight / zoomLens.offsetHeight;
        
        zoomResult.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
    });
    
    console.log('✅ 이미지 확대 기능 초기화 완료');
}

// ========================================
// PDF 스펙시트 다운로드
// ========================================
async function downloadPDF(index) {
    // 제품 데이터 유효성 검사
    if (typeof products === 'undefined' || !Array.isArray(products)) {
        alert('제품 데이터를 불러오지 못했습니다.\n페이지를 새로고침 해주세요.');
        return;
    }

    const product = products[index];
    if (!product) {
        alert('제품 정보를 찾을 수 없습니다.');
        return;
    }

    // 인터넷 연결 확인
    if (!navigator.onLine) {
        alert('인터넷 연결을 확인해주세요.');
        return;
    }

    console.log('📄 PDF 생성 시작...');

    // 로딩 오버레이 표시
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'pdfLoadingOverlay';
    loadingOverlay.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;">
            <div style="background:#fff;padding:40px 60px;border-radius:12px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                <div style="width:50px;height:50px;border:4px solid #f3f3f3;border-top:4px solid #333;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px;"></div>
                <div style="font-size:18px;font-weight:600;color:#333;margin-bottom:8px;">PDF 생성 중...</div>
                <div style="font-size:14px;color:#666;" id="pdfLoadingStatus">이미지를 처리하고 있습니다</div>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loadingOverlay);

    // 로딩 상태 업데이트 함수
    const updateLoadingStatus = (text) => {
        const statusEl = document.getElementById('pdfLoadingStatus');
        if (statusEl) statusEl.textContent = text;
    };

    // 로딩 제거 함수
    const removeLoading = () => {
        const overlay = document.getElementById('pdfLoadingOverlay');
        if (overlay) overlay.remove();
    };

    try {
        // 이미지를 프록시를 통해 Base64로 변환 (타임아웃 추가)
        const fetchImageAsBase64 = async (url, timeoutMs = 15000) => {
            if (!url) return null;

            try {
                // 프록시 서버를 통해 CORS 우회
                const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);

                console.log('📷 이미지 fetch 시도:', url.substring(0, 50));

                // 타임아웃 적용
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                const response = await fetch(proxyUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const blob = await response.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            console.log('✅ 이미지 Base64 변환 성공!');
                            resolve(reader.result);
                        };
                        reader.onerror = () => resolve(null);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (e) {
                if (e.name === 'AbortError') {
                    console.log('⚠️ 이미지 로딩 타임아웃:', url.substring(0, 50));
                } else {
                    console.log('⚠️ 프록시 fetch 실패:', e.message);
                }
            }
            return null;
        };

        // 메인 이미지 변환
        updateLoadingStatus('메인 이미지 처리 중...');
        let capturedImageBase64 = null;
        if (product.thumbnail) {
            capturedImageBase64 = await fetchImageAsBase64(product.thumbnail);
        }

        // 서브 이미지들 변환
        const capturedThumbnails = [];
        if (product.detailImages && product.detailImages.length > 0) {
            const detailCount = Math.min(product.detailImages.length, 3);
            for (let i = 0; i < detailCount; i++) {
                updateLoadingStatus(`상세 이미지 처리 중... (${i + 1}/${detailCount})`);
                const base64 = await fetchImageAsBase64(product.detailImages[i]);
                if (base64) {
                    capturedThumbnails.push(base64);
                }
            }
        }

        console.log('📄 이미지 변환 결과:', {
            mainImage: capturedImageBase64 ? '성공' : '실패',
            thumbnails: capturedThumbnails.length + '개'
        });

        // 마크 이미지들도 Base64로 변환
        updateLoadingStatus('마크 이미지 처리 중...');
        const marksWithBase64 = [];
        if (product.marks && Array.isArray(product.marks)) {
            for (const mark of product.marks) {
                if (mark && typeof mark === 'object') {
                    let markImageBase64 = null;
                    if (mark.imageUrl) {
                        markImageBase64 = await fetchImageAsBase64(mark.imageUrl);
                    }
                    marksWithBase64.push({
                        ...mark,
                        imageBase64: markImageBase64
                    });
                }
            }
        }
        console.log('📄 마크 이미지 변환:', marksWithBase64.length + '개');

        updateLoadingStatus('PDF 생성 준비 중...');

        // 디버깅: tableData 전체 출력
        console.log('📄 tableData 키 목록:', product.tableData ? Object.keys(product.tableData) : 'null');
        console.log('📄 tableData 전체:', product.tableData);
        console.log('📄 loadedTableColumns:', loadedTableColumns);

        // tableData에서 값 찾는 헬퍼 함수 (loadedTableColumns 활용)
        const getTableValue = (...targetLabels) => {
            if (!product.tableData) return '';

            for (const targetLabel of targetLabels) {
                const upperTarget = targetLabel.toUpperCase();

                // 1. loadedTableColumns에서 해당 라벨의 id 찾기
                if (loadedTableColumns && loadedTableColumns.length > 0) {
                    for (const col of loadedTableColumns) {
                        if (col.label) {
                            const upperLabel = col.label.toUpperCase();
                            // 정확히 일치하거나 포함되는 경우
                            if (upperLabel === upperTarget || upperLabel.includes(upperTarget) || upperTarget.includes(upperLabel)) {
                                if (product.tableData[col.id]) {
                                    console.log(`📄 매칭: "${targetLabel}" → col.id="${col.id}" → "${product.tableData[col.id]}"`);
                                    return product.tableData[col.id];
                                }
                            }
                        }
                    }
                }

                // 2. 직접 키 이름으로 검색
                if (product.tableData) {
                    const keys = Object.keys(product.tableData);
                    for (const key of keys) {
                        const upperKey = key.toUpperCase();
                        if (upperKey === upperTarget || upperKey.includes(upperTarget) || upperTarget.includes(upperKey)) {
                            console.log(`📄 직접 매칭: "${targetLabel}" → key="${key}" → "${product.tableData[key]}"`);
                            return product.tableData[key];
                        }
                    }
                }
            }

            return '';
        };

        // Firebase 제품 데이터를 specsheet-generator.js 형식으로 변환
        const productForPDF = {
            // 기본 정보
            name: product.name || '',
            modelNo: product.name || '',
            modelName: product.name || '',
            type: product.categories?.productType || '',
            category: product.categories?.productType || '',
            code: product.productNumber || product._key || '',
            productCode: product.productNumber || '',
            id: product._key || '',

            // tableData에서 스펙 정보 추출 (여러 키워드 순서대로 시도)
            size: getTableValue('SIZE', '사이즈', '크기', 'DIMENSION', '치수'),
            color: getTableValue('COLOR', '색상', '컬러', 'COLOUR'),
            finish: getTableValue('FINISH', '마감', '재질', 'MATERIAL', '소재'),
            lamp: getTableValue('LAMP', 'LED', '광원', '램프', 'LIGHT SOURCE', 'SOURCE'),
            beamAngle: getTableValue('BEAM ANGLE', 'BEAM', 'ANGLE', '각도', '조사각', '빔앵글'),
            cri: getTableValue('CRI', '연색', '연색성'),
            watt: getTableValue('WATT', 'W', '전력', '소비전력', 'POWER'),
            voltage: getTableValue('VOLTAGE', 'VOLT', '전압', 'INPUT'),
            ip: getTableValue('IP', '방수', '방수등급', 'PROTECTION'),
            cct: getTableValue('CCT', '색온도', 'COLOR TEMP', 'KELVIN'),

            // 캡처된 이미지 (Base64)
            mainImageBase64: capturedImageBase64,
            subImagesBase64: capturedThumbnails,
            thumbnail: product.thumbnail || '',

            // 마크 정보 (Base64 이미지 포함)
            marks: marksWithBase64,

            // 기타
            description: product.specs || '',
            note: product.specs || '',
            specs: product.specs || '',
            companyInfo: 'INTECH LIGHTING Co.,Ltd.'
        };

        // 디버깅: 변환된 데이터 출력
        console.log('📄 PDF용 변환 결과:', {
            size: productForPDF.size,
            color: productForPDF.color,
            finish: productForPDF.finish,
            lamp: productForPDF.lamp,
            beamAngle: productForPDF.beamAngle,
            cri: productForPDF.cri,
            marks: productForPDF.marks?.length || 0,
            images: productForPDF.images?.length || 0
        });

        // 로딩 제거
        removeLoading();

        // specsheet-generator.js의 PDF 다운로드 함수 호출
        if (typeof downloadSpecSheetPDF === 'function') {
            downloadSpecSheetPDF(productForPDF);
        } else {
            console.error('downloadSpecSheetPDF 함수를 찾을 수 없습니다.');
            alert('PDF 생성 기능을 불러오는 중 오류가 발생했습니다.\n페이지를 새로고침 후 다시 시도해주세요.');
        }

    } catch (error) {
        console.error('PDF 생성 오류:', error);
        removeLoading();

        // 사용자 친화적 에러 메시지
        let errorMsg = 'PDF 생성 중 오류가 발생했습니다.';
        if (error.message) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMsg = '네트워크 오류가 발생했습니다.\n인터넷 연결을 확인해주세요.';
            } else if (error.message.includes('timeout') || error.message.includes('시간')) {
                errorMsg = '처리 시간이 초과되었습니다.\n다시 시도해주세요.';
            } else if (error.message.includes('memory') || error.message.includes('메모리')) {
                errorMsg = '메모리가 부족합니다.\n다른 탭을 닫고 다시 시도해주세요.';
            } else {
                errorMsg += '\n' + error.message;
            }
        }
        alert(errorMsg);
    }
}

// 윈도우 리사이즈 시 재초기화
window.addEventListener('resize', function() {
    if (document.getElementById('detailPage') && document.getElementById('detailPage').classList.contains('active')) {
        const oldLens = document.querySelector('.zoom-lens');
        const oldResult = document.querySelector('.zoom-result');
        if (oldLens) oldLens.remove();
        if (oldResult) oldResult.remove();
        
        if (window.innerWidth > 1024) {
            setTimeout(() => initImageZoom(), 100);
        }
    }
});

// ========================================
// 페이지 초기화
// ========================================
window.addEventListener('DOMContentLoaded', function() {
    selectedFilters.productType = 'ALL';
    setupSearch();
    
    if (typeof database !== 'undefined') {
        // 설정(카테고리, 테이블) 로드
        database.ref('settings').once('value', (snapshot) => {
            const settings = snapshot.val();
            if (settings) {
                loadedCategories = settings.categories || {};
                loadedTableColumns = settings.tableColumns || [];
                
                console.log('✅ 카테고리 로드:', Object.keys(loadedCategories).length, '개');
                console.log('✅ 테이블 컬럼 로드:', loadedTableColumns.length, '개');
                
                Object.keys(loadedCategories).forEach(key => {
                    if (key !== 'productType') selectedFilters[key] = [];
                });
            }
        });
    }
    
    const checkDataInterval = setInterval(() => {
        if (typeof products !== 'undefined' && products.length > 0 && Object.keys(loadedCategories).length > 0) {
            clearInterval(checkDataInterval);
            console.log('✅ 데이터 준비 완료');
            generateDynamicFilters();
            createProductCards();
        }
    }, 100);
});