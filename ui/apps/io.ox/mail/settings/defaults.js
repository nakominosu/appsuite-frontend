/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/settings/defaults', ['gettext!io.ox/mail'], function (gt) {

    'use strict';

    var settingsDefaults = {
            'removeDeletedPermanently': false,
            'contactCollectOnMailTransport': false,
            'contactCollectOnMailAccess': false,
            'useFixedWidthFont': false,
            'appendVcard': false,
            'appendMailTextOnReply': true,
            'forwardMessageAs': 'Inline',
            'messageFormat': 'html',
            'lineWrapAfter': '',
            'defaultSendAddress': '',
            'autoSaveDraftsAfter': false,
            'allowHtmlMessages': true,
            'allowHtmlImages': false,
            'displayEmoticons': false,
            'isColorQuoted': false,
            'selectFirstMessage': true,
            'defaultSignature': false,
            'mobileSignature':
                //#. %s is the product name
                gt('Sent from %s via mobile', ox.serverConfig.productName),
            'mobileSignatureType': 'none', // one of 'none', 'custom'
            'threadView': 'inbox',
            //for persistent sort
            'sort': 'thread',
            'order': 'desc',
            'unread': false,
            //hidden atm
            'features': {
                'alwaysDeleteDraft': true
            }
        };

    return settingsDefaults;
});
