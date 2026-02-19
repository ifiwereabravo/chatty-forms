import { __ } from '@wordpress/i18n';
import { TextControl, ToggleControl, SelectControl } from '@wordpress/components';
import useFormStore from '../../store/useFormStore';

const TYPE_OPTIONS = [
    { label: 'Text', value: 'text' },
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Address', value: 'address' },
    { label: 'URL', value: 'url' },
    { label: 'Paragraph', value: 'textarea' },
    { label: 'Number', value: 'number' },
    { label: 'Dropdown', value: 'select' },
    { label: 'Checkboxes', value: 'checkbox' },
    { label: 'Radio Buttons', value: 'radio' },
    { label: 'Date', value: 'date' },
    { label: 'Photo Upload', value: 'photo' },
    { label: 'Custom', value: 'custom' },
];

const Properties = () => {
    const selectedFieldId = useFormStore(state => state.selectedFieldId);
    const fields = useFormStore(state => state.fields);
    const updateField = useFormStore(state => state.updateField);
    const removeField = useFormStore(state => state.removeField);

    const field = fields.find(f => f.id === selectedFieldId);

    if (!field) {
        return <div className="chatty-forms-properties-empty">{__('Select a field to edit its properties.', 'chatty-forms')}</div>;
    }

    const handleChange = (key, value) => {
        updateField(field.id, { [key]: value });
    };

    return (
        <div className="chatty-forms-field-properties">
            <div className="chatty-forms-prop-header">
                <h4>{field.label || 'Field'} Properties</h4>
                <button
                    className="button-link-delete"
                    onClick={() => removeField(field.id)}
                    style={{ color: 'var(--chatty-status-error-light)', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                    {__('Delete', 'chatty-forms')}
                </button>
            </div>

            <SelectControl
                label={__('Field Type', 'chatty-forms')}
                value={field.type}
                options={TYPE_OPTIONS}
                onChange={(val) => handleChange('type', val)}
            />

            <TextControl
                label={__('Label', 'chatty-forms')}
                value={field.label}
                onChange={(val) => handleChange('label', val)}
            />

            <TextControl
                label={__('Placeholder', 'chatty-forms')}
                value={field.placeholder}
                onChange={(val) => handleChange('placeholder', val)}
            />

            <ToggleControl
                label={__('Required', 'chatty-forms')}
                checked={field.required}
                onChange={(val) => handleChange('required', val)}
            />

            {/* Type Specific Props */}
            {field.type === 'number' && (
                <>
                    <TextControl
                        label={__('Min Value', 'chatty-forms')}
                        type="number"
                        value={field.min}
                        onChange={(val) => handleChange('min', val)}
                    />
                    <TextControl
                        label={__('Max Value', 'chatty-forms')}
                        type="number"
                        value={field.max}
                        onChange={(val) => handleChange('max', val)}
                    />
                </>
            )}

            {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                <TextControl
                    label={__('Options (comma separated)', 'chatty-forms')}
                    value={field.options || ''}
                    onChange={(val) => handleChange('options', val)}
                    help={__('e.g. Option 1, Option 2, Option 3', 'chatty-forms')}
                />
            )}

            {field.type === 'custom' && (
                <TextControl
                    label={__('HTML Input Type', 'chatty-forms')}
                    value={field.htmlType || 'text'}
                    onChange={(val) => handleChange('htmlType', val)}
                    help={__('e.g. text, tel, color, range, file', 'chatty-forms')}
                />
            )}

            {field.type === 'photo' && (
                <TextControl
                    label={__('Max Photos', 'chatty-forms')}
                    type="number"
                    value={field.maxPhotos || 1}
                    onChange={(val) => handleChange('maxPhotos', Math.min(10, Math.max(1, parseInt(val) || 1)))}
                    help={__('Maximum number of photos (1–10)', 'chatty-forms')}
                    min={1}
                    max={10}
                />
            )}

            <div className="chatty-forms-prop-help">
                <p>Type: <code>{field.type}</code></p>
                <p>ID: <code>{field.id}</code></p>
            </div>
        </div>
    );
};

export default Properties;
