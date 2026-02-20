<?php

declare(strict_types=1);

namespace BagAddressLookup\Api;

defined('ABSPATH') || exit;

use BagAddressLookup\Admin\Settings;
use WP_Error;

final class BagClient
{
    private const BASE_URL = 'https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2';

    /**
     * @return array{street: string, city: string}|WP_Error
     */
    public static function lookup(string $postcode, int $houseNumber): array|WP_Error
    {
        $apiKey = Settings::apiKey();
        if ($apiKey === '') {
            return new WP_Error('no_api_key', __('BAG API key not configured.', 'bag-address-lookup'));
        }

        $normalizedPostcode = strtoupper(str_replace(' ', '', $postcode));
        $cacheKey = 'bal_' . $normalizedPostcode . '_' . $houseNumber;
        $cached = get_transient($cacheKey);
        if ($cached !== false) {
            return $cached;
        }

        $url = self::BASE_URL . '/adressen?' . http_build_query([
            'postcode' => $normalizedPostcode,
            'huisnummer' => $houseNumber,
            'exacteMatch' => 'true',
        ]);

        $response = wp_remote_get($url, [
            'headers' => [
                'X-Api-Key' => $apiKey,
                'Accept' => 'application/hal+json',
            ],
            'timeout' => 5,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            return new WP_Error(
                'bag_api_error',
                /* translators: %d: HTTP status code */
                sprintf(__('BAG API returned status %d.', 'bag-address-lookup'), $code)
            );
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        $addresses = $body['_embedded']['adressen'] ?? [];

        if (empty($addresses)) {
            return new WP_Error('not_found', __('Address not found.', 'bag-address-lookup'));
        }

        $address = $addresses[0];

        $result = [
            'street' => $address['openbareRuimteNaam'] ?? '',
            'city' => $address['woonplaatsNaam'] ?? '',
        ];

        set_transient($cacheKey, $result, DAY_IN_SECONDS);

        return $result;
    }
}
