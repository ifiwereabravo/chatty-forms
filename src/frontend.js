import './frontend.scss';

// ─── Photo Upload Field ─────────────────────────────────────────────────────
class ChattyPhotoField {
    constructor(container) {
        this.container = container;
        this.fieldId = container.dataset.fieldId;
        this.maxPhotos = parseInt(container.dataset.maxPhotos) || 1;
        this.isRequired = container.dataset.required === '1';
        this.apiUrl = container.dataset.apiUrl;
        this.nonce = container.dataset.nonce;
        this.photos = []; // { id, url, file, uploading }
        this.dragIndex = null;
        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.grid = document.createElement('div');
        this.grid.className = 'chatty-photo-grid';
        this.container.appendChild(this.grid);
        this.renderGrid();
    }

    renderGrid() {
        this.grid.innerHTML = '';

        // Render existing photo thumbnails
        this.photos.forEach((photo, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'chatty-photo-thumb' + (photo.uploading ? ' uploading' : '');
            thumb.draggable = true;
            thumb.dataset.index = index;

            // Drag events for rearranging
            thumb.addEventListener('dragstart', (e) => {
                this.dragIndex = index;
                thumb.classList.add('chatty-photo-dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            thumb.addEventListener('dragend', () => {
                thumb.classList.remove('chatty-photo-dragging');
                this.dragIndex = null;
            });
            thumb.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                thumb.classList.add('drag-over');
            });
            thumb.addEventListener('dragleave', () => {
                thumb.classList.remove('drag-over');
            });
            thumb.addEventListener('drop', (e) => {
                e.preventDefault();
                thumb.classList.remove('drag-over');
                if (this.dragIndex !== null && this.dragIndex !== index) {
                    const moved = this.photos.splice(this.dragIndex, 1)[0];
                    this.photos.splice(index, 0, moved);
                    this.renderGrid();
                }
            });

            // Touch drag for mobile
            thumb.addEventListener('touchstart', (e) => {
                this.dragIndex = index;
                thumb.classList.add('chatty-photo-dragging');
            }, { passive: true });
            thumb.addEventListener('touchend', () => {
                thumb.classList.remove('chatty-photo-dragging');
                this.dragIndex = null;
            });

            const img = document.createElement('img');
            img.src = photo.url;
            img.alt = `Photo ${index + 1}`;
            thumb.appendChild(img);

            // Uploading spinner
            if (photo.uploading) {
                const spinner = document.createElement('div');
                spinner.className = 'chatty-photo-spinner';
                spinner.innerHTML = '⏳';
                thumb.appendChild(spinner);
            }

            // Delete button
            if (!photo.uploading) {
                const del = document.createElement('button');
                del.type = 'button';
                del.className = 'chatty-photo-delete';
                del.innerHTML = '✕';
                del.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.photos.splice(index, 1);
                    this.renderGrid();
                });
                thumb.appendChild(del);
            }

            // Photo number badge
            const badge = document.createElement('span');
            badge.className = 'chatty-photo-badge';
            badge.textContent = index + 1;
            thumb.appendChild(badge);

