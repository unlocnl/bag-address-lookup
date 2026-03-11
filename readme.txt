=== Dutch Address Lookup for WooCommerce (BAG API) ===
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

Auto-fills street and city in WooCommerce Block Checkout for Dutch addresses using the free Kadaster BAG API.

== Description ==

Automatically looks up Dutch addresses based on postcode and house number during WooCommerce checkout. Uses the official Kadaster BAG API (Basisregistratie Adressen en Gebouwen) — **completely free** (50,000 requests/day). Reduces input errors and speeds up the checkout process for customers in the Netherlands.

**Features:**

* Uses the free Kadaster BAG API — no subscription, no usage fees (50k requests/day)
* Auto-fills street name and city based on postcode + house number
* Works with WooCommerce Block Checkout
* Only activates for Dutch addresses (The Netherlands selected in the country select)
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

== Frequently Asked Questions ==

= Do I need an API key? =

Yes, but it's completely free. Request your API key from the Kadaster (Dutch Land Registry) at [kadaster.nl](https://www.kadaster.nl/zakelijk/producten/adressen-en-gebouwen/bag-api-individuele-bevragingen). There are no usage fees. The daily limit is 50,000 requests, and this plugin caches results for 24 hours.

= Does this work with the classic WooCommerce checkout? =

No. This plugin only works with the WooCommerce Block Checkout (the default since WooCommerce 8.3).

= What happens if the address is not found? =

The street and city fields are shown and the customer can fill them in manually. Checkout is never blocked.

= Does this plugin work for other countries than The Netherlands? =

No. The BAG is a Dutch government registry. The plugin only activates when the country is set to The Netherlands.

== Screenshots ==

1. Checkout with auto-filled Dutch address
2. Settings page under WooCommerce → Advanced

== Privacy ==

This plugin sends the customer's postcode and house number to the [Kadaster BAG API](https://www.kadaster.nl/zakelijk/producten/adressen-en-gebouwen/bag-api-individuele-bevragingen) to look up the corresponding street name and city. No other personal data is transmitted. The Kadaster is a Dutch government agency; their privacy policy can be found at [kadaster.nl](https://www.kadaster.nl/privacy).

Results are cached on your server for 24 hours to minimize external requests.

== Changelog ==

= 1.0.0 =
* Initial release
