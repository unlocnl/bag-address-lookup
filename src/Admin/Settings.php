<?php

declare(strict_types=1);

namespace BagAddressLookup\Admin;

defined('ABSPATH') || exit;

final class Settings
{
    private const SECTION_ID = 'bag_address_lookup';
    private const OPTION_API_KEY = 'bag_address_lookup_api_key';
    private const OPTION_ENABLED = 'bag_address_lookup_enabled';

    public static function register(): void
    {
        add_filter('woocommerce_get_sections_advanced', [self::class, 'addSection']);
        add_filter('woocommerce_get_settings_advanced', [self::class, 'addSettings'], 10, 2);
    }

    public static function addSection(array $sections): array
    {
        $sections[self::SECTION_ID] = __('BAG Address Lookup', 'bag-address-lookup');

        return $sections;
    }

    public static function addSettings(array $settings, string $currentSection): array
    {
        if ($currentSection !== self::SECTION_ID) {
            return $settings;
        }

        return [
            [
                'title' => __('BAG Address Lookup', 'bag-address-lookup'),
                'type' => 'title',
                'desc' => __('Auto-fill street and city using the Kadaster BAG API.', 'bag-address-lookup'),
                'id' => 'bag_address_lookup_options',
            ],
            [
                'title' => __('Enable', 'bag-address-lookup'),
                'type' => 'checkbox',
                'desc' => __('Enable postcode lookup on checkout', 'bag-address-lookup'),
                'id' => self::OPTION_ENABLED,
                'default' => 'yes',
            ],
            [
                'title' => __('BAG API Key', 'bag-address-lookup'),
                'type' => 'text',
                'desc' => sprintf(
                    /* translators: %s: link to Kadaster website */
                    __('Get your free API key from %s', 'bag-address-lookup'),
                    '<a href="https://www.kadaster.nl/zakelijk/producten/adressen-en-gebouwen/bag-api-individuele-bevragingen" target="_blank">Kadaster</a>'
                ),
                'id' => self::OPTION_API_KEY,
                'default' => '',
                'css' => 'min-width: 400px;',
            ],
            [
                'type' => 'sectionend',
                'id' => 'bag_address_lookup_options',
            ],
        ];
    }

    public static function apiKey(): string
    {
        return (string) get_option(self::OPTION_API_KEY, '');
    }

    public static function isEnabled(): bool
    {
        return self::apiKey() !== '' && get_option(self::OPTION_ENABLED, 'yes') === 'yes';
    }
}
