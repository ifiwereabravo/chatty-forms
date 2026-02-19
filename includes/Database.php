<?php
namespace Chatty\Forms;

class Database {
    public function __construct() {
        // init logic
    }

    public function migrate() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $table_forms = $wpdb->prefix . 'chatty_forms';
        $sql_forms = "CREATE TABLE $table_forms (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            slug varchar(255) NOT NULL,
            status varchar(20) DEFAULT 'draft' NOT NULL,
            fields_json longtext,
            settings_json longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        $table_submissions = $wpdb->prefix . 'chatty_form_submissions';
        $sql_submissions = "CREATE TABLE $table_submissions (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            form_id bigint(20) NOT NULL,
            data_json longtext,
            meta_json longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY form_id (form_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_forms);
        dbDelta($sql_submissions);
    }
}
