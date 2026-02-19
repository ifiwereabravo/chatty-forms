<?php
/**
 * Plugin Name: CHATTY: Forms
 * Description: A powerful, drag-and-drop form builder for the CHATTY ecosystem.
 * Version: 1.0.0
 * Author: CHATTY
 * Text Domain: chatty-forms
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('CHATTY_FORMS_VERSION', '1.0.0');
define('CHATTY_FORMS_PATH', plugin_dir_path(__FILE__));
define('CHATTY_FORMS_URL', plugin_dir_url(__FILE__));
define('CHATTY_FORMS_FILE', __FILE__);

// Autoloader
spl_autoload_register(function ($class) {
    if (strpos($class, 'Chatty\\Forms\\') !== 0) {
        return;
    }

    $relative_class = substr($class, strlen('Chatty\\Forms\\'));
    $file = CHATTY_FORMS_PATH . 'includes/' . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// Initialize Plugin
function chatty_forms_init() {
    \Chatty\Forms\ChattyForms::get_instance();
}
add_action('plugins_loaded', 'chatty_forms_init');

// Activation/Deactivation
register_activation_hook(__FILE__, ['\\Chatty\\Forms\\ChattyForms', 'activate']);
register_deactivation_hook(__FILE__, ['\\Chatty\\Forms\\ChattyForms', 'deactivate']);
