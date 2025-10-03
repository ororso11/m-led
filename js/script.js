// ========================================
// 전역 변수
// ========================================
let selectedFilters = {
    watt: [],
    cct: [],
    ip: []
};
let searchKeyword = '';
let currentPage = 1;
const itemsPerPage = 30; // 5x6 = 30개로 변경

// ========================================
// 제품 필터링 함수
// ========================================
function filterProducts() {
    return products.filter(product => {
        // 검색어 필터
        if (searchKeyword) {
            const keyword = searchKeyword.toLowerCase();
            const nameMatch = product.name.toLowerCase().includes(keyword);
            const specsMatch = product.specs.toLowerCase().includes(keyword);
            if (!nameMatch && !specsMatch) {
                return false;
            }
        }

        // WATT 필터
        if (selectedFilters.watt.length > 0) {
            if (!selectedFilters.watt.includes(product.categories.watt)) {
                return false;
            }
        }

        // CCT 필터
        if (selectedFilters.cct.length > 0) {
            if (!selectedFilters.cct.includes(product.categories.cct)) {
                return false;
            }
        }

        // IP 필터
        if (selectedFilters.ip.length > 0) {
            if (!selectedFilters.ip.includes(product.categories.ip)) {
                return false;
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
    
    // 이전 버튼
    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentPage - 1})" class="page-btn">이전</button>`;
    }
    
    // 페이지 번호 (최대 5개씩 표시)
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
    
    // 다음 버튼
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentPage + 1})" class="page-btn">다음</button>`;
    }
    
    paginationHTML += '</div>';
    return paginationHTML;
}

