# CLAUDE.md — bag-address-lookup

Dutch Address Lookup for WooCommerce (BAG API). Auto-fills street and city at Block Checkout using the free Kadaster BAG API.

## Architecture

- **Namespace:** `BagAddressLookup\` (PSR-4 from `src/`)
- **Entry point:** `bag-address-lookup.php` — constants, autoload, WooCommerce compat declarations, bootstraps `Plugin::init()` on `plugins_loaded`
- **WooCommerce dependency:** native `Requires Plugins: woocommerce` header — no manual class_exists check needed

### Key classes

| Class | Role |
|-|-|
| `Plugin` | Bootstraps all components, settings link, API key notice, privacy policy |
| `Admin\Settings` | WooCommerce settings section under Advanced tab. Options: `bag_address_lookup_enabled`, `bag_address_lookup_api_key` |
| `Api\BagClient` | Server-side proxy to `api.bag.kadaster.nl`. Caches results as transients (`bag_address_lookup_{postcode}_{number}`, 24h TTL) |
| `Api\RestController` | REST endpoint `POST bag-address-lookup/v1/lookup`. Nonce-protected to prevent external API key abuse |
| `Checkout\Fields` | Registers the house number additional checkout field (visible/required only for NL) |
| `Checkout\FieldOrder` | Reorders NL locale fields: postcode → address → city |
| `Checkout\BlockIntegration` | Implements `IntegrationInterface` — enqueues JS/CSS, passes config via `get_script_data()` |

### Frontend (`assets/js/checkout.js`)

Vanilla JS (no build step). Subscribes to `wc/store/cart` for country/postcode changes, debounces lookups, manages field visibility and an address summary card. Uses `MutationObserver` on `document.body` to bind to dynamically rendered checkout fields.

## Translations

- Text domain: `bag-address-lookup`
- Don't translate the plugin name — keep "Dutch Address Lookup (BAG API)" in all locales
- After changing strings: `wp i18n make-pot . languages/bag-address-lookup.pot --slug=bag-address-lookup --domain=bag-address-lookup --skip-js && cd languages && msgfmt -o bag-address-lookup-nl_NL.mo bag-address-lookup-nl_NL.po && wp i18n make-php .`
- The plugin checker flags `.l10n.php` for missing ABSPATH guard — this is a false positive on auto-generated files, ignore it

## Cleanup

`uninstall.php` deletes options and `bag_address_lookup_*` transients. Keep the transient prefix in sync between `BagClient` and `uninstall.php`.

## WordPress.org publication

Published to wordpress.org. Changes must comply with [plugin guidelines](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/). Key constraints:
- Privacy: external API call to Kadaster must be disclosed (readme.txt + `wp_add_privacy_policy_content`)
- All user-facing output must be escaped
- `vendor/` contains only the Composer autoloader (no third-party deps)
