/**
 * 조명 스펙시트 PDF 생성기
 * html2canvas + jsPDF 방식
 * 한글 완벽 지원
 */

// ========================================
// 전역 변수
// ========================================
let currentProductForPDF = null;

// ========================================
// 이미지를 Base64로 변환 (다양한 방법 시도)
// ========================================
async function convertImageToBase64(url) {
    if (!url) return null;

    // 이미 Base64인 경우 그대로 반환
    if (url.startsWith('data:')) {
        return url;
    }

    console.log('🖼️ 이미지 변환 시작:', url.substring(0, 60) + '...');

    // 방법 0: 페이지에 이미 로드된 이미지 찾기 (CORS 우회)
    const existingImg = document.querySelector(`img[src="${url}"]`);
    if (existingImg && existingImg.complete && existingImg.naturalWidth > 0) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = existingImg.naturalWidth;
            canvas.height = existingImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(existingImg, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            console.log('✅ 기존 로드된 이미지 사용 성공');
            return dataUrl;
        } catch (e) {
            console.log('⚠️ 기존 이미지 canvas 변환 실패 (tainted)');
        }
    }

    // 방법 1: fetch로 blob 가져오기
    try {
        const response = await fetch(url, {
            mode: 'cors',
            credentials: 'omit'
        });
        if (response.ok) {
            const blob = await response.blob();
            const result = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
            if (result) {
                console.log('✅ fetch 방식 성공');
                return result;
            }
        }
    } catch (e) {
        console.log('⚠️ fetch 방식 실패:', e.message);
    }

    // 방법 2: Image 객체 + crossOrigin anonymous
    try {
        const result = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            const timeout = setTimeout(() => {
                resolve(null);
            }, 8000);

            img.onload = () => {
                clearTimeout(timeout);
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width || 400;
                    canvas.height = img.naturalHeight || img.height || 400;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    console.log('✅ Image+Canvas 방식 성공');
                    resolve(dataUrl);
                } catch (e) {
                    resolve(null);
                }
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve(null);
            };

            // 캐시 무시를 위해 타임스탬프 추가
            img.src = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
        });
        if (result) return result;
    } catch (e) {
        console.log('⚠️ Image 방식 실패');
    }

    console.log('❌ 이미지 변환 실패 - null 반환');
    return null;
}