// ========================================
// 페이지 변경
// ========================================
function changePage(page) {
    currentPage = page;
    createProductCards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// 제품 카드 생성 함수
// ========================================
function createProductCards() {
    const productGrid = document.getElementById('productGrid');
    const mainContent = document.querySelector('.main-content');
    
    // 기존 페이지네이션 제거
    let paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer) {
        paginationContainer.remove();
    }
    
    productGrid.innerHTML = '';
    
    const filteredProducts = filterProducts();

    // 필터링 결과가 없을 때
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #999;">
                <h3 style="font-size: 20px; margin-bottom: 10px;">검색 결과가 없습니다</h3>
                <p>다른 조건으로 검색해 보세요</p>
            </div>
        `;
        return;
    }
    
    // 현재 페이지에 표시할 제품만 추출
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    paginatedProducts.forEach((product) => {
        // 원본 배열에서의 인덱스 찾기
        const originalIndex = products.indexOf(product);
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => showDetail(originalIndex);
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.thumbnail}" 
                     alt="${product.name}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-specs">${product.specs.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        
        productGrid.appendChild(card);
    });
    
    // 페이지네이션 추가
    paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    paginationContainer.innerHTML = createPagination(filteredProducts.length);
    mainContent.appendChild(paginationContainer);
}

// ========================================
// 필터 변경 시 첫 페이지로 리셋
// ========================================
function resetToFirstPage() {
    currentPage = 1;
    createProductCards();
}

// ========================================
// 필터 체크박스 변경 이벤트
// ========================================
function setupFilterListeners() {
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const value = this.parentElement.textContent.trim();
            const filterType = getFilterType(this);
            
            if (this.checked) {
                if (!selectedFilters[filterType].includes(value)) {
                    selectedFilters[filterType].push(value);
                }
            } else {
                const index = selectedFilters[filterType].indexOf(value);
                if (index > -1) {
                    selectedFilters[filterType].splice(index, 1);
                }
            }
            
            resetToFirstPage();
        });
    });
}

// ========================================
// 필터 타입 판별
// ========================================
function getFilterType(checkbox) {
    const filterGroup = checkbox.closest('.filter-group');
    const heading = filterGroup.querySelector('h4').textContent;
    
    if (heading === 'WATT') return 'watt';
    if (heading === 'CCT') return 'cct';
    if (heading === 'IP') return 'ip';
    
    return null;
}

// ========================================
// 검색 기능 설정
// ========================================
function setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    
    if (searchInput) {
        // 엔터 키 검색
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchKeyword = this.value.trim();
                resetToFirstPage();
            }
        });

        // 실시간 검색 (타이핑 후 500ms 후 자동 검색)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchKeyword = this.value.trim();
                resetToFirstPage();
            }, 500);
        });
    }

    // 검색 아이콘 클릭
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
// 상세 페이지 표시 함수
// ========================================
function showDetail(index) {
    const product = products[index];
    const detailContent = document.getElementById('detailContent');
    
    // 상세 이미지 HTML 생성
    let detailImagesHTML = '';
    product.detailImages.forEach(img => {
        detailImagesHTML += `
            <div class="detail-main-image">
                <img src="${img}" 
                     alt="${product.name}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EDetail Image%3C/text%3E%3C/svg%3E'">
            </div>
        `;
    });

    // 스펙 리스트 HTML 생성
    let specsListHTML = '';
    if (product.specsList) {
        product.specsList.forEach(spec => {
            specsListHTML += `<li>${spec}</li>`;
        });
    }

    // showDetail 함수 내 테이블 HTML 생성 부분 수정
    let tableHTML = '';
    if (product.tableData) {
        tableHTML = `
            <div class="detail-table-wrapper">
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Voltage</th>
                            <th>Current</th>
                            <th>Max. Output</th>
                            <th>Efficiency</th>
                            <th>Dimension</th>
                            <th>Guarantee</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${product.tableData.item}</td>
                            <td>${product.tableData.voltage}</td>
                            <td>${product.tableData.current}</td>
                            <td>${product.tableData.maxOutput}</td>
                            <td>${product.tableData.efficiency}</td>
                            <td>${product.tableData.dimension}</td>
                            <td>${product.tableData.guarantee}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // 전체 상세 페이지 내용 생성
    detailContent.innerHTML = `
        <h1 class="detail-title">${product.name}</h1>
        
        <div class="detail-images-section">
            ${detailImagesHTML}
            <div class="detail-specs-list">
                <h3>제품 사양</h3>
                <ul>
                    ${specsListHTML}
                </ul>
            </div>
        </div>

        ${tableHTML}

    `;

    // 페이지 전환
    document.getElementById('listPage').classList.add('hidden');
    document.getElementById('detailPage').classList.add('active');
    window.scrollTo(0, 0);
}

