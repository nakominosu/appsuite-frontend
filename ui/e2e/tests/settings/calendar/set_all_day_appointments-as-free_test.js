/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ejaz Ahmed <ejaz.ahmed@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />
Feature('Settings > Calendar');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7866] Set all-day appointments to be marked as free', async function (I) {

    const freeappointmentsubject = 'Free Appt',
        reservedappointmentsubject = 'Reserved Appt',
        location = 'Dortmund',
        description = 'Set all-day appointments to be marked as free';

    await I.haveSetting('io.ox/calendar//markFulltimeAppointmentsAsFree', false);
    I.login(['app=io.ox/calendar&perspective=week:week']);

    // Make sure setting is set correctly
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings');
    I.waitForVisible('div[data-point="io.ox/core/settings/detail/view"]');
    I.click({ css: '[data-id="virtual/settings/io.ox/calendar"]' });
    I.waitForElement('.alarms-link-view .btn-link');
    I.dontSeeCheckboxIsChecked('Mark all day appointments as free');

    // Create all day appointment and dont mark as free
    I.openApp('Calendar');
    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('summary', reservedappointmentsubject);
    I.fillField('location', location);
    I.click('All day');
    I.fillField('description', description);
    I.dontSeeCheckboxIsChecked('transp');
    I.click('Create');
    I.waitForElement('div.appointment.reserved');

    // Change setting
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings');
    I.waitForVisible('div[data-point="io.ox/calendar/settings/detail/view"]');
    I.waitForElement('.alarms-link-view .btn-link');
    I.click('Mark all day appointments as free');

    // Create new all day appointment and see if it is marked as free
    I.openApp('Calendar');
    I.waitForVisible('.weekview-toolbar');
    // Have to click on today button for setting to work
    I.click('button.weekday.today');
    I.waitForText('Subject');
    I.fillField('summary', freeappointmentsubject);
    I.fillField('location', location);
    I.fillField('description', description);
    I.seeCheckboxIsChecked('allDay');
    I.seeCheckboxIsChecked('transp');
    I.click('Create');
    I.waitForElement('div.appointment.free');
});