// ========================================
// 모달 UI 생성 및 관리
// ========================================
function createSpecSheetModal() {
    // 기존 모달 제거 후 재생성
    const existing = document.getElementById('specsheetModal');
    if (existing) existing.remove();

    const modalHTML = `
    <div id="specsheetModal" class="specsheet-modal">
        <div class="specsheet-modal-content" style="max-width:650px;">
            <div class="specsheet-modal-header">
                <h3>스펙시트 정보 입력</h3>
                <button class="close-btn" onclick="closeSpecSheetModal()">&times;</button>
            </div>
            <div class="specsheet-modal-body">
                <!-- 필수 입력 -->
                <div class="spec-form-group">
                    <label>CODE (파일명) <span style="color:#e74c3c;">*필수</span></label>
                    <input type="text" id="specCode" placeholder="CODE를 입력하세요 (파일명으로 사용됩니다)">
                </div>
                <div class="spec-form-group">
                    <label>PROJECT (프로젝트명)</label>
                    <input type="text" id="specProject" placeholder="프로젝트명을 입력하세요">
                </div>
                <div class="spec-form-row">
                    <div class="spec-form-group">
                        <label>AREA (영역)</label>
                        <input type="text" id="specArea" placeholder="예: Lobby, Office">
                    </div>
                    <div class="spec-form-group">
                        <label>LOCATION (위치)</label>
                        <input type="text" id="specLocation" placeholder="예: 1F, B1">
                    </div>
                </div>

                <div style="border-top:1px solid #eee;margin:16px 0;padding-top:16px;">
                    <div style="font-size:12px;color:#666;margin-bottom:12px;">▼ 아래 항목은 데이터가 없는 경우 직접 입력하세요</div>
                </div>

                <!-- 추가 스펙 입력 필드 -->
                <div class="spec-form-row">
                    <div class="spec-form-group">
                        <label>TYPE</label>
                        <input type="text" id="specType" placeholder="제품 유형">
                    </div>
                    <div class="spec-form-group">
                        <label>MODEL NO.</label>
                        <input type="text" id="specModelNo" placeholder="모델 번호">
                    </div>
                </div>
                <div class="spec-form-row">
                    <div class="spec-form-group">
                        <label>FINISH (마감재)</label>
                        <input type="text" id="specFinish" placeholder="예: Aluminum, Steel">
                    </div>
                    <div class="spec-form-group">
                        <label>COLOR (색상)</label>
                        <input type="text" id="specColor" placeholder="예: White, Black">
                    </div>
                </div>
                <div class="spec-form-row">
                    <div class="spec-form-group">
                        <label>SIZE (크기)</label>
                        <input type="text" id="specSize" placeholder="예: 100x100x50mm">
                    </div>
                    <div class="spec-form-group">
                        <label>LAMP (광원)</label>
                        <input type="text" id="specLamp" placeholder="예: LED 10W">
                    </div>
                </div>
                <div class="spec-form-row">
                    <div class="spec-form-group">
                        <label>BEAM ANGLE (조사각)</label>
                        <input type="text" id="specBeamAngle" placeholder="예: 24°, 36°">
                    </div>
                    <div class="spec-form-group">
                        <label>CRI (연색성)</label>
                        <input type="text" id="specCri" placeholder="예: 90, 95">
                    </div>
                </div>
            </div>
            <div class="specsheet-modal-footer">
                <button class="btn-cancel" onclick="closeSpecSheetModal()">취소</button>
                <button class="btn-download" id="pdfDownloadBtn" onclick="generatePDFWithInput()">
                    <span id="pdfBtnText">PDF 다운로드</span>
                    <span id="pdfBtnLoading" style="display:none;">생성 중...</span>
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openSpecSheetModal(product) {
    createSpecSheetModal();
    currentProductForPDF = product;

    // 기존 데이터로 필드 미리 채우기 (CODE는 비워둠 - 사용자 직접 입력)
    document.getElementById('specCode').value = '';
    document.getElementById('specProject').value = '';
    document.getElementById('specArea').value = '';
    document.getElementById('specLocation').value = '';

    // 상세페이지 데이터가 있으면 가져오고, 없으면 비워둠
    document.getElementById('specType').value = product.type || '';
    document.getElementById('specModelNo').value = product.modelNo || product.name || '';
    document.getElementById('specFinish').value = product.finish || '';
    document.getElementById('specColor').value = product.color || '';
    document.getElementById('specSize').value = product.size || '';
    document.getElementById('specLamp').value = product.lamp || '';
    document.getElementById('specBeamAngle').value = product.beamAngle || '';
    document.getElementById('specCri').value = product.cri || '';

    document.getElementById('specsheetModal').style.display = 'flex';
    document.addEventListener('keydown', handleModalEsc);
}

function closeSpecSheetModal() {
    const modal = document.getElementById('specsheetModal');
    if (modal) modal.style.display = 'none';
    document.removeEventListener('keydown', handleModalEsc);
}

function handleModalEsc(e) {
    if (e.key === 'Escape') closeSpecSheetModal();
}

async function generatePDFWithInput() {
    if (!currentProductForPDF) {
        alert('제품 정보가 없습니다.');
        return;
    }

    // CODE 필수 확인
    const codeInput = document.getElementById('specCode').value.trim();
    if (!codeInput) {
        alert('CODE는 필수 입력입니다. (파일명으로 사용됩니다)');
        document.getElementById('specCode').focus();
        return;
    }

    // 파일명에 사용할 수 없는 특수문자 체크
    const invalidChars = /[\/\\:*?"<>|]/g;
    if (invalidChars.test(codeInput)) {
        alert('CODE에 특수문자( / \\ : * ? " < > | )는 사용할 수 없습니다.');
        document.getElementById('specCode').focus();
        return;
    }

    const btn = document.getElementById('pdfDownloadBtn');
    const btnText = document.getElementById('pdfBtnText');
    const btnLoading = document.getElementById('pdfBtnLoading');

    if (btn) btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';

    // 모달 입력값으로 덮어쓰기 (입력값 우선)
    const productWithInput = {
        ...currentProductForPDF,
        code: codeInput,
        project: document.getElementById('specProject').value.trim(),
        area: document.getElementById('specArea').value.trim(),
        location: document.getElementById('specLocation').value.trim(),
        type: document.getElementById('specType').value.trim() || currentProductForPDF.type,
        modelNo: document.getElementById('specModelNo').value.trim() || currentProductForPDF.modelNo,
        finish: document.getElementById('specFinish').value.trim() || currentProductForPDF.finish,
        color: document.getElementById('specColor').value.trim() || currentProductForPDF.color,
        size: document.getElementById('specSize').value.trim() || currentProductForPDF.size,
        lamp: document.getElementById('specLamp').value.trim() || currentProductForPDF.lamp,
        beamAngle: document.getElementById('specBeamAngle').value.trim() || currentProductForPDF.beamAngle,
        cri: document.getElementById('specCri').value.trim() || currentProductForPDF.cri
    };

    closeSpecSheetModal();

    try {
        await createSpecSheetPDF(productWithInput);
    } catch (e) {
        console.error('PDF 생성 실패:', e);
        alert('PDF 생성에 실패했습니다: ' + e.message);
    }

    if (btn) btn.disabled = false;
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
}

// ========================================
// 메인 진입점
// ========================================
function downloadSpecSheetPDF(product) {
    if (!product) {
        alert('제품 정보가 없습니다.');
        return;
    }

    // 디버깅: 받은 데이터 전체 출력
    console.log('='.repeat(50));
    console.log('📄 PDF 생성 - 전체 데이터:', JSON.stringify(product, null, 2));
    console.log('='.repeat(50));

    openSpecSheetModal(product);
}

// ========================================
// 스펙시트 HTML 생성
// ========================================
function createSpecSheetHTML(product) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    // CODE 값
    const codeValue = product.code || product.productCode || product.productNumber || '-';

    console.log('📄 createSpecSheetHTML - product:', product);

    // ========================================
    // 이미지 섹션 - 캡처된 Base64 이미지 사용
    // ========================================
    const mainImageBase64 = product.mainImageBase64;
    const subImagesBase64 = product.subImagesBase64 || [];

    console.log('📄 메인 이미지 Base64:', mainImageBase64 ? '있음' : '없음');
    console.log('📄 서브 이미지:', subImagesBase64.length + '개');

    // 이미지 크기 통일 (60mm x 60mm)
    const imgSize = '60mm';

    // 메인 이미지 HTML
    let mainImageHTML = '';
    if (mainImageBase64) {
        mainImageHTML = `
            <div style="width:${imgSize};height:${imgSize};overflow:hidden;">
                <img src="${mainImageBase64}" style="width:100%;height:100%;object-fit:contain;">
            </div>`;
    } else {
        mainImageHTML = '';
    }

    // 서브 이미지 HTML (메인과 동일 크기)
    const subImagesHTML = subImagesBase64.map(src =>
        `<div style="width:${imgSize};height:${imgSize};overflow:hidden;">
            <img src="${src}" style="width:100%;height:100%;object-fit:contain;">
        </div>`
    ).join('');

    // ========================================
    // 마크 처리 (marks 배열이 있으면 텍스트로 표시)
    // ========================================
    const rawMarks = product.marks || [];
    let marksHTML = '';

    console.log('📄 마크 데이터 (raw):', rawMarks);

    // 유효한 마크만 필터링 (이미지가 있거나, 유효한 이름이 있는 경우)
    const validMarks = rawMarks.filter(mark => {
        // mark가 객체인지 확인
        if (!mark || typeof mark !== 'object') return false;

        // 이미지(Base64)가 있으면 유효
        if (mark.imageBase64) return true;

        // 이미지 URL이 있으면 유효
        if (mark.imageUrl) return true;

        // name이 있고 의미있는 값인 경우 유효
        if (mark.name && typeof mark.name === 'string') {
            const name = mark.name.trim();
            if (name.length >= 2 && !/^\d+$/.test(name)) return true;
        }

        return false;
    });

    console.log('📄 유효한 마크:', validMarks);

    // 유효한 마크 이름인지 확인 (숫자만 있거나 1글자면 무효)
    const isValidMarkName = (name) => {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        if (trimmed.length < 2) return false;
        if (/^\d+$/.test(trimmed)) return false;
        return true;
    };

    // 마크 이미지 표시 (Base64 이미지 사용)
    for (const mark of validMarks.slice(0, 6)) {
        if (mark.imageBase64) {
            // Base64 이미지가 있으면 이미지로 표시 (유효한 이름만 표시)
            marksHTML += `<div style="display:inline-flex;flex-direction:column;align-items:center;margin-right:5mm;">
                <img src="${mark.imageBase64}" style="width:40px;height:40px;object-fit:contain;">
                ${isValidMarkName(mark.name) ? `<span style="font-size:8px;margin-top:2px;">${mark.name}</span>` : ''}
            </div>`;
        } else if (isValidMarkName(mark.name)) {
            // 이미지 없고 유효한 이름만 있으면 텍스트로 표시
            marksHTML += `<span style="font-size:10px;font-weight:bold;padding:5px 8px;background:#f0f0f0;border-radius:3px;margin-right:5mm;border:1px solid #ddd;">${mark.name}</span>`;
        }
    }

    // 유효한 마크 배열로 교체
    const marks = validMarks;

    // ========================================
    // HTML 템플릿
    // ========================================
    return `
    <div id="specsheet-render" style="
        width:210mm;
        min-height:297mm;
        padding:15mm;
        background:#fff;
        font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif;
        font-size:11px;
        color:#000;
        box-sizing:border-box;
    ">
        <!-- 제목 -->
        <div style="text-align:center;margin-bottom:5mm;">
            <h1 style="font-size:20px;font-weight:bold;margin:0;letter-spacing:3px;">SPECIFICATION</h1>
        </div>
        <div style="border-bottom:2px solid #000;margin-bottom:5mm;"></div>

        <!-- PROJECT -->
        <div style="margin-bottom:4mm;font-size:11px;">
            <span style="font-weight:bold;display:inline-block;width:22mm;">PROJECT</span>
            <span>:</span>
            <span style="margin-left:3mm;">${product.project || ''}</span>
        </div>

        <!-- 메인 영역 -->
        <div style="display:flex;gap:5mm;margin-bottom:8mm;">
            <!-- 좌측 -->
            <div style="flex:0 0 62%;">
                <!-- 상단 박스 -->
                <div style="border:1px solid #000;padding:3mm;">
                    <div style="display:flex;padding:2mm 0;border-bottom:1px solid #ccc;">
                        <span style="font-weight:bold;width:25mm;">AREA</span>
                        <span>:</span>
                        <span style="margin-left:3mm;">${product.area || ''}</span>
                    </div>
                    <div style="display:flex;padding:2mm 0;">
                        <span style="font-weight:bold;width:25mm;">LOCATION</span>
                        <span>:</span>
                        <span style="margin-left:3mm;">${product.location || ''}</span>
                    </div>
                </div>

                <!-- 하단 박스 -->
                <div style="border:1px solid #000;border-top:none;padding:3mm;">
                    <div style="display:flex;padding:2mm 0;border-bottom:1px solid #ccc;">
                        <span style="font-weight:bold;width:25mm;">TYPE</span>
                        <span>:</span>
                        <span style="margin-left:3mm;">${product.type || ''}</span>
                    </div>
                    <div style="display:flex;padding:2mm 0;border-bottom:1px solid #ccc;">
                        <span style="font-weight:bold;width:25mm;">MODEL NO.</span>
                        <span>:</span>
                        <span style="margin-left:3mm;">${product.modelNo || product.name || ''}</span>
                    </div>
                    <div style="display:flex;padding:2mm 0;border-bottom:1px solid #ccc;">
                        <span style="font-weight:bold;width:25mm;">FINISH</span>
                        <span>:</span>
                        <span style="margin-left:3mm;">${product.finish || ''}</span>
                    </div>
                    <div style="display:flex;padding:2mm 0;border-bottom:1px solid #ccc;">
                        <span style="font-weight:bold;width:25mm;">COLOR</span>
                        <span>:</span>
                        <span style="margin-left:3mm;">${product.color || ''}</span>
                    </div>
                    <div style="display:flex;padding:2mm 0;border-bottom:1px solid #ccc;">
                        <span style="font-weight:bold;width:25mm;">SIZE</span>
                        <span>:</span>
                        <span style="margin-left:3mm;">${product.size || ''}</span>
                    </div>
                    <div style="display:flex;padding:2mm 0;border-bottom:1px solid #ccc;">
                        <span style="font-weight:bold;width:25mm;">LAMP</span>
                        <span>:</span>
                        <span style="margin-left:3mm;">${product.lamp || ''}</span>
                    </div>
                    <div style="display:flex;padding:2mm 0;">
                        <span style="font-weight:bold;width:25mm;">BEAM ANGLE</span>
                        <span>:</span>
                        <span style="margin-left:3mm;">${product.beamAngle || ''}</span>
                    </div>
                </div>
            </div>

            <!-- 우측 -->
            <div style="flex:0 0 35%;display:flex;flex-direction:column;">
                <!-- CODE -->
                <div style="border:2px solid #000;padding:3mm;text-align:center;">
                    <div style="text-align:left;font-size:10px;font-weight:bold;">CODE :</div>
                    <div style="font-size:24px;font-weight:bold;margin-top:3mm;">${codeValue}</div>
                </div>

                <!-- NOTE -->
                <div style="border:2px solid #000;border-top:none;padding:3mm;flex:1;min-height:25mm;">
                    <div style="font-size:10px;font-weight:bold;margin-bottom:2mm;">NOTE</div>
                    <div style="font-size:9px;color:#333;line-height:1.4;">${(product.note || product.specs || '').substring(0, 200)}</div>
                </div>

                <!-- DATE -->
                <div style="border:2px solid #000;border-top:none;padding:2mm 3mm;display:flex;align-items:center;gap:3mm;">
                    <span style="font-weight:bold;font-size:10px;">DATE</span>
                    <span>|</span>
                    <span style="font-size:10px;">${dateStr}</span>
                </div>
            </div>
        </div>

        <!-- IMAGE / DRAWING -->
        <div style="margin-bottom:8mm;">
            <div style="font-weight:bold;font-size:12px;color:#CC0000;margin-bottom:2mm;">IMAGE / DRAWING</div>
            <div style="border-bottom:2px solid #CC0000;margin-bottom:5mm;"></div>
            <div style="display:flex;gap:5mm;align-items:flex-start;flex-wrap:wrap;">
                ${mainImageHTML}
                ${subImagesHTML}
            </div>
        </div>

        <!-- 하단 마크 (마크 이미지가 있을 때만 표시) -->
        ${marksHTML ? `
        <div style="display:flex;align-items:center;gap:5mm;margin-top:10mm;flex-wrap:wrap;">
            ${marksHTML}
        </div>
        ` : ''}

        <!-- 회사 정보 -->
        <div style="margin-top:15mm;font-size:9px;color:#666;font-style:italic;">
            ${product.companyInfo || 'INTECH LIGHTING Co.,Ltd.'}
        </div>
    </div>
    `;
}

// ========================================
// PDF 생성
// ========================================
async function createSpecSheetPDF(product) {
    // 라이브러리 체크
    if (typeof html2canvas === 'undefined') {
        throw new Error('PDF 생성에 필요한 라이브러리를 불러오지 못했습니다.\n페이지를 새로고침 후 다시 시도해주세요.');
    }
    if (typeof window.jspdf === 'undefined') {
        throw new Error('PDF 생성에 필요한 라이브러리를 불러오지 못했습니다.\n페이지를 새로고침 후 다시 시도해주세요.');
    }

    console.log('📄 PDF 생성 시작...');

    // 컨테이너 생성 (화면 밖에 숨김)
    let container = null;
    try {
        container = document.createElement('div');
        container.innerHTML = createSpecSheetHTML(product);
        container.style.cssText = 'position:absolute;left:-9999px;top:0;';
        document.body.appendChild(container);
    } catch (e) {
        console.error('HTML 생성 오류:', e);
        throw new Error('PDF 템플릿 생성 중 오류가 발생했습니다.');
    }

    const specElement = container.querySelector('#specsheet-render');

    if (!specElement) {
        if (container) document.body.removeChild(container);
        throw new Error('PDF 템플릿을 생성할 수 없습니다.');
    }

    // 렌더링 대기
    await new Promise(r => setTimeout(r, 300));

    try {
        console.log('📷 캡처 중...');

        // 타임아웃 설정 (30초)
        const capturePromise = html2canvas(specElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('PDF 생성 시간이 초과되었습니다.\n다시 시도해주세요.')), 30000);
        });

        const canvas = await Promise.race([capturePromise, timeoutPromise]);

        if (!canvas || canvas.width === 0) {
            throw new Error('PDF 캡처에 실패했습니다.\n다시 시도해주세요.');
        }

        console.log('📝 PDF 변환 중... (캔버스 크기:', canvas.width, 'x', canvas.height, ')');

        // 메모리 체크 (대략적)
        const estimatedMemory = canvas.width * canvas.height * 4; // RGBA
        if (estimatedMemory > 100000000) { // 100MB 이상
            console.warn('⚠️ 큰 캔버스 크기 감지:', estimatedMemory, 'bytes');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pageWidth = 210;
        const pageHeight = 297;

        let imgData;
        try {
            imgData = canvas.toDataURL('image/jpeg', 0.95);
        } catch (e) {
            console.error('Canvas toDataURL 오류:', e);
            throw new Error('이미지 변환 중 오류가 발생했습니다.\n브라우저 메모리가 부족할 수 있습니다.');
        }

        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        if (imgHeight <= pageHeight) {
            doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
        } else {
            doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
        }

        // 파일명 안전하게 처리
        let codeValue = product.code || product.productCode || product.productNumber || 'PRODUCT';
        codeValue = codeValue.replace(/[\/\\:*?"<>|]/g, '_'); // 특수문자 치환
        const fileName = `${codeValue}.pdf`;

        try {
            doc.save(fileName);
            console.log('✅ PDF 저장:', fileName);
            // 완료 토스트 메시지
            showToast(`${fileName} 다운로드 완료!`);
        } catch (e) {
            console.error('PDF 저장 오류:', e);
            // iOS Safari 등에서 팝업 차단 시
            if (e.message && e.message.includes('popup')) {
                throw new Error('팝업이 차단되었습니다.\n브라우저 설정에서 팝업을 허용해주세요.');
            }
            throw new Error('PDF 다운로드에 실패했습니다.\n브라우저 설정을 확인해주세요.');
        }

    } catch (error) {
        console.error('PDF 생성 오류:', error);
        throw error;
    } finally {
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    }
}

// 토스트 메시지 표시
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: #fff;
        padding: 15px 30px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 99999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: toastIn 0.3s ease;
    `;
    toast.textContent = message;

    // 애니메이션 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes toastIn {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastOut {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // 3초 후 제거
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// 초기화
document.addEventListener('DOMContentLoaded', createSpecSheetModal);
