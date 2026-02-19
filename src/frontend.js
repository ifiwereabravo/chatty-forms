import './frontend.scss';

document.addEventListener('DOMContentLoaded', () => {
    const wrappers = document.querySelectorAll('.chatty-form-wrapper');

    wrappers.forEach(wrapper => {
        const form = wrapper.querySelector('.chatty-form');
        const gate = wrapper.querySelector('.chatty-form-gate');
        const downloadSection = wrapper.querySelector('.chatty-form-download');
        const downloadBtn = downloadSection?.querySelector('.chatty-form-download-btn');

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

            try {
                const response = await fetch(chattyFormsFrontend.apiUrl + '/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': chattyFormsFrontend.nonce
                    },
                    body: JSON.stringify({
                        form_id: config.formId,
                        data: data
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
