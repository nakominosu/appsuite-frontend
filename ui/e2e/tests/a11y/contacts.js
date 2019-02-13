/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

Scenario('Contacts - Default List view w/o contact', async (I) => {
    I.login('app=io.ox/contacts');
    I.waitForElement('.contact-detail');
    I.waitForElement('.vgrid-cell.selectable.contact.selected');
    I.click('View');
    I.click('Checkboxes');
    I.click('.vgrid-cell.selectable.contact.selected .vgrid-cell-checkbox');
    I.waitForElement('.summary.empty');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Contacts - Default List view with contact detail view', async (I) => {
    I.login('app=io.ox/contacts');
    I.waitForElement('.contact-detail');

    expect(await I.grabAxeReport()).to.be.accessible;
});