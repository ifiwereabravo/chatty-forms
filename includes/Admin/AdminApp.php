<?php
namespace Chatty\Forms\Admin;

class AdminApp {
    public function __construct() {
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    public function enqueue_assets($hook) {
        if ($hook !== 'toplevel_page_chatty-forms') {
            return;
        }

        $asset_file = include(CHATTY_FORMS_PATH . 'build/index.asset.php');

        wp_enqueue_script(
            'chatty-forms-app',
            CHATTY_FORMS_URL . 'build/index.js',
            $asset_file['dependencies'],
            $asset_file['version'],
            true
        );

        // Enqueue the CHATTY Design System for dark theme variables
        wp_enqueue_style(
            'chatty-design-system',
            plugins_url('chatty-core/assets/css/chatty-design-system.css', CHATTY_FORMS_PATH),
            [],
            '1.0.0'
        );

        wp_enqueue_style(
            'chatty-forms-app',
            CHATTY_FORMS_URL . 'build/index.css',
            ['wp-components', 'chatty-design-system'],
            $asset_file['version']
        );
        
        // Pass data to the React app
        $emblem_url = '';
        $core_emblem = WP_PLUGIN_DIR . '/chatty-core/assets/images/logo-concierge-emblem.png';
        if (file_exists($core_emblem)) {
            $emblem_url = plugins_url('chatty-core/assets/images/logo-concierge-emblem.png');
        }

        wp_localize_script('chatty-forms-app', 'chattyFormsData', [
            'apiUrl'    => rest_url('chatty-forms/v1'),
            'nonce'     => wp_create_nonce('wp_rest'),
            'emblemUrl' => $emblem_url,
        ]);
    }
}
