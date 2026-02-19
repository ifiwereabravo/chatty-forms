import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Placeholder, Spinner } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

import './editor.scss';

registerBlockType(metadata.name, {
    edit: ({ attributes, setAttributes }) => {
        const { formId } = attributes;
        const blockProps = useBlockProps();
        const [forms, setForms] = useState([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            wp.apiFetch({ path: '/chatty-forms/v1/forms' })
                .then((data) => {
                    setForms(data || []);
                    setLoading(false);
                })
                .catch(() => {
                    setForms([]);
                    setLoading(false);
                });
        }, []);

        const formOptions = [
            { label: __('— Select a form —', 'chatty-forms'), value: '' },
            ...forms.map(f => ({ label: f.title || `Form #${f.id}`, value: String(f.id) })),
        ];

        const selectedForm = forms.find(f => String(f.id) === String(formId));

        return (
            <div {...blockProps}>
                <InspectorControls>
                    <PanelBody title={__('Form Settings', 'chatty-forms')}>
                        <SelectControl
                            label={__('Select Form', 'chatty-forms')}
                            value={formId}
                            options={formOptions}
                            onChange={(val) => setAttributes({ formId: val })}
                        />
                    </PanelBody>
                </InspectorControls>

                {loading ? (
                    <Placeholder icon="feedback" label={__('CHATTY Form', 'chatty-forms')}>
                        <Spinner />
                    </Placeholder>
                ) : !formId ? (
                    <Placeholder
                        icon="feedback"
                        label={__('CHATTY Form', 'chatty-forms')}
                        instructions={__('Select a form to display.', 'chatty-forms')}
                    >
                        <SelectControl
                            value={formId}
                            options={formOptions}
                            onChange={(val) => setAttributes({ formId: val })}
                        />
                    </Placeholder>
                ) : (
                    <div className="chatty-forms-block-preview">
                        <div className="chatty-forms-block-preview__header">
                            <span className="chatty-forms-block-preview__icon">📋</span>
                            <span className="chatty-forms-block-preview__title">
                                {selectedForm ? selectedForm.title : `Form #${formId}`}
                            </span>
                        </div>
                        <div className="chatty-forms-block-preview__info">
                            <code>[chatty_form id="{formId}"]</code>
                        </div>
                    </div>
                )}
            </div>
        );
    },

    save: () => null, // Rendered server-side via PHP
});
