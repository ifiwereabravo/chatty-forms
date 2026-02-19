import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useFormStore from '../../store/useFormStore';

const FieldItem = ({ field }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
    const selectField = useFormStore(state => state.selectField);
    const selectedFieldId = useFormStore(state => state.selectedFieldId);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isSelected = selectedFieldId === field.id;

    const renderPreview = () => {
        switch (field.type) {
            case 'textarea':
                return <textarea placeholder={field.placeholder} disabled />;
            case 'select':
                return <select disabled><option>Option 1</option></select>;
            case 'address':
                return (
                    <div className="chatty-forms-address-preview">
                        <input type="text" placeholder="Street Address" disabled />
                        <input type="text" placeholder="City" disabled />
                        <div className="chatty-forms-address-row">
                            <input type="text" placeholder="State" disabled />
                            <input type="text" placeholder="ZIP" disabled />
                        </div>
                    </div>
                );
            case 'name':
                return (
                    <div className="chatty-forms-address-row">
                        <input type="text" placeholder="First Name" disabled />
                        <input type="text" placeholder="Last Name" disabled />
                    </div>
                );
            case 'phone':
                return <input type="tel" placeholder={field.placeholder || '(555) 123-4567'} disabled />;
            case 'url':
                return <input type="url" placeholder={field.placeholder || 'https://'} disabled />;
            case 'custom':
                return <input type={field.htmlType || 'text'} placeholder={field.placeholder || 'Custom field...'} disabled />;
            case 'photo':
                return (
                    <div className="chatty-forms-photo-preview" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#1a202c', borderRadius: '6px', border: '1px dashed #4a5568' }}>
                        <span style={{ fontSize: '24px' }}>📷</span>
                        <span style={{ color: '#a0aec0', fontSize: '13px' }}>Photo Upload (max {field.maxPhotos || 1})</span>
                    </div>
                );
            default:
                return <input type={field.type === 'email' ? 'email' : 'text'} placeholder={field.placeholder} disabled />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`chatty-forms-field-item ${isSelected ? 'is-selected' : ''}`}
            onClick={() => selectField(field.id)}
        >
            <label>{field.label} {field.required && <span className="required">*</span>}</label>
            {renderPreview()}
        </div>
    );
};

export default FieldItem;
