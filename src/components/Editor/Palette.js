import { __ } from '@wordpress/i18n';
import { useDraggable } from '@dnd-kit/core';
import useFormStore from '../../store/useFormStore';

const PaletteItem = ({ type, label, icon }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${type}`,
        data: { type, isPalette: true },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`chatty-forms-palette-item ${isDragging ? 'is-dragging' : ''}`}
        >
            <span className="dashicons dashicons-editor-justify"></span>
            {label}
        </div>
    );
};

export const FIELD_TYPES = [
    { type: 'text', label: __('Text Field', 'chatty-forms') },
    { type: 'name', label: __('Name', 'chatty-forms') },
    { type: 'email', label: __('Email Address', 'chatty-forms') },
    { type: 'phone', label: __('Phone Number', 'chatty-forms') },
    { type: 'address', label: __('Address', 'chatty-forms') },
    { type: 'url', label: __('Website URL', 'chatty-forms') },
    { type: 'textarea', label: __('Paragraph Text', 'chatty-forms') },
    { type: 'number', label: __('Number', 'chatty-forms') },
    { type: 'select', label: __('Dropdown', 'chatty-forms') },
    { type: 'checkbox', label: __('Checkboxes', 'chatty-forms') },
    { type: 'radio', label: __('Radio Buttons', 'chatty-forms') },
    { type: 'date', label: __('Date Picker', 'chatty-forms') },
];

const Palette = () => {
    const addField = useFormStore(state => state.addField);

    const handleAddCustom = () => {
        addField('custom');
    };

    return (
        <div className="chatty-forms-palette-list">
            {FIELD_TYPES.map(field => (
                <PaletteItem key={field.type} {...field} />
            ))}
            <button
                className="chatty-forms-custom-field-btn"
                onClick={handleAddCustom}
            >
                <span className="dashicons dashicons-plus-alt2"></span>
                {__('Custom Field', 'chatty-forms')}
            </button>
        </div>
    );
};

export default Palette;
