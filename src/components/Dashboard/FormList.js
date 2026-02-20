import { __ } from '@wordpress/i18n';
import { Button, Spinner } from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';
import useFormStore, { FORM_TEMPLATES } from '../../store/useFormStore';
import { useToast } from '../Toast/Toast';

const FormList = ({ onEdit, onCreate }) => {
    const forms = useFormStore(state => state.forms);
    const isLoading = useFormStore(state => state.isLoadingForms);
    const fetchForms = useFormStore(state => state.fetchForms);
    const deleteForm = useFormStore(state => state.deleteForm);
    const cloneForm = useFormStore(state => state.cloneForm);
    const exportForms = useFormStore(state => state.exportForms);
    const importForms = useFormStore(state => state.importForms);
    const createFromTemplate = useFormStore(state => state.createFromTemplate);
    const toast = useToast();

    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const importRef = useRef(null);

    useEffect(() => {
        fetchForms();
    }, []);

    if (isLoading) {
        return (
            <div className="chatty-forms-dashboard-view">
                <Spinner />
            </div>
        );
    }

    // === Handlers ===
    const handleDeleteClick = (id) => setConfirmDeleteId(id);
    const handleCancelDelete = () => setConfirmDeleteId(null);

    const handleConfirmDelete = async (id, title) => {
        await deleteForm(id);
        setConfirmDeleteId(null);
        toast.success(`"${title}" deleted.`);
    };

    const handleClone = async (id, title) => {
        const result = await cloneForm(id);
        if (result) {
            toast.success(`"${title}" cloned!`);
        }
    };

    const handleExportAll = async () => {
        const data = await exportForms([]);
        if (data) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chatty-forms-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`${data.count} form(s) exported.`);
        }
    };

    const handleImport = () => {
        importRef.current?.click();
    };

    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.forms || !Array.isArray(data.forms)) {
                toast.error('Invalid import file — no forms found.');
                return;
            }

            const result = await importForms(data);
            if (result) {
                toast.success(`${result.imported} form(s) imported!`);
            }
        } catch (err) {
            toast.error('Failed to parse import file.');
        }

        // Reset file input
        e.target.value = '';
    };

    const handleCreateFromTemplate = async (template) => {
        const result = await createFromTemplate(template);
        if (result?.id) {
            toast.success(`"${template.title}" created from template!`);
            await fetchForms();
            onEdit(result.id);
        }
        setShowTemplates(false);
    };

    // === Template Picker ===
    if (showTemplates) {
        return (
            <div className="chatty-forms-dashboard-view">
                <div className="chatty-forms-list-header">
                    <h2>{__('Choose a Template', 'chatty-forms')}</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="tertiary" onClick={() => setShowTemplates(false)}>
                            {__('← Back', 'chatty-forms')}
                        </Button>
                        <Button variant="primary" onClick={onCreate}>
                            {__('Blank Form', 'chatty-forms')}
                        </Button>
                    </div>
                </div>
                <div className="chatty-forms-template-grid">
                    {FORM_TEMPLATES.map(tpl => (
                        <div
                            key={tpl.id}
                            className="chatty-forms-template-card"
                            onClick={() => handleCreateFromTemplate(tpl)}
                        >
                            <div className="chatty-forms-template-icon">{tpl.icon}</div>
                            <h3>{tpl.title}</h3>
                            <p>{tpl.description}</p>
                            <span className="chatty-forms-template-fields">
                                {tpl.fields.length} field{tpl.fields.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // === Empty State ===
    if (!forms.length) {
        return (
            <div className="chatty-forms-dashboard-view">
                <div className="chatty-forms-empty-placeholder">
                    <h2>{__('No forms yet', 'chatty-forms')}</h2>
                    <p>{__('Create your first form to get started.', 'chatty-forms')}</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Button variant="primary" onClick={onCreate}>
                            {__('Blank Form', 'chatty-forms')}
                        </Button>
                        <Button variant="secondary" onClick={() => setShowTemplates(true)}>
                            {__('Use a Template', 'chatty-forms')}
                        </Button>
                        <Button variant="tertiary" onClick={handleImport}>
                            {__('Import', 'chatty-forms')}
                        </Button>
                    </div>
                </div>
                <input
                    type="file"
                    ref={importRef}
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportFile}
                />
            </div>
        );
    }

    // === Main Form List ===
    return (
        <div className="chatty-forms-dashboard-view">
            <div className="chatty-forms-list-header">
                <h2>{__('All Forms', 'chatty-forms')}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="tertiary" onClick={handleImport}>
                        {__('Import', 'chatty-forms')}
                    </Button>
                    <Button variant="tertiary" onClick={handleExportAll}>
                        {__('Export All', 'chatty-forms')}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowTemplates(true)}>
                        {__('Templates', 'chatty-forms')}
                    </Button>
                    <Button variant="primary" onClick={onCreate}>
                        {__('+ New Form', 'chatty-forms')}
                    </Button>
                </div>
            </div>
            <table className="chatty-forms-table">
                <thead>
                    <tr>
                        <th>{__('Title', 'chatty-forms')}</th>
                        <th>{__('Status', 'chatty-forms')}</th>
                        <th>{__('Submissions', 'chatty-forms')}</th>
                        <th>{__('Shortcode', 'chatty-forms')}</th>
                        <th>{__('Updated', 'chatty-forms')}</th>
                        <th>{__('Actions', 'chatty-forms')}</th>
                    </tr>
                </thead>
                <tbody>
                    {forms.map(form => (
                        <tr key={form.id} onClick={() => onEdit(form.id)} style={{ cursor: 'pointer' }}>
                            <td>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); onEdit(form.id); }}
                                    className="chatty-forms-title-link"
                                >
                                    {form.title}
                                </a>
                            </td>
                            <td>
                                <span className={`chatty-forms-status-badge ${form.status}`}>
                                    {form.status}
                                </span>
                            </td>
                            <td>{form.submissions || 0}</td>
                            <td>
                                <code className="chatty-forms-shortcode">[chatty_form id="{form.id}"]</code>
                            </td>
                            <td>{form.updated_at}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                                {confirmDeleteId === form.id ? (
                                    <div className="chatty-forms-inline-confirm">
                                        <span>Delete?</span>
                                        <Button
                                            variant="primary"
                                            isDestructive
                                            size="small"
                                            onClick={() => handleConfirmDelete(form.id, form.title)}
                                        >
                                            {__('Yes', 'chatty-forms')}
                                        </Button>
                                        <Button
                                            variant="tertiary"
                                            size="small"
                                            onClick={handleCancelDelete}
                                        >
                                            {__('No', 'chatty-forms')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            variant="tertiary"
                                            size="small"
                                            onClick={() => onEdit(form.id)}
                                        >
                                            {__('Edit', 'chatty-forms')}
                                        </Button>
                                        <Button
                                            variant="tertiary"
                                            size="small"
                                            onClick={() => handleClone(form.id, form.title)}
                                        >
                                            {__('Clone', 'chatty-forms')}
                                        </Button>
                                        <Button
                                            variant="tertiary"
                                            size="small"
                                            isDestructive
                                            onClick={() => handleDeleteClick(form.id)}
                                        >
                                            {__('Delete', 'chatty-forms')}
                                        </Button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <input
                type="file"
                ref={importRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />
        </div>
    );
};

export default FormList;
