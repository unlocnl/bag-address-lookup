<?php

declare(strict_types=1);

namespace BagAddressLookup\Checkout;

defined('ABSPATH') || exit;

use BagAddressLookup\Admin\Settings;

final class Fields
{
    public const HOUSE_NUMBER = 'bag-address-lookup/house-number';

    public static function register(): void
    {
        add_action('woocommerce_init', [self::class, 'registerFields']);
    }

    public static function registerFields(): void
    {
        if (! Settings::isEnabled() || ! function_exists('woocommerce_register_additional_checkout_field')) {
            return;
        }

        woocommerce_register_additional_checkout_field([
            'id' => self::HOUSE_NUMBER,
            'label' => __('House number', 'bag-address-lookup'),
            'location' => 'address',
            'type' => 'text',
            'required' => [
                'properties' => [
                    'country' => ['const' => 'NL'],
                ],
            ],
            'hidden' => [
                'not' => [
                    'properties' => [
                        'country' => ['const' => 'NL'],
                    ],
                ],
            ],
        ]);
    }
}
