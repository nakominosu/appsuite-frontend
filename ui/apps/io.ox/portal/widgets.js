/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/widgets',
       ['io.ox/core/extensions',
       'io.ox/core/manifests',
       'io.ox/core/upsell',
       'io.ox/core/notifications',
       'settings!io.ox/portal',
       'gettext!io.ox/portal'
        ], function (ext, manifests, upsell, notifications, settings, gt) {

	'use strict';

	// use for temporary hacks
	var DEV_PLUGINS = []; // ['plugins/portal/helloworld/register'];

    // application object
    var availablePlugins = _(manifests.manager.pluginsFor('portal')).uniq().concat(DEV_PLUGINS),
        collection = new Backbone.Collection([]);

    collection.comparator = function (a, b) {
        return ext.indexSorter({ index: a.get('index') }, { index: b.get('index') });
    };

    function reduceBool(memo, bool) {
        return memo && bool;
    }

    var api = {

        // for demo/debugging
        addPlugin: function (plugin) {
            availablePlugins = availablePlugins.concat(plugin);
        },

        getAvailablePlugins: function () {
            return _(availablePlugins).uniq();
        },

        getCollection: function () {
            return collection;
        },

        getEnabled: function () {
            return collection.chain().filter(function (model) {
                return !model.has('candidate') && (!model.has('enabled') || model.get('enabled') === true);
            });
        },

        getSettings: function () {

            var prot = {};

            _(settings.get('widgets/protected')).each(function (obj, id) {
                obj.protectedWidget = true;
                prot[id] = obj;
            });

            var allTypes = ext.point('io.ox/portal/widget').pluck('id');

            return _(settings.get('widgets/user', {}))
                .chain()
                .extend(prot)
                // map first since we need the object keys
                .map(function (obj, id) {

                    obj.id = id;
                    obj.type = id.substr(0, id.lastIndexOf('_'));
                    obj.props = obj.props || {};
                    obj.inverse = _.isUndefined(obj.inverse) ? false : obj.inverse;
                    obj.enabled = _.isUndefined(obj.enabled) ? true : obj.enabled;

                    return obj;
                })
                .filter(function (obj) {
                    return _(api.getAvailablePlugins()).contains(obj.plugin) || _(allTypes).contains(obj.type);
                })
                .value();
        },

        loadAllPlugins: function () {
            return require(api.getAvailablePlugins());
        },

        loadUsedPlugins: function () {
            var usedPlugins = collection.pluck('plugin'),
                dependencies = _(api.getAvailablePlugins()).intersection(usedPlugins);
            return require(dependencies).done(function () {
                api.removeDisabled();
            });
        },

        getOptions: function (type) {
            return ext.point('io.ox/portal/widget/' + type + '/settings').options();
        },

        getAllTypes: function () {

            var allTypes = ext.point('io.ox/portal/widget').pluck('id');

            return _.chain(api.getAvailablePlugins().concat(allTypes))
                .map(function (id) {
                    return id.replace(/^plugins\/portal\/(\w+)\/register$/, '$1');
                })
                .uniq()
                .map(function (type) {
                    var options = api.getOptions(type);
                    // inject "requires" for upsell
                    options.requires = api.requires(type);
                    return options;
                })
                .filter(function (obj) {
                    return obj.type !== undefined;
                })
                .value()
                .sort(function (a, b) {
                    return a.title < b.title ? -1 : +1;
                });
        },

        getUsedTypes: function () {
            // mmmh, chain() on collection seems broken
            return _(collection.pluck('type')).uniq().sort();
        },

        containsType: function (type) {
            return _(this.getUsedTypes()).contains(type);
        },

        getColors: function () {
            return 'black red orange lightgreen green lightblue blue purple pink gray'.split(' ');
        },

        getTitle: function (data, fallback) {
            return data.title || (data.props ? (data.props.description || data.props.title) : '') || fallback || '';
        },

        getPluginByType: function (type) {
            // look for type
            var prop = ext.point('io.ox/portal/widget/' + type).prop('type');
            return 'plugins/portal/' + (prop || type) + '/register';
        },

        add: function (type, options) {

            // find free id
            var widgets = _(settings.get('widgets/user', {})).extend(settings.get('widgets/protected', {})),
                widget, i = 0, id = type + '_0',
                colors = api.getColors();

            options = _.extend({
                color: colors[_.random(colors.length - 1)],
                enabled: true,
                inverse: false,
                plugin: type,
                props: {}
            }, options || {});

            while (id in widgets) {
                id = type + '_' + (++i);
            }

            widget = {
                color: options.color,
                enabled: options.enabled,
                inverse: options.inverse,
                id: id,
                index: 0, // otherwise not visible
                plugin: this.getPluginByType(options.plugin),
                props: options.props,
                type: type
            };

            settings.set('widgets/user/' + id, widget).save();

            collection.unshift(widget);
        },

        remove: function (model) {
            collection.remove(model);
        },

        removeDisabled: function () {
            collection.remove(
                collection.filter(function (model) {
                    return ext.point('io.ox/portal/widget/' + model.get('type'))
                        .invoke('isEnabled').reduce(reduceBool, true).value() === false;
                })
            );
        },

        toJSON: function () {
            // get latest values
            var widgets = {};
            collection.each(function (model) {
                if (model.get('protectedWidget')) {
                    return;
                }
                var id = model.get('id');
                widgets[id] = model.toJSON();
                delete widgets[id].baton;
            });
            return widgets;
        },

        update: function (obj) {
            collection.each(function (model) {
                var id = model.get('id');
                if (id in obj) {
                    model.set(obj[id], { silent: true, validate: true });
                }
            });
        },

        /**
         * Save a list of widgets into the database. The parameter
         * @param widgetList must be a jQuery UI sortable object with its
         * children sorted in the order that should be saved.
         *
         * @param widgetList - the sortable list of widgets
         * @return - a deffered object with the save request
         */
        save: function (widgetList) {
            var obj = this.toJSON(), old_state = obj, self = this;

            // update all indexes
            widgetList.children().each(function (index) {
                var node = $(this), id = node.attr('data-widget-id');
                if (id in obj) {
                    obj[id].index = index;
                }
            });
            this.update(obj);
            collection.trigger('sort');

            return settings.set('widgets/user', this).save().then(
                function () {
                    notifications.yell('success', gt("Settings saved."));
                },
                function () {
                    //reset old state
                    self.update(old_state);
                    collection.trigger('sort');
                    widgetList.sortable('cancel');
                    notifications.yell('error', gt("Could not save settings."));
                }
            );
        },

        requires: function (type) {
            var plugin = this.getPluginByType(type);
            return manifests.manager.getRequirements(plugin);
        },

        // convenience function for upsell
        visible: function (type) {
            var requires = this.requires(type);
            return upsell.has(requires);
        },

        // get model by widget id, e.g. mail_0
        getModel: function (id) {
            return collection.get(id);
        },

        // open settings by widget id
        // returns true if edit dialog can be opened, false otherwise
        edit: function (id) {
            var model = this.getModel(id), options;
            if (model) {
                options = this.getOptions(model.get('type'));
                if (_.isFunction(options.edit)) {
                    options.edit(model);
                    return true;
                }
            }
            return false;
        }
    };

    collection.reset(
        // fix "candidate=true" bug (maybe just a development issue)
        _(api.getSettings()).map(function (obj) {
            delete obj.candidate;
            return obj;
        })
    );

    collection.on('change', function () {
        settings.set('widgets/user', api.toJSON()).save()
        // don’t handle positive case here, since this is called quite often
        // TODO: make sure, this is only called as much as needed, also _.throttle handles this (see settings.save)
        .fail(function () {
            notifications.yell('error', gt("Could not save settings."));
        });
    });

    collection.on('remove', function (model) {
        if (model.get("protectedWidget")) {
            // Don't you dare!
            return;
        }
        settings.remove('widgets/user/' + model.get('id')).save();
    });

    return api;
});
