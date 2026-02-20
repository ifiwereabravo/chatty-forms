import { createRoot, useState } from '@wordpress/element';
import MainLayout from './components/Layout/MainLayout';
import FormList from './components/Dashboard/FormList';
import GlobalSettings from './components/Dashboard/GlobalSettings';
import EditorLayout from './components/Editor/EditorLayout';
import { ToastProvider } from './components/Toast/Toast';
import useFormStore from './store/useFormStore';
import './index.scss';
import './components/Layout/Layout.scss';
import './components/Editor/Editor.scss';

const App = () => {
    const [view, setView] = useState('dashboard');
    const loadForm = useFormStore(state => state.loadForm);
    const newForm = useFormStore(state => state.newForm);
    const fetchForms = useFormStore(state => state.fetchForms);

    const handleCreate = () => {
        newForm();
        setView('editor');
    };

    const handleEdit = async (id) => {
        await loadForm(id);
        setView('editor');
    };

    const handleNavChange = (newView) => {
        if (newView === 'dashboard') {
            fetchForms();
        }
        setView(newView);
    };

    return (
        <ToastProvider>
            <MainLayout currentView={view} onViewChange={handleNavChange}>
                {view === 'settings' ? (
                    <GlobalSettings />
                ) : view === 'editor' ? (
                    <EditorLayout onBack={() => handleNavChange('dashboard')} />
                ) : (
                    <FormList onCreate={handleCreate} onEdit={handleEdit} />
                )}
            </MainLayout>
        </ToastProvider>
    );
};

const rootElement = document.getElementById('chatty-forms-root');
if (rootElement) {
    createRoot(rootElement).render(<App />);
}
