<?php

defined('WP_UNINSTALL_PLUGIN') || exit;

delete_option('bag_address_lookup_api_key');
delete_option('bag_address_lookup_enabled');

global $wpdb;
$wpdb->query(
    "DELETE FROM {$wpdb->options}
     WHERE option_name LIKE '_transient_bag_address_lookup_%'
        OR option_name LIKE '_transient_timeout_bag_address_lookup_%'"
);
