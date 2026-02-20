<?php
namespace Chatty\Forms;

class Shortcode {
    public function __construct() {
        add_shortcode('chatty_form', [$this, 'render_form']);
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
    }

    public function register_assets() {
        $asset_file = include(CHATTY_FORMS_PATH . 'build/frontend.asset.php');

        wp_register_script(
            'chatty-forms-frontend',
            CHATTY_FORMS_URL . 'build/frontend.js',
            $asset_file['dependencies'],
            $asset_file['version'],
            true
        );

        wp_register_style(
            'chatty-forms-frontend',
            CHATTY_FORMS_URL . 'build/frontend.css',
            [],
            $asset_file['version']
        );

        wp_localize_script('chatty-forms-frontend', 'chattyFormsFrontend', [
            'apiUrl' => rest_url('chatty-forms/v1'),
            'nonce'  => wp_create_nonce('wp_rest')
        ]);
    }

    public function render_form($atts) {
        $atts = shortcode_atts(['id' => 0, 'theme' => ''], $atts);
        $form_id = (int)$atts['id'];

        if (!$form_id) {
            return '';
        }

        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $form = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $form_id));

        if (!$form || empty($form->fields_json)) {
            return '<div class="chatty-form-error">Form not found or empty.</div>';
        }

        $fields = json_decode($form->fields_json, true);
        if (!is_array($fields)) {
            return '<div class="chatty-form-error">Invalid form configuration.</div>';
        }

        $settings = json_decode($form->settings_json, true) ?: [];

        // Enqueue Assets
        wp_enqueue_script('chatty-forms-frontend');
        wp_enqueue_style('chatty-forms-frontend');

        // Prepare settings data attributes
        $delivery_type = esc_attr($settings['deliveryType'] ?? 'message');
        $gate_type = esc_attr($settings['gateType'] ?? 'none');
        $download_url = esc_attr($settings['downloadUrl'] ?? '');
        $redirect_url = esc_attr($settings['redirectUrl'] ?? '');
        $success_message = esc_attr($settings['successMessage'] ?? 'Thank you! Your submission has been received.');
        $share_text = esc_attr($settings['shareText'] ?? '');
        $share_url = esc_attr($settings['shareUrl'] ?? '');

        // Theme: shortcode attr > form setting > default 'light'
        $theme = $atts['theme'] ?? ($settings['theme'] ?? 'light');
        $theme = in_array($theme, ['light', 'dark', 'auto']) ? $theme : 'light';

        ob_start();
        ?>
        <div class="chatty-form-wrapper"
            data-form-id="<?php echo esc_attr($form_id); ?>"
            data-theme="<?php echo esc_attr($theme); ?>"
            data-delivery="<?php echo $delivery_type; ?>"
            data-gate="<?php echo $gate_type; ?>"
            data-download="<?php echo $download_url; ?>"
            data-redirect="<?php echo $redirect_url; ?>"
            data-success-msg="<?php echo $success_message; ?>"
            data-share-text="<?php echo $share_text; ?>"
            data-share-url="<?php echo $share_url; ?>"
            data-share-facebook="<?php echo ($settings['shareFacebook'] ?? true) ? '1' : '0'; ?>"
            data-share-twitter="<?php echo ($settings['shareTwitter'] ?? true) ? '1' : '0'; ?>"
            data-share-linkedin="<?php echo ($settings['shareLinkedin'] ?? true) ? '1' : '0'; ?>"
            data-social-login="<?php echo ($settings['enableSocialLogin'] ?? false) ? '1' : '0'; ?>"
            data-social-google="<?php echo ($settings['socialGoogle'] ?? true) ? '1' : '0'; ?>"
            data-social-facebook="<?php echo ($settings['socialFacebook'] ?? true) ? '1' : '0'; ?>"
            data-social-instagram="<?php echo ($settings['socialInstagram'] ?? true) ? '1' : '0'; ?>"
        >
            <?php if (!empty($settings['enableSocialLogin'])): ?>
                <div class="chatty-form-social-login">
                    <p class="chatty-form-social-label">Quick fill with:</p>
                    <div class="chatty-form-social-buttons">
                        <?php if ($settings['socialGoogle'] ?? true): ?>
                            <button type="button" class="chatty-form-social-btn chatty-social-google" data-provider="google">
                                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                Google
                            </button>
                        <?php endif; ?>
                        <?php if ($settings['socialFacebook'] ?? true): ?>
                            <button type="button" class="chatty-form-social-btn chatty-social-facebook" data-provider="facebook">
                                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                Facebook
                            </button>
                        <?php endif; ?>
                        <?php if ($settings['socialInstagram'] ?? true): ?>
                            <button type="button" class="chatty-form-social-btn chatty-social-instagram" data-provider="instagram">
                                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/><defs><linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0"><stop offset="0%" stop-color="#FD5"/><stop offset="50%" stop-color="#FF543E"/><stop offset="100%" stop-color="#C837AB"/></linearGradient></defs></svg>
                                Instagram
                            </button>
                        <?php endif; ?>
                    </div>
                    <div class="chatty-form-divider"><span>or fill manually</span></div>
                </div>
            <?php endif; ?>

            <form class="chatty-form" data-form-id="<?php echo esc_attr($form_id); ?>">
                <div class="chatty-form-message"></div>
                <?php foreach ($fields as $field): ?>
                    <div class="chatty-form-field field-<?php echo esc_attr($field['type']); ?>">
                        <label>
                            <?php echo esc_html($field['label']); ?>
                            <?php if (!empty($field['required'])): ?>
                                <span class="required">*</span>
                            <?php endif; ?>
                        </label>

                        <?php if ($field['type'] === 'textarea'): ?>
                            <textarea 
                                name="<?php echo esc_attr($field['id']); ?>" 
                                placeholder="<?php echo esc_attr($field['placeholder'] ?? ''); ?>"
                                <?php echo !empty($field['required']) ? 'required' : ''; ?>
                            ></textarea>

                        <?php elseif ($field['type'] === 'select'): ?>
                            <select 
                                name="<?php echo esc_attr($field['id']); ?>"
                                <?php echo !empty($field['required']) ? 'required' : ''; ?>
                            >
                                <option value="">Select...</option>
                                <?php 
                                $options = !empty($field['options']) ? explode(',', $field['options']) : ['Option 1', 'Option 2'];
                                foreach ($options as $opt): 
                                    $opt = trim($opt);
                                ?>
                                    <option value="<?php echo esc_attr($opt); ?>"><?php echo esc_html($opt); ?></option>
                                <?php endforeach; ?>
                            </select>

                        <?php elseif ($field['type'] === 'checkbox'): ?>
                            <div class="chatty-form-options">
                                <?php 
                                $options = !empty($field['options']) ? explode(',', $field['options']) : ['Option 1', 'Option 2'];
                                foreach ($options as $i => $opt): 
                                    $opt = trim($opt);
                                ?>
                                    <label class="chatty-form-check">
                                        <input type="checkbox" name="<?php echo esc_attr($field['id']); ?>[]" value="<?php echo esc_attr($opt); ?>">
                                        <?php echo esc_html($opt); ?>
                                    </label>
                                <?php endforeach; ?>
                            </div>

                        <?php elseif ($field['type'] === 'radio'): ?>
                            <div class="chatty-form-options">
                                <?php 
                                $options = !empty($field['options']) ? explode(',', $field['options']) : ['Option 1', 'Option 2'];
                                foreach ($options as $i => $opt): 
                                    $opt = trim($opt);
                                ?>
                                    <label class="chatty-form-check">
                                        <input type="radio" name="<?php echo esc_attr($field['id']); ?>" value="<?php echo esc_attr($opt); ?>">
                                        <?php echo esc_html($opt); ?>
                                    </label>
                                <?php endforeach; ?>
                            </div>

                        <?php elseif ($field['type'] === 'name'): ?>
                            <div class="chatty-form-name-row">
                                <input type="text" name="<?php echo esc_attr($field['id']); ?>_first" placeholder="First Name" <?php echo !empty($field['required']) ? 'required' : ''; ?>>
                                <input type="text" name="<?php echo esc_attr($field['id']); ?>_last" placeholder="Last Name" <?php echo !empty($field['required']) ? 'required' : ''; ?>>
                            </div>

                        <?php elseif ($field['type'] === 'address'): ?>
                            <div class="chatty-form-address">
                                <input type="text" name="<?php echo esc_attr($field['id']); ?>_street" placeholder="Street Address" <?php echo !empty($field['required']) ? 'required' : ''; ?>>
                                <input type="text" name="<?php echo esc_attr($field['id']); ?>_city" placeholder="City" <?php echo !empty($field['required']) ? 'required' : ''; ?>>
                                <div class="chatty-form-address-row">
                                    <input type="text" name="<?php echo esc_attr($field['id']); ?>_state" placeholder="State" <?php echo !empty($field['required']) ? 'required' : ''; ?>>
                                    <input type="text" name="<?php echo esc_attr($field['id']); ?>_zip" placeholder="ZIP Code" <?php echo !empty($field['required']) ? 'required' : ''; ?>>
                                </div>
                            </div>

                        <?php elseif ($field['type'] === 'phone'): ?>
                            <input type="tel" name="<?php echo esc_attr($field['id']); ?>" placeholder="<?php echo esc_attr($field['placeholder'] ?? '(555) 123-4567'); ?>" <?php echo !empty($field['required']) ? 'required' : ''; ?>>

                        <?php elseif ($field['type'] === 'url'): ?>
                            <input type="url" name="<?php echo esc_attr($field['id']); ?>" placeholder="<?php echo esc_attr($field['placeholder'] ?? 'https://'); ?>" <?php echo !empty($field['required']) ? 'required' : ''; ?>>

                        <?php elseif ($field['type'] === 'date'): ?>
                            <input type="date" name="<?php echo esc_attr($field['id']); ?>" <?php echo !empty($field['required']) ? 'required' : ''; ?>>

                        <?php elseif ($field['type'] === 'number'): ?>
                            <input type="number" name="<?php echo esc_attr($field['id']); ?>" placeholder="<?php echo esc_attr($field['placeholder'] ?? ''); ?>" <?php echo !empty($field['required']) ? 'required' : ''; ?> <?php echo isset($field['min']) ? 'min="'.esc_attr($field['min']).'"' : ''; ?> <?php echo isset($field['max']) ? 'max="'.esc_attr($field['max']).'"' : ''; ?>>

                        <?php elseif ($field['type'] === 'photo'): ?>
                            <div class="chatty-form-photo-field"
                                data-field-id="<?php echo esc_attr($field['id']); ?>"
                                data-max-photos="<?php echo esc_attr($field['maxPhotos'] ?? 1); ?>"
                                data-required="<?php echo !empty($field['required']) ? '1' : '0'; ?>"
                                data-api-url="<?php echo esc_url(rest_url('chatty-forms/v1/upload-photo')); ?>"
                                data-nonce="<?php echo esc_attr(wp_create_nonce('wp_rest')); ?>">
                                <!-- Photo grid will be initialized by frontend JS -->
                            </div>

                        <?php else: ?>
                            <input 
                                type="<?php echo esc_attr($field['type'] === 'email' ? 'email' : ($field['htmlType'] ?? 'text')); ?>"
                                name="<?php echo esc_attr($field['id']); ?>"
                                placeholder="<?php echo esc_attr($field['placeholder'] ?? ''); ?>"
                                <?php echo !empty($field['required']) ? 'required' : ''; ?>
                            >
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
                <button type="submit">Submit</button>
            </form>

            <?php if (($settings['gateType'] ?? 'none') !== 'none'): ?>
                <!-- Share/Social gate overlay (hidden until form submit) -->
                <div class="chatty-form-gate" style="display:none;">
                    <div class="chatty-form-gate-content">
                        <?php if (in_array($settings['gateType'] ?? '', ['share', 'form_share'])): ?>
                            <h3>📢 Share to unlock your download</h3>
                            <p>Share this page on social media to access your content.</p>
                            <div class="chatty-form-share-buttons">
                                <?php if ($settings['shareFacebook'] ?? true): ?>
                                    <button class="chatty-share-btn chatty-share-facebook" data-platform="facebook">
                                        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                        Share on Facebook
                                    </button>
                                <?php endif; ?>
                                <?php if ($settings['shareTwitter'] ?? true): ?>
                                    <button class="chatty-share-btn chatty-share-twitter" data-platform="twitter">
                                        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                        Share on X
                                    </button>
                                <?php endif; ?>
                                <?php if ($settings['shareLinkedin'] ?? true): ?>
                                    <button class="chatty-share-btn chatty-share-linkedin" data-platform="linkedin">
                                        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                        Share on LinkedIn
                                    </button>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>

                        <?php if (in_array($settings['gateType'] ?? '', ['login', 'form_login'])): ?>
                            <h3>🔐 Login to access your download</h3>
                            <p>Sign in with your social account to unlock your content.</p>
                            <div class="chatty-form-social-buttons chatty-form-gate-login">
                                <?php if ($settings['loginGoogle'] ?? true): ?>
                                    <button type="button" class="chatty-form-social-btn chatty-social-google" data-provider="google">Google</button>
                                <?php endif; ?>
                                <?php if ($settings['loginFacebook'] ?? true): ?>
                                    <button type="button" class="chatty-form-social-btn chatty-social-facebook" data-provider="facebook">Facebook</button>
                                <?php endif; ?>
                                <?php if ($settings['loginInstagram'] ?? true): ?>
                                    <button type="button" class="chatty-form-social-btn chatty-social-instagram" data-provider="instagram">Instagram</button>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Download button (hidden until unlocked) -->
            <div class="chatty-form-download" style="display:none;">
                <a href="" class="chatty-form-download-btn" download>
                    <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 16l-5-5 1.41-1.41L11 12.17V4h2v8.17l2.59-2.58L17 11l-5 5zm-6 2h12v2H6v-2z"/></svg>
                    Download Your File
                </a>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
