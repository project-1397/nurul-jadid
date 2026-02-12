class FileHandler {
    constructor() {
        this.baseUrl = this.getBaseUrl();
        this.maxSize = 2 * 1024 * 1024;
        this.supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.compressionOptions = {
            jpeg: {quality: 0.8},
            png: {quality: 0.9, transparent: true},
            webp: {quality: 0.85, lossless: false},
            gif: {quality: 0.95}
        };
        this._webpSupportChecked = null;
    }

    getBaseUrl() {
        return new URL(window.location.href).origin;
    }

    loadFile(id, path, file) {
        if (!file) {
            return;
        }

        const imageUrl = `${this.baseUrl}/preview/${encodeURIComponent(path)}/${encodeURIComponent(file)}`;
        const container = document.getElementById(id);
        container.innerHTML = '';
        const img = new Image();
        img.src = imageUrl;
        img.classList.add('img-fluid', 'mt-5', 'h-lg-250px', 'h-md-150px', 'cursor-zoom');
        img.alt = "Preview Gambar";
        img.onclick = () => this.showImageModal(img);
        container.appendChild(img);
    }

    async validateAndPreview(input, containerId) {
        try {
            const file = input.files[0];
            if (!file) throw new Error('Silakan pilih file terlebih dahulu');
            if (!this.supportedTypes.includes(file.type)) throw new Error('Format file tidak didukung');

            const compressedFile = await this.compressImage(file);
            if (compressedFile.size > this.maxSize) throw new Error('Ukuran file maksimal 2MB');

            this.previewFile(compressedFile, containerId);
            this.updateInputFile(input, compressedFile);
        } catch (error) {
            alert(error.message);
            input.value = '';
        }
    }

    async compressImage(file) {
        const supportsWebP = await this.checkWebPSupport();
        const img = await this.createImage(URL.createObjectURL(file));
        const isTransparent = await this.hasTransparency(img);
        let targetMime = isTransparent ? (supportsWebP ? 'image/webp' : 'image/png') : (supportsWebP ? 'image/webp' : 'image/jpeg');
        if (file.type === 'image/gif') targetMime = 'image/gif';

        const [width, height] = this.calculateDimensions(img);
        const canvas = await this.drawImage(img, width, height);
        const quality = this.compressionOptions[targetMime.split('/')[1]].quality;
        const lossless = targetMime === 'image/webp' && this.compressionOptions.webp.lossless;

        const blob = await this.canvasToBlob(canvas, targetMime, quality, lossless);

        return new File([blob], this.generateFileName(file.name, targetMime), {
            type: targetMime,
            lastModified: Date.now()
        });
    }

    calculateDimensions(img) {
        const maxDimension = Math.max(img.width, img.height);
        const targetSize = maxDimension > 3840 ? 1600 : 1200;
        const scale = Math.min(1, targetSize / maxDimension);
        return [Math.round(img.width * scale), Math.round(img.height * scale)];
    }

    async drawImage(img, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        return canvas;
    }

    canvasToBlob(canvas, mimeType, quality, lossless) {
        return new Promise(resolve => {
            if (mimeType === 'image/webp' && lossless !== undefined) {
                canvas.toBlob(resolve, mimeType, {quality, lossless});
            } else {
                canvas.toBlob(resolve, mimeType, quality);
            }
        });
    }

    generateFileName(originalName, mimeType) {
        return originalName.replace(/\.[^/.]+$/, '') + `_opt.${mimeType.split('/')[1]}`;
    }

    updateInputFile(input, file) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
    }

    async checkWebPSupport() {
        if (this._webpSupportChecked !== null) {
            return this._webpSupportChecked;
        }

        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                this._webpSupportChecked = true;
                resolve(true);
            };
            img.onerror = () => {
                this._webpSupportChecked = false;
                resolve(false);
            };
            img.src = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
        });
    }

    createImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async hasTransparency(img) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.width, 100);
        canvas.height = Math.min(img.height, 100);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        return data.some((_, i) => i % 4 === 3 && data[i] < 255);
    }

    previewFile(file, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.classList.add('img-fluid', 'mt-5', 'h-lg-250px', 'h-md-150px', 'cursor-zoom');
        img.alt = "Preview Gambar";
        img.onclick = () => this.showImageModal(img);
        container.appendChild(img);
    }

    showImageModal(img) {
        const modal = document.getElementById("myModal");
        const modalImg = modal.querySelector(".modal-img");
        modalImg.src = img.src;
        new bootstrap.Modal(modal).show();
    }
}

const fileHandler = new FileHandler();