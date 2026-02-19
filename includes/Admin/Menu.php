<?php
namespace Chatty\Forms\Admin;

class Menu {
    public function __construct() {
        add_action('admin_menu', [$this, 'register_menu']);
    }

    public function register_menu() {
        add_menu_page(
            __('CHATTY Forms', 'chatty-forms'),
            __('CHATTY Forms', 'chatty-forms'),
            'manage_options',
            'chatty-forms',
            [$this, 'render_admin_app'],
            'dashicons-feedback',
            30
        );
    }

    public function render_admin_app() {
        echo '<div id="chatty-forms-root"></div>';
    }
}
