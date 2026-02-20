<?php

declare(strict_types=1);

namespace BagAddressLookup\Api;

defined('ABSPATH') || exit;

use WP_REST_Request;
use WP_REST_Response;

final class RestController
{
    private const NAMESPACE = 'bag-address-lookup/v1';

    public static function register(): void
    {
        add_action('rest_api_init', static function (): void {
            register_rest_route(self::NAMESPACE, '/lookup', [
                'methods' => 'POST',
                'callback' => [self::class, 'lookup'],
                'permission_callback' => static function (): bool {
                    return wp_verify_nonce(
                        sanitize_text_field(wp_unslash($_SERVER['HTTP_X_WP_NONCE'] ?? '')),
                        'wp_rest'
                    ) !== false;
                },
                'args' => [
                    'postcode' => [
                        'required' => true,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                        'validate_callback' => static function (string $value): bool {
                            return (bool) preg_match('/^\d{4}[A-Za-z]{2}$/', trim(str_replace(' ', '', $value)));
                        },
                    ],
                    'houseNumber' => [
                        'required' => true,
                        'type' => 'integer',
                        'sanitize_callback' => 'absint',
                        'validate_callback' => static function ($value): bool {
                            return is_numeric($value) && (int) $value > 0 && (int) $value <= 99999;
                        },
                    ],
                ],
            ]);
        });
    }

    public static function lookup(WP_REST_Request $request): WP_REST_Response
    {
        $postcode = $request->get_param('postcode');
        $houseNumber = (int) $request->get_param('houseNumber');

        $result = BagClient::lookup($postcode, $houseNumber);

        if (is_wp_error($result)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $result->get_error_message(),
            ], $result->get_error_code() === 'not_found' ? 404 : 500);
        }

        return new WP_REST_Response([
            'success' => true,
            'street' => $result['street'],
            'city' => $result['city'],
        ]);
    }
}
