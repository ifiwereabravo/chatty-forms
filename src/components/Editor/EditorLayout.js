import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import useFormStore from '../../store/useFormStore';
import { useToast } from '../Toast/Toast';
import Palette, { FIELD_TYPES } from './Palette';
import Canvas from './Canvas';
import Properties from './Properties';
import FormSettings from './FormSettings';

const EditorLayout = ({ onBack }) => {
    const form = useFormStore(state => state.form);
    const fields = useFormStore(state => state.fields);
    const isSaving = useFormStore(state => state.isSaving);
    const hasUnsavedChanges = useFormStore(state => state.hasUnsavedChanges);
    const saveForm = useFormStore(state => state.saveForm);
    const setFormTitle = useFormStore(state => state.setFormTitle);
    const addField = useFormStore(state => state.addField);
    const moveField = useFormStore(state => state.moveField);
    const setIsDragging = useFormStore(state => state.setIsDragging);
    const toast = useToast();

    const [activeItem, setActiveItem] = useState(null);
    const [activeTab, setActiveTab] = useState('builder');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        setIsDragging(true);
        const { active } = event;

        if (active.data.current?.isPalette) {
            const fieldType = FIELD_TYPES.find(f => f.type === active.data.current.type);
            setActiveItem({ source: 'palette', label: fieldType?.label || active.data.current.type });
        } else {
            const field = fields.find(f => f.id === active.id);
            setActiveItem({ source: 'canvas', label: field?.label || 'Field' });
        }
    };

    const handleDragEnd = (event) => {
        setIsDragging(false);
        setActiveItem(null);
        const { active, over } = event;

        if (!over) return;

        if (active.data.current?.isPalette) {
            if (over.id === 'canvas-droppable') {
                addField(active.data.current.type);
            } else {
                const overIndex = fields.findIndex(f => f.id === over.id);
                addField(active.data.current.type, overIndex >= 0 ? overIndex : null);
            }
            return;
        }

        if (active.id !== over.id) {
            const oldIndex = fields.findIndex(f => f.id === active.id);
            const newIndex = fields.findIndex(f => f.id === over.id);
            if (oldIndex >= 0 && newIndex >= 0) {
                moveField(oldIndex, newIndex);
            }
        }
    };

    const handleDragCancel = () => {
        setIsDragging(false);
        setActiveItem(null);
    };

    const handleSave = async () => {
        try {
            await saveForm();
            toast.success('Form saved successfully!');
        } catch (e) {
            toast.error('Failed to save form.');
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="chatty-forms-editor-wrapper">
                <div className="chatty-forms-editor-toolbar">
                    <div className="chatty-forms-toolbar-left">
                        <Button variant="tertiary" onClick={onBack} icon="arrow-left-alt">
                            {__('Back', 'chatty-forms')}
                        </Button>
                        <input
                            className="chatty-forms-title-input"
                            type="text"
                            value={form.title}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Form title..."
                        />
                        {hasUnsavedChanges && (
                            <span className="chatty-forms-unsaved-badge">Unsaved</span>
                        )}
                    </div>
                    <div className="chatty-forms-toolbar-right">
                        {/* Tab Switcher */}
                        <div className="chatty-forms-tab-switcher">
                            <button
                                className={`chatty-forms-tab ${activeTab === 'builder' ? 'active' : ''}`}
                                onClick={() => setActiveTab('builder')}
                            >
                                <span className="dashicons dashicons-edit"></span>
                                {__('Builder', 'chatty-forms')}
                            </button>
                            <button
                                className={`chatty-forms-tab ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                <span className="dashicons dashicons-admin-generic"></span>
                                {__('Settings', 'chatty-forms')}
                            </button>
                        </div>

                        {form.id && (
                            <code className="chatty-forms-shortcode-inline">[chatty_form id="{form.id}"]</code>
                        )}
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            isBusy={isSaving}
                            disabled={isSaving}
                        >
                            {isSaving ? __('Saving...', 'chatty-forms') : __('Save Form', 'chatty-forms')}
                        </Button>
                    </div>
                </div>

                {activeTab === 'builder' ? (
                    <div className="chatty-forms-editor">
                        <aside className="chatty-forms-palette">
                            <h3>{__('Fields', 'chatty-forms')}</h3>
                            <Palette />
                        </aside>
                        <section className="chatty-forms-canvas-container">
                            <Canvas />
                        </section>
                        <aside className="chatty-forms-properties">
                            <h3>{__('Properties', 'chatty-forms')}</h3>
                            <Properties />
                        </aside>
                    </div>
                ) : (
                    <div className="chatty-forms-settings-view">
                        <FormSettings />
                    </div>
                )}
            </div>

            <DragOverlay dropAnimation={null}>
                {activeItem ? (
                    <div className="chatty-forms-drag-overlay">
                        <span className="dashicons dashicons-editor-justify"></span>
                        {activeItem.label}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default EditorLayout;
