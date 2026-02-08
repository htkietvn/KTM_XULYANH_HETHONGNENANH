// Biến toàn cục
let originalImage = null;
let processedImage = null;

// Canvas elements
const originalCanvas = document.getElementById('originalCanvas');
const processedCanvas = document.getElementById('processedCanvas');
const originalCtx = originalCanvas.getContext('2d');
const processedCtx = processedCanvas.getContext('2d');

// Cập nhật giá trị slider
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');

qualitySlider.addEventListener('input', function() {
    qualityValue.textContent = this.value;
});

// Hàm tải ảnh
function loadImage() {
    const input = document.getElementById('imageInput');
    const file = input.files[0];
    
    if (!file) {
        alert('Vui lòng chọn file ảnh trước!');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            originalImage = img;
            
            // Tính toán kích thước hiển thị cố định
            const displayWidth = 600;
            const displayHeight = 400;
            const scale = Math.min(displayWidth / img.width, displayHeight / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            // Vẽ ảnh gốc với kích thước cố định
            originalCanvas.width = displayWidth;
            originalCanvas.height = displayHeight;
            originalCtx.fillStyle = '#f0f0f0';
            originalCtx.fillRect(0, 0, displayWidth, displayHeight);
            
            const x = (displayWidth - scaledWidth) / 2;
            const y = (displayHeight - scaledHeight) / 2;
            originalCtx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            // Xóa canvas xử lý (chưa nén)
            processedCanvas.width = displayWidth;
            processedCanvas.height = displayHeight;
            processedCtx.fillStyle = '#f0f0f0';
            processedCtx.fillRect(0, 0, displayWidth, displayHeight);
            processedImage = null;
            
            // Hiển thị thông tin ảnh gốc
            const originalInfo = document.getElementById('originalInfo');
            const sizeKB = (file.size / 1024).toFixed(2);
            originalInfo.textContent = `${img.width} x ${img.height}px | ${sizeKB} KB`;
            
            // Xóa thông tin ảnh đã nén
            const processedInfo = document.getElementById('processedInfo');
            processedInfo.textContent = 'Chưa nén';
            
            // Xóa kết quả phân tích
            document.getElementById('analysisResults').innerHTML = '';
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}



// Áp dụng phương pháp nén
function applyCompression() {
    if (!originalImage) {
        alert('Vui lòng tải ảnh trước!');
        return;
    }
    
    const method = document.getElementById('compressionMethod').value;
    const quality = qualitySlider.value / 100;
    
    console.log('Áp dụng nén:', method, 'chất lượng:', quality);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalImage.width;
    tempCanvas.height = originalImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(originalImage, 0, 0);
    
    let mimeType, useQuality;
    switch(method) {
        case 'jpeg':
            mimeType = 'image/jpeg';
            useQuality = quality;
            break;
        case 'png':
            mimeType = 'image/png';
            useQuality = undefined; // PNG không dùng quality
            break;
        case 'webp':
            mimeType = 'image/webp';
            useQuality = quality;
            break;
        default:
            mimeType = 'image/jpeg';
            useQuality = quality;
    }
    
    tempCanvas.toBlob(function(blob) {
        // Kiểm tra nếu toBlob thất bại
        if (!blob) {
            alert(`Lỗi: Trình duyệt không hỗ trợ định dạng ${method.toUpperCase()}. Vui lòng thử định dạng khác.`);
            return;
        }
        
        console.log('Kích thước sau nén:', blob.size, 'bytes =', (blob.size/1024).toFixed(2), 'KB');
        
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = function() {
            // Sử dụng cùng kích thước với canvas gốc
            const displayWidth = originalCanvas.width;
            const displayHeight = originalCanvas.height;
            const scale = Math.min(displayWidth / img.width, displayHeight / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            processedCanvas.width = displayWidth;
            processedCanvas.height = displayHeight;
            processedCtx.fillStyle = '#f0f0f0';
            processedCtx.fillRect(0, 0, displayWidth, displayHeight);
            
            const x = (displayWidth - scaledWidth) / 2;
            const y = (displayHeight - scaledHeight) / 2;
            processedCtx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            const sizeKB = (blob.size / 1024).toFixed(2);
            const processedInfo = document.getElementById('processedInfo');
            
            // Hiển thị thông tin phù hợp với từng loại
            let infoText = `${img.width} x ${img.height}px | ${sizeKB} KB (${method.toUpperCase()}`;
            if (method === 'png') {
                infoText += ' - Lossless)';
            } else {
                infoText += ` - ${(useQuality*100).toFixed(0)}%)`;
            }
            processedInfo.textContent = infoText;
            
            URL.revokeObjectURL(url);
            
            alert(`Nén ${method.toUpperCase()} thành công! Kích thước: ${sizeKB} KB`);
        };
        
        img.onerror = function() {
            alert('Lỗi: Không thể tải ảnh đã nén. Vui lòng thử lại.');
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }, mimeType, useQuality);
}

// So sánh kết quả
function compareResults() {
    if (!originalImage) {
        alert('Vui lòng tải ảnh trước!');
        return;
    }
    
    const originalInfo = document.getElementById('originalInfo').textContent;
    const processedInfo = document.getElementById('processedInfo').textContent;
    
    // Parse thông tin
    const originalSize = parseFloat(originalInfo.match(/[\d.]+(?= KB)/)?.[0] || 0);
    const processedSize = parseFloat(processedInfo.match(/[\d.]+(?= KB)/)?.[0] || 0);
    
    const reduction = ((originalSize - processedSize) / originalSize * 100).toFixed(2);
    const compressionRatio = (originalSize / processedSize).toFixed(2);
    
    const analysisResults = document.getElementById('analysisResults');
    analysisResults.innerHTML = `
        <h3>Kết quả phân tích</h3>
        <div class="stat-card">
            <strong>Kích thước gốc:</strong> ${originalSize} KB
        </div>
        <div class="stat-card">
            <strong>Kích thước sau nén:</strong> ${processedSize} KB
        </div>
        <div class="stat-card">
            <strong>Giảm:</strong> ${reduction}%
        </div>
        <div class="stat-card">
            <strong>Tỷ lệ nén:</strong> ${compressionRatio}:1
        </div>
        
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Thuộc tính</th>
                    <th>Ảnh gốc</th>
                    <th>Ảnh đã xử lý</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Kích thước file</td>
                    <td>${originalSize} KB</td>
                    <td>${processedSize} KB</td>
                </tr>
                <tr>
                    <td>Độ phân giải</td>
                    <td>${originalImage.width} x ${originalImage.height}px</td>
                    <td>${processedCanvas.width} x ${processedCanvas.height}px</td>
                </tr>
                <tr>
                    <td>Tiết kiệm dung lượng</td>
                    <td>-</td>
                    <td>${(originalSize - processedSize).toFixed(2)} KB (${reduction}%)</td>
                </tr>
            </tbody>
        </table>
    `;
}

// Tải xuống ảnh
function downloadImage() {
    if (!processedCanvas.width) {
        alert('Chưa có ảnh để tải xuống!');
        return;
    }
    
    const method = document.getElementById('compressionMethod').value;
    const quality = qualitySlider.value / 100;
    
    let mimeType, extension;
    switch(method) {
        case 'jpeg':
            mimeType = 'image/jpeg';
            extension = 'jpg';
            break;
        case 'png':
            mimeType = 'image/png';
            extension = 'png';
            break;
        case 'webp':
            mimeType = 'image/webp';
            extension = 'webp';
            break;
        default:
            mimeType = 'image/jpeg';
            extension = 'jpg';
    }
    
    processedCanvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_image_${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, mimeType, quality);
}
