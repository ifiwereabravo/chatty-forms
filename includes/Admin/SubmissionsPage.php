<?php
namespace Chatty\Forms\Admin;

/**
 * Admin page listing all form submissions with visitor identity enrichment.
 */
class SubmissionsPage {

    public function __construct() {
        add_action('admin_menu', [$this, 'register_menu']);
    }

    public function register_menu() {
        add_submenu_page(
            'chatty-forms',
            __('Submissions', 'chatty-forms'),
            __('📋 Submissions', 'chatty-forms'),
            'manage_options',
            'chatty-forms-submissions',
            [$this, 'render']
        );
    }

    public function render() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        global $wpdb;
        $sub_table   = $wpdb->prefix . 'chatty_form_submissions';
        $forms_table = $wpdb->prefix . 'chatty_forms';
        $vis_table   = $wpdb->prefix . 'chatty_visitors';

        // Check tables exist
        $sub_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $sub_table));
        if (!$sub_exists) {
            echo '<div class="wrap"><h1>📋 Form Submissions</h1><p>The submissions table does not exist yet. Submit a form first.</p></div>';
            return;
        }

        // Pagination
        $page     = max(1, (int) ($_GET['paged'] ?? 1));
        $per_page = 25;
        $offset   = ($page - 1) * $per_page;

        // Filters
        $form_filter = (int) ($_GET['form_id'] ?? 0);
        $search      = sanitize_text_field($_GET['ss'] ?? '');

        $where  = ['1=1'];
        $params = [];

        if ($form_filter) {
            $where[]  = 's.form_id = %d';
            $params[] = $form_filter;
        }

        if ($search) {
            $like     = '%' . $wpdb->esc_like($search) . '%';
            $where[]  = '(s.data_json LIKE %s OR v.name LIKE %s OR v.email LIKE %s)';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        $where_sql = implode(' AND ', $where);

        // Check if visitors table exists for JOIN
        $vis_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $vis_table));

        // Count
        if ($vis_exists) {
            $count_sql = "SELECT COUNT(*) FROM $sub_table s
                LEFT JOIN $vis_table v ON JSON_UNQUOTE(JSON_EXTRACT(s.meta_json, '$.visitor_id')) = v.visitor_id
                WHERE $where_sql";
        } else {
            $count_sql = "SELECT COUNT(*) FROM $sub_table s WHERE $where_sql";
        }
        $total = !empty($params)
            ? (int) $wpdb->get_var($wpdb->prepare($count_sql, $params))
            : (int) $wpdb->get_var($count_sql);
        $total_pages = ceil($total / $per_page);

        // Fetch
        $query_params = array_merge($params, [$per_page, $offset]);
        if ($vis_exists) {
            $sql = "SELECT s.*, f.title as form_title, v.name as visitor_name, v.email as visitor_email, v.phone as visitor_phone
                FROM $sub_table s
                LEFT JOIN $forms_table f ON s.form_id = f.id
                LEFT JOIN $vis_table v ON JSON_UNQUOTE(JSON_EXTRACT(s.meta_json, '$.visitor_id')) = v.visitor_id
                WHERE $where_sql
                ORDER BY s.created_at DESC
                LIMIT %d OFFSET %d";
        } else {
            $sql = "SELECT s.*, f.title as form_title, NULL as visitor_name, NULL as visitor_email, NULL as visitor_phone
                FROM $sub_table s
                LEFT JOIN $forms_table f ON s.form_id = f.id
                WHERE $where_sql
                ORDER BY s.created_at DESC
                LIMIT %d OFFSET %d";
        }
        $submissions = $wpdb->get_results($wpdb->prepare($sql, $query_params));

        // Available forms for filter dropdown
        $forms = $wpdb->get_results("SELECT id, title FROM $forms_table ORDER BY title ASC");

        // ─── Render ───────────────────────────────────────────────
        $base_url = admin_url('admin.php?page=chatty-forms-submissions');
        if ($form_filter) $base_url = add_query_arg('form_id', $form_filter, $base_url);
        if ($search)      $base_url = add_query_arg('ss', $search, $base_url);
        ?>
        <style>
            .chatty-sub-wrap { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .chatty-sub-bar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:16px; }
            .chatty-sub-search { background:#1d2327; color:#fff; border:1px solid #3a3f47; border-radius:8px; padding:8px 14px; width:260px; font-size:13px; }
            .chatty-sub-search:focus { outline:none; border-color:#805ad5; box-shadow:0 0 0 2px rgba(128,90,213,0.2); }
            .chatty-sub-search::placeholder { color:#718096; }
            .chatty-sub-select { background:#1d2327; color:#a0aec0; border:1px solid #3a3f47; border-radius:6px; padding:6px 10px; font-size:12px; }
            .chatty-sub-btn { background:#2d3748; color:#a0aec0; border:1px solid #3a3f47; border-radius:6px; padding:5px 14px; font-size:12px; cursor:pointer; text-decoration:none; }
            .chatty-sub-btn:hover { background:#805ad5; color:#fff; border-color:#805ad5; }
            .chatty-sub-detail { display:none; background:#1a1a2e; border-top:1px solid #2d3748; padding:16px; }
            .chatty-sub-detail.open { display:table-row; }
            .chatty-sub-detail td { padding:12px 16px !important; }
            .chatty-sub-kv { display:grid; grid-template-columns:140px 1fr; gap:6px 16px; font-size:13px; }
            .chatty-sub-kv dt { color:#718096; font-weight:600; }
            .chatty-sub-kv dd { color:#e2e8f0; margin:0; word-break:break-word; }
        </style>

        <div class="wrap chatty-sub-wrap">
            <h1 style="display:flex; align-items:center; gap:10px; color:#e2e8f0;">📋 Form Submissions</h1>
            <p style="color:#a0aec0; margin-top:0;">All data captured by CHATTY Forms, linked to visitor identities when available.</p>

            <!-- Filter Bar -->
            <div class="chatty-sub-bar">
                <form method="get" style="display:flex; gap:8px; align-items:center;">
                    <input type="hidden" name="page" value="chatty-forms-submissions">
                    <?php if ($form_filter): ?><input type="hidden" name="form_id" value="<?php echo $form_filter; ?>"><?php endif; ?>
                    <input type="text" name="ss" class="chatty-sub-search" placeholder="🔍 Search submissions..." value="<?php echo esc_attr($search); ?>">
                    <button type="submit" class="chatty-sub-btn" style="padding:7px 16px;">Search</button>
                    <?php if ($search): ?><a href="<?php echo esc_url(remove_query_arg(['ss','paged'], $base_url)); ?>" class="chatty-sub-btn">✕</a><?php endif; ?>
                </form>

                <form method="get" style="display:flex; gap:4px; align-items:center;">
                    <input type="hidden" name="page" value="chatty-forms-submissions">
                    <?php if ($search): ?><input type="hidden" name="ss" value="<?php echo esc_attr($search); ?>"><?php endif; ?>
                    <select name="form_id" class="chatty-sub-select" onchange="this.form.submit()">
                        <option value="">All Forms</option>
                        <?php foreach ($forms as $f): ?>
                            <option value="<?php echo (int) $f->id; ?>" <?php selected($form_filter, $f->id); ?>><?php echo esc_html($f->title); ?></option>
                        <?php endforeach; ?>
                    </select>
                </form>

                <span style="color:#718096; font-size:12px; margin-left:auto;"><?php echo number_format($total); ?> submission<?php echo $total !== 1 ? 's' : ''; ?></span>
            </div>

            <!-- Table -->
            <div style="background:#1a202c; border:1px solid #2d3748; border-radius:8px; overflow:hidden;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#2d3748; color:#a0aec0; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">
                            <th style="padding:12px 16px; text-align:left;">Form</th>
                            <th style="padding:12px 16px; text-align:left;">Visitor</th>
                            <th style="padding:12px 16px; text-align:left;">Preview</th>
                            <th style="padding:12px 16px; text-align:left;">Date</th>
                            <th style="padding:12px 16px; text-align:center; width:40px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($submissions)): ?>
                            <tr><td colspan="5" style="padding:30px; text-align:center; color:#718096;">No submissions found.</td></tr>
                        <?php else: ?>
                            <?php foreach ($submissions as $i => $s):
                                $data = json_decode($s->data_json, true) ?: [];
                                $meta = json_decode($s->meta_json, true) ?: [];

                                // Preview: first 2 key=value pairs
                                $preview_parts = [];
                                $count = 0;
                                foreach ($data as $k => $val) {
                                    if ($count >= 2) break;
                                    if (is_array($val)) $val = implode(', ', $val);
                                    $preview_parts[] = esc_html(ucfirst(str_replace('_', ' ', $k))) . ': ' . esc_html(mb_strimwidth($val, 0, 40, '…'));
                                    $count++;
                                }
                                $preview = implode(' · ', $preview_parts);

                                $visitor_display = $s->visitor_name ? esc_html($s->visitor_name) : '<span style="color:#718096; font-style:italic;">Anonymous</span>';
                                $contact_parts = [];
                                if ($s->visitor_email) $contact_parts[] = esc_html($s->visitor_email);
                                if ($s->visitor_phone) $contact_parts[] = esc_html($s->visitor_phone);
                                $contact = implode(' · ', $contact_parts);

                                $date = date('M j, Y g:ia', strtotime($s->created_at));
                                $form_title = $s->form_title ?: 'Form #' . $s->form_id;
                                $row_id = 'chatty-sub-detail-' . $s->id;
                            ?>
                                <tr style="border-top:1px solid #2d3748; cursor:pointer;" onclick="document.getElementById('<?php echo $row_id; ?>').classList.toggle('open')">
                                    <td style="padding:12px 16px;">
                                        <span style="background:#2d3748; color:#805ad5; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;"><?php echo esc_html($form_title); ?></span>
                                    </td>
                                    <td style="padding:12px 16px;">
                                        <div style="font-weight:600; color:#fff; font-size:13px;"><?php echo $visitor_display; ?></div>
                                        <?php if ($contact): ?><div style="font-size:11px; color:#a0aec0;"><?php echo $contact; ?></div><?php endif; ?>
                                    </td>
                                    <td style="padding:12px 16px; color:#a0aec0; font-size:12px;"><?php echo $preview; ?></td>
                                    <td style="padding:12px 16px; color:#a0aec0; font-size:12px;"><?php echo $date; ?></td>
                                    <td style="padding:12px 16px; text-align:center; color:#4a5568; font-size:16px;">▸</td>
                                </tr>
                                <tr id="<?php echo $row_id; ?>" class="chatty-sub-detail">
                                    <td colspan="5" style="padding:16px 24px !important;">
                                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                                            <div>
                                                <h4 style="margin:0 0 8px; color:#805ad5; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Submitted Data</h4>
                                                <dl class="chatty-sub-kv">
                                                    <?php foreach ($data as $k => $val):
                                                        if (is_array($val)) $val = implode(', ', $val);
                                                    ?>
                                                        <dt><?php echo esc_html(ucfirst(str_replace('_', ' ', $k))); ?></dt>
                                                        <dd><?php echo esc_html($val); ?></dd>
                                                    <?php endforeach; ?>
                                                </dl>
                                            </div>
                                            <div>
                                                <h4 style="margin:0 0 8px; color:#667eea; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Meta</h4>
                                                <dl class="chatty-sub-kv">
                                                    <?php if (!empty($meta['visitor_id'])): ?>
                                                        <dt>Visitor ID</dt>
                                                        <dd style="font-family:monospace; font-size:11px;"><?php echo esc_html($meta['visitor_id']); ?></dd>
                                                    <?php endif; ?>
                                                    <?php if (!empty($meta['ip'])): ?>
                                                        <dt>IP</dt>
                                                        <dd><?php echo esc_html($meta['ip']); ?></dd>
                                                    <?php endif; ?>
                                                    <?php if (!empty($meta['referer'])): ?>
                                                        <dt>Referer</dt>
                                                        <dd><?php echo esc_html($meta['referer']); ?></dd>
                                                    <?php endif; ?>
                                                    <?php if (!empty($meta['ua'])): ?>
                                                        <dt>User Agent</dt>
                                                        <dd style="font-size:11px; color:#718096;"><?php echo esc_html(mb_strimwidth($meta['ua'], 0, 100, '…')); ?></dd>
                                                    <?php endif; ?>
                                                </dl>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>

                <?php if ($total_pages > 1): ?>
                    <div style="display:flex; gap:8px; align-items:center; justify-content:center; padding:12px;">
                        <?php if ($page > 1): ?>
                            <a href="<?php echo esc_url(add_query_arg('paged', $page - 1, $base_url)); ?>" class="chatty-sub-btn">&laquo; Prev</a>
                        <?php endif; ?>
                        <span style="color:#a0aec0; font-size:12px;">Page <?php echo $page; ?> of <?php echo $total_pages; ?></span>
                        <?php if ($page < $total_pages): ?>
                            <a href="<?php echo esc_url(add_query_arg('paged', $page + 1, $base_url)); ?>" class="chatty-sub-btn">Next &raquo;</a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
}
