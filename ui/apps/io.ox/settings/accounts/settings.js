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
define('io.ox/settings/accounts/settings',
      ['io.ox/core/extensions',
       'io.ox/core/tk/view',
       'io.ox/settings/utils',
       'io.ox/core/tk/dialogs',
       'io.ox/core/api/account',
       'io.ox/core/tk/forms'
       ], function (ext, View, utils, dialogs, api, forms) {


    'use strict';




    var listOfAccounts,

        createAccountItem = function (val) {
            listOfAccounts.push({
                dataid: 'email/' + val.id,
                html: val.primary_address
            });
            console.log(listOfAccounts);

        },

        seperateEachAccount = function (data) {
            listOfAccounts = [];
            _.each(data, function (val) {
                createAccountItem(val);
            });
        },


        createExtpointForSelectedAccount = function (args) {
            var selectedItemID = args.data.listbox.find('div[selected="selected"]').attr('data-item-id');
            if (selectedItemID !== undefined) {
                var type = selectedItemID.split(/\//)[0],
                    dataid = selectedItemID.split(/\//)[1];
                args.data.id = dataid;
                require(['io.ox/settings/accounts/' + type + '/settings'], function (m) {
                    console.log('ext: ' + 'io.ox/settings/accounts/' + type + '/settings/detail');
                    ext.point('io.ox/settings/accounts/' + type + '/settings/detail').invoke('draw', args.data.self.node, args);

                });
            }
        },

        createExtpointForNewAccount = function (args) {
            var type = 'email'; // TODO add more options
            console.log('create a new account');
            require(['io.ox/settings/accounts/' + type + '/settings'], function (m) {
                console.log('ext: ' + 'io.ox/settings/accounts/' + type + '/settings/detail');
                ext.point('io.ox/settings/accounts/' + type + '/settings/detail').invoke('draw', args.data.self.node, args);

            });
        },

        AccountsSettingsModelView = {
        draw: function (data) {
            var self = this,
                listbox = null;

            self.node = $('<div>');

            self.node.append(forms.createSettingsHead(data))
            .append(
                    forms.createSection()
                    .append(
                        forms.createSectionTitle({text: 'Accounts'})
                        )
                    .append(
                        forms.createSectionContent()
                        .append(
                            listbox = forms.createListBox({
                                dataid: 'accounts-list',
                                model: {
                                    get: function () {
                                        return listOfAccounts;
                                    }
                                }
                            })
                        )
                        .append(
                            forms.createButton({label: 'Add ...', btnclass: 'btn'}).attr('data-action', 'add').css({'margin-right': '15px'})
                                 .on('click', {self: self}, createExtpointForNewAccount),
                            forms.createButton({label: 'Edit ...', btnclass: 'btn'}).attr('data-action', 'edit').css({'margin-right': '15px'})
                                .on('click', {listbox: listbox, self: self}, createExtpointForSelectedAccount),
                            forms.createButton({label: 'Delete ...', btnclass: 'btn'}).attr('data-action', 'delete')
                        )
                    )
                    .append(forms.createSectionDelimiter())
                );
            return self;

        }
    };

    ext.point("io.ox/settings/accounts/settings/detail").extend({
        index: 200,
        id: "accountssettings",
        draw: function (data) {
            var  that = this;
            api.all().done(function (allAccounts) {
                seperateEachAccount(allAccounts);
                that.append(AccountsSettingsModelView.draw(data).node);
            });

            return AccountsSettingsModelView.node;
        },
        save: function () {
            console.log('now accounts get saved?');
        }
    });

    return {}; //whoa return nothing at first

});

