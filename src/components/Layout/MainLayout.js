import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

const MainLayout = ({ children, currentView, onViewChange }) => {
    return (
        <div className="chatty-forms-layout">
            <header className="chatty-forms-header">
                <div className="chatty-forms-branding">
                    <h1>{__('CHATTY Forms', 'chatty-forms')}</h1>
                </div>
                <nav className="chatty-forms-nav">
                    <Button
                        variant={currentView === 'dashboard' ? 'primary' : 'tertiary'}
                        onClick={() => onViewChange('dashboard')}
                    >
                        {__('Dashboard', 'chatty-forms')}
                    </Button>
                </nav>
            </header>
            <main className="chatty-forms-main">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
