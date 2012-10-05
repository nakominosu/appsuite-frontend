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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/editor/controller',
    ['io.ox/office/tk/controller',
     'io.ox/office/editor/image'
    ], function (BaseController, Image) {

    'use strict';

    // class Controller =======================================================

    function Controller(app) {

        var // self reference
            self = this,

            // the editor of the passed application
            editor = app.getEditor(),

            // all the little controller items
            items = {

                'chain/editable': {
                    enable: function () { return !editor.isReadonlyMode(); }
                },
                'chain/editable/text': {
                    enable: function (enabled) { return enabled && editor.isTextSelected(); }
                },

                // document file

                'file/download': {
                    set: function () { app.download(); }
                },
                'file/print': {
                    set: function () { app.print(); }
                },
                'file/export': {
                    set: function () { app.save(); }
                },
                'file/flush': {
                    set: function () { app.flush(); }
                },
                'file/rename': {
                    chain: 'chain/editable',
                    get: function () {
                        var fileDesc = app.getFileDescriptor();
                        return (fileDesc && fileDesc.filename) ? fileDesc.filename : null;
                    },
                    set: function (fileName) { app.rename(fileName); }
                },

                // document contents

                'document/undo': {
                    chain: 'chain/editable',
                    enable: function (enabled) { return enabled && editor.hasUndo(); },
                    set: function () { editor.undo(); }
                },
                'document/redo': {
                    chain: 'chain/editable',
                    enable: function (enabled) { return enabled && editor.hasRedo(); },
                    set: function () { editor.redo(); }
                },
                'document/quicksearch': {
                    get: function () { return editor.hasHighlighting(); },
                    set: function (query) { editor.quickSearch(query); },
                    done: $.noop // do not focus editor
                },

                // paragraphs

                'chain/format/paragraph': {
                    chain: 'chain/editable/text',
                    get: function () { return editor.getAttributes('paragraph'); }
                },
                'format/paragraph/stylesheet': {
                    chain: 'chain/format/paragraph',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('paragraph', 'style', styleId); }
                },
                'format/paragraph/alignment': {
                    chain: 'chain/format/paragraph',
                    get: function (attributes) { return attributes.alignment; },
                    set: function (alignment) { editor.setAttribute('paragraph', 'alignment', alignment); }
                },
                'format/paragraph/lineheight': {
                    chain: 'chain/format/paragraph',
                    get: function (attributes) { return attributes.lineheight; },
                    set: function (lineHeight) { editor.setAttribute('paragraph', 'lineheight', lineHeight); }
                },

                // characters

                'chain/format/character': {
                    chain: 'chain/editable/text',
                    get: function () { return editor.getAttributes('character'); }
                },
                'format/character/stylesheet': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('character', 'style', styleId); }
                },
                'format/character/font/family': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.fontname; },
                    set: function (fontName) { editor.setAttribute('character', 'fontname', fontName); }
                },
                'format/character/font/height': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.fontsize; },
                    set: function (fontSize) { editor.setAttribute('character', 'fontsize', fontSize); }
                },
                'format/character/font/bold': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.bold; },
                    set: function (state) { editor.setAttribute('character', 'bold', state); }
                },
                'format/character/font/italic': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.italic; },
                    set: function (state) { editor.setAttribute('character', 'italic', state); }
                },
                'format/character/font/underline': {
                    chain: 'chain/format/character',
                    get: function (attributes) { return attributes.underline; },
                    set: function (state) { editor.setAttribute('character', 'underline', state); }
                },

                // tables

                'chain/table': {
                    chain: 'chain/editable/text',
                    enable: function (enabled) { return enabled && editor.isPositionInTable(); }
                },
                'table/insert': {
                    chain: 'chain/editable/text',
                    set: function (size) { editor.insertTable(size); }
                },
                'table/insert/row': {
                    chain: 'chain/table',
                    set: function () { editor.insertRow(); }
                },
                'table/insert/column': {
                    chain: 'chain/table',
                    set: function () { editor.insertColumn(); }
                },
                'table/delete/row': {
                    chain: 'chain/table',
                    set: function () { editor.deleteRows(); }
                },
                'table/delete/column': {
                    chain: 'chain/table',
                    set: function () { editor.deleteColumns(); }
                },

                // images

                'chain/image': {
                    chain: 'chain/editable',
                    enable: function (enabled) { return enabled && editor.isImageSelected(); }
                },
                'chain/format/image': {
                    chain: 'chain/image',
                    get: function () { return editor.getAttributes('image'); }
                },
                'image/insert/file': {
                    chain: 'chain/editable/text',
                    set: function () { Image.insertFileDialog(app); }
                },
                'image/insert/url': {
                    chain: 'chain/editable/text',
                    set: function () { Image.insertURLDialog(app); }
                },
                'image/delete': {
                    chain: 'chain/image',
                    enable: function (enabled) { return enabled && (editor.getImageFloatMode() !== 'inline'); },
                    set: function () { editor.deleteSelected(); }
                },
                'format/image/floatmode': {
                    chain: 'chain/image',
                    get: function () { return editor.getImageFloatMode(); },
                    set: function (floatMode) { editor.setImageFloatMode(floatMode); }
                },

                // debug

                'debug/toggle': {
                    get: function () { return app.isDebugMode(); },
                    set: function (state) { app.setDebugMode(state); }
                },
                'debug/sync': {
                    get: function () { return app.isSynchronizedMode(); },
                    set: function (state) { app.setSynchronizedMode(state); }
                },
                'debug/readonly': {
                    get: function () { return editor.isReadonlyMode(); },
                    set: function (state) { self.setReadonlyMode(state); }
                }
            };

        // private methods ----------------------------------------------------

        /**
         * The controller done handler that will be executed after an item
         * setter function (of items without own done handler), and after a
         * view component triggers a 'cancel' event.
         */
        function doneHandler() {
            editor.grabFocus();
        }

        // base constructor ---------------------------------------------------

        BaseController.call(this, items, doneHandler);

        // methods ------------------------------------------------------------

        /**
         * Changes the read-only mode at the editor and updates all controller
         * items.
         */
        this.setReadonlyMode = function (state) {
            editor.setReadonlyMode(state);
            this.update();
        };

        // initialization -----------------------------------------------------

        // update GUI after operations or changed selection
        editor.on('operation selection', function () { self.update(); });

    } // class Controller

    // exports ================================================================

    // derive this class from class BaseController
    return BaseController.extend({ constructor: Controller });

});
