<?php

declare(strict_types=1);

namespace BagAddressLookup\Checkout;

defined('ABSPATH') || exit;

use Automattic\WooCommerce\Blocks\Integrations\IntegrationInterface;
use BagAddressLookup\Admin\Settings;

final class BlockIntegration implements IntegrationInterface
{
    public function get_name(): string
    {
        return 'bag-address-lookup';
    }

    public function initialize(): void
    {
        if (! Settings::isEnabled()) {
            return;
        }

        wp_register_style(
            'bag-address-lookup-checkout',
            BAG_ADDRESS_LOOKUP_URL . 'assets/css/checkout.css',
            [],
            (string) filemtime(BAG_ADDRESS_LOOKUP_DIR . 'assets/css/checkout.css')
        );

        wp_register_script(
            'bag-address-lookup-checkout',
            BAG_ADDRESS_LOOKUP_URL . 'assets/js/checkout.js',
            ['wc-settings', 'wp-data'],
            (string) filemtime(BAG_ADDRESS_LOOKUP_DIR . 'assets/js/checkout.js'),
            true
        );
    }

    public function get_script_handles(): array
    {
        if (! Settings::isEnabled()) {
            return [];
        }

        wp_enqueue_style('bag-address-lookup-checkout');

        return ['bag-address-lookup-checkout'];
    }

    public function get_editor_script_handles(): array
    {
        return [];
    }

    public function get_script_data(): array
    {
        return [
            'restUrl' => rest_url('bag-address-lookup/v1/lookup'),
            'restNonce' => wp_create_nonce('wp_rest'),
            'i18n' => [
                'auto_filled' => __('Street and city are filled automatically.', 'bag-address-lookup'),
                'looking_up' => __('Looking up address…', 'bag-address-lookup'),
                'not_found' => __('Address not found. Please enter manually.', 'bag-address-lookup'),
                'address' => __('Address', 'bag-address-lookup'),
                'edit' => __('Edit', 'bag-address-lookup'),
            ],
        ];
    }

    public static function register(): void
    {
        add_action('woocommerce_blocks_checkout_block_registration', static function ($registry): void {
            $registry->register(new self());
        });
    }
}
