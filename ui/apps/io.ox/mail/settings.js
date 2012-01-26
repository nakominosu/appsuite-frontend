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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
/*global
define: true, _: true
*/
define('io.ox/mail/settings',
    ['io.ox/core/extensions',
     'io.ox/settings/utils',
     'io.ox/core/tk/dialogs',
     'settings!io.ox/mail'], function (ext, utils, dialogs, settings) {

    'use strict';

    console.log("mail/settings");
    console.log(settings);

    var myValidator = {
    };

    var mailSettings = {
        draw: function (node, app) {
            node
            .append(
              utils.createSettingsHead(app)
            )
            //section
            .append(
                utils.createSection()
                .append(utils.createSectionTitle({ text: 'Common' }))
                .append(
                    utils.createSectionContent()
                    .append(
                        utils.createInfoText(
                        {   html: 'EVERYTHING IS JUST MENT TO BE AN EXAMPLE HERE::::: Melden Sie sich mit Ihrem OX-Konto in OX Chrome an, ' +
                                  'um Ihre personalisierten Browserfunktionen online zu ' +
                                  'speichern und über OX Chrome auf jedem Computer darauf ' +
                                  'zuzugreifen. Sie werden dann auch automatisch in Ihren ' +
                                  'Lieblingsdiensten von OX angemeldet. Weitere Informationen' +
                                  'mehr Infos unter <a href="http://www.open-xchange.com" target="_blank">www.open-xchange.com</a>'
                        })
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            utils.createSelectbox(
                            {   dataid: 'mail-common-defaultview',
                                label: 'Default view:',
                                items:
                                {   'V-split view 1': 'option1',
                                    'V-split view 2': 'option2',
                                    'V-split view 3': 'option3'
                                },
                                currentValue: 'option1',
                                model: settings,
                                validator: myValidator
                           })
                        )
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            utils.createSelectbox(
                            {   dataid: 'mail-common-spamfolderview',
                                label: 'Default view for Spam folder',
                                items:
                                {   'V-split view 1': 'option1',
                                    'V-split view 2': 'option2',
                                    'V-split view 3': 'option3'
                                },
                                model: settings,
                                validator: myValidator
                            })
                        )
                        .addClass('expertmode')
                    )
                    .append(utils.createSectionDelimiter())

                    .append(utils.createCheckbox({ dataid: 'mail-common-selectfirst', label: 'Automatically select first E-Mail?', model: settings, validator: myValidator}).addClass('expertmode'))
                    .append(utils.createCheckbox({ dataid: 'mail-common-removepermanently', label: 'Permanently remove deleted E-Mails?', model: settings, validator: myValidator}))
                    .append(utils.createCheckbox({ dataid: 'mail-common-notifyreceipt', label: 'Notify on delivery receipt?', model: settings, validator: myValidator}).addClass('expertmode'))
                    .append(utils.createCheckbox({ dataid: 'mail-common-showsenderpic', label: 'Show sender image?', model: settings, validator: myValidator}))
                    .append(utils.createCheckbox({ dataid: 'mail-common-collectwhilesending', label: 'Automatically collect contacts in the folder "Collected addresses" while sending?', model: settings, validator: myValidator}).addClass('expertmode'))
                    .append(utils.createCheckbox({ dataid: 'mail-common-collectwhilereading', label: 'Automatically collect contacts in the folder "Collected addresses" while reading?', model: settings, validator: myValidator}).addClass('expertmode'))

                    .append(utils.createSectionDelimiter())

                    .append(
                        utils.createButton({label: 'click me'})
                    )
                )
                .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                .append(utils.createSectionTitle({text: 'Compose'}))
                .append(
                    utils.createSectionContent()
                    .append(utils.createCheckbox({dataid: 'mail-common-selectfirst', label: 'Insert the original E-Mail text to a reply', model: settings, validator: myValidator}).addClass('expertmode'))
                    .append(utils.createCheckbox({dataid: 'mail-common-removepermanently', label: 'Append vcard', model: settings, validator: myValidator}))
                    .append(utils.createCheckbox({dataid: 'mail-common-notifyreceipt', label: 'Enable auto completion of E-Mail addresses', model: settings, validator: myValidator}).addClass('expertmode'))
                    .append(
                        utils.createSectionGroup()
                        .append(utils.createInfoText({text: 'Forward E-Mails as:'}))
                        .append(utils.createRadioButton({dataid: 'mail-compose-forwardas', label: 'Inline', name: 'mail-compose-forwardas', value: true, model: settings, validator: myValidator}))
                        .append(utils.createRadioButton({dataid: 'mail-compose-forwardas', label: 'Attachment', name: 'mail-compose-forwardas', value: false, model: settings, validator: myValidator}))
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(utils.createInfoText({text: 'When "Reply all":'}))
                        .append(utils.createRadioButton({dataid: 'mail-compose-whenreplyall', label: 'Add sender and recipients to "To", Cc to "Cc"', name: 'mail-compose-whenreplyall', value: "fields", model: settings, validator: myValidator}))
                        .append(utils.createRadioButton({dataid: 'mail-compose-whenreplyall', label: 'Add sender to "To", recipients to "Cc"', name: 'mail-compose-whenreplyall', value: "cc", model: settings, validator: myValidator}))
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(utils.createInfoText({text: 'Format E-Mails as:'}))
                        .append(utils.createRadioButton({dataid: 'mail-compose-emailformat', label: 'HTML', name: 'mail-compose-emailformat', value: "html", model: settings, validator: myValidator}))
                        .append(utils.createRadioButton({dataid: 'mail-compose-emailformat', label: 'Plain text', name: 'mail-compose-emailformat', value: "plain", model: settings, validator: myValidator}))
                        .append(utils.createRadioButton({dataid: 'mail-compose-emailformat', label: 'HTML and Plain text', name: 'mail-compose-emailformat', value: 'both', model: settings, validator: myValidator}))
                    )

                    .append(
                        utils.createSectionGroup()
                        .append(
                            utils.createSelectbox(
                            {   dataid: 'mail-testselect',
                                label: 'Editor feature set',
                                items:
                                {   'Enhanced': 'enhanced',
                                    'Default': 'default'
                                },
                                model: settings,
                                validator: myValidator
                           })
                        )
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            utils.createSelectbox(
                            {   dataid: 'mail-compose-font',
                                label: 'Default E-Mail font:',
                                items:
                                {   'Default': 'default',
                                    'Andale Mono': 'andale_mono',
                                    'Arial': 'arial',
                                    'Arial Black': 'arial_black',
                                    'Book Antiqua': 'book_antiqua'
                                },
                                model: settings,
                                validator: myValidator
                            })
                        )
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            utils.createSelectbox(
                            {   dataid: 'mail-compose-fontsize',
                                label: 'Default E-Mail font size:',
                                items:
                                {   'Default': 'default',
                                    '1 (8pt)': '8_pt',
                                    '2 (10pt)': '10_pt'
                                },
                                model: settings,
                                validator: myValidator
                            })
                        )
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createLabel()
                        .append(
                            utils.createText({text: 'Line wrap when sending text mails after:'})
                        )
                        .append(
                            utils.createTextField({dataid: 'mail-compose-linewarpafter', model: settings, validator: myValidator}).css({ width: '30px', display: 'inline-block'})
                        )
                        .append(
                            utils.createText({text: 'characters'})
                        )
                        .addClass('expertmode')
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            utils.createSelectbox(
                            {   dataid: 'mail-compose-defaultsender',
                                label: 'Default sender address:',
                                items:
                                {   'mario@sourcegarden.de': 'mario@sourcegarden.de',
                                    'mario@sourcegarden.com': 'mario@sourcegarden.com',
                                    'mario.scheliga@open-xchange.com': 'mario.scheliga@open-xchange.com'
                                },
                                model: settings,
                                validator: myValidator
                            })
                        )
                    )
                    .append(
                        utils.createSectionGroup()
                        .append(
                            utils.createSelectbox(
                            {   dataid: 'mail-compose-savedraftsinterval',
                                label: 'Auto-save Email drafts?',
                                items:
                                {   'Disabled': 'disabled',
                                    '1 Minute': '1_minute',
                                    '3 Minutes': '3_minutes',
                                    '5 Minutes': '5_minutes',
                                    '10 Minutes': '10_minutes'
                                },
                                model: settings,
                                validator: myValidator
                            })
                        )
                        .addClass('expertmode')
                    )
                    .append(utils.createSectionDelimiter())
                )
                .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                .append(utils.createSectionTitle({text: 'Display' }))
                .append(
                    utils.createSectionContent()
                    .append(utils.createCheckbox({dataid: 'mail-display-allowhtml', label: 'Allow html formatted E-Mails', model: settings, validator: myValidator}))
                    .append(utils.createCheckbox({dataid: 'mail-display-blockimgs', label: 'Block pre-loading of externally linked images', model: settings, validator: myValidator}))
                    .append(utils.createCheckbox({dataid: 'mail-display-emotionicons', label: 'Display emoticons as graphics in text E-Mails', model: settings, validator: myValidator}))
                    .append(utils.createCheckbox({dataid: 'mail-display-colorquotes', label: 'Color quoted lines', model: settings, validator: myValidator}))
                    .append(utils.createCheckbox({dataid: 'mail-display-namesinfields', label: 'Show name instead of E-Mail address in To and Cc fields', model: settings, validator: myValidator}))
                )
                .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                .addClass('expertmode')
                .append(utils.createSectionTitle({text: 'Signatures'}))
                .append(
                    utils.createSectionContent()
                    .append(utils.createCheckbox({dataid: 'mail-display-namesinfields', label: 'Show name instead of E-Mail address in To and Cc fields', model: settings, validator: myValidator}))
                )
                .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                .addClass('expertmode')
                .append(utils.createSectionTitle({text: 'Filter' }))
                .append(
                  utils.createSectionContent()
                    .append(utils.createCheckbox({dataid: 'mail-display-namesinfields', label: 'Show name instead of E-Mail address in To and Cc fields', model: settings, validator: myValidator}))
                )
                .append(utils.createSectionDelimiter())
            )
            .append(
                utils.createSection()
                .append(utils.createSectionTitle({text: 'Vacation Notice'}))
                .append(
                    utils.createSectionContent()
                    .append(utils.createCheckbox({dataid: 'mail-display-namesinfields', label: 'Show name instead of E-Mail address in To and Cc fields', model: settings, validator: myValidator}))
                )
                .append(utils.createSectionDelimiter())
            );

            return node;
        }
    };

    // created on/by
    ext.point("io.ox/mail/settings/detail").extend({
        index: 200,
        id: "mailsettings",
        draw: function (data) {
            return mailSettings.draw(this, data);
        },
        save: function () {
            settings.save().done(function () {
                console.log('saved for email');
            });
        }
    });

    return {}; //whoa return nothing at first
});
