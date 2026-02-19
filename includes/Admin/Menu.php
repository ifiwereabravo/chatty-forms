<?php
namespace Chatty\Forms\Admin;

class Menu {
    public function __construct() {
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_head', [$this, 'menu_icon_styles']);
    }

    public function register_menu() {
        // Use the Concierge emblem from chatty-core if available
        $icon_url = 'dashicons-feedback';
        $core_emblem = WP_PLUGIN_DIR . '/chatty-core/assets/images/logo-concierge-emblem.png';
        if (file_exists($core_emblem)) {
            $icon_url = plugins_url('chatty-core/assets/images/logo-concierge-emblem.png');
        }

        add_menu_page(
            __('CHATTY Forms', 'chatty-forms'),
            __('CHATTY Forms', 'chatty-forms'),
            'manage_options',
            'chatty-forms',
            [$this, 'render_admin_app'],
            $icon_url,
            30
        );
    }

    /**
     * Constrain the sidebar menu icon to WordPress standard 20×20px.
     * The emblem PNG is 800×697px native, which overflows without this.
     */
    public function menu_icon_styles() {
        echo '<style>
            #toplevel_page_chatty-forms .wp-menu-image img {
                width: 20px !important;
                height: 20px !important;
                object-fit: contain;
                padding: 7px 0 !important;
            }
            #toplevel_page_chatty-forms .wp-menu-image {
                overflow: hidden !important;
            }
        </style>';
    }

    public function render_admin_app() {
        echo '<div id="chatty-forms-root"></div>';
    }
}

