import { __ } from '@wordpress/i18n';
import {
    SelectControl,
    TextControl,
    TextareaControl,
    ToggleControl,
    Button
} from '@wordpress/components';
import useFormStore from '../../store/useFormStore';

const DELIVERY_OPTIONS = [
    { label: 'Show Success Message', value: 'message' },
    { label: 'Deliver Download', value: 'download' },
    { label: 'Redirect to URL', value: 'redirect' },
];

const GATE_OPTIONS = [
    { label: 'None — Deliver Immediately', value: 'none' },
    { label: 'Social Share Required', value: 'share' },
    { label: 'Social Login Required', value: 'login' },
    { label: 'Form + Share Required', value: 'form_share' },
    { label: 'Form + Login Required', value: 'form_login' },
];

const FormSettings = () => {
    const settings = useFormStore(state => state.settings);
    const updateSettings = useFormStore(state => state.updateSettings);

    const openMediaPicker = () => {
        const frame = wp.media({
            title: __('Select Download File', 'chatty-forms'),
            button: { text: __('Use this file', 'chatty-forms') },
            multiple: false,
        });

        frame.on('select', () => {
            const attachment = frame.state().get('selection').first().toJSON();
            updateSettings({
                downloadUrl: attachment.url,
                downloadFilename: attachment.filename,
                downloadFilesize: attachment.filesizeHumanReadable,
            });
        });

        frame.open();
    };

    return (
        <div className="chatty-forms-settings-panel">

            {/* After Submission */}
            <div className="chatty-forms-settings-section">
                <h4>{__('After Submission', 'chatty-forms')}</h4>

                <SelectControl
                    label={__('Delivery Type', 'chatty-forms')}
                    value={settings.deliveryType || 'message'}
                    options={DELIVERY_OPTIONS}
                    onChange={(val) => updateSettings({ deliveryType: val })}
                />

                {settings.deliveryType === 'message' && (
                    <TextareaControl
                        label={__('Success Message', 'chatty-forms')}
                        value={settings.successMessage || 'Thank you! Your submission has been received.'}
                        onChange={(val) => updateSettings({ successMessage: val })}
                        rows={3}
                    />
                )}

                {settings.deliveryType === 'download' && (
                    <div className="chatty-forms-file-picker">
                        <label>{__('Download File', 'chatty-forms')}</label>
                        {settings.downloadUrl ? (
                            <div className="chatty-forms-file-selected">
                                <div className="chatty-forms-file-info">
                                    <span className="dashicons dashicons-media-default"></span>
                                    <div>
                                        <strong>{settings.downloadFilename || 'File'}</strong>
                                        {settings.downloadFilesize && (
                                            <small>{settings.downloadFilesize}</small>
                                        )}
                                    </div>
                                </div>
                                <div className="chatty-forms-file-actions">
                                    <Button variant="secondary" size="small" onClick={openMediaPicker}>
                                        {__('Change', 'chatty-forms')}
                                    </Button>
                                    <Button
                                        variant="tertiary"
                                        size="small"
                                        isDestructive
                                        onClick={() => updateSettings({ downloadUrl: '', downloadFilename: '', downloadFilesize: '' })}
                                    >
                                        {__('Remove', 'chatty-forms')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button variant="secondary" onClick={openMediaPicker}>
                                <span className="dashicons dashicons-upload"></span>
                                {__('Select File', 'chatty-forms')}
                            </Button>
                        )}
                    </div>
                )}

                {settings.deliveryType === 'redirect' && (
                    <TextControl
                        label={__('Redirect URL', 'chatty-forms')}
                        value={settings.redirectUrl || ''}
                        onChange={(val) => updateSettings({ redirectUrl: val })}
                        placeholder="https://example.com/thank-you"
                    />
                )}
            </div>

            {/* Content Gate */}
            <div className="chatty-forms-settings-section">
                <h4>{__('Content Gate', 'chatty-forms')}</h4>
                <p className="chatty-forms-settings-help">
                    {__('Require visitors to share or login before accessing content.', 'chatty-forms')}
                </p>

                <SelectControl
                    label={__('Gate Type', 'chatty-forms')}
                    value={settings.gateType || 'none'}
                    options={GATE_OPTIONS}
                    onChange={(val) => updateSettings({ gateType: val })}
                />

                {/* Share Settings */}
                {(settings.gateType === 'share' || settings.gateType === 'form_share') && (
                    <div className="chatty-forms-share-settings">
                        <label className="chatty-forms-settings-label">{__('Share Platforms', 'chatty-forms')}</label>
                        <ToggleControl
                            label="Facebook"
                            checked={settings.shareFacebook !== false}
                            onChange={(val) => updateSettings({ shareFacebook: val })}
                        />
                        <ToggleControl
                            label="X (Twitter)"
                            checked={settings.shareTwitter !== false}
                            onChange={(val) => updateSettings({ shareTwitter: val })}
                        />
                        <ToggleControl
                            label="LinkedIn"
                            checked={settings.shareLinkedin !== false}
                            onChange={(val) => updateSettings({ shareLinkedin: val })}
                        />
                        <TextControl
                            label={__('Share Text', 'chatty-forms')}
                            value={settings.shareText || ''}
                            onChange={(val) => updateSettings({ shareText: val })}
                            placeholder="Check out this awesome resource!"
                        />
                        <TextControl
                            label={__('Share URL', 'chatty-forms')}
                            value={settings.shareUrl || ''}
                            onChange={(val) => updateSettings({ shareUrl: val })}
                            placeholder="Leave blank for current page URL"
                        />
                    </div>
                )}

                {/* Social Login Settings */}
                {(settings.gateType === 'login' || settings.gateType === 'form_login') && (
                    <div className="chatty-forms-login-settings">
                        <label className="chatty-forms-settings-label">{__('Login Providers', 'chatty-forms')}</label>
                        <ToggleControl
                            label="Google"
                            checked={settings.loginGoogle !== false}
                            onChange={(val) => updateSettings({ loginGoogle: val })}
                        />
                        <ToggleControl
                            label="Facebook"
                            checked={settings.loginFacebook !== false}
                            onChange={(val) => updateSettings({ loginFacebook: val })}
                        />
                        <ToggleControl
                            label="Instagram"
                            checked={settings.loginInstagram !== false}
                            onChange={(val) => updateSettings({ loginInstagram: val })}
                        />
                        <p className="chatty-forms-settings-note">
                            <span className="dashicons dashicons-info"></span>
                            {__('OAuth credentials must be configured in CHATTY Forms → Settings.', 'chatty-forms')}
                        </p>
                    </div>
                )}
            </div>

            {/* Social Login on Form */}
            <div className="chatty-forms-settings-section">
                <h4>{__('Social Login (Auto-Fill)', 'chatty-forms')}</h4>
                <p className="chatty-forms-settings-help">
                    {__('Let visitors login with social accounts to pre-fill form fields.', 'chatty-forms')}
                </p>
                <ToggleControl
                    label={__('Enable Social Login Buttons', 'chatty-forms')}
                    checked={settings.enableSocialLogin || false}
                    onChange={(val) => updateSettings({ enableSocialLogin: val })}
                />
                {settings.enableSocialLogin && (
                    <>
                        <ToggleControl label="Google" checked={settings.socialGoogle !== false} onChange={val => updateSettings({ socialGoogle: val })} />
                        <ToggleControl label="Facebook" checked={settings.socialFacebook !== false} onChange={val => updateSettings({ socialFacebook: val })} />
                        <ToggleControl label="Instagram" checked={settings.socialInstagram !== false} onChange={val => updateSettings({ socialInstagram: val })} />
                    </>
                )}
            </div>
        </div>
    );
};

export default FormSettings;
