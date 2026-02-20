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

        // Clone/duplicate form
        register_rest_route($namespace, '/forms/(?P<id>\d+)/clone', [
            'methods'             => 'POST',
            'callback'            => [$this, 'clone_form'],
            'permission_callback' => [$this, 'check_admin'],
        ]);

        // Export forms (POST with body containing form IDs)
        register_rest_route($namespace, '/forms/export', [
            'methods'             => 'POST',
            'callback'            => [$this, 'export_forms'],
            'permission_callback' => [$this, 'check_admin'],
        ]);

        // Import forms
        register_rest_route($namespace, '/forms/import', [
            'methods'             => 'POST',
            'callback'            => [$this, 'import_forms'],
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

    /**
     * Clone/duplicate a form
     */
    public function clone_form($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $source_id = (int) $request['id'];

        $source = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $source_id), ARRAY_A);

        if (!$source) {
            return new \WP_Error('not_found', 'Source form not found', ['status' => 404]);
        }

        $new_title = $source['title'] . ' (Copy)';

        $inserted = $wpdb->insert($table, [
            'title'         => $new_title,
            'slug'          => sanitize_title($new_title),
            'status'        => 'draft',
            'fields_json'   => $source['fields_json'],
            'settings_json' => $source['settings_json'],
            'created_at'    => current_time('mysql'),
            'updated_at'    => current_time('mysql'),
        ]);

        if ($inserted === false) {
            return new \WP_Error('db_error', 'Failed to clone form', ['status' => 500]);
        }

        return rest_ensure_response([
            'id'      => $wpdb->insert_id,
            'title'   => $new_title,
            'message' => 'Form cloned successfully',
        ]);
    }

    /**
     * Export forms as JSON bundle
     */
    public function export_forms($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $params = $request->get_json_params();

        // If specific IDs provided, export those; otherwise export all
        $ids = !empty($params['ids']) ? array_map('absint', $params['ids']) : [];

        if (!empty($ids)) {
            $placeholders = implode(',', array_fill(0, count($ids), '%d'));
            $forms = $wpdb->get_results($wpdb->prepare(
                "SELECT title, slug, status, fields_json, settings_json FROM $table WHERE id IN ($placeholders)",
                ...$ids
            ), ARRAY_A);
        } else {
            $forms = $wpdb->get_results(
                "SELECT title, slug, status, fields_json, settings_json FROM $table ORDER BY id ASC",
                ARRAY_A
            );
        }

        // Decode JSON fields for clean export
        foreach ($forms as &$form) {
            $form['fields']   = json_decode($form['fields_json'], true) ?: [];
            $form['settings'] = json_decode($form['settings_json'], true) ?: [];
            unset($form['fields_json'], $form['settings_json']);
        }

        return rest_ensure_response([
            'version'     => '1.0',
            'plugin'      => 'chatty-forms',
            'exported_at' => current_time('mysql'),
            'count'       => count($forms),
            'forms'       => $forms,
        ]);
    }

    /**
     * Import forms from JSON bundle
     */
    public function import_forms($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'chatty_forms';
        $params = $request->get_json_params();

        $forms = $params['forms'] ?? [];

        if (empty($forms) || !is_array($forms)) {
            return new \WP_Error('invalid_data', 'No forms found in import data', ['status' => 400]);
        }

        $imported = 0;
        $errors = [];

        foreach ($forms as $form) {
            $title    = sanitize_text_field($form['title'] ?? 'Imported Form');
            $fields   = $form['fields'] ?? [];
            $settings = $form['settings'] ?? [];
            $status   = sanitize_text_field($form['status'] ?? 'draft');

            $result = $wpdb->insert($table, [
                'title'         => $title,
                'slug'          => sanitize_title($title),
                'status'        => $status,
                'fields_json'   => wp_json_encode($fields),
                'settings_json' => wp_json_encode($settings),
                'created_at'    => current_time('mysql'),
                'updated_at'    => current_time('mysql'),
            ]);

            if ($result) {
                $imported++;
            } else {
                $errors[] = "Failed to import: {$title}";
            }
        }

        return rest_ensure_response([
            'imported' => $imported,
            'total'    => count($forms),
            'errors'   => $errors,
            'message'  => "{$imported} form(s) imported successfully",
        ]);
    }
}
