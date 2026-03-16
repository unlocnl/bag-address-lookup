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
        add_filter('woocommerce_admin_billing_fields', [self::class, 'removeHouseNumberFromAdmin'], 20);
        add_filter('woocommerce_admin_shipping_fields', [self::class, 'removeHouseNumberFromAdmin'], 20);
    }

    /**
     * @param array $fields
     * @return array
     */
    public static function removeHouseNumberFromAdmin(array $fields): array
    {
        $prefix = doing_action('woocommerce_admin_billing_fields') ? '_wc_billing/' : '_wc_shipping/';
        $id = $prefix . self::HOUSE_NUMBER;

        return array_filter($fields, static function (array $field) use ($id): bool {
            return ($field['id'] ?? '') !== $id;
        });
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
            'show_in_order_confirmation' => false,
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
