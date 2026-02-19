import { __ } from '@wordpress/i18n';
import { Button, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import useFormStore from '../../store/useFormStore';
import { useToast } from '../Toast/Toast';

const FormList = ({ onEdit, onCreate }) => {
    const forms = useFormStore(state => state.forms);
    const isLoading = useFormStore(state => state.isLoadingForms);
    const fetchForms = useFormStore(state => state.fetchForms);
    const deleteForm = useFormStore(state => state.deleteForm);
    const toast = useToast();
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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

    if (!forms.length) {
        return (
            <div className="chatty-forms-dashboard-view">
                <div className="chatty-forms-empty-placeholder">
                    <h2>{__('No forms yet', 'chatty-forms')}</h2>
                    <p>{__('Create your first form to get started.', 'chatty-forms')}</p>
                    <Button variant="primary" onClick={onCreate}>
                        {__('Create New Form', 'chatty-forms')}
                    </Button>
                </div>
            </div>
        );
    }

    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
    };

    const handleConfirmDelete = async (id, title) => {
        await deleteForm(id);
        setConfirmDeleteId(null);
        toast.success(`"${title}" deleted.`);
    };

    const handleCancelDelete = () => {
        setConfirmDeleteId(null);
    };

    return (
        <div className="chatty-forms-dashboard-view">
            <div className="chatty-forms-list-header">
                <h2>{__('All Forms', 'chatty-forms')}</h2>
                <Button variant="primary" onClick={onCreate}>
                    {__('+ New Form', 'chatty-forms')}
                </Button>
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
        </div>
    );
};

export default FormList;
