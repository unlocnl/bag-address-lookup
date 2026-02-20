(function () {
    'use strict';

    const settings = wc.wcSettings.getSetting('bag-address-lookup_data', {});
    if (!settings.restUrl) return;

    const POSTCODE_REGEX = /^\d{4}[A-Za-z]{2}$/;
    const DEBOUNCE_MS = 400;

    const debounceTimers = { billing: null, shipping: null };
    const lastLookup = { billing: '', shipping: '' };
    const activeRequests = { billing: null, shipping: null };
    const lastStreet = { billing: '', shipping: '' };
    const lockedFields = { billing: false, shipping: false };
    const statusEls = { billing: null, shipping: null };

    function dispatch() {
        return wp.data.dispatch('wc/store/cart');
    }

    function getStore() {
        return wp.data.select('wc/store/cart');
    }

    function normalizePostcode(value) {
        return (value || '').replace(/\s/g, '').toUpperCase();
    }

    /**
     * Parse house number field value into numeric part + optional suffix.
     * "19" -> { number: 19, full: "19" }
     * "19a" -> { number: 19, full: "19a" }
     * "19 III" -> { number: 19, full: "19 III" }
     */
    function parseHouseNumber(value) {
        const trimmed = (value || '').trim();
        const match = trimmed.match(/^(\d+)\s*(.*)$/);
        if (!match) return null;
        const num = parseInt(match[1], 10);
        if (num <= 0) return null;
        return { number: num, full: trimmed };
    }

    function findHouseNumberInput(type) {
        const selectors = [
            '#' + type + '-bag-address-lookup\\/house-number',
            '#' + type + '-bag-address-lookup-house-number',
            '[id^="' + type + '"][id*="house-number"]'
        ];
        for (const selector of selectors) {
            try {
                const el = document.querySelector(selector);
                if (el) return el;
            } catch (e) { /* invalid selector, try next */ }
        }
        return null;
    }

    function fieldWrapper(input) {
        if (!input) return null;
        const form = input.closest('.wc-block-components-address-form');
        if (!form) return null;
        let el = input;
        while (el.parentElement && el.parentElement !== form) {
            el = el.parentElement;
        }
        return el.parentElement === form ? el : null;
    }

    function reorderFields(type) {
        const houseInput = findHouseNumberInput(type);
        if (!houseInput) return;

        const postcodeInput = document.getElementById(type + '-postcode');
        if (!postcodeInput) return;

        const houseWrapper = fieldWrapper(houseInput);
        const postcodeWrapper = fieldWrapper(postcodeInput);
        if (!houseWrapper || !postcodeWrapper) return;

        const form = postcodeWrapper.parentElement;

        const address1Input = document.getElementById(type + '-address_1');
        const address1Wrapper = fieldWrapper(address1Input);
        if (!address1Wrapper) return;

        if (postcodeWrapper.nextElementSibling !== houseWrapper ||
            houseWrapper.nextElementSibling !== address1Wrapper) {
            form.insertBefore(postcodeWrapper, address1Wrapper);
            form.insertBefore(houseWrapper, address1Wrapper);
        }
    }

    function getOrCreateStatus(type) {
        if (statusEls[type]) return statusEls[type];
        const address1 = document.getElementById(type + '-address_1');
        const wrapper = fieldWrapper(address1);
        if (!wrapper) return null;
        const el = document.createElement('p');
        el.className = 'bal-status';
        el.style.cssText = 'margin:0 0 1em;font-size:0.875em;color:#666;display:none;';
        wrapper.parentElement.insertBefore(el, wrapper);
        statusEls[type] = el;
        return el;
    }

    function setStatus(type, text) {
        const el = getOrCreateStatus(type);
        if (!el) return;
        if (text) {
            el.textContent = text;
            el.style.display = '';
        } else {
            el.textContent = '';
            el.style.display = 'none';
        }
    }

    function doLookup(type) {
        const customer = getStore().getCustomerData();
        if (!customer) return;

        const address = type === 'billing' ? customer.billingAddress : customer.shippingAddress;
        if (!address || address.country !== 'NL') return;

        const postcode = normalizePostcode(address.postcode);
        if (!POSTCODE_REGEX.test(postcode)) return;

        const houseInput = findHouseNumberInput(type);
        if (!houseInput) return;

        const parsed = parseHouseNumber(houseInput.value);
        if (!parsed) return;

        const lookupKey = postcode + '-' + parsed.number;
        if (lastLookup[type] === lookupKey) {
            if (lastStreet[type]) {
                setAddress(type, lastStreet[type], parsed.full);
            }
            return;
        }
        lastLookup[type] = lookupKey;

        if (activeRequests[type]) {
            activeRequests[type].abort();
        }

        setStatus(type, settings.i18n.looking_up);

        const controller = new AbortController();
        activeRequests[type] = controller;

        fetch(settings.restUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': settings.restNonce,
            },
            body: JSON.stringify({ postcode: postcode, houseNumber: parsed.number }),
            signal: controller.signal,
        })
        .then((response) => response.json())
        .then((data) => {
            activeRequests[type] = null;
            if (!data.success) {
                lastStreet[type] = '';
                setStatus(type, settings.i18n.not_found);
                unlockFields(type);
                return;
            }

            lastStreet[type] = data.street;
            setAddress(type, data.street, parsed.full);
            lockFields(type);
            setStatus(type, '');

            if (type === 'billing') {
                dispatch().setBillingAddress({ city: data.city });
            } else {
                dispatch().setShippingAddress({ city: data.city });
            }
        })
        .catch(() => {
            activeRequests[type] = null;
            setStatus(type, '');
            unlockFields(type);
        });
    }

    function setReadonly(input, readonly) {
        if (!input) return;
        input.readOnly = readonly;
        input.style.opacity = readonly ? '0.7' : '';
    }

    function lockFields(type) {
        setReadonly(document.getElementById(type + '-address_1'), true);
        setReadonly(document.getElementById(type + '-city'), true);
        lockedFields[type] = true;
    }

    function unlockFields(type) {
        if (!lockedFields[type]) return;
        setReadonly(document.getElementById(type + '-address_1'), false);
        setReadonly(document.getElementById(type + '-city'), false);
        lockedFields[type] = false;
    }

    function setAddress(type, street, houseNumberFull) {
        const address1 = street + ' ' + houseNumberFull;
        if (type === 'billing') {
            dispatch().setBillingAddress({ address_1: address1 });
        } else {
            dispatch().setShippingAddress({ address_1: address1 });
        }
    }

    function scheduleLookup(type) {
        clearTimeout(debounceTimers[type]);
        debounceTimers[type] = setTimeout(() => doLookup(type), DEBOUNCE_MS);
    }

    const prevPostcode = { billing: '', shipping: '' };
    const prevCountry = { billing: '', shipping: '' };

    wp.data.subscribe(() => {
        const customer = getStore().getCustomerData();
        if (!customer) return;

        const billing = customer.billingAddress || {};
        if (billing.country !== prevCountry.billing) {
            prevCountry.billing = billing.country;
            toggleHouseNumber('billing', billing.country);
            if (billing.country === 'NL') {
                lockFields('billing');
                setStatus('billing', settings.i18n.auto_filled);
            } else {
                unlockFields('billing');
                setStatus('billing', '');
            }
        }
        if (billing.country === 'NL' && billing.postcode !== prevPostcode.billing) {
            prevPostcode.billing = billing.postcode;
            scheduleLookup('billing');
        }

        const shipping = customer.shippingAddress || {};
        if (shipping.country !== prevCountry.shipping) {
            prevCountry.shipping = shipping.country;
            toggleHouseNumber('shipping', shipping.country);
            if (shipping.country === 'NL') {
                lockFields('shipping');
                setStatus('shipping', settings.i18n.auto_filled);
            } else {
                unlockFields('shipping');
                setStatus('shipping', '');
            }
        }
        if (shipping.country === 'NL' && shipping.postcode !== prevPostcode.shipping) {
            prevPostcode.shipping = shipping.postcode;
            scheduleLookup('shipping');
        }
    });

    function toggleHouseNumber(type, country) {
        const input = findHouseNumberInput(type);
        if (!input) return;
        const wrapper = fieldWrapper(input);
        if (!wrapper) return;
        wrapper.style.display = country === 'NL' ? '' : 'none';
    }

    function setup(type) {
        const houseInput = findHouseNumberInput(type);
        if (!houseInput || houseInput._balBound) return;

        houseInput._balBound = true;
        houseInput.addEventListener('input', () => scheduleLookup(type));

        reorderFields(type);
        toggleHouseNumber(type, prevCountry[type]);

        const customer = getStore().getCustomerData();
        if (customer) {
            const address = type === 'billing' ? customer.billingAddress : customer.shippingAddress;
            if (address && address.country === 'NL') {
                lockFields(type);
                setStatus(type, settings.i18n.auto_filled);
            }
        }
    }

    const observer = new MutationObserver(() => {
        setup('billing');
        setup('shipping');
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setup('billing');
    setup('shipping');
})();
