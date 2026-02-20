import { useState, useEffect } from '@wordpress/element';
import { SelectControl, Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const GlobalSettings = () => {
    const [defaultTheme, setDefaultTheme] = useState('light');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        wp.apiFetch({ path: '/chatty-forms/v1/settings' })
            .then((data) => {
                setDefaultTheme(data.defaultTheme || 'light');
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await wp.apiFetch({
                path: '/chatty-forms/v1/settings',
                method: 'PUT',
                data: { defaultTheme },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Spinner />
            </div>
        );
    }

    return (
        <div className="chatty-forms-global-settings">
            <h2>{__('Global Settings', 'chatty-forms')}</h2>

            <div className="chatty-forms-settings-card">
                <h3>{__('Appearance', 'chatty-forms')}</h3>
                <p className="chatty-forms-settings-help">
                    {__('Set the default theme for all forms. This can be overridden per-form in the editor or per-block when placing a form.', 'chatty-forms')}
                </p>

                <SelectControl
                    label={__('Default Theme Mode', 'chatty-forms')}
                    value={defaultTheme}
                    options={[
                        { label: '☀️ Light', value: 'light' },
                        { label: '🌙 Dark', value: 'dark' },
                        { label: '🔄 Auto (follows visitor OS)', value: 'auto' },
                    ]}
                    onChange={setDefaultTheme}
                />

                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isBusy={saving}
                        disabled={saving}
                    >
                        {saving ? __('Saving...', 'chatty-forms') : __('Save Settings', 'chatty-forms')}
                    </Button>
                    {saved && (
                        <span style={{ color: '#48bb78', fontWeight: 600 }}>
                            ✓ {__('Saved!', 'chatty-forms')}
                        </span>
                    )}
                </div>
            </div>

            <div className="chatty-forms-settings-card" style={{ marginTop: 20 }}>
                <h3>{__('Theme Priority', 'chatty-forms')}</h3>
                <p className="chatty-forms-settings-help">
                    {__('When a form is rendered, the theme is determined in this order:', 'chatty-forms')}
                </p>
                <ol style={{ margin: '12px 0', paddingLeft: 20, lineHeight: 1.8 }}>
                    <li><strong>{__('Block/Shortcode override', 'chatty-forms')}</strong> — {__('set when placing the form on a page', 'chatty-forms')}</li>
                    <li><strong>{__('Form setting', 'chatty-forms')}</strong> — {__('set in the form editor Settings panel', 'chatty-forms')}</li>
                    <li><strong>{__('Global default', 'chatty-forms')}</strong> — {__('set here', 'chatty-forms')}</li>
                </ol>
            </div>
        </div>
    );
};

export default GlobalSettings;
