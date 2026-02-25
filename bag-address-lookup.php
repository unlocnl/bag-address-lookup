<?php
/**
 * Plugin Name: BAG Address Lookup for WooCommerce
 * Plugin URI: https://github.com/unlocnl/bag-address-lookup
 * Description: Auto-fills street and city in WooCommerce Block Checkout based on Dutch postcode and house number using the Kadaster BAG API.
 * Version: 1.0.0
 * Author: Unloc
 * Author URI: https://unloc.dev
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: bag-address-lookup
 * Domain Path: /languages
 * Requires at least: 6.4
 * Requires PHP: 8.1
 * WC requires at least: 8.6
 * WC tested up to: 10.4
 */

declare(strict_types=1);

defined('ABSPATH') || exit;

define('BAG_ADDRESS_LOOKUP_VERSION', '1.0.0');
define('BAG_ADDRESS_LOOKUP_FILE', __FILE__);
define('BAG_ADDRESS_LOOKUP_DIR', plugin_dir_path(__FILE__));
define('BAG_ADDRESS_LOOKUP_URL', plugin_dir_url(__FILE__));

require_once __DIR__ . '/vendor/autoload.php';

add_action('before_woocommerce_init', static function (): void {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', __FILE__);
    }
});

add_action('plugins_loaded', static function (): void {
    if (! class_exists('WooCommerce')) {
        add_action('admin_notices', static function (): void {
            echo '<div class="notice notice-error"><p>';
            echo esc_html__('BAG Address Lookup requires WooCommerce to be installed and active.', 'bag-address-lookup');
            echo '</p></div>';
        });
        return;
    }

    \BagAddressLookup\Plugin::init();
});
