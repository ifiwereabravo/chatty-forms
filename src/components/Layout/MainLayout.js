import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

const MainLayout = ({ children, currentView, onViewChange }) => {
    const emblemUrl = window.chattyFormsData?.emblemUrl;

    return (
        <div className="chatty-forms-layout">
            <header className="chatty-forms-header">
                <div className="chatty-forms-branding">
                    {emblemUrl && (
                        <img
                            src={emblemUrl}
                            alt="CHATTY"
                            className="chatty-forms-emblem"
                        />
                    )}
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
