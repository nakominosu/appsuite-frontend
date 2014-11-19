/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/core/viewer/views/mainview', [
    'io.ox/core/viewer/views/toolbarview',
    'io.ox/core/viewer/views/displayerview',
    'io.ox/core/viewer/views/sidebarview',
    'less!io.ox/core/viewer/style'
], function (ToolbarView, DisplayerView, SidebarView) {

    'use strict';

    /**
     * The MainViewer is the base view for the OX Viewer.
     * This view imports, manage and  renders these children views:
     * - ToolbarView
     * - DisplayerView
     * - SidebarView
     */
    var MainView = Backbone.View.extend({

        className: 'io-ox-viewer abs',

        events: {
            'click': 'onClose'
        },

        onClose: function () {
            this.remove();
        },

        initialize: function () {
            //console.log('MainView.initialize()');
        },

        render: function () {
            return this;
        }
    });
    console.log(ToolbarView, DisplayerView, SidebarView);
    return MainView;
});
