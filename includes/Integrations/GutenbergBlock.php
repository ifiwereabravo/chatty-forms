<?php
namespace Chatty\Forms\Integrations;

/**
 * Gutenberg Block — CHATTY Form picker
 * Registers a server-side rendered block that outputs [chatty_form id="X"]
 */
class GutenbergBlock {

    public function __construct() {
        add_action('init', [$this, 'register_block']);
    }

    public function register_block() {
        $block_dir = CHATTY_FORMS_PATH . 'build/block';

        if (!file_exists($block_dir . '/block.json')) {
            return;
        }

        try {
            register_block_type($block_dir, [
                'render_callback' => [$this, 'render_block'],
            ]);
        } catch (\Throwable $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[CHATTY Forms] Block registration failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Server-side render — outputs the form shortcode
     */
    public function render_block($attributes) {
        $form_id = !empty($attributes['formId']) ? absint($attributes['formId']) : 0;

        if (!$form_id) {
            if (is_admin() || defined('REST_REQUEST')) {
                return '<p style="color:#a0aec0;text-align:center;">No form selected.</p>';
            }
            return '';
        }

        return do_shortcode('[chatty_form id="' . $form_id . '"]');
    }
}