// ========================================
// 리스트 페이지로 돌아가기
// ========================================
function goBack() {
    document.getElementById('detailPage').classList.remove('active');
    document.getElementById('listPage').classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ========================================
// 사이드바 토글 (모바일)
// ========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// ========================================
// 필터 그룹 토글 함수
// ========================================
function toggleFilterGroup(element) {
    element.classList.toggle('collapsed');
    const content = element.nextElementSibling;
    content.classList.toggle('collapsed');
}

// ========================================
// 필터 초기화 버튼 추가
// ========================================
function addResetButton() {
    const sidebar = document.querySelector('.sidebar');
    const resetBtn = document.createElement('button');
    resetBtn.textContent = '필터 초기화';
    resetBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        background: #333;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 20px;
        font-size: 14px;
    `;
    
    resetBtn.addEventListener('click', function() {
        // 모든 체크박스 해제
        document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // 검색어 초기화
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // 필터 상태 초기화
        selectedFilters = {
            watt: [],
            cct: [],
            ip: []
        };
        searchKeyword = '';
        
        // 제품 다시 표시
        resetToFirstPage();
    });
    
    sidebar.appendChild(resetBtn);
}

// ========================================
// 페이지 로드 시 실행
// ========================================
window.onload = function() {
    createProductCards();
    setupFilterListeners();
    setupSearch();
    // addResetButton();
};

// script.js에 추가할 코드 - 동적 사이드바 생성

// 페이지 로드 시 동적으로 필터 생성
window.addEventListener('DOMContentLoaded', function() {
    generateDynamicFilters();
    setupDynamicFilterListeners();
});

// products.js에서 모든 고유한 카테고리 추출
function extractUniqueCategories() {
    const categories = {
        watt: new Set(),
        cct: new Set(),
        ip: new Set()
    };
    
    if (typeof products !== 'undefined' && products.length > 0) {
        products.forEach(product => {
            if (product.categories) {
                if (product.categories.watt) categories.watt.add(product.categories.watt);
                if (product.categories.cct) categories.cct.add(product.categories.cct);
                if (product.categories.ip) categories.ip.add(product.categories.ip);
            }
        });
    }
    
    // Set을 정렬된 배열로 변환
    return {
        watt: Array.from(categories.watt).sort((a, b) => {
            // 와트 정렬 (숫자 순서)
            const aNum = parseInt(a.split('-')[0]);
            const bNum = parseInt(b.split('-')[0]);
            if (a === '30W+') return 1;
            if (b === '30W+') return -1;
            return aNum - bNum;
        }),
        cct: Array.from(categories.cct).sort((a, b) => {
            // CCT 정렬 (숫자 → 특수값)
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            if (!isNaN(aNum)) return -1;
            if (!isNaN(bNum)) return 1;
            return a.localeCompare(b);
        }),
        ip: Array.from(categories.ip).sort() // IP 정렬 (문자열 순서)
    };
}

// 동적으로 필터 HTML 생성
function generateDynamicFilters() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const categories = extractUniqueCategories();
    
    // 기존 필터 그룹 제거 (있다면)
    sidebar.querySelectorAll('.filter-group').forEach(group => group.remove());
    
    // HTML 생성
    let filterHTML = '<h3>제품</h3>';
    
    // WATT 필터
    if (categories.watt.length > 0) {
        filterHTML += `
            <div class="filter-group">
                <h4 onclick="toggleFilterGroup(this)">WATT</h4>
                <div class="filter-group-content">
                    ${categories.watt.map(watt => `
                        <label>
                            <input type="checkbox" value="${watt}" data-filter-type="watt">
                            ${watt}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // CCT 필터
    if (categories.cct.length > 0) {
        filterHTML += `
            <div class="filter-group">
                <h4 onclick="toggleFilterGroup(this)">CCT</h4>
                <div class="filter-group-content">
                    ${categories.cct.map(cct => `
                        <label>
                            <input type="checkbox" value="${cct}" data-filter-type="cct">
                            ${cct}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // IP 필터
    if (categories.ip.length > 0) {
        filterHTML += `
            <div class="filter-group">
                <h4 onclick="toggleFilterGroup(this)">IP</h4>
                <div class="filter-group-content">
                    ${categories.ip.map(ip => `
                        <label>
                            <input type="checkbox" value="${ip}" data-filter-type="ip">
                            ${ip}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 사이드바에 삽입
    sidebar.innerHTML = filterHTML;
    
    // 필터 초기화 버튼 추가
    addResetButton();
}

// 제품 카드에 카테고리 버튼 추가
function addCategoryButtons() {
    document.querySelectorAll('.product-card').forEach((card, index) => {
        const product = products[index];
        if (!product || !product.categories) return;
        
        // 카테고리 버튼 컨테이너가 없으면 추가
        let categoryButtons = card.querySelector('.category-buttons');
        if (!categoryButtons) {
            categoryButtons = document.createElement('div');
            categoryButtons.className = 'category-buttons';
            categoryButtons.style.cssText = `
                display: flex;
                gap: 5px;
                margin-top: 10px;
                flex-wrap: wrap;
            `;
            card.querySelector('.product-info').appendChild(categoryButtons);
        }
        
        // 카테고리 버튼 추가
        categoryButtons.innerHTML = `
            ${product.categories.watt ? 
                `<button class="category-btn" onclick="filterByCategory('watt', '${product.categories.watt}')" 
                         style="padding: 3px 8px; font-size: 11px; background: #e3f2fd; border: 1px solid #2196F3; 
                                border-radius: 3px; cursor: pointer; color: #2196F3;">
                    ${product.categories.watt}
                </button>` : ''}
            ${product.categories.cct ? 
                `<button class="category-btn" onclick="filterByCategory('cct', '${product.categories.cct}')"
                         style="padding: 3px 8px; font-size: 11px; background: #fff3e0; border: 1px solid #FF9800;
                                border-radius: 3px; cursor: pointer; color: #FF9800;">
                    ${product.categories.cct}
                </button>` : ''}
            ${product.categories.ip ? 
                `<button class="category-btn" onclick="filterByCategory('ip', '${product.categories.ip}')"
                         style="padding: 3px 8px; font-size: 11px; background: #e8f5e9; border: 1px solid #4CAF50;
                                border-radius: 3px; cursor: pointer; color: #4CAF50;">
                    ${product.categories.ip}
                </button>` : ''}
        `;
    });
}

// 카테고리 버튼 클릭 시 필터 적용
function filterByCategory(filterType, value) {
    // 모든 체크박스 해제
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // 해당 카테고리 체크박스 체크
    const checkbox = document.querySelector(`input[data-filter-type="${filterType}"][value="${value}"]`);
    if (checkbox) {
        checkbox.checked = true;
        
        // 필터 상태 업데이트
        selectedFilters = {
            watt: [],
            cct: [],
            ip: []
        };
        selectedFilters[filterType] = [value];
        
        // 제품 카드 다시 생성
        resetToFirstPage();
        
        // 스크롤 위로
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 시각적 피드백
        highlightFilter(checkbox);
    }
}

// 필터 하이라이트 효과
function highlightFilter(checkbox) {
    const label = checkbox.parentElement;
    label.style.transition = 'background-color 0.3s';
    label.style.backgroundColor = '#ffeb3b';
    setTimeout(() => {
        label.style.backgroundColor = '';
    }, 500);
}

// 동적 필터 리스너 설정
function setupDynamicFilterListeners() {
    // 이벤트 위임 사용
    document.addEventListener('change', function(e) {
        if (e.target.matches('.filter-group input[type="checkbox"]')) {
            const checkbox = e.target;
            const filterType = checkbox.getAttribute('data-filter-type');
            const value = checkbox.value;
            
            if (checkbox.checked) {
                if (!selectedFilters[filterType].includes(value)) {
                    selectedFilters[filterType].push(value);
                }
            } else {
                const index = selectedFilters[filterType].indexOf(value);
                if (index > -1) {
                    selectedFilters[filterType].splice(index, 1);
                }
            }
            
            resetToFirstPage();
        }
    });
}

// 제품 추가/수정/삭제 후 필터 업데이트
function refreshFilters() {
    generateDynamicFilters();
    setupDynamicFilterListeners();
}

// createProductCards 함수 수정 (카테고리 버튼 추가)
const originalCreateProductCards = createProductCards;
createProductCards = function() {
    originalCreateProductCards();
    setTimeout(addCategoryButtons, 100); // DOM 업데이트 후 버튼 추가
};

// 전체 선택/해제 기능 추가
function addSelectAllButtons() {
    document.querySelectorAll('.filter-group').forEach(group => {
        const header = group.querySelector('h4');
        const selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = '전체';
        selectAllBtn.style.cssText = `
            margin-left: auto;
            padding: 2px 8px;
            font-size: 11px;
            background: #333;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        `;
        selectAllBtn.onclick = (e) => {
            e.stopPropagation();
            const checkboxes = group.querySelectorAll('input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            });
        };
        header.appendChild(selectAllBtn);
    });
}