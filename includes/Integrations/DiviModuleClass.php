<?php
if (!defined('ABSPATH')) exit;

/**
 * CHATTY Form — Divi Builder Module
 *
 * Appears in the Divi Builder module picker under "CHATTY" category.
 * Renders the selected form via [chatty_form] shortcode.
 */
class Chatty_Forms_Divi_Module extends ET_Builder_Module {

    public $slug       = 'chatty_form_module';
    public $vb_support = 'on';

    protected $module_credits = [
        'module_uri' => '',
        'author'     => 'CHATTY',
        'author_uri' => '',
    ];

    public function init() {
        $this->name       = esc_html__('CHATTY Form', 'chatty-forms');
        $this->icon_path  = '';

        $this->settings_modal_toggles = [
            'general' => [
                'toggles' => [
                    'main_content' => esc_html__('Form Settings', 'chatty-forms'),
                ],
            ],
        ];
    }

    public function get_fields() {
        // Build form options from the DB
        $forms = $this->get_form_options();

        return [
            'form_id' => [
                'label'           => esc_html__('Select Form', 'chatty-forms'),
                'type'            => 'select',
                'options'         => $forms,
                'default'         => '',
                'toggle_slug'     => 'main_content',
                'description'     => esc_html__('Choose which CHATTY form to display.', 'chatty-forms'),
                'computed_affects' => ['__form_preview'],
            ],
            '__form_preview' => [
                'type'                => 'computed',
                'computed_callback'   => ['Chatty_Forms_Divi_Module', 'get_form_preview'],
                'computed_depends_on' => ['form_id'],
                'computed_minimum'    => ['form_id'],
            ],
        ];
    }

    /**
     * Get available forms as select options
     */
    private function get_form_options() {
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $options = ['' => esc_html__('— Select a form —', 'chatty-forms')];

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") === $table) {
            $forms = $wpdb->get_results("SELECT id, title FROM $table ORDER BY title ASC");
            foreach ($forms as $form) {
                $options[$form->id] = $form->title ?: sprintf(__('Form #%d', 'chatty-forms'), $form->id);
            }
        }

        return $options;
    }

    /**
     * Computed field: generates a preview for the Visual Builder
     */
    public static function get_form_preview($args = [], $conditional_tags = [], $current_page = []) {
        $form_id = isset($args['form_id']) ? absint($args['form_id']) : 0;

        if (!$form_id) {
            return '<div style="padding:20px;text-align:center;color:#a0aec0;background:#1a202c;border:2px dashed #4a5568;border-radius:8px;">
                📋 Select a CHATTY form to display
            </div>';
        }

        return do_shortcode('[chatty_form id="' . $form_id . '"]');
    }

    public function render($attrs, $content, $render_slug) {
        $form_id = !empty($this->props['form_id']) ? absint($this->props['form_id']) : 0;

        if (!$form_id) {
            return '';
        }

        return do_shortcode('[chatty_form id="' . $form_id . '"]');
    }
}

new Chatty_Forms_Divi_Module();
