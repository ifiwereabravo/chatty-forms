<?php
namespace Chatty\Forms\Api;

/**
 * REST endpoint for uploading photos from the photo field.
 * Photos are saved to wp-content/uploads/chatty-forms/photos/YYYY/MM/
 */
class PhotoUploadHandler {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('chatty-forms/v1', '/upload-photo', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_upload'],
            'permission_callback' => '__return_true', // Public — form submissions are public
        ]);
    }

    public function handle_upload(\WP_REST_Request $request) {
        // Validate file exists
        $files = $request->get_file_params();
        if (empty($files['photo'])) {
            return new \WP_Error('no_file', 'No photo file was uploaded.', ['status' => 400]);
        }

        $file = $files['photo'];

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return new \WP_Error('upload_error', 'File upload failed (error code: ' . $file['error'] . ')', ['status' => 400]);
        }

        // Validate file type
        $allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $allowed_types)) {
            return new \WP_Error('invalid_type', 'Only JPEG, PNG, WebP, and HEIC images are allowed.', ['status' => 400]);
        }

        // Validate file size (10MB max)
        $max_size = 10 * 1024 * 1024;
        if ($file['size'] > $max_size) {
            return new \WP_Error('file_too_large', 'Photo must be under 10MB.', ['status' => 400]);
        }

        // Build upload directory
        $upload_dir = wp_upload_dir();
        $base_dir = $upload_dir['basedir'] . '/chatty-forms/photos/' . date('Y') . '/' . date('m');
        $base_url = $upload_dir['baseurl'] . '/chatty-forms/photos/' . date('Y') . '/' . date('m');

        if (!file_exists($base_dir)) {
            wp_mkdir_p($base_dir);
        }

        // Generate unique filename
        $ext = $this->get_extension($mime);
        $filename = 'cf_' . wp_generate_uuid4() . '.' . $ext;
        $filepath = $base_dir . '/' . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return new \WP_Error('move_failed', 'Failed to save uploaded photo.', ['status' => 500]);
        }

        // Set proper permissions
        chmod($filepath, 0644);

        $url = $base_url . '/' . $filename;

        return rest_ensure_response([
            'success'  => true,
            'url'      => $url,
            'filename' => $filename,
            'id'       => wp_generate_uuid4(),
        ]);
    }

    /**
     * Get file extension from MIME type.
     */
    private function get_extension(string $mime): string {
        $map = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/heic' => 'heic',
            'image/heif' => 'heif',
        ];
        return $map[$mime] ?? 'jpg';
    }
}
