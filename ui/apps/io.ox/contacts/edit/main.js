/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/contacts/edit/main',
    ['io.ox/contacts/api',
     'io.ox/core/cache',
     'io.ox/contacts/edit/view-form',
     'io.ox/contacts/model',
     'gettext!io.ox/contacts/contacts',
     'less!io.ox/contacts/style.css'
     ], function (api, cache, ContactEditView, ContactModel, gt) {

    'use strict';

    // multi instance pattern
    function createInstance(data) {
        var app, getDirtyStatus,
            dirtyStatus = {
            byApi: true
        };

        app = ox.ui.createApp({
            name: 'io.ox/contacts/edit',
            title: 'Edit Contact'
        });

        app.setLauncher(function () {
            var win,
                container;

            win = ox.ui.createWindow({
                title: 'Edit Contact',
                toolbar: true,
                close: true
            });

            app.setWindow(win);

            container = win.nodes.main
                .css({ backgroundColor: '#fff' })
                .scrollable()
                .css({ maxWidth: '600px', margin: '20px auto 20px auto' });

            var cont = function (data) {

                win.show(function () {

                    // create model & view
                    var myModel = new ContactModel({ data: data }),
                        myView = new ContactEditView({ model: myModel });

                    getDirtyStatus = function () {
                        var status;
                        if (myModel.dirty !== true) {
                            status =  myModel.isDirty();
                        } else {
                            status = true;
                        }
                        return status;
                    };

                    myModel.store = function (data, changes) {
                        // TODO: replace image upload with a field in formsjs method
                        var image = $('#contactUploadImage').find("input[type=file]").get(0);
                        if (image.files && image.files[0]) {
                            return api.editNewImage(data, changes, image.files[0])
                            .done(function () {
                                dirtyStatus.byApi = false;
                                app.quit();
                            });

                        } else {
                            return api.edit({
                                id: data.id,
                                folder: data.folder_id,
                                timestamp: _.now(),
                                data: changes
                            }).done(function () {
                                dirtyStatus.byApi = false;
                                app.quit();
                            });
                        }
                    };

//                    window.model = myModel;
//                    window.view = myView;
                    container.append(myView.draw(app).node);
                    container.find('input[type=text]:visible').eq(0).focus();
                });
            };

            if (data) {
                // hash support
                app.setState({ folder: data.folder_id, id: data.id });
                cont(data);
            } else {
                api.get(app.getState()).done(cont);
            }
        });

        app.setQuit(function () {
            var def = $.Deferred(),
                listetItem =  $('.listet-item');

            dirtyStatus.byModel = getDirtyStatus();

            if (dirtyStatus.byModel === true) {
                if (dirtyStatus.byApi === true) {
                    require(["io.ox/core/tk/dialogs"], function (dialogs) {
                        new dialogs.ModalDialog()
                            .text(gt("Do you really want to lose your changes?"))
                            .addButton("cancel", gt('Cancel'))
                            .addButton("delete", gt('Lose changes'))
                            .show()
                            .done(function (action) {
                                console.debug("Action", action);
                                if (action === 'delete') {
                                    def.resolve();
                                    listetItem.remove();
                                } else {
                                    def.reject();
                                }
                            });
                    });
                } else {
                    def.resolve();
                    listetItem.remove();
                }
            } else {
                def.resolve();
                listetItem.remove();
            }
            //clean
            return def;
        });

        return app;
    }

    return {
        getApp: createInstance
    };

});
