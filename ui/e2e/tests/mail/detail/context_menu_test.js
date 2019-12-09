/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Detail');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C248438] Context menu can be opened by right click', async (I, users, mail) => {

    const icke = users[0].userdata.email1,
        subject = 'Context menu can be opened by right click';

    await Promise.all([
        I.haveMail({
            attachments: [{
                content: 'Lorem ipsum',
                content_type: 'text/html',
                disp: 'inline'
            }],
            from: [['Icke', icke]],
            subject: subject,
            to: [['Icke', icke]]
        }),
        I.haveSetting({ 'io.ox/mail': { 'features/registerProtocolHandler': false } })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();

    // wait for first email
    var firstItem = '.list-view .list-item';
    I.waitForElement(firstItem);
    I.click(firstItem);
    I.waitForVisible('.thread-view.list-view .list-item');
    // we need to wait until the message is seen
    I.waitForDetached('.thread-view.list-view .list-item.unread');
    I.wait(1);

    // Mark unread
    rightClick('Mark as unread');
    I.waitForElement('.thread-view.list-view .list-item.unread');

    // View source
    rightClick('View source');
    I.waitForElement('.mail-source-dialog');
    I.waitForElement('//button[@data-action="close"]', '.modal-footer');
    I.wait(1);
    I.click('Close', '.modal-footer');
    I.waitForDetached('.mail-source-dialog');

    // Move
    rightClick('Move');
    I.waitForElement('.folder-picker-dialog');
    I.click('Cancel');

    // Reply
    rightClick('Reply');
    I.waitForElement({ css: 'button[data-action="discard"]:not(.disabled)' });
    I.seeInField('subject', 'Re: ' + subject);
    // no better approach yet. I.waitForMailCompose() might be a good one
    I.wait(1);
    I.click('Discard');

    // // Shift-F10 (view source again)
    // --- DOES NOT WORK YET -----
    // shiftF10();
    // clickAction('io.ox/mail/actions/source');
    // I.waitForElement('.mail-source-dialog');
    // I.click('Close');

    // Delete
    rightClick('Delete');
    // I.seeNumberOfElements('.leftside .list-view .list-item', 1);
    I.waitForDetached('.leftside .list-view .list-item');

    function rightClick(action) {
        let actionSelector = `//ul[@class="dropdown-menu"]//a[text()="${action}"]`;
        I.rightClick({ xpath: '//li[contains(@class, "list-item selectable")]' });
        I.waitForElement('.dropdown.open');
        I.waitForElement({ xpath: actionSelector });
        I.wait(1);
        I.click({ xpath: actionSelector });
    }

    // function shiftF10() {
    //     I.executeScript(function () {
    //         var e = $.Event('keydown', { button: 0, shiftKey: true, which: 121 });
    //         list.$el.children('.selected').first().trigger(e);
    //     });
    // }
});

