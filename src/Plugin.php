<?php

declare(strict_types=1);

namespace BagAddressLookup;

defined('ABSPATH') || exit;

use BagAddressLookup\Admin\Settings;
use BagAddressLookup\Api\RestController;
use BagAddressLookup\Checkout\BlockIntegration;
use BagAddressLookup\Checkout\FieldOrder;
use BagAddressLookup\Checkout\Fields;

final class Plugin
{
    public static function init(): void
    {
        Settings::register();
        RestController::register();
        Fields::register();
        FieldOrder::register();
        BlockIntegration::register();

        $basename = plugin_basename(BAG_ADDRESS_LOOKUP_FILE);

        add_filter('plugin_action_links_' . $basename, static function (array $links): array {
            $url = admin_url('admin.php?page=wc-settings&tab=advanced&section=bag_address_lookup');
            array_unshift($links, '<a href="' . esc_url($url) . '">' . esc_html__('Settings', 'bag-address-lookup') . '</a>');

            return $links;
        });

        if (! Settings::apiKey()) {
            add_action('admin_notices', static function (): void {
                $url = admin_url('admin.php?page=wc-settings&tab=advanced&section=bag_address_lookup');
                echo '<div class="notice notice-warning"><p>';
                printf(
                    /* translators: %1$s: opening link tag, %2$s: closing link tag */
                    esc_html__('BAG Address Lookup: Please enter your BAG API key in %1$sSettings%2$s.', 'bag-address-lookup'),
                    '<a href="' . esc_url($url) . '">',
                    '</a>'
                );
                echo '</p></div>';
            });
        }
    }
}
