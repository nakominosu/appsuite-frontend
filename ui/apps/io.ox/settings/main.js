/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/settings/main', [
    'io.ox/core/tk/vgrid',
    'io.ox/core/api/apps',
    'io.ox/core/extensions',
    'io.ox/core/commons',
    'gettext!io.ox/core',
    'settings!io.ox/settings/configjump',
    'settings!io.ox/core',
    'io.ox/core/capabilities',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/node',
    'io.ox/core/folder/api',
    'io.ox/core/folder/util',
    'io.ox/core/api/mailfilter',
    'io.ox/core/yell',
    'io.ox/keychain/api',
    'io.ox/core/settings/errorlog/settings/pane',
    'io.ox/core/settings/downloads/pane',
    'io.ox/settings/apps/settings/pane',
    'less!io.ox/settings/style'
], function (VGrid, appsAPI, ext, commons, gt, configJumpSettings, coreSettings, capabilities, TreeView, TreeNodeView, api, folderUtil, mailfilterAPI, yell, keychainAPI) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/settings' }),
        // app window
        win,
        // nodes
        left,
        right,
        currentSelection = null,
        previousSelection = null,
        pool = api.pool,
        mainGroups = [],
        disabledSettingsPanes;

    ext.point('io.ox/settings/help/mapping').extend({
        id: 'core',
        index: 100,
        list: function () {
            _.extend(this, {
                'virtual/settings/io.ox/settings/accounts': 'ox.appsuite.user.sect.dataorganisation.accounts.html',
                'virtual/settings/io.ox/portal': 'ox.appsuite.user.sect.portal.customize.settings.html',
                'virtual/settings/io.ox/mail': 'ox.appsuite.user.sect.email.settings.html',
                'virtual/settings/io.ox/vacation': 'ox.appsuite.user.sect.email.send.vacationnotice.html',
                'virtual/settings/io.ox/autoforward': 'ox.appsuite.user.sect.email.send.autoforward.html',
                'virtual/settings/io.ox/mailfilter': 'ox.appsuite.user.sect.email.mailfilter.html',
                'virtual/settings/io.ox/mail/settings/signatures': 'ox.appsuite.user.sect.email.settings.html#ox.appsuite.user.reference.email.settings.signatures',
                'virtual/settings/io.ox/contacts': 'ox.appsuite.user.sect.contacts.settings.html',
                'virtual/settings/io.ox/calendar': 'ox.appsuite.user.sect.calendar.settings.html',
                'virtual/settings/io.ox/timezones': 'ox.appsuite.user.sect.calendar.settings.html#ox.appsuite.user.reference.calendar.settings.timezones',
                'virtual/settings/io.ox/tasks': 'ox.appsuite.user.sect.tasks.settings.html',
                'virtual/settings/io.ox/files': 'ox.appsuite.user.sect.files.settings.html',
                'virtual/settings/administration/groups': 'ox.appsuite.user.sect.calendar.groups.html',
                'virtual/settings/administration/resources': 'ox.appsuite.user.sect.calendar.resources.html'
            });
        }
    });

    app.getContextualHelp = function () {
        var id = this.folder.get(),
            data = {};

        ext.point('io.ox/settings/help/mapping').invoke('list', data);

        return data[id] ? data[id] : 'ox.appsuite.user.sect.firststeps.globalsettings.html';
    };

    app.setLauncher(function (options) {

        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/settings',
            title: 'Settings',
            chromeless: true
        }));

        function disableListetSettingsPanes(subgroup) {
            _.each(ext.point(subgroup).list(), function (p) {
                var result = _.indexOf(disabledSettingsPanes, p.id) >= 0;
                if (result) ext.point(subgroup).disable(p.id);
            });
        }

        win.addClass('io-ox-settings-main');

        var vsplit = commons.vsplit(win.nodes.main, app);
        left = vsplit.left.addClass('leftside border-right');

        left.attr({
            'role': 'navigation',
            'aria-label': gt('Settings')
        });

        right = vsplit.right.addClass('default-content-padding settings-detail-pane f6-target').attr({
            //needed or mac voice over reads the whole settings pane when an input element is focused
            'role': 'main',
            'tabindex': 0
        }).scrollable();

        // Create extensions for the apps
        var appsInitialized = appsAPI.getInstalled().done(function (installed) {

            var apps = _.filter(installed, function (item) {
                if (!item.settings) return false;
                if (item.device && !_.device(item.device)) return false;
                // check for dedicated requirements for settings (usually !guest)
                if (item.settingsRequires && !capabilities.has(item.settingsRequires)) return false;
                // check for device requirements for settings
                if (item.settingsDevice && !_.device(item.settingsDevice)) return false;
                // special code for tasks because here settings depend on a capability
                // could have been done in manifest, but I did not want to change the general structure
                // because of one special case, that might even disappear in the future
                if (item.id === 'io.ox/tasks') return capabilities.has('delegate_tasks');
                return true;
            });

            ext.point('io.ox/settings/pane').extend({
                id: 'main',
                index: 200,
                subgroup: 'io.ox/settings/pane/main'
            });

            var index = 100;

            _(apps).each(function (app) {
                ext.point('io.ox/settings/pane/main').extend(_.extend({}, {
                    title: app.description,
                    ref: app.id,
                    index: index
                }, app));
                index += 100;
            });
        });

        var getAllSettingsPanes = function () {

            var def = $.Deferred(),
                actionPoints = {
                    'redirect': 'auto-forward',
                    'vacation': 'vacation-notice'
                };

            disabledSettingsPanes = coreSettings.get('disabledSettingsPanes') ? coreSettings.get('disabledSettingsPanes').split(',') : [];

            function filterAvailableSettings(point) {
                return _.indexOf(disabledSettingsPanes, point.id) === -1;
            }

            if (capabilities.has('mailfilter_v2')) {
                mailfilterAPI.getConfig().done(function (config) {

                    // disable autoforward or vacationnotice if the needed actions are not available
                    _.each(actionPoints, function (val, key) {
                        if (_.findIndex(config.actioncmds, function (obj) { return obj.id === key; }) === -1) {
                            ext.point('io.ox/mail/settings/detail/view/buttons').disable(val);
                        }
                    });

                }).fail(function (response) {
                    yell('error', response.error_desc);
                }).always(function () {
                    appsInitialized.done(function () {
                        def.resolve(_.filter(ext.point('io.ox/settings/pane').list(), filterAvailableSettings));
                    }).fail(def.reject);

                });
            } else {
                appsInitialized.done(function () {
                    def.resolve(_.filter(ext.point('io.ox/settings/pane').list(), filterAvailableSettings));
                }).fail(def.reject);

            }

            return def;
        };

        var defaultExtension = {
            id: 'standard-folders',
            index: 100,
            draw: function (tree) {
                var defaults = {
                    headless: true,
                    count: 0,
                    empty: false,
                    indent: false,
                    open: true,
                    tree: tree,
                    parent: tree,
                    folder: 'virtual/settings',
                    className: 'folder selectable'
                };

                this.append(

                    mainGroups.map(function (group) {
                        var folderOptions = _.extend({}, defaults, group.folderOptions || {}, { model_id: group.id });
                        return new TreeNodeView(folderOptions)
                        .render().$el.addClass('standard-folders');
                    })

                );
            }
        };

        ext.point('io.ox/core/foldertree/settings/app').extend(_.extend({}, defaultExtension));

        var getter = function () {
            var def = $.Deferred();
            def.resolve(pool.getCollection(this.id).models);
            return def;
        };

        // tree view
        var tree = new TreeView({
            root: '1',
            all: false,
            app: app,
            contextmenu: false,
            flat: false,
            indent: true,
            module: 'settings'
        });
        tree.preselect(_.url.hash('folder'));

        // select tree node on expand
        tree.on('open', function (id, autoOpen) {
            if (autoOpen) return;
            if (_.device('smartphone')) return;
            select(id, undefined, undefined, { focus: true, focusPane: true });
        });

        // select virtual node
        tree.on('virtual', select);
        function select(id, item, baton, options) {
            // a11y - avoid this folder to avoid focus drop
            if (id === 'virtual/settings') return;

            var opt = _.extend({
                focus: false,
                focusPane: !!baton,
                refresh: baton && baton.options && baton.options.refresh
            }, options);

            // different selections
            tree.selection.uncheck().preselect(id);
            app.folder.set(id);
            item = tree.selection.byId(id);

            // view may not exists if the user does not have this setting
            var view = item.closest('li').data('view');
            if (!view) return;

            // expand subfolders
            folderUtil.open(view.options.parent);
            // focus tree node
            if (opt.focus) item.focus();

            // show subfolders on default
            if (view.hasSubFolders() && view.options.open !== 'open') view.toggle('open', true);

            // show settings on changed selection or on forced refresh
            previousSelection = currentSelection;
            currentSelection = pool.getModel(id).get('meta');

            if (previousSelection === null || (previousSelection.id !== currentSelection.id) || opt.refresh) {
                showSettings(baton || currentSelection, opt.focusPane);
            }

            left.trigger('select');

        }

        // metrics
        tree.on('virtual', function (id) {
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                // folder tree selection
                metrics.trackEvent({
                    app: 'settings',
                    target: 'folder',
                    type: 'click',
                    action: 'select',
                    // flat
                    detail: id.substr(id.lastIndexOf('/') + 1)
                });
            });
        });

        if (_.device('smartphone')) {
            tree.$container.on('click', '.folder.selectable.selected .folder-label', function () {
                left.trigger('select');
            });

        }

        function addModelsToPool(groupList) {

            var externalList = [];

            function processSubgroup(extPoint, subgroup) {

                subgroup = subgroup + '/' + extPoint.id;
                disableListetSettingsPanes(subgroup);

                var list = _(ext.point(subgroup).list()).map(function (p) {
                    processSubgroup(p, subgroup);
                    return pool.addModel({
                        id: 'virtual/settings/' + p.id,
                        module: 'settings',
                        own_rights: 134225984,
                        title: /*#, dynamic*/gt.pgettext('app', p.title),
                        meta: p
                    });
                });

                if (list.length > 0) {
                    api.virtual.add('virtual/settings/' + extPoint.id, getter);
                    pool.addCollection('virtual/settings/' + extPoint.id, list, { reset: true });
                }
            }

            _.each(groupList, function (val) {

                if (val.subgroup) {
                    mainGroups.push({
                        id: 'virtual/settings/' + val.id,
                        folderOptions: val.folderOptions
                    });
                    disableListetSettingsPanes(val.subgroup);
                    var list = _(ext.point(val.subgroup).list()).map(function (p) {
                        processSubgroup(p, val.subgroup);

                        return pool.addModel({
                            id: 'virtual/settings/' + p.id,
                            module: 'settings',
                            own_rights: 134225984,
                            title: /*#, dynamic*/gt.pgettext('app', p.title),
                            meta: p
                        });
                    });
                    list = _(list).compact();
                    pool.addCollection('virtual/settings/' + val.id, list, { reset: true });
                } else {
                    // this handles all old settings without a settingsgroup
                    externalList.push(pool.addModel({
                        id: 'virtual/settings/' + val.id,
                        module: 'settings',
                        own_rights: 134225984,
                        title: /*#, dynamic*/gt.pgettext('app', val.title),
                        meta: val
                    }).toJSON());
                }
            });

            pool.getCollection('virtual/settings/external').add(externalList);
        }

        // Create extensions for the config jump pages
        _(configJumpSettings.get()).chain().keys().each(function (id) {

            var declaration = configJumpSettings.get(id);
            if (declaration.requires && !capabilities.has(declaration.requires)) return;

            // try to get a translated title
            var title = declaration['title_' + ox.language] || /*#, dynamic*/gt(declaration.title) || '';

            ext.point('io.ox/settings/pane/' + (declaration.group || 'tools')).extend(_.extend({
                id: id,
                ref: 'io.ox/configjump/' + id,
                loadSettingPane: false
            }, declaration, { title: title }));

            ext.point('io.ox/configjump/' + id + '/settings/detail').extend({
                id: 'iframe',
                index: 100,
                draw: function () {
                    var $node = this;
                    $node.css({ height: '100%' });
                    var fillUpURL = $.Deferred();

                    if (declaration.url.indexOf('[token]') > 0) {
                        // Grab token
                        $node.busy();
                        require(['io.ox/core/http'], function (http) {
                            http.GET({
                                module: 'token',
                                params: {
                                    action: 'acquireToken'
                                }
                            }).done(function (resp) {
                                fillUpURL.resolve(declaration.url.replace('[token]', resp.token));
                            }).fail(yell);
                        });
                    } else {
                        fillUpURL.resolve(declaration.url);
                    }

                    fillUpURL.done(function (url) {
                        $node.idle();
                        $node.append($('<iframe>', { src: url, frameborder: 0 }).css({
                            width: '100%',
                            minHeight: '90%'
                        }));
                    });
                }
            });
        });

        require(['io.ox/metrics/main'], function (metrics) {
            if (!metrics.isEnabled()) return;

            var node = app.getWindow().nodes.outer;
            metrics.watch({
                node: node,
                selector: '.io-ox-accounts-settings [data-actionname="mailaccount"]',
                type: 'click'

            }, {
                app: 'mail',
                target: 'settings/account',
                type: 'click',
                action: 'add'
            });
        });

        ext.point('io.ox/settings/pane').extend({
            id: 'general',
            index: 100,
            subgroup: 'io.ox/settings/pane/general'
        });

        ext.point('io.ox/settings/pane/general').extend({
            title: gt('Basic settings'),
            index: 100,
            id: 'io.ox/core'
        });

        // security group

        ext.point('io.ox/settings/pane').extend({
            id: 'security',
            index: 200,
            subgroup: 'io.ox/settings/pane/security'
        });

        ext.point('io.ox/settings/pane/security').extend({
            id: 'security-root',
            title: gt('Security'),
            ref: 'io.ox/settings/security',
            index: 100
        });

        ext.point('io.ox/settings/pane/security/security-root').extend({
            id: 'sessions',
            title: gt('Active clients'),
            ref: 'io.ox/settings/security/sessions',
            index: 100
        });

        var submodules = _(keychainAPI.submodules).filter(function (submodule) {
            return !submodule.canAdd || submodule.canAdd.apply(this);
        });
        // do not show accounts for guest
        // show accounts if user has webmail
        // show accounts if user has submodules which can be added
        if (!capabilities.has('guest') && (capabilities.has('webmail') || submodules.length > 0)) {
            ext.point('io.ox/settings/pane/general').extend({
                title: gt('Accounts'),
                index: 300,
                id: 'io.ox/settings/accounts'
            });
        }

        ext.point('io.ox/settings/pane').extend({
            id: 'tools',
            index: 400,
            subgroup: 'io.ox/settings/pane/tools'
        });

        ext.point('io.ox/settings/pane').extend({
            id: 'external',
            index: 500,
            subgroup: 'io.ox/settings/pane/external'
        });

        // enqueue is probably a bad name, but since it's not exposed …
        // only resolve the last object enqueed
        var enqueue = (function () {
            var active;
            return function (def) {
                if (active) active.cancelled = true;
                active = def;

                return def.then(function () {
                    if (this.cancelled) return $.Deferred().reject();

                    active = null;
                    return $.Deferred().resolve();
                }.bind(active));
            };
        }());
        var showSettings = function (baton, focus) {
            baton = ext.Baton.ensure(baton);
            baton.tree = tree;
            app.get('window').setTitle(gt('%1$s %2$s', gt('Settings'), /*#, dynamic*/gt.pgettext('app', baton.data.title)));

            var data = baton.data,
                settingsPath = data.pane || ((data.ref || data.id) + '/settings/pane'),
                extPointPart = data.pane || ((data.ref || data.id) + '/settings/detail'),
                def = $.Deferred();

            right.empty().busy();

            if (data.loadSettingPane || _.isUndefined(data.loadSettingPane)) {
                def = require([settingsPath]);
            } else {
                def.resolve();
            }
            return enqueue(def).then(function () {
                vsplit.right.attr('aria-label', /*#, dynamic*/gt.pgettext('app', baton.data.title));
                ext.point(extPointPart).invoke('draw', right, baton);
                if (focus) vsplit.right.focus();
                right.idle();
            });
        };

        app.setSettingsPane = function (options) {

            getAllSettingsPanes().done(function (data) {
                addModelsToPool(data);
                if (vsplit.left.find('.folder-tree').length === 0) {
                    vsplit.left.append(tree.render().$el);
                }

                if (options && (options.id || options.folder)) {

                    var id = options.folder || ('virtual/settings/' + options.id),
                        baton = new ext.Baton({ data: pool.getModel(id).get('meta'), options: options || {} });
                    tree.trigger('virtual', id, {}, baton);
                }
                if (!_.device('smartphone')) {
                    if (tree.selection.get() === undefined) tree.selection.uncheck().pick(0);
                }
            });

            return $.when();
        };

        // go!
        commons.addFolderSupport(app, null, 'settings', options.folder || 'virtual/settings/io.ox/core')
            .always(function always() {
                win.show(function () {
                    app.setSettingsPane(options);
                });
            })
            .fail(function fail(result) {
                var errorMsg = (result && result.error) ? result.error + ' ' : '';
                errorMsg += gt('Application may not work as expected until this problem is solved.');
                yell('error', errorMsg);
            });
    });

    return {
        getApp: app.getInstance
    };
});
