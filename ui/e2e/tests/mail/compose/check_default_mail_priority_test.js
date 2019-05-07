/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Francisco Laguna <francisco.laguna@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose');

Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C8819] Default mail priority', async (I) => {
    // Preparation
    // Suppress mailto: popup
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    // Log in and switch to mail app
    I.login('app=io.ox/mail');
    I.waitForText('Compose');
    I.click('Compose');
    // Wait for the compose dialog
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    // Click 'Options' Dropdown
    I.click('Options');
    //Check default mail priority
    I.seeElement(locate('~Priority Normal').withDescendant('i.fa-check'));
    I.click('Normal');
    I.logout();
});
