<?php

declare(strict_types=1);

namespace BagAddressLookup\Checkout;

defined('ABSPATH') || exit;

use BagAddressLookup\Admin\Settings;

final class FieldOrder
{
    public static function register(): void
    {
        add_filter('woocommerce_get_country_locale', [self::class, 'adjustLocale']);
    }

    public static function adjustLocale(array $locales): array
    {
        if (! Settings::isEnabled()) {
            return $locales;
        }

        $locales['NL'] = array_merge($locales['NL'] ?? [], [
            'postcode' => ['priority' => 45],
            'address_1' => ['priority' => 55],
            'city' => ['priority' => 65],
        ]);

        return $locales;
    }
}
