/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/settings/dialogs/personalDataDialog', [
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core',
    'io.ox/backbone/views/modal',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/api/personalData',
    'less!io.ox/core/settings/dialogs/style'
], function (DisposableView, gt, ModalDialog, ext, mini, api) {

    'use strict';

    // same structure as api response
    var modules = {
            'mail': {
                'label': gt('Mails'),
                'includeTrash': {
                    //#. shown when a download of mail data is requested
                    'label': gt('include trash folder')
                },
                'subscribedOnly': {
                    //#. shown when a download of mail data is requested
                    'label': gt('include subscribed folders only')
                }
            },
            'calendar': {
                'label': gt('Calendar'),
                'includePublic': {
                    //#. shown when a download of calendar data is requested
                    'label': gt('include public calendars')
                },
                'includeShared': {
                    //#. shown when a download of calendar data is requested
                    'label': gt('include shared calendars')
                },
                'subscribedOnly': {
                    //#. shown when a download of calendar data is requested
                    'label': gt('include subscribed calendars only')
                }
            },
            'contacts': {
                'label': gt('Address books'),
                'includePublic': {
                    //#. shown when a download of contact data is requested
                    'label': gt('include public address books')
                },
                'includeShared': {
                    //#. shown when a download of contact data is requested
                    'label': gt('include shared address books')
                },
                'includeDistributionLists': {
                    //#. shown when a download of contact data is requested
                    'label': gt('include distribution lists')
                }
            },
            'infostore': {
                'label': gt('Files'),
                'includeAllVersions': {
                    //#. shown when a download of (cloud) drive files is requested
                    'label': gt('include all file versions')
                },
                'includeTrash':  {
                    //#. shown when a download of (cloud) drive files is requested
                    'label': gt('include trash folder')
                },
                'includePublic':  {
                    //#. shown when a download of (cloud) drive files is requested
                    'label': gt('include public folders')
                },
                'includeShared': {
                    //#. shown when a download of (cloud) drive files is requested
                    'label': gt('include shared folders')
                }
            },
            'tasks': {
                'label': gt('Tasks'),
                'includePublic':  {
                    //#. shown when a download of task data is requested
                    'label': gt('include public folders')
                },
                'includeShared': {
                    //#. shown when a download of task data is requested
                    'label': gt('include shared folders')
                }
            }
        },
        personalDataView = DisposableView.extend({
            className: 'personal-data-view',
            initialize: function () {
                var self = this;
                // create one model for each submodule
                // makes it easier to use checkbox miniviews later on since data is not nested anymore
                this.models = {};
                _(_(modules).keys()).each(function (moduleName) {
                    if (!self.model.get(moduleName)) return;
                    self.models[moduleName] = new Backbone.Model(self.model.get(moduleName));
                    self.models[moduleName].on('change:enabled', function (model) {
                        self.$el.find('.' + moduleName + '-sub-option').toggleClass('disabled', !model.get('enabled')).find('input').attr('aria-disabled', true).prop('disabled', model.get('enabled') ? '' : 'disabled');
                    });
                });
            },
            render: function () {
                var self = this;
                this.$el.empty();

                // data selection
                this.$el.append($('<div>').text(gt('Please select the data to be included in your download')));

                // build Checkboxes
                _(modules).each(function (data, moduleName) {
                    if (!self.model.get(moduleName)) return;
                    // main checkbox for the module (mail)
                    self.$el.append(new mini.CustomCheckboxView({ name: 'enabled', label: modules[moduleName].label, model: self.models[moduleName] }).render().$el.addClass('main-option '));
                    // sub checkboxes (include trash folder etc)
                    _(_(data).keys()).each(function (subOption) {
                        if (subOption === 'label') return;
                        self.$el.append(new mini.CustomCheckboxView({ name: subOption, label: modules[moduleName][subOption].label, model: self.models[moduleName] }).render().$el.addClass('sub-option ' + moduleName + '-sub-option'));
                    });

                });

                return this;
            },
            requestDownload: function () {
                var self = this;
                _(_(this.models).keys()).each(function (moduleName) {
                    self.model.set(moduleName, self.models[moduleName].toJSON());
                });
                api.requestDownload(this.model.toJSON());
            }
        }),
        downloadView = DisposableView.extend({
            className: 'personal-data-download-view',
            render: function () {
                this.$el.empty();

                if (this.model.get('status') === 'running') {
                    //#. %1$s: date and time the download was requested
                    this.$el.append($('<div class="alert alert-info">')
                    .text(gt('Your download request from %1$s is currently being prepared. You can only request one download at a time.', moment(this.model.get('creationTime')).format('LLL'))));
                }

                if (this.model.get('results') && this.model.get('results').length) {
                    this.$el.append(
                        //#. %1$s: date and time when the download expires
                        $('<label>').text(gt('Files ready for download. Available until %1$s.', moment(this.model.get('avaiableUntil')).format('LLL'))),
                        $('<ul class="list-unstyled downloads">').append(
                            _(this.model.get('results')).map(function (file) {
                                return $('<li class="file">')
                                    .append(
                                        $('<span>').text(file.fileInfo),
                                        $('<button type="button" class="btn fa fa-download">')
                                            //#. %1$s: filename
                                            .attr('title', gt('Download %1$s.', file.fileInfo))
                                            .on('click', function () {
                                                api.downloadFile(file.taskId, file.number);
                                            })
                                    );
                            })
                        ));
                }

                return this;
            }
        });

    var openDialog = function () {
        $.when(api.getAvailableDownloads(), api.getAvailableModules()).then(function (downloadStatus, availableModules) {

            var availableModulesModel = new Backbone.Model(availableModules),
                status = new Backbone.Model(downloadStatus),
                pdView, dlView, dialog;

            dialog = new ModalDialog({ title: gt('Personal data') })
                .addCancelButton({ left: true })
                .build(function () {
                    if (status.get('status') !== 'running' && !(status.get('results') && status.get('results').length)) {
                        pdView = new personalDataView({ model: availableModulesModel });
                        this.$body.append(
                            pdView.render().$el
                        );
                        this.on('generate', _.bind(pdView.requestDownload, pdView));
                    }

                    dlView = new downloadView({ model: status });
                    this.$body.append(
                        dlView.render().$el
                    );
                })
                .on('cancelDownload', api.cancelDownloadRequest)
                .on('removefiles', api.deleteAllFiles);

            if (status.get('status') !== 'running' && !(status.get('results') && status.get('results').length)) {
                dialog.addButton({ action: 'generate', label: gt('Generate download') });
            }
            if (status.get('status') === 'running') {
                dialog.addButton({ action: 'cancelDownload', label: gt('Cancel download request') })
                    //mock
                    .on('cancel', function () {
                        api.requestFinished = true;
                    });
            }
            if (status.get('results') && status.get('results').length) {
                dialog.addButton({ action: 'removefiles', label: gt('Delete all avaliable downloads') });
            }

            dialog.open();
        });
    };

    return {
        openDialog: openDialog
    };

});