            this.grid.appendChild(thumb);
        });

        // Add "+" slot if under max
        if (this.photos.length < this.maxPhotos) {
            const addSlot = document.createElement('div');
            addSlot.className = 'chatty-photo-add';
            addSlot.innerHTML = '<span class="chatty-photo-add-icon">📷</span><span class="chatty-photo-add-label">+</span>';
            addSlot.addEventListener('click', () => this.openCamera());

            // Also accept drop on the add slot for rearranging
            addSlot.addEventListener('dragover', (e) => { e.preventDefault(); });
            addSlot.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.dragIndex !== null) {
                    const moved = this.photos.splice(this.dragIndex, 1)[0];
                    this.photos.push(moved);
                    this.renderGrid();
                }
            });

            this.grid.appendChild(addSlot);
        }

        // Hidden input for form validation (required check)
        let hiddenInput = this.container.querySelector('.chatty-photo-hidden');
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.className = 'chatty-photo-hidden';
            hiddenInput.name = this.fieldId;
            this.container.appendChild(hiddenInput);
        }
        hiddenInput.value = this.getUrls().join(',');
        if (this.isRequired && this.photos.length === 0) {
            hiddenInput.setCustomValidity('Please add at least one photo.');
        } else {
            hiddenInput.setCustomValidity('');
        }
    }

    openCamera() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.addEventListener('change', () => {
            if (input.files && input.files[0]) {
                this.showPreview(input.files[0]);
            }
            document.body.removeChild(input);
        });

        input.click();
    }

    showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;

            // Create full-width preview overlay
            const overlay = document.createElement('div');
            overlay.className = 'chatty-photo-preview-overlay';

            const previewImg = document.createElement('img');
            previewImg.src = dataUrl;
            previewImg.className = 'chatty-photo-preview-img';
            overlay.appendChild(previewImg);

            const actions = document.createElement('div');
            actions.className = 'chatty-photo-preview-actions';

            const retakeBtn = document.createElement('button');
            retakeBtn.type = 'button';
            retakeBtn.className = 'chatty-photo-retake-btn';
            retakeBtn.innerHTML = '↻ Retake';
            retakeBtn.addEventListener('click', () => {
                overlay.remove();
                this.openCamera();
            });

            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'chatty-photo-save-btn';
            saveBtn.innerHTML = '✓ Save';
            saveBtn.addEventListener('click', () => {
                overlay.remove();
                this.addPhoto(file, dataUrl);
            });

            actions.appendChild(retakeBtn);
            actions.appendChild(saveBtn);
            overlay.appendChild(actions);

            this.container.appendChild(overlay);
        };
        reader.readAsDataURL(file);
    }

    async addPhoto(file, dataUrl) {
        const tempId = 'temp_' + Date.now();
        const photo = { id: tempId, url: dataUrl, uploading: true };
        this.photos.push(photo);
        this.renderGrid();

        try {
            const formData = new FormData();
            formData.append('photo', file);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'X-WP-Nonce': this.nonce },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Upload failed');
            }

            // Update with server URL
            const idx = this.photos.findIndex(p => p.id === tempId);
            if (idx !== -1) {
                this.photos[idx] = { id: result.id, url: result.url, uploading: false };
            }
        } catch (err) {
            console.error('[CHATTY Forms] Photo upload failed:', err);
            // Remove failed photo
            const idx = this.photos.findIndex(p => p.id === tempId);
            if (idx !== -1) this.photos.splice(idx, 1);
        }

        this.renderGrid();
    }

    getUrls() {
        return this.photos.filter(p => !p.uploading).map(p => p.url);
    }

    isUploading() {
        return this.photos.some(p => p.uploading);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const wrappers = document.querySelectorAll('.chatty-form-wrapper');

    wrappers.forEach(wrapper => {
        const form = wrapper.querySelector('.chatty-form');
        const gate = wrapper.querySelector('.chatty-form-gate');
        const downloadSection = wrapper.querySelector('.chatty-form-download');
        const downloadBtn = downloadSection?.querySelector('.chatty-form-download-btn');

        // Initialize photo fields
        const photoFields = [];
        wrapper.querySelectorAll('.chatty-form-photo-field').forEach(container => {
            photoFields.push(new ChattyPhotoField(container));
        });

        // Read settings from data attributes
        const config = {
            formId: wrapper.dataset.formId,
            delivery: wrapper.dataset.delivery || 'message',
            gate: wrapper.dataset.gate || 'none',
            downloadUrl: wrapper.dataset.download || '',
            redirectUrl: wrapper.dataset.redirect || '',
            successMsg: wrapper.dataset.successMsg || 'Thank you!',
            shareText: wrapper.dataset.shareText || '',
            shareUrl: wrapper.dataset.shareUrl || window.location.href,
        };

        // Social login buttons
        const socialBtns = wrapper.querySelectorAll('.chatty-form-social-btn');
        socialBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const provider = btn.dataset.provider;
                handleSocialLogin(provider, form);
            });
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageContainer = form.querySelector('.chatty-form-message');
            const submitBtn = form.querySelector('button[type="submit"]');

            messageContainer.innerHTML = '';
            messageContainer.className = 'chatty-form-message';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                // Handle checkbox arrays
                if (key.endsWith('[]')) {
                    const cleanKey = key.slice(0, -2);
                    if (!data[cleanKey]) data[cleanKey] = [];
                    data[cleanKey].push(value);
                } else {
                    data[key] = value;
                }
            });

            // Inject photo field URLs into data
            photoFields.forEach(pf => {
                const urls = pf.getUrls();
                if (urls.length > 0) {
                    data[pf.fieldId] = urls;
                }
            });

            // Block submit if photos are still uploading
            if (photoFields.some(pf => pf.isUploading())) {
                messageContainer.innerHTML = 'Photos are still uploading, please wait...';
                messageContainer.classList.add('info');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
                return;
            }

            // Read chatty_visitor_id cookie for identity resolution
            const visitorId = getCookie('chatty_visitor_id');

            try {
                const response = await fetch(chattyFormsFrontend.apiUrl + '/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': chattyFormsFrontend.nonce
                    },
                    body: JSON.stringify({
                        form_id: config.formId,
                        data: data,
                        visitor_id: visitorId || ''
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Submission failed');
                }

                // Handle delivery
                if (config.gate !== 'none' && config.gate !== 'form_only') {
                    // Gate active — show gate overlay
                    form.style.display = 'none';
                    if (gate) {
                        gate.style.display = 'block';
                        setupShareButtons(wrapper, config);
                    }
                } else if (config.delivery === 'redirect' && config.redirectUrl) {
                    messageContainer.innerHTML = 'Redirecting...';
                    messageContainer.classList.add('success');
                    setTimeout(() => {
                        window.location.href = config.redirectUrl;
                    }, 500);
                } else if (config.delivery === 'download' && config.downloadUrl) {
                    form.style.display = 'none';
                    showDownload(wrapper, config);
                } else {
                    messageContainer.innerHTML = config.successMsg;
                    messageContainer.classList.add('success');
                    form.reset();
                }
            } catch (error) {
                messageContainer.innerHTML = error.message;
                messageContainer.classList.add('error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
            }
        });
    });
});

