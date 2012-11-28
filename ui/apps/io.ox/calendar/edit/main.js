/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/main',
      ['io.ox/calendar/model',
       'io.ox/calendar/api',
       'io.ox/core/extPatterns/dnd',
       'io.ox/calendar/edit/view-main',
       'gettext!io.ox/calendar/edit/main',
       'less!io.ox/calendar/edit/style.less'], function (appointmentModel, api, dnd, MainView, gt) {

    'use strict';

    function createInstance() {

        var app = ox.ui.createApp({name: 'io.ox/calendar/edit', title: gt('Edit Appointment'), userContent: true }),

            controller = _.extend(app, {
                start: function () {
                    app.dropZone = new dnd.UploadZone({
                        ref: "io.ox/calendar/edit/dnd/actions"
                    }, app);

                },
                stop: function () {
                    var self = this,
                        df = new $.Deferred();

                    //be gently
                    if (self.getDirtyStatus()) {
                        require(['io.ox/core/tk/dialogs'], function (dialogs) {
                            new dialogs.ModalDialog()
                                .text(gt("Do you really want to discard your changes?"))
                                .addPrimaryButton('delete', gt('Discard'))
                                .addButton('cancel', gt('Cancel'))
                                .show()
                                .done(function (action) {
                                    if (action === 'delete') {
                                        self.dispose();
                                        df.resolve();
                                    } else {
                                        df.reject();
                                    }
                                });
                        });
                    } else {
                        //just let it go
                        self.dispose();
                        df.resolve();
                    }
                    return df;
                },
                /*
                * should cleanly remove every outbounding reference
                * of all objects created. this could be a awkward task
                * but better for longtime perf. IE still has a hu
                * :(
                */
                dispose: function () {
                    this.view.off('save', _.bind(this.onSave, this));
                    this.model.off('change:title');
                },
                edit: function (data) {

                    app.cid = 'io.ox/calendar:edit.' + _.cid(data);
                    console.log('YEAH.edit', app.cid);

                    var self = this;
                    function cont(data) {
                        app.model = self.model = appointmentModel.factory.create(data);
                        appointmentModel.applyAutoLengthMagic(self.model);
                        appointmentModel.setDefaultParticipants(self.model).done(function () {
                            app.view = self.view = new MainView({model: self.model, mode: data.id ? 'edit' : 'create', app: self});
                            self.model.on('create:start update:start', function () {
                                self.getWindow().busy();
                            });
                            self.model.on('create update', _.bind(self.onSave, self));
                            self.model.on('backendError', function () {
                                self.getWindow().idle();
                            });

                            self.setTitle(gt('Edit Appointment'));

                            // create app window
                            var win = ox.ui.createWindow({
                                name: 'io.ox/calendar/edit',
                                chromeless: true
                            });

                            self.setWindow(win);
                            win.on('show', function () {
                                app.dropZone.include();
                            });

                            win.on('hide', function () {
                                app.dropZone.remove();
                            });

                            $(self.getWindow().nodes.main[0]).append(self.view.render().el);
                            self.getWindow().show(_.bind(self.onShowWindow, self));

                        });
                    }

                    if (data) {
                        //hash support
                        self.setState({ folder: data.folder_id, id: data.id});
                        cont(data);
                    } else {
                        api.get(self.getState())
                            .done(cont)
                            .fail(function (err) {
                                // FIXME: use general error class, teardown gently for the user
                                throw new Error(err.error);
                            });
                    }
                },
                considerSaved: false,
                create: function (data) {
                    var self = this;
                    app.model = self.model = appointmentModel.factory.create(data);
                    appointmentModel.applyAutoLengthMagic(self.model);

                    appointmentModel.setDefaultParticipants(self.model).done(function () {
                        app.view = self.view = new MainView({model: self.model, lasso: data.lasso || false, app: self});

                        self.model.on('create update', _.bind(self.onSave, self));
                        self.view.on('save:success', function () {
                            self.considerSaved = true;
                            self.view.idle();
                            self.quit();
                        });

                        self.setTitle(gt('Create Appointment'));

                        // create app window
                        var win = ox.ui.createWindow({
                            name: 'io.ox/calendar/edit',
                            title: gt('Create Appointment'),
                            chromeless: true
                        });

                        self.setWindow(win);

                        win.on('show', function () {
                            app.dropZone.include();
                        });

                        win.on('hide', function () {
                            app.dropZone.remove();
                        });

                        $(self.getWindow().nodes.main[0]).append(self.view.render().el);
                        self.getWindow().show(_.bind(self.onShowWindow, self));

                    });

                },
                getDirtyStatus : function () {
                    if (this.considerSaved) {
                        return false;
                    }
                    return !_.isEmpty(this.model.changedSinceLoading());
                },
                onShowWindow: function () {
                    var self = this;
                    if (self.model.get('title')) {
                        self.getWindow().setTitle(self.model.get('title'));
                        self.setTitle(self.model.get('title'));
                    }
                    self.model.on('change:title', function (model, value, source) {
                        self.getWindow().setTitle(value);
                        self.setTitle(value);
                    });
                    $(self.getWindow().nodes.main).find('input')[0].focus(); // focus first input element
                    $(self.getWindow().nodes.main[0]).addClass('scrollable'); // make window scrollable
                },
                onSave: function () {
                    this.considerSaved = true;
                    this.getWindow().idle();
                    this.quit();
                },
                failSave: function () {
                    if (this.model) {
                        return {
                            module: 'io.ox/calendar/edit',
                            point: this.model.attributes
                        };
                    }
                    return {module: 'io.ox/calendar/edit'};
                },
                failRestore: function (point) {
                    var df = $.Deferred();
                    if (_.isUndefined(point.id)) {
                        this.create(point);
                    } else {
                        this.edit(point);
                    }
                    df.resolve();
                    return df;
                }

            });

        controller.setLauncher(_.bind(controller.start, controller));
        controller.setQuit(_.bind(controller.stop, controller));
        return controller;
    }

    return {

        getApp: createInstance,

        reuse: function (type, data) {
            if (type === 'edit') {
                console.log('calendar.edit.reuse?', _.cid(data));
                return ox.ui.App.reuse('io.ox/calendar:edit.' + _.cid(data));
            }
        }
    };
});
