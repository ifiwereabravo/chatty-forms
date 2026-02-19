<?php
namespace Chatty\Forms;

class ChattyForms {
    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_hooks();
        $this->init_components();
    }

    private function init_hooks() {
        // Localization
        add_action('init', function() {
            load_plugin_textdomain('chatty-forms', false, dirname(plugin_basename(CHATTY_FORMS_FILE)) . '/languages');
        });
    }

    private function init_components() {
        // Admin UI
        if (is_admin()) {
            new Admin\Menu();
            new Admin\AdminApp();
        }

        // Database
        new Database();

        // Frontend
        new Shortcode();

        // API
        new Api\SubmissionHandler();
        new Api\FormController();
        new Api\PhotoUploadHandler();

        // Admin Submissions Viewer
        if (is_admin()) {
            new Admin\SubmissionsPage();
        }
    }

    public static function activate() {
        // Run migrations
        require_once CHATTY_FORMS_PATH . 'includes/Database.php';
        $db = new Database();
        $db->migrate();
    }

    public static function deactivate() {
        // Cleanup if needed
    }
}