/**
 * Read a cookie by name
 */
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
}

function setupShareButtons(wrapper, config) {
    const shareBtns = wrapper.querySelectorAll('.chatty-share-btn');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.dataset.platform;
            const text = encodeURIComponent(config.shareText || document.title);
            const url = encodeURIComponent(config.shareUrl || window.location.href);
            let shareUrl = '';

            switch (platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
                    break;
            }

            if (shareUrl) {
                // Open share dialog
                const popup = window.open(shareUrl, 'share', 'width=600,height=400,scrollbars=yes');

                // Mark as shared (intent-based — we can't verify actual shares)
                btn.classList.add('shared');
                btn.innerHTML = '✓ Shared';

                // Unlock content after share
                sessionStorage.setItem(`chatty-shared-${config.formId}`, '1');

                // Show download after a brief delay
                setTimeout(() => {
                    const gate = wrapper.querySelector('.chatty-form-gate');
                    if (gate) gate.style.display = 'none';
                    showDownload(wrapper, config);
                }, 1500);
            }
        });
    });
}

function showDownload(wrapper, config) {
    const downloadSection = wrapper.querySelector('.chatty-form-download');
    const downloadBtn = downloadSection?.querySelector('.chatty-form-download-btn');

    if (downloadSection && downloadBtn && config.downloadUrl) {
        downloadBtn.href = config.downloadUrl;
        downloadSection.style.display = 'block';
        downloadSection.classList.add('visible');
    } else {
        // No download, show success message
        const form = wrapper.querySelector('.chatty-form');
        const msg = form.querySelector('.chatty-form-message');
        if (msg) {
            msg.innerHTML = config.successMsg;
            msg.classList.add('success');
        }
        form.style.display = 'block';
    }
}

function handleSocialLogin(provider, form) {
    // Stub — OAuth integration will be implemented in Phase B
    // For now, show a message that OAuth needs API credentials
    const msg = form.querySelector('.chatty-form-message');
    if (msg) {
        msg.innerHTML = `Social login with ${provider} requires OAuth credentials. Configure in CHATTY Forms → Settings.`;
        msg.className = 'chatty-form-message info';
    }

    console.log(`[CHATTY Forms] Social login initiated for: ${provider}`);
    console.log('[CHATTY Forms] OAuth flow will be available after API credentials are configured.');
}
