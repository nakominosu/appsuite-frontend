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

define('io.ox/office/editor/format/imagestyles',
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dom',
     'io.ox/office/editor/format/stylesheets'
    ], function (Utils, DOM, StyleSheets) {

    'use strict';

    var // definitions for image attributes
        definitions = {

            /**
             * Width of the image, as number in 1/100 of millimeters.
             */
            width: {
                def: 0,
                set: function (element, width) {
                    element.width(Utils.convertHmmToLength(width, 'px', 0));
                }
            },

            /**
             * Height of the image, as number in 1/100 of millimeters.
             */
            height: {
                def: 0,
                set: function (element, height) {
                    element.height(Utils.convertHmmToLength(height, 'px', 0));
                }
            },

            /**
             * Margin from top border of the image to text contents, in 1/100
             * of millimeters.
             */
            margint: { def: 0 },

            /**
             * Margin from bottom border of the image to text contents, in
             * 1/100 of millimeters.
             */
            marginb: { def: 0 },

            /**
             * Margin from left border of the image to text contents, in 1/100
             * of millimeters.
             */
            marginl: { def: 0 },

            /**
             * Margin from right border of the image to text contents, in 1/100
             * of millimeters.
             */
            marginr: { def: 0 },

            cropl: { def: 0 },

            cropt: { def: 0 },

            cropr: { def: 0 },

            cropb: { def: 0 },

            /**
             * If set to true, the image is rendered as inline element ('as
             * character'), otherwise it is anchored relative to another
             * element (page, paragraph, table cell, ...).
             */
            inline: { def: true },

            anchorhbase: { def: 'margin' },

            anchorhalign: { def: 'left' },

            anchorhoffset: { def: 0 },

            anchorvbase: { def: 'margin' },

            anchorvalign: { def: 'top' },

            anchorvoffset: { def: 0 },

            /**
             * Specifies how text floats around the image.
             * - 'none': Text does not float around the image.
             * - 'square': Text floats around the bounding box of the image.
             * - 'tight': Text aligns to the left/right outline of the image.
             * - 'through': Text aligns to the entire outline of the image.
             * - 'topandbottom': Text floats above and below the image only.
             */
            textwrapmode: { def: 'none' },

            /**
             * Specifies on which side text floats around the image. Effective
             * only if the attribute 'textwrapmode' is either 'square',
             * 'tight', or 'through'.
             * - 'bothsides': Text floats at the left and right side.
             * - 'left': Text floats at the left side of the image only.
             * - 'right': Text floats at the right side of the image only.
             * - 'largest': Text floats at the larger side of the image only.
             */
            textwrapside: { def: 'bothsides' }
        },

        // predefined image attributes for image float modes used in GUI
        FLOAT_MODE_ATTRIBUTES = {
            inline:       { inline: true },
            leftFloated:  { inline: false, anchorhbase: 'column', anchorhalign: 'left', textwrapmode: 'square', textwrapside: 'right' },
            rightFloated: { inline: false, anchorhbase: 'column', anchorhalign: 'right', textwrapmode: 'square', textwrapside: 'left' },
            noneFloated:  { inline: false, anchorhbase: 'column', anchorhalign: 'center', textwrapmode: 'none' }
        },

        // values for the 'textwrapmode' attribute allowing to wrap the text around the image
        WRAPPED_TEXT_VALUES = _(['square', 'tight', 'through']);

    // private global functions ===============================================

    /**
     * Returns whether the passed 'textwrapmode' attribute allows to wrap the
     * text around the image.
     */
    function isTextWrapped(textWrapMode) {
        return WRAPPED_TEXT_VALUES.contains(textWrapMode);
    }

    /**
     * Calculates the original image size from the visible size and the cropping values.
     *
     * @param Number visWidth
     * The width of the visible area of the image (1/100mm)
     *
     * @param Number visHeight
     * The height of the visible area of the image (1/100mm)
     *
     * @param Number cropl
     * The left cropping in percent (0-100)
     *
     * @param Number cropt
     * The top cropping in percent (0-100)
     *
     * @param Number cropr
     * The right cropping in percent (0-100)
     *
     * @param Number cropb
     * The bottom cropping in percent (0-100)
     *
     * @return Object
     * The orgWidth and orgHeight of the image (1/100mm)
     */
    function calcOriginalImageSizeFromCropping(visWidth, visHeight, cropl, cropt, cropr, cropb) {
        var orgWidth, orgHeight;

        orgWidth = visWidth * (1 / ((100 - (cropl + cropr)) / 100));
        orgHeight = visHeight * (1 / ((100 - (cropt + cropb)) / 100));

        return { width : orgWidth, height: orgHeight };
    }

    /**
     * Calculates the left, top corner for the cropped image
     *
     * @param {Number} orgWidth
     * The original image width of the image (1/100mm)
     *
     * @param {Number} orgHeight
     * The original image height of the image (1/100mm)
     *
     * @param {Number} cropl
     * The left cropping in percent (0-100)
     *
     * @param {Number} cropt
     * The top cropping in percent (0-100)
     *
     * @return {Object}
     * The left, top position of the original image in (1/100mm)
     */
    function calcLeftTopForOriginalImage(orgWidth, orgHeight, cropl, cropt) {
        var left, top;

        left = Math.round((orgWidth * cropl) / 100);
        top = Math.round((orgHeight * cropt) / 100);

        return { left: left, top: top };
    }

    /**
     * Will be called for every image element whose attributes have been
     * changed. Repositions and reformats the image according to the passed
     * attributes.
     *
     * @param {jQuery} div
     *  The <div> element containing an image whose image attributes have been
     *  changed, as jQuery object.
     *
     * @param {Object} attributes
     *  A map of all attributes (name/value pairs), containing the effective
     *  attribute values merged from style sheets and explicit attributes.
     */
    function updateImageFormatting(div, attributes) {

        var // the paragraph element containing the image div
            paragraph = div.parent(),
            // total width of the paragraph, in 1/100 mm
            paraWidth = Utils.convertLengthToHmm(paragraph.width(), 'px'),
            // preceding div element used for vertical offset
            verticalOffsetNode = div.prev(DOM.OFFSET_NODE_SELECTOR),
            // first text node in paragraph
            firstTextNode = null,
            // current object width, in 1/100 mm
            objectWidth = Utils.convertLengthToHmm(div.width(), 'px'),
            // current object height, in 1/100 mm
            objectHeight = Utils.convertLengthToHmm(div.height(), 'px'),
            // offset from top/left/right margin of paragraph element, in 1/100 mm
            topOffset = 0, leftOffset = 0, rightOffset = 0,
            // margins to be applied at the image
            topMargin = 0, bottomMargin = 0, leftMargin = 0, rightMargin = 0,
            // text wrapping side (left/right/none)
            wrapMode = 'none';

        // cropping

        if ((attributes.cropl !== 0) || (attributes.cropt !== 0) ||
            (attributes.cropr !== 0) || (attributes.cropb !== 0)) {
            // TODO: validation
            var orgSize = calcOriginalImageSizeFromCropping(objectWidth, objectHeight,
                    attributes.cropl, attributes.cropt, attributes.cropr, attributes.cropb);
            var leftTop = calcLeftTopForOriginalImage(orgSize.width, orgSize.height,
                    attributes.cropl, attributes.cropt);

            div.find('img').css({
                left: Utils.convertHmmToCssLength(-leftTop.left, 'px', 0),
                top: Utils.convertHmmToCssLength(-leftTop.top, 'px', 0),
                width: Utils.convertHmmToCssLength(orgSize.width, 'px', 0),
                height: Utils.convertHmmToCssLength(orgSize.height, 'px', 0)
            });
        } else {
            div.find('img').css({
                left: 0,
                top: 0,
                width: div.width() + 'px',
                height: div.height() + 'px'
            });
        }

        // position

        if (attributes.inline) {

            // from floating mode to inline mode
            if (div.hasClass('float')) {

                // remove leading div used for positioning
                verticalOffsetNode.remove();

                // create empty text span before first text span
                firstTextNode = Utils.findFirstTextNode(paragraph);
                DOM.splitTextNode(firstTextNode, 0);

                // remove floating classes, move image behind floated images
                div.removeClass('float left right').insertBefore(firstTextNode.parentNode);
            }

            // TODO: Word uses fixed predefined margins in inline mode, we too?
            div.addClass('inline').css('margin', '0 1mm');
            // ignore other attributes in inline mode

            // TODO: positioning code still relies on the 'mode' data attribute
            div.data('mode', 'inline');

        } else {

            // from inline mode to floating mode
            if (div.hasClass('inline')) {

                // first text node in paragraph
                firstTextNode = Utils.findFirstTextNode(paragraph);

                // move image before the first text node
                div.removeClass('inline').insertBefore(firstTextNode.parentNode);
            }

            // calculate top offset (only if image is anchored to paragraph)
            if (attributes.anchorvbase === 'paragraph') {
                if (attributes.anchorvalign === 'offset') {
                    topOffset = Math.max(attributes.anchorvoffset, 0);
                } else {
                    // TODO: automatic alignment (top/bottom/center/...)
                    topOffset = 0;
                }
            }

            // calculate top/bottom image margins
            topMargin = Utils.minMax(attributes.margint, 0, topOffset);
            bottomMargin = Math.max(attributes.marginb, 0);

            // add or remove leading div used for positioning
            // TODO: support for multiple images (also overlapping) per side
            topOffset -= topMargin;
            if (topOffset < 700) {
                // offset less than 7mm: expand top margin to top of paragraph,
                // otherwise the first text line overwrites the image
                topMargin += topOffset;
                // remove offset node
                verticalOffsetNode.remove();
            } else {
                // create offset node if not existing yet
                if (verticalOffsetNode.length === 0) {
                    verticalOffsetNode = $('<div>', { contenteditable: false }).addClass('offset').width(1).insertBefore(div);
                }
                // set height of the offset node
                verticalOffsetNode.height(Utils.convertHmmToLength(topOffset, 'px', 0));
            }

            // calculate left/right offset (only if image is anchored to column)
            if (attributes.anchorhbase === 'column') {
                switch (attributes.anchorhalign) {
                case 'center':
                    leftOffset = (paraWidth - objectWidth) / 2;
                    break;
                case 'right':
                    leftOffset = paraWidth - objectWidth;
                    break;
                case 'offset':
                    leftOffset = attributes.anchorhoffset;
                    break;
                default:
                    leftOffset = 0;
                }
            } else {
                // TODO: other anchor bases (page/character/margins/...)
                leftOffset = 0;
            }
            rightOffset = paraWidth - leftOffset - objectWidth;

            // determine text wrapping side
            if (isTextWrapped(attributes.textwrapmode)) {
                switch (attributes.textwrapside) {
                case 'left':
                    wrapMode = 'left';
                    break;
                case 'right':
                    wrapMode = 'right';
                    break;
                case 'bothsides':
                case 'largest':
                    // no support for 'wrap both sides' in CSS, default to 'largest'
                    wrapMode = (leftOffset > rightOffset) ? 'left' : 'right';
                    break;
                default:
                    Utils.warn('updateImageFormatting(): invalid text wrap side: ' + attributes.textwrapside);
                    wrapMode = 'none';
                }
            } else {
                // text does not float beside image
                wrapMode = 'none';
            }

            // calculate left/right image margins
            switch (wrapMode) {
            case 'left':
                // image floats at right paragraph margin
                rightMargin = rightOffset;
                leftMargin = Math.max(attributes.marginl, 0);
                // if there is less than 6mm space available for text, occupy all space (no wrapping)
                if (leftOffset - leftMargin < 600) { leftMargin = Math.max(leftOffset, 0); }
                // TODO: positioning code still relies on the 'mode' data attribute
                div.data('mode', 'rightFloated');
                break;
            case 'right':
                // image floats at left paragraph margin
                leftMargin = leftOffset;
                rightMargin = Math.max(attributes.marginr, 0);
                // if there is less than 6mm space available for text, occupy all space (no wrapping)
                if (rightOffset - rightMargin < 600) { rightMargin = Math.max(rightOffset, 0); }
                // TODO: positioning code still relies on the 'mode' data attribute
                div.data('mode', 'leftFloated');
                break;
            default:
                // no wrapping: will be modeled by left-floated with large CSS margins
                wrapMode = 'right';
                leftMargin = leftOffset;
                rightMargin = Math.max(rightOffset, 0);
                // TODO: positioning code still relies on the 'mode' data attribute
                div.data('mode', 'noneFloated');
            }

            // set floating mode to image and positioning div
            div.add(verticalOffsetNode)
                .removeClass('left right')
                .addClass('float ' + ((wrapMode === 'left') ? 'right' : 'left'));

            // apply CSS formatting to image div element
            div.css({
                marginTop: Utils.convertHmmToCssLength(topMargin, 'px', 0),
                marginBottom: Utils.convertHmmToCssLength(bottomMargin, 'px', 0),
                marginLeft: Utils.convertHmmToCssLength(leftMargin, 'px', 0),
                marginRight: Utils.convertHmmToCssLength(rightMargin, 'px', 0)
            });
        }
    }

    // private global functions ===============================================

    /**
     * A jQuery selector function that returns whether the DOM node bound to
     * the 'this' symbol is an element that can receive image formatting
     * attributes.
     */
    function imageNodeSelector() {
        return DOM.isImageNode(this);
    }

    // class ImageStyles ======================================================

    /**
     * Contains the style sheets for image formatting attributes. The CSS
     * formatting will be read from and written to <img> elements.
     *
     * @constructor
     *
     * @extends StyleSheets
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing all elements formatted by the style sheets of
     *  this container. If this object is a jQuery collection, uses the first
     *  node it contains.
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function ImageStyles(rootNode, documentStyles) {

        // base constructor ---------------------------------------------------

        StyleSheets.call(this, documentStyles, 'image', imageNodeSelector, definitions, {
            updateHandler: updateImageFormatting
        });

        // methods ------------------------------------------------------------

        /**
         * Iterates over all image elements covered by the passed DOM ranges
         * for read-only access and calls the passed iterator function.
         */
        this.iterateReadOnly = function (ranges, iterator, context) {
            // DOM.iterateAncestorNodesInRanges() passes the current element to
            // the passed iterator function exactly as expected
            return DOM.iterateAncestorNodesInRanges(ranges, rootNode, DOM.IMAGE_NODE_SELECTOR, iterator, context);
        };

        /**
         * Iterates over all image elements covered by the passed DOM ranges
         * for read/write access and calls the passed iterator function.
         */
        this.iterateReadWrite = this.iterateReadOnly;

    } // class ImageStyles

    // static methods ---------------------------------------------------------

    /**
     * Returns the images attributes that are needed to represent the passed
     * GUI image float mode.
     *
     * @param {String} floatMode
     *  The GUI image float mode.
     *
     * @returns {Object}
     *  A map with image attributes, as name/value pairs.
     */
    ImageStyles.getAttributesFromFloatMode = function (floatMode) {
        return (floatMode in FLOAT_MODE_ATTRIBUTES) ? FLOAT_MODE_ATTRIBUTES[floatMode] : {};
    };

    /**
     * Returns the images attributes that are needed to represent the passed
     * image float mode as used in the GUI.
     *
     * @param {String} floatMode
     *  The GUI image float mode.
     *
     * @returns {Object}
     *  A map with image attributes, as name/value pairs.
     */
    ImageStyles.getFloatModeFromAttributes = function (attributes) {

        // inline mode overrules floating attributes
        if (attributes.inline) {
            return 'inline';
        }

        // floating mode depends on text wrapping side
        if (isTextWrapped(attributes.textwrapmode)) {
            switch (attributes.textwrapside) {
            case 'left':
                return 'leftFloated';
            case 'right':
                return 'rightFloated';
            }
        }
        return 'noneFloated';
    };

    // exports ================================================================

    // derive this class from class StyleSheets
    return StyleSheets.extend({ constructor: ImageStyles });

});
