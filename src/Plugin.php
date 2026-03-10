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

        add_action('admin_init', static function (): void {
            if (! function_exists('wp_add_privacy_policy_content')) {
                return;
            }

            wp_add_privacy_policy_content(
                __('Dutch Address Lookup (BAG API)', 'bag-address-lookup'),
                wp_kses_post(sprintf(
                    /* translators: %s: link to Kadaster privacy policy */
                    __('When a customer enters a Dutch postcode and house number during checkout, this data is sent to the Kadaster BAG API to retrieve the street name and city. No other personal data is transmitted. Results are cached on your server for 24 hours. See the %s.', 'bag-address-lookup'),
                    '<a href="https://www.kadaster.nl/privacy" target="_blank">' . __('Kadaster privacy policy', 'bag-address-lookup') . '</a>'
                ))
            );
        });
    }
}
