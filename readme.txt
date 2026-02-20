=== BAG Address Lookup for WooCommerce ===
Contributors: unlocnl
Tags: woocommerce, postcode, checkout, netherlands, address
Requires at least: 6.4
Tested up to: 6.9
Requires PHP: 8.1
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
WC requires at least: 8.6
WC tested up to: 10.4

Auto-fills street and city in WooCommerce Block Checkout using the Dutch Kadaster BAG API.

== Description ==

Automatically looks up Dutch addresses based on postcode and house number during WooCommerce checkout. Reduces input errors and speeds up the checkout process for Dutch customers.

**Features:**

* Auto-fills street name and city based on postcode + house number
* Works with WooCommerce Block Checkout
* Only activates for Netherlands addresses
* API key stays server-side (proxied through your site)
* Non-blocking: manual entry still possible if address not found

**Requirements:**

* A free Kadaster BAG API key — [request one here](https://www.kadaster.nl/zakelijk/producten/adressen-en-gebouwen/bag-api-individuele-bevragingen)

== Installation ==

1. Upload the plugin to `/wp-content/plugins/bag-address-lookup`
2. Activate through the Plugins menu
3. Go to WooCommerce → Settings → Advanced → BAG Address Lookup
4. Enter your Kadaster BAG API key
5. Done — checkout will now auto-fill Dutch addresses

== Changelog ==

= 1.0.0 =
* Initial release
