<?php
namespace Chatty\Forms\Integrations;

/**
 * Divi Builder Module — CHATTY Form
 *
 * Adds a "CHATTY Form" module to the Divi Builder module picker.
 * Uses the existing [chatty_form] shortcode for rendering.
 */
class DiviModule {

    public function __construct() {
        add_action('et_builder_ready', [$this, 'register_module']);
    }

    public function register_module() {
        if (!class_exists('ET_Builder_Module')) {
            return;
        }

        if (!class_exists('Chatty_Forms_Divi_Module')) {
            require_once __DIR__ . '/DiviModuleClass.php';
        }
    }
}
