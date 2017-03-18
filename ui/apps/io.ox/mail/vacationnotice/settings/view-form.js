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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/vacationnotice/settings/view-form', [
    'io.ox/mail/vacationnotice/settings/model',
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/datepicker',
    'gettext!io.ox/mail',
    'less!io.ox/mail/vacationnotice/settings/style'
], function (model, views, ext, mini, DatePicker, gt) {

    'use strict';

    function createVacationEdit(ref, multiValues, activateTimeframe, config) {

        var point = views.point(ref + '/edit/view'),
            VacationEditView = point.createView({
                tagName: 'div',
                className: 'edit-vacation',
                render: function () {
                    var baton = ext.Baton({ model: this.model, view: this, multiValues: multiValues });
                    ext.point(ref + '/edit/view').invoke('draw', this.$el.empty(), baton);
                    return this;

                },
            }),
            hasCurrentDate = _.findIndex(config.tests, function (obj) { return obj.test === 'currentdate'; }) !== -1;

        ext.point(ref + '/edit/view').extend({
            index: 50,
            id: 'headline',
            draw: function () {
                this.append($('<div>').append(
                    $('<h1>').text(model.fields.headline)
                ));
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 75,
            id: ref + '/edit/view/active',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-group activate').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(model.fields.active).prepend(
                                new mini.CheckboxView({ name: 'active', model: baton.model }).render().$el
                            )
                        )
                    )
                );
            }
        });

        if (hasCurrentDate) {

            ext.point(ref + '/edit/view').extend({
                index: 100,
                id: ref + '/edit/view/timeframecheckbox',
                draw: function (baton) {
                    var checkboxView = new mini.CheckboxView({ name: 'activateTimeFrame', model: baton.model });

                    // see bug 45187, ignore change events triggerd by the initial datepicker setup
                    this.on('change', function (e) {
                        if (e.target.disabled) e.stopPropagation();
                    });

                    baton.model.off('change:' + checkboxView.name, null, ext.point(ref + '/edit/view'));
                    baton.model.on('change:' + checkboxView.name, function (model, checked) {
                        $('.dateFrom').find('.form-control').attr('disabled', !checked);
                        $('.dateUntil').find('.form-control').attr('disabled', !checked);
                    }, ext.point(ref + '/edit/view'));

                    this.append(
                        $('<fieldset>').append(
                            $('<div>').addClass('checkbox').append(
                                $('<label>').addClass('control-label').append(
                                    new mini.CheckboxView({ name: 'activateTimeFrame', model: baton.model }).render().$el,
                                    $.txt(model.fields.activateTimeFrame)
                                )
                            )
                        )
                    );
                }
            });

            ext.point(ref + '/edit/view').extend({
                index: 125,
                id: ref + '/edit/view/start_date',
                draw: function (baton) {
                    var dateView = new DatePicker({
                        model: baton.model,
                        className: 'col-sm-6 dateFrom',
                        display: 'DATE',
                        attribute: 'dateFrom',
                        label: model.fields.dateFrom
                    });

                    this.append(dateView.render().$el);
                    dateView.$el.find('legend').removeClass('simple');

                    if (!baton.model.get('activateTimeFrame')) {
                        dateView.$el.find('.form-control').attr('disabled', true);
                    }
                }
            });

            ext.point(ref + '/edit/view').extend({
                index: 150,
                id: ref + '/edit/view/dates',
                draw: function (baton) {
                    var dateView = new DatePicker({
                        model: baton.model,
                        className: 'col-sm-6 dateUntil',
                        display: 'DATE',
                        attribute: 'dateUntil',
                        label: model.fields.dateUntil
                    });

                    this.append(dateView.render().$el);
                    dateView.$el.find('legend').removeClass('simple');

                    if (!baton.model.get('activateTimeFrame')) {
                        dateView.$el.find('.form-control').attr('disabled', true);
                    }
                }
            });

        }


        ext.point(ref + '/edit/view').extend({
            index: 175,
            id: ref + '/edit/view/subject',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-group').append(
                        $('<label for="subject">').append(model.fields.subject),
                        new mini.InputView({ name: 'subject', model: baton.model, className: 'form-control', id: 'subject' }).render().$el
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 200,
            id: ref + '/edit/view/mailtext',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-group').append(
                        $('<label for="text">').text(model.fields.text),
                        new mini.TextView({ name: 'text', model: baton.model, id: 'text', rows: '12' }).render().$el
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 250,
            id: ref + '/edit/view/days',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-group').append(
                        $('<div class="row">').append(
                            $('<label>').attr({ 'for': 'days' }).addClass('control-label col-md-8').text(model.fields.days),
                            $('<div>').addClass('col-md-offset-2 col-md-2').append(
                                new mini.SelectView({ list: baton.multiValues.days, name: 'days', model: baton.model, id: 'days', className: 'form-control' }).render().$el
                            )
                        )
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 250,
            id: ref + '/edit/view/sender',
            draw: function (baton) {
                var SelectView = mini.SelectView.extend({
                    onChange: function () {
                        var valuePosition = _.findIndex(baton.multiValues.from, { value: this.$el.val() });
                        this.model.set(this.name, baton.multiValues.fromArrays[valuePosition]);
                    },
                    update: function () {
                        var valuePosition,
                            modelValue = this.model.get(this.name);
                        if (_.isArray(modelValue)) {
                            this.$el.val(baton.multiValues.from[_.findIndex(baton.multiValues.fromArrays, modelValue)].value);
                        } else {
                            valuePosition = _.findIndex(baton.multiValues.from, { value: modelValue });
                            if (valuePosition === -1) valuePosition = _.findIndex(baton.multiValues.from, { label: modelValue });
                            this.$el.val(baton.multiValues.from[valuePosition].value);
                        }
                    }
                });

                this.append(
                    $('<div>').addClass('form-group').append(
                        $('<div class="row">').append(
                            $('<label class="col-sm-2">').attr({ 'for': 'days' }).text(model.fields.sendFrom),
                            $('<div class="col-sm-6">').append(
                                new SelectView({ list: baton.multiValues.from, name: 'from', model: baton.model, id: 'from', className: 'form-control' }).render().$el
                            )
                        )
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 300,
            id: ref + '/edit/view/addresses',
            draw: function (baton) {
                var checkboxes = [],
                    primaryMail = baton.multiValues.aliases[0],
                    actionlink = $('<a href="#" role="button" data-action="selectall">'),
                    self = this,
                    all;

                // set default
                baton.model.set('selectall', false);

                baton.model.on('change:selectall', function (model, value) {
                    actionlink.text(value ? gt('unselect all') : gt('select all'));
                    self.trigger('change');
                });

                // skip primary mail since this is default
                baton.multiValues.aliases.shift();

                // check if all aliases are set
                _.each(baton.multiValues.aliases, function (alias) {
                    if (baton.model.has(alias)) all = true;
                });

                baton.model.set('selectall', all);

                _(baton.multiValues.aliases).each(function (alias) {
                    checkboxes.push(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').addClass('control-label blue').append(
                                new mini.CheckboxView({ name: alias, model: baton.model }).render().$el,
                                $.txt(alias)
                            )
                        )
                    );
                });

                this.append(
                    $('<fieldset>').append(
                        $('<legend>').addClass('sectiontitle').append(
                            $('<h2>').append(
                                gt('The Notice is sent out for messages received by %1$s. You may choose to send it out for other recipient addresses too:', primaryMail)
                            )
                        ),
                        actionlink
                        .on('click', function (e) {
                            e.preventDefault();
                            if (!baton.model.get('selectall')) {
                                _.each(baton.multiValues.aliases, function (alias) {
                                    baton.model.set(alias, true);
                                });
                                baton.model.set('selectall', true);
                            } else {
                                _.each(baton.multiValues.aliases, function (alias) {
                                    baton.model.unset(alias);
                                });
                                baton.model.set('selectall', false);
                            }

                        }),
                        checkboxes
                    )
                );
            }
        });

        return VacationEditView;
    }

    return {
        protectedMethods: {
            createVacationEdit: createVacationEdit
        }
    };

});
