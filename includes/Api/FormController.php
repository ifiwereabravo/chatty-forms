<?php
namespace Chatty\Forms\Api;

class FormController {
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        $namespace = 'chatty-forms/v1';

        // List all forms
        register_rest_route($namespace, '/forms', [
            'methods'             => 'GET',
            'callback'            => [$this, 'list_forms'],
            'permission_callback' => [$this, 'check_admin'],
        ]);

        // Get single form
        register_rest_route($namespace, '/forms/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_form'],
            'permission_callback' => [$this, 'check_admin'],
        ]);

        // Create form
        register_rest_route($namespace, '/forms', [
            'methods'             => 'POST',
            'callback'            => [$this, 'create_form'],
            'permission_callback' => [$this, 'check_admin'],
        ]);

        // Update form
        register_rest_route($namespace, '/forms/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [$this, 'update_form'],
            'permission_callback' => [$this, 'check_admin'],
        ]);

        // Delete form
        register_rest_route($namespace, '/forms/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [$this, 'delete_form'],
            'permission_callback' => [$this, 'check_admin'],
        ]);
    }

    public function check_admin() {
        return current_user_can('manage_options');
    }

    public function list_forms($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $forms = $wpdb->get_results("SELECT id, title, slug, status, created_at, updated_at FROM $table ORDER BY updated_at DESC");

        // Add submission count
        $sub_table = $wpdb->prefix . 'chatty_form_submissions';
        foreach ($forms as &$form) {
            $form->submissions = (int)$wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $sub_table WHERE form_id = %d", $form->id
            ));
        }

        return rest_ensure_response($forms);
    }

    public function get_form($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $form = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $request['id']));

        if (!$form) {
            return new \WP_Error('not_found', 'Form not found', ['status' => 404]);
        }

        $form->fields = json_decode($form->fields_json, true) ?: [];
        $form->settings = json_decode($form->settings_json, true) ?: [];
        unset($form->fields_json, $form->settings_json);

        return rest_ensure_response($form);
    }

    public function create_form($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $params = $request->get_json_params();

        $title = sanitize_text_field($params['title'] ?? 'Untitled Form');
        $slug = sanitize_title($title);
        $fields = $params['fields'] ?? [];
        $settings = $params['settings'] ?? [];
        $status = sanitize_text_field($params['status'] ?? 'draft');

        $inserted = $wpdb->insert($table, [
            'title'         => $title,
            'slug'          => $slug,
            'status'        => $status,
            'fields_json'   => wp_json_encode($fields),
            'settings_json' => wp_json_encode($settings),
            'created_at'    => current_time('mysql'),
            'updated_at'    => current_time('mysql'),
        ]);

        if ($inserted === false) {
            return new \WP_Error('db_error', 'Failed to create form', ['status' => 500]);
        }

        return rest_ensure_response([
            'id'      => $wpdb->insert_id,
            'title'   => $title,
            'status'  => $status,
            'message' => 'Form created successfully',
        ]);
    }

    public function update_form($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $form_id = (int)$request['id'];
        $params = $request->get_json_params();

        $data = ['updated_at' => current_time('mysql')];

        if (isset($params['title'])) {
            $data['title'] = sanitize_text_field($params['title']);
            $data['slug'] = sanitize_title($params['title']);
        }
        if (isset($params['fields'])) {
            $data['fields_json'] = wp_json_encode($params['fields']);
        }
        if (isset($params['settings'])) {
            $data['settings_json'] = wp_json_encode($params['settings']);
        }
        if (isset($params['status'])) {
            $data['status'] = sanitize_text_field($params['status']);
        }

        $updated = $wpdb->update($table, $data, ['id' => $form_id]);

        if ($updated === false) {
            return new \WP_Error('db_error', 'Failed to update form', ['status' => 500]);
        }

        return rest_ensure_response([
            'id'      => $form_id,
            'message' => 'Form updated successfully',
        ]);
    }

    public function delete_form($request) {
        global $wpdb;
        $form_id = (int)$request['id'];

        // Delete submissions first
        $sub_table = $wpdb->prefix . 'chatty_form_submissions';
        $wpdb->delete($sub_table, ['form_id' => $form_id]);

        // Delete form
        $table = $wpdb->prefix . 'chatty_forms';
        $deleted = $wpdb->delete($table, ['id' => $form_id]);

        if ($deleted === false) {
            return new \WP_Error('db_error', 'Failed to delete form', ['status' => 500]);
        }

        return rest_ensure_response(['message' => 'Form deleted successfully']);
    }
}
