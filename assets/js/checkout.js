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
    const lastCity = { billing: '', shipping: '' };
    const editMode = { billing: false, shipping: false };
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

    // --- Status element: hint / loading / summary ---

    function createPencilIcon() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 640 640');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M100.4 417.2C104.5 402.6 112.2 389.3 123 378.5L304.2 197.3L338.1 163.4C354.7 180 389.4 214.7 442.1 267.4L476 301.3L442.1 335.2L260.9 516.4C250.2 527.1 236.8 534.9 222.2 539L94.4 574.6C86.1 576.9 77.1 574.6 71 568.4C64.9 562.2 62.6 553.3 64.9 545L100.4 417.2zM156 413.5C151.6 418.2 148.4 423.9 146.7 430.1L122.6 517L209.5 492.9C215.9 491.1 221.7 487.8 226.5 483.2L155.9 413.5zM510 267.4C493.4 250.8 458.7 216.1 406 163.4L372 129.5C398.5 103 413.4 88.1 416.9 84.6C430.4 71 448.8 63.4 468 63.4C487.2 63.4 505.6 71 519.1 84.6L554.8 120.3C568.4 133.9 576 152.3 576 171.4C576 190.5 568.4 209 554.8 222.5C551.3 226 536.4 240.9 509.9 267.4z');
        svg.appendChild(path);
        return svg;
    }

    function getOrCreateStatus(type) {
        if (statusEls[type]) return statusEls[type];
        const address1 = document.getElementById(type + '-address_1');
        const wrapper = fieldWrapper(address1);
        if (!wrapper) return null;
        const el = document.createElement('div');
        el.className = 'bal-status bal-status--hidden';
        wrapper.parentElement.insertBefore(el, wrapper);
        statusEls[type] = el;
        return el;
    }

    function showHint(type, text) {
        const el = getOrCreateStatus(type);
        if (!el) return;
        while (el.firstChild) el.removeChild(el.firstChild);
        el.textContent = text;
        el.classList.toggle('bal-status--hidden', !text);
    }

    function showSummary(type, address1, postcode, city) {
        const el = getOrCreateStatus(type);
        if (!el) return;

        while (el.firstChild) el.removeChild(el.firstChild);
        el.classList.remove('bal-status--hidden');

        const card = document.createElement('div');
        card.className = 'wc-block-components-address-card';

        const addr = document.createElement('address');

        const title = document.createElement('span');
        title.className = 'wc-block-components-address-card__address-section';
        const titleStrong = document.createElement('strong');
        titleStrong.textContent = settings.i18n.address;
        title.appendChild(titleStrong);
        addr.appendChild(title);

        const primary = document.createElement('span');
        primary.className = 'wc-block-components-address-card__address-section wc-block-components-address-card__address-section--primary';
        primary.textContent = address1 + ', ' + postcode + ' ' + city;
        addr.appendChild(primary);

        card.appendChild(addr);

        const editBtn = document.createElement('a');
        editBtn.href = '#';
        editBtn.className = 'wc-block-components-address-card__edit';
        editBtn.appendChild(createPencilIcon());
        editBtn.appendChild(document.createTextNode(' ' + settings.i18n.edit));
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            enterEditMode(type);
        });
        card.appendChild(editBtn);

        el.appendChild(card);
    }

    function hideStatus(type) {
        const el = statusEls[type];
        if (el) {
            while (el.firstChild) el.removeChild(el.firstChild);
            el.classList.add('bal-status--hidden');
        }
    }

    // --- Address/city field visibility ---

    function hideAddressFields(type) {
        const address1 = document.getElementById(type + '-address_1');
        const city = document.getElementById(type + '-city');
        const w1 = fieldWrapper(address1);
        const w2 = fieldWrapper(city);
        if (w1) w1.style.display = 'none';
        if (w2) w2.style.display = 'none';
    }

    function showAddressFields(type) {
        const address1 = document.getElementById(type + '-address_1');
        const city = document.getElementById(type + '-city');
        const w1 = fieldWrapper(address1);
        const w2 = fieldWrapper(city);
        if (w1) w1.style.display = '';
        if (w2) w2.style.display = '';
    }

    function enterEditMode(type) {
        editMode[type] = true;
        hideStatus(type);
        showAddressFields(type);
    }

    // --- Lookup ---

    function doLookup(type) {
        const customer = getStore().getCustomerData();
        if (!customer) return;

        const address = type === 'billing' ? customer.billingAddress : customer.shippingAddress;
        if (!address || address.country !== 'NL') return;

        const displayPostcode = (address.postcode || '').trim();
        const postcode = normalizePostcode(displayPostcode);
        if (!POSTCODE_REGEX.test(postcode)) return;

        const houseInput = findHouseNumberInput(type);
        if (!houseInput) return;

        const parsed = parseHouseNumber(houseInput.value);
        if (!parsed) return;

        const lookupKey = postcode + '-' + parsed.number;
        if (lastLookup[type] === lookupKey) {
            if (lastStreet[type]) {
                setAddress(type, lastStreet[type], parsed.full);
                if (!editMode[type]) {
                    const address1 = lastStreet[type] + ' ' + parsed.full;
                    showSummary(type, address1, displayPostcode, lastCity[type]);
                }
            }
            return;
        }
        lastLookup[type] = lookupKey;

        if (activeRequests[type]) {
            activeRequests[type].abort();
        }

        if (!editMode[type]) {
            showHint(type, settings.i18n.looking_up);
        }

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
                lastCity[type] = '';
                enterEditMode(type);
                showHint(type, settings.i18n.not_found);
                return;
            }

            lastStreet[type] = data.street;
            lastCity[type] = data.city;

            setAddress(type, data.street, parsed.full);

            if (type === 'billing') {
                dispatch().setBillingAddress({ city: data.city });
            } else {
                dispatch().setShippingAddress({ city: data.city });
            }

            if (!editMode[type]) {
                const address1 = data.street + ' ' + parsed.full;
                showSummary(type, address1, displayPostcode, data.city);
                hideAddressFields(type);
            }
        })
        .catch(() => {
            activeRequests[type] = null;
        });
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

    // --- Country / postcode watchers ---

    const prevPostcode = { billing: '', shipping: '' };
    const prevCountry = { billing: '', shipping: '' };

    function handleCountryChange(type, country) {
        prevCountry[type] = country;
        toggleHouseNumber(type, country);

        if (country === 'NL') {
            if (!editMode[type]) {
                hideAddressFields(type);
                showHint(type, settings.i18n.auto_filled);
            }
        } else {
            editMode[type] = false;
            lastLookup[type] = '';
            hideStatus(type);
            showAddressFields(type);
        }
    }

    wp.data.subscribe(() => {
        const customer = getStore().getCustomerData();
        if (!customer) return;

        const billing = customer.billingAddress || {};
        if (billing.country !== prevCountry.billing) {
            handleCountryChange('billing', billing.country);
        }
        if (billing.country === 'NL' && billing.postcode !== prevPostcode.billing) {
            prevPostcode.billing = billing.postcode;
            scheduleLookup('billing');
        }

        const shipping = customer.shippingAddress || {};
        if (shipping.country !== prevCountry.shipping) {
            handleCountryChange('shipping', shipping.country);
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

    function bindPostcodeTrim(type) {
        const input = document.getElementById(type + '-postcode');
        if (!input || input._balTrimBound) return;
        input._balTrimBound = true;
        input.addEventListener('blur', () => {
            const trimmed = input.value.trim();
            if (trimmed !== input.value) {
                const nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                nativeSet.call(input, trimmed);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    function setup(type) {
        const houseInput = findHouseNumberInput(type);
        if (!houseInput || houseInput._balBound) return;

        houseInput._balBound = true;
        houseInput.addEventListener('input', () => scheduleLookup(type));

        reorderFields(type);
        bindPostcodeTrim(type);
        toggleHouseNumber(type, prevCountry[type]);

        const customer = getStore().getCustomerData();
        if (customer) {
            const address = type === 'billing' ? customer.billingAddress : customer.shippingAddress;
            if (address && address.country === 'NL' && !editMode[type]) {
                hideAddressFields(type);
                showHint(type, settings.i18n.auto_filled);
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
