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

        // Store in DB
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_form_submissions';
        
        $inserted = $wpdb->insert($table, [
            'form_id' => $form_id,
            'data_json' => json_encode($data),
            'meta_json' => json_encode([
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'ua' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'referer' => $_SERVER['HTTP_REFERER'] ?? ''
            ]),
            'created_at' => current_time('mysql')
        ]);

        if ($inserted === false) {
            return new \WP_Error('db_error', 'Failed to save submission', ['status' => 500]);
        }

        return rest_ensure_response(['success' => true, 'message' => 'Thank you! Your submission has been received.']);
    }
}
