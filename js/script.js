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
// 상세 페이지 (동적 테이블)
// ========================================
function showDetail(index) {
    const product = products[index];
    const detailContent = document.getElementById('detailContent');
    
    let detailImagesHTML = '';
    if (product.detailImages && product.detailImages.length > 0) {
        product.detailImages.forEach(img => {
            detailImagesHTML += `
                <div class="detail-main-image">
                    <img src="${img}" alt="${product.name}" 
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EDetail Image%3C/text%3E%3C/svg%3E'">
                </div>
            `;
        });
    }

    let specsListHTML = '';
    if (product.specsList && product.specsList.length > 0) {
        product.specsList.forEach(spec => {
            specsListHTML += `<li>${spec}</li>`;
        });
    }

    let tableHTML = '';
    if (product.tableData && loadedTableColumns.length > 0) {
        const headerHTML = loadedTableColumns.map(col => `<th>${col.label}</th>`).join('');
        const dataHTML = loadedTableColumns.map(col => `<td>${product.tableData[col.id] || '-'}</td>`).join('');
        
        tableHTML = `
            <div class="detail-table-wrapper">
                <table class="detail-table">
                    <thead><tr>${headerHTML}</tr></thead>
                    <tbody><tr>${dataHTML}</tr></tbody>
                </table>
            </div>
        `;
    }

    detailContent.innerHTML = `
        <h1 class="detail-title">${product.name}</h1>
        <div class="detail-images-section">
            ${detailImagesHTML}
            ${specsListHTML ? `<div class="detail-specs-list"><h3>제품 사양</h3><ul>${specsListHTML}</ul></div>` : ''}
        </div>
        ${tableHTML}
    `;

    document.getElementById('listPage').classList.add('hidden');
    document.getElementById('detailPage').classList.add('active');
    window.scrollTo(0, 0);
}

function goBack() {
    document.getElementById('detailPage').classList.remove('active');
    document.getElementById('listPage').classList.remove('hidden');
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

window.addEventListener('DOMContentLoaded', function() {
    selectedFilters.productType = 'ALL';
    setupSearch();
    
    if (typeof database !== 'undefined') {
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