<?php
namespace Chatty\Forms\Api;

class SubmissionHandler {
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('chatty-forms/v1', '/submit', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_submission'],
            'permission_callback' => '__return_true', // Public form submission
        ]);
    }

    public function handle_submission($request) {
        $params = $request->get_json_params();
        $form_id = (int)($params['form_id'] ?? 0);
        $data = $params['data'] ?? [];

        if (!$form_id || empty($data)) {
            return new \WP_Error('invalid_data', 'Missing form ID or data', ['status' => 400]);
        }

        // Read visitor_id from request body (sent by frontend) or cookie fallback
        $visitor_id = sanitize_text_field($params['visitor_id'] ?? '');
        if (empty($visitor_id) && isset($_COOKIE['chatty_visitor_id'])) {
            $visitor_id = sanitize_text_field($_COOKIE['chatty_visitor_id']);
        }

        // Store in DB
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_form_submissions';
        
        $inserted = $wpdb->insert($table, [
            'form_id' => $form_id,
            'data_json' => json_encode($data),
            'meta_json' => json_encode([
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'ua' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'referer' => $_SERVER['HTTP_REFERER'] ?? '',
                'visitor_id' => $visitor_id,
            ]),
            'created_at' => current_time('mysql')
        ]);

        if ($inserted === false) {
            return new \WP_Error('db_error', 'Failed to save submission', ['status' => 500]);
        }

        // ─── Visitor Identity Resolution ──────────────────────────────
        // If chatty-core is active and we have a visitor_id, enrich the visitor record
        if ($visitor_id && class_exists('\\Chatty\\Core\\VisitorIdentity')) {
            try {
                // Load form field definitions for smarter field detection
                $field_defs = $this->get_form_fields($form_id);

                // Extract contact data from submitted form fields
                $contact = \Chatty\Core\VisitorIdentity::extract_contact($data, $field_defs);

                if (!empty($contact)) {
                    \Chatty\Core\VisitorIdentity::identify($visitor_id, $contact);
                }

                // Always increment form submission counter (even for repeat submitters)
                \Chatty\Core\VisitorIdentity::increment_form_count($visitor_id);
            } catch (\Throwable $e) {
                // Don't fail the form submission if identity resolution fails
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('[CHATTY Forms] Visitor identity resolution error: ' . $e->getMessage());
                }
            }
        }

        /**
         * Fires after a form submission is saved.
         * Works standalone — any plugin can hook into this to process submissions.
         *
         * @param int    $form_id    The form ID
         * @param array  $data       The submitted field data
         * @param string $visitor_id The visitor cookie ID (may be empty)
         * @param int    $submission_id The DB row ID of the submission
         */
        do_action('chatty_forms_submitted', $form_id, $data, $visitor_id, $wpdb->insert_id);

        return rest_ensure_response(['success' => true, 'message' => 'Thank you! Your submission has been received.']);
    }

    /**
     * Load form field definitions to aid contact extraction.
     * Returns an array of field configs with 'id' and 'type' keys.
     */
    private function get_form_fields(int $form_id): array {
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $fields_json = $wpdb->get_var($wpdb->prepare(
            "SELECT fields_json FROM $table WHERE id = %d",
            $form_id
        ));

        if (!$fields_json) return [];

        $fields = json_decode($fields_json, true);
        return is_array($fields) ? $fields : [];
    }
}
