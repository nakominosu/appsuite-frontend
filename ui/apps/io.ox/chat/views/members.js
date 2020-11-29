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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/chat/views/members', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/views/avatar',
    'io.ox/chat/data',
    'io.ox/switchboard/presence'
], function (Disposable, AvatarView, data, presence) {

    'use strict';

    return Disposable.extend({

        className: 'members',

        events: {
            'click .remove': 'onRemove'
        },

        initialize: function () {
            this.listenTo(this.collection, 'add remove reset', this.render);
        },

        renderEntry: function (model) {
            if (model.id === data.user.email) return;
            return $('<li>').attr('data-id', model.get('id')).append(
                $('<div class="picture">').append(
                    new AvatarView({ model: model }).render().$el,
                    presence.getPresenceIcon(model.get('email'))
                ),
                $('<div class="center">').append(
                    $('<strong>').text(model.getName()),
                    $('<span>').text(model.get('email'))
                ),
                $('<div class="member-controls">').append(
                    $('<button class="remove">').append($('<i class="fa fa-times" aria-hidden="true">'))
                )
            );
        },

        render: function () {
            this.$el.empty().append(
                $('<ul class="list-unstyled">').append(
                    this.collection.map(this.renderEntry.bind(this))
                )
            );
            return this;
        },

        onRemove: function (e) {
            var target = $(e.currentTarget),
                id = target.closest('li').attr('data-id'),
                model = this.collection.get(id);
            this.collection.remove(model);
        }
    });
});
