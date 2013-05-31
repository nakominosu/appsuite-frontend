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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define("io.ox/mail/write/view-main",
    ["io.ox/core/extensions",
     "io.ox/core/extPatterns/links",
     "io.ox/mail/actions",
     'io.ox/core/tk/view',
     'io.ox/core/tk/model',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/mail/util',
     'io.ox/preview/main',
     'io.ox/core/tk/dialogs',
     'io.ox/core/tk/autocomplete',
     'io.ox/core/api/autocomplete',
     'io.ox/core/api/account',
     'io.ox/core/api/snippets',
     'io.ox/core/strings',
     'io.ox/core/config',
     'settings!io.ox/mail',
     'gettext!io.ox/mail'
    ], function (ext, links, actions, View, Model, contactsAPI, contactsUtil, mailUtil, pre, dialogs, autocomplete, AutocompleteAPI, accountAPI, snippetAPI, strings, config, settings, gt) {

    'use strict';

    // extension points

    var POINT = 'io.ox/mail/write';

    ext.point(POINT + '/toolbar').extend(new links.Button({
        id: 'send',
        index: 100,
        label: gt('Send'),
        cssClasses: 'btn btn-primary',
        ref: POINT + '/actions/send',
        tabIndex: '6'
    }));

    ext.point(POINT + '/toolbar').extend(new links.Button({
        id: 'draft',
        index: 200,
        label: gt('Save'), // is "Save as draft" but let's keep it short for small devices
        cssClasses: 'btn',
        ref: POINT + '/actions/draft',
        tabIndex: '6'
    }));

    ext.point(POINT + '/toolbar').extend(new links.Button({
        id: 'discard',
        index: 1000,
        label: gt('Discard'),
        cssClasses: 'btn',
        ref: POINT + '/actions/discard',
        tabIndex: '6'
    }));

    var contactPictureOptions = { width: 42, height: 42, scaleType: 'contain' };

    var autocompleteAPI = new AutocompleteAPI({ id: 'mailwrite', contacts: true, msisdn: true });

    var view = View.extend({

        initialize: function () {
            var self = this;
            this.sections = {};
        },

        focusSection: function (id) {
            this.sections[id].find('input[type!=hidden]').eq(0).focus();
        },

        createSection: function (id, label, show, collapsable) {

            if (label) {
                this.sections[id + 'Label'] = $('<div>')
                    .attr('data-section-label', id)
                    .addClass('io-ox-label')
                    .text(label)
                    .prepend(
                        collapsable ?
                            $('<a>', { href: '#', tabindex: '7' })
                            .addClass('collapse').text(gt('Hide'))
                            .on('click', $.preventDefault) :
                            $()
                    );
            } else {
                this.sections[id + 'Label'] = $();
            }

            if (collapsable) {
                this.sections[id + 'Label'].on('click', { id: id }, $.proxy(fnToggleSection, this));
            } else {
                this.sections[id + 'Label'].css('cursor', 'default');
            }

            this.sections[id] = $('<div>').addClass('section').attr('data-section', id);

            if (show === false) {
                this.sections[id + 'Label'].hide();
                this.sections[id].hide();
            }

            return { label: $(this.sections[id + 'Label']), section: this.sections[id] };
        },

        addSection: function (id, label, show, collapsable) {
            this.createSection(id, label, show, collapsable);
            this.scrollpane.append(this.sections[id + 'Label'], this.sections[id]);
            return this.sections[id];
        },

        showSection: function (id, focus) {
            var sec = this.sections[id];
            if (sec) {
                sec.show().trigger('show');
                if (focus !== false) {
                    this.focusSection(id);
                }
            }
        },

        hideSection: function (id, node) {
            this.sections[id + 'Label'].add(this.sections[id]).hide();
            $(node).trigger('hide');
        },

        createLink: function (id, label) {
            return (this.sections[id + 'Link'] = $('<div>'))
                .addClass('section-link')
                .append(
                    $('<a>', { href: '#', tabindex: '7' })
                    .attr('data-section-link', id)
                    .text(label)
                    .on('click', { id: id }, $.proxy(fnToggleSection, this))
                );
        },

        addLink: function (id, label) {
            return this.createLink(id, label).appendTo(this.scrollpane);
        },

        createUpload: (function () {

            var change = function (e) {
                handleFileSelect(e, this);
            };

            return function () {

                var inputOptions = Modernizr.file && 'FormData' in window ?
                    { type: 'file', name: 'file_' + (this.fileCount++), multiple: 'multiple', tabindex: '7' } :
                    { type: 'file', name: 'file_' + (this.fileCount++), tabindex: '7' };

                return $('<div class="section-item upload">').append(
                    $('<input>', inputOptions).on('change', $.proxy(change, this))
                );
            };

        }()),

        createField: function (id) {

            var self = this, node = self.app.getWindowNode();

            return $('<div class="fieldset">').append(
                $('<label>', { 'for' : 'writer_field_' + id })
                .addClass('wrapping-label')
                .append(
                    $('<input>', {
                        type: 'text',
                        tabindex: (id === 'to' ? '2' : '7'),
                        id: 'writer_field_' + id
                    })
                    .attr('data-type', id) // not name=id!
                    .addClass('discreet')
                    .autocomplete({
                        api: autocompleteAPI,
                        reduce: function (data) {
                            var hash = {},
                                list;
                            // remove duplicates
                            node.find('input[name=' + id + ']').map(function () {
                                var rcpt = mailUtil.parseRecipient($(this).val())[1];
                                hash[rcpt] = true;
                            });
                            list = _(data).filter(function (o) {
                                return o.email !== '' ? hash[o.email] === undefined : hash[mailUtil.cleanupPhone(o.phone)] === undefined;
                            });

                            //return number of query hits and the filtered list
                            return { list: list, hits: data.length };
                        },
                        stringify: function (data) {
                            return data.display_name ?
                                '"' + data.display_name + '" <' + data.email + (data.phone || '') + '>' :
                                data.email;
                        },
                        draw: function (data, query) {
                            drawAutoCompleteItem.call(null, this, data, query);
                        },
                        click: function (e) {
                            copyRecipients.call(self, id, $(this), e);
                        },
                        blur: function (e) {
                            copyRecipients.call(self, id, $(this));
                        }
                    })
                    .on('keyup', function (e) {
                        if (e.which === 13) {
                            copyRecipients.call(self, id, $(this));
                        } else {
                            // look for special prefixes
                            var val = $(this).val();
                            if ((/^to:?\s/i).test(val)) {
                                $(this).val('');
                                self.showSection('to');
                            } else if ((/^cc:?\s/i).test(val)) {
                                $(this).val('');
                                self.showSection('cc');
                            } else if ((/^bcc:?\s/i).test(val)) {
                                $(this).val('');
                                self.showSection('bcc');
                            }
                        }
                    })
                )
            );
        },

        createSenderField: function () {

            var node = $('<div class="fromselect-wrapper">').append(
                   $('<label for="from" class="wrapping-label">').text(gt('From'))
                ),
                select = $('<select name="from" tabindex="7">').css('width', '100%');

            accountAPI.getAllSenderAddresses().done(function (addresses) {
                // sort by mail address (across all accounts)
                addresses.sort(function (a, b) {
                    a = mailUtil.formatSender(a);
                    b = mailUtil.formatSender(b);
                    return a < b ? -1 : +1;
                });
                _(addresses).each(function (address) {
                    var value = mailUtil.formatSender(address),
                        option = $('<option>', { value: value }).text(_.noI18n(value))
                        .data({ displayname: address[0], primaryaddress: address[1] });
                    select.append(option);
                });
            });
            return node.append(select);
        },

        createReplyToField: function () {
            //TODO: once this is mapped to jslob, use settings here (key should be showReplyTo)
            if (config.get('ui.mail.replyTo.configurable', true) !== true) {
                return;
            }
            return $('<div>').addClass('fieldset').append(
                $('<label>', {'for': 'writer_field_replyTo'})
                .addClass('wrapping-label').text(gt('Reply to')),
                $('<input>',
                    {'type' : 'text',
                     'id' : 'writer_field_replyTo',
                     'name' : 'replyTo'
                    })
                .addClass('discreet')
                .autocomplete({
                    source: function (val) {
                        return autocompleteAPI.search(val).then(function (autocomplete_result) {
                            return accountAPI.getAllSenderAddresses().then(function (result) {
                                result = result.filter(function (elem) {
                                    return elem[0].indexOf(val) >= 0 || elem[1].indexOf(val) >= 0;
                                });
                                return {list: result.concat(autocomplete_result), hits: result.length};
                            });
                        });
                    },
                    draw: function (data, query) {
                        drawAutoCompleteItem(this, data, query);
                    },
                    reduce: function (data) {
                        data.list = _(data.list).map(function (elem) {
                            return elem.type === 'contact' ? elem : {data: {}, display_name: elem[0], email: elem[1]};
                        });
                        return data;
                    },
                    stringify: function (data) {
                        return mailUtil.formatSender(data.display_name, data.email);
                    }
                })
            );
        },

        createRecipientList: function (id) {
            return (this.sections[id + 'List'] = $('<div>'))
                .addClass('recipient-list').hide();
        },


       /**
        * appends recipient nodes
        *
        * @param {string} id defines section (f.e. 'cc')
        * @param {array} list contains recipient objects
        * @return {void}
        */
        addRecipients: function (id, list) {
            var hash = {};

            if (list && list.length) {
                list = getNormalized(list);
                //hash current recipients
                this.app.getWindowNode().find('input[name=' + id + ']').map(function () {
                    var rcpt = mailUtil.parseRecipient($(this).val())[1];
                    hash[rcpt] = true;
                });
                // ignore doublets and draw remaining
                list = _(list).filter(function (recipient) {
                    if (hash[recipient.email] === undefined && hash[mailUtil.cleanupPhone(recipient.phone)] === undefined) {
                        //draw recipient
                        var node = $('<div>'), value;
                        drawContact(id, node, recipient);
                        // add to proper section (to, CC, ...)
                        this.sections[id + 'List'].append(node);
                        // if list itself contains doublets
                        value = recipient.email !== '' ? recipient.email : mailUtil.cleanupPhone(recipient.phone);
                        return hash[value] = true;
                    }
                }, this);
                this.sections[id + 'List'].show().trigger('show');
            }
        },

        render: function () {

            var self = this, app = self.app, buttons;

            /*
             * LEFTSIDE
             */

            // side panel
            this.leftside = $('<div class="leftside io-ox-mail-write-sidepanel">');
            this.scrollpane = this.leftside.scrollable();

            // title
            this.scrollpane.append(
                $('<h1 class="title">').text('\u00A0')
            );

            // sections

            // TO
            this.addSection('to').append(
                this.createRecipientList('to'),
                this.createField('to')
                    .find('input').attr('placeholder', gt.format('%1$s ...', gt('To'))).placeholder().end()
            );

            // CC

            this.addLink('cc', gt('Copy (CC) to'));
            this.addSection('cc', gt('Copy (CC) to'), false, true)
                .append(this.createRecipientList('cc'))
                .append(this.createField('cc'));


            // BCC

            this.addLink('bcc', gt('Blind copy (BCC) to'));
            this.addSection('bcc', gt('Blind copy (BCC) to'), false, true)
                .append(this.createRecipientList('bcc'))
                .append(this.createField('bcc'));


            // Attachments (unless we're on iOS)
            if (ox.uploadsEnabled) {
                this.fileCount = 0;
                var uploadSection = this.createSection('attachments', gt('Attachments'), false, true);
                this.scrollpane.append(
                    $('<form class="oldschool">').append(
                        this.createLink('attachments', gt('Attachments')),
                        uploadSection.label,
                        uploadSection.section.append(
                            this.createUpload()
                        )
                    )
                );
                // add preview side-popup
                new dialogs.SidePopup().delegate(this.sections.attachments, '.attachment-preview', previewAttachment);
            }

            // Signatures
            (function () {
                self.addLink('signatures', gt('Signatures'));

                var signatureNode = self.addSection('signatures', gt('Signatures'), false, true);

                function fnDrawSignatures() {
                    snippetAPI.getAll('signature').done(function (signatures) {
                        self.signatures = signatures;
                        signatureNode.empty();
                        signatureNode.append(
                            _(signatures.concat(dummySignature))
                            .inject(function (memo, o, index) {
                                var preview = (o.content || '')
                                    .replace(/\s\s+/g, ' ') // remove subsequent white-space
                                    .replace(/(\W\W\W)\W+/g, '$1 '); // reduce special char sequences
                                preview = preview.length > 150 ? preview.substr(0, 150) + ' ...' : preview;
                                return memo.add(
                                    $('<div>').addClass('section-item pointer')
                                    .addClass(index >= signatures.length ? 'signature-remove' : '')
                                    .append(
                                        $('<a>', { href: '#', tabindex: '7' })
                                        .on('click dragstart', $.preventDefault)
                                        .text(o.displayname)
                                    )
                                    .append(
                                        preview.length ?
                                            $('<div>').addClass('signature-preview')
                                            .text(_.noI18n(' ' + preview)) :
                                            $()
                                    )
                                    .on('click', { index: index }, function (e) {
                                        e.preventDefault();
                                        app.setSignature(e);
                                    })
                                );
                            }, $(), self)
                        );
                        if (signatures.length === 0) {
                            self.sections.signaturesLink.hide();
                        } else {
                            self.sections.signaturesLink.show();
                        }

                    });
                }

                fnDrawSignatures();
                snippetAPI.on('refresh.all', fnDrawSignatures);
                signatureNode.on('dispose', function () {
                    snippetAPI.off('refresh.all', fnDrawSignatures);
                });

            }());

            // FROM
            this.addLink('sender', gt('Sender'));
            this.addSection('sender', gt('Sender'), false, true)
                .append(this.createSenderField())
                .append(this.createReplyToField());

            accountAPI.getAllSenderAddresses().done(function (addresses) {
                if (addresses.length <= 1) {
                    self.scrollpane.find('div.fromselect-wrapper').hide();
                }
                self.sections.sender.show();
                if (self.sections.sender.children(':visible').length === 0) {
                    $('a[data-section-link="sender"]').hide();
                }
                self.sections.sender.hide();
            });

            // Options
            this.addLink('options', gt('More'));
            this.addSection('options', gt('Options'), false, true).append(
                // Priority
                $('<div>').addClass('section-item')
                .css({ paddingTop: '0.5em', paddingBottom: '0.5em' })
                .append(
                    $('<span>').addClass('group-label').text(gt('Priority'))
                )
                .append(createRadio('priority', '1', gt('High')))
                .append(createRadio('priority', '3', gt('Normal'), true))
                .append(createRadio('priority', '5', gt('Low')))
                .on('change', 'input', function () {
                    var radio = $(this);
                    if (radio.val() === '1' && radio.prop('checked')) {
                        self.applyHighPriority(true);
                    } else {
                        self.applyHighPriority(false);
                    }
                }),
                // Attach vCard
                $('<div>').addClass('section-item')
                .css({ paddingTop: '1em', paddingBottom: '1em' })
                .append(createCheckbox('vcard', gt('Attach my vCard')))
            );

            if (!Modernizr.touch) {
                var format = settings.get('messageFormat', 'html');
                this.addSection('format', gt('Text format'), true, false).append(

                    $('<div class="section-item">').append(
                        createRadio('format', 'text', gt('Text')),
                        createRadio('format', 'html', gt('HTML'), true)
                    )
                    .css({
                        paddingTop: '1em',
                        paddingBottom: '1em'
                    })
                    .on('change', 'input', function () {
                        var radio = $(this), format = radio.val();
                        app.setFormat(format).done(function () {
                            app.getEditor().focus();
                        });
                    })
                );
            }

            /*
             * RIGHTSIDE
             */

            this.rightside = $('<div class="rightside">');

            ext.point(POINT + '/toolbar').invoke(
                'draw', buttons = $('<div class="inline-buttons top">'), ext.Baton({ app: app })
            );

            this.rightside.append(
                // buttons
                buttons,
                // subject field
                $('<div>').css('position', 'relative').append(
                    $('<div>').addClass('subject-wrapper')
                    .append(
                        // subject
                        $.labelize(
                            this.subject = $('<input>')
                            .attr({
                                type: 'text',
                                name: 'subject',
                                tabindex: '3',
                                placeholder: gt('Subject')
                            })
                            .addClass('subject')
                            .val('')
                            .placeholder()
                            .on('keydown', function (e) {
                                if (e.which === 13 || (e.which === 9 && !e.shiftKey)) {
                                    // auto jump to editor on enter/tab
                                    e.preventDefault();
                                    app.getEditor().focus();
                                }
                            })
                            .on('keyup', function () {
                                var title = _.noI18n($.trim($(this).val()));
                                if (title.length > 0) {
                                    app.setTitle(title);
                                } else {
                                    app.setTitle(app.getDefaultWindowTitle());
                                }
                            }),
                            'mail_subject'
                        )
                    ),
                    // priority
                    this.priorityOverlay = $('<div>').addClass('priority-overlay')
                        .attr('title', 'Priority')
                        .append(
                            $('<i class="icon-star">'),
                            $('<i class="icon-star">'),
                            $('<i class="icon-star">')
                        )
                        .on('click', $.proxy(togglePriority, this))
                ),
                // editor container
                $('<div class="abs editor-outer-container">').append(
                    // white background
                    $('<div>').addClass('abs editor-background'),
                    // editor's print margin
                    $('<div>').addClass('abs editor-print-margin'),
                    // inner div
                    $('<div>').addClass('abs editor-inner-container')
                    .css('overflow', 'hidden')
                    .append(
                        // text editor
                        // FIXME: Labelize Call?
                        this.textarea = $('<textarea>')
                        .attr({ name: 'content', tabindex: '4', disabled: 'disabled' })
                        .addClass('text-editor')
                        .addClass(settings.get('useFixedWidthFont') ? 'monospace' : '')
                    )
                )
            );
        }
    });

    var dummySignature = { displayname: gt('No signature') };
    var handleFileSelect, addUpload, supportsPreview, previewAttachment, createPreview;

    supportsPreview = function (file) {
        // is not local?
        if (file.message) {
            return new pre.Preview({ mimetype: 'message/rfc822' }).supportsPreview();
        } else if (file.display_name) {
            return true;
        } else {
            return window.FileReader && (/^image\/(png|gif|jpe?g|bmp)$/i).test(file.type);
        }
    };

    previewAttachment = function (popup, e, target) {

        e.preventDefault();

        var file = target.data('file'), message = file.message, preview, reader;

        // nested message?
        if (message) {
            preview = new pre.Preview({
                    data: { nested_message: message },
                    mimetype: 'message/rfc822'
                }, {
                    width: popup.parent().width(),
                    height: 'auto'
                });
            if (preview.supportsPreview()) {
                preview.appendTo(popup);
                popup.append($('<div>').text(_.noI18n('\u00A0')));
            }
        } else if (file.display_name) {
            // if is vCard
            require(['io.ox/contacts/view-detail'], function (view) {
                popup.append(view.draw(file));
            });
        } else {
            // inject image as data-url
            reader = new FileReader();
            reader.onload = function (e) {
                popup.css({ width: '100%', height: '100%' })
                .append(
                    $('<div>')
                    .css({
                        width: '100%',
                        height: '100%',
                        backgroundImage: 'url(' + e.target.result + ')',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center center',
                        backgroundSize: 'contain'
                    })
                );
                reader = reader.onload = null;
            };
            reader.readAsDataURL(file);
        }
    };

    createPreview = function (file) {
        return $('<a href="#" class="attachment-preview">').data('file', file).text(gt('Preview'));
    };

    function round(num, digits) {
        // TODO: add localization (. vs ,)
        digits = digits || 0;
        var pow = Math.pow(10, digits);
        return Math.round(num * pow) / pow;
    }

    handleFileSelect = function (e, view) {
        // look for linked attachments or dropped files
        var target = $(e.currentTarget),
            item = target.prop('attachment') || target.prop('file') || target.prop('nested'),
            list = item ? [item] : e.target.files;

        // IE fallback
        if (!list) {
            var name = target.val();
            list = [{
                filename: name.split(/(\\|\/)/g).pop(),
                size: 0
            }];
        }

        if (list.length) {
            // loop over all attachments
            _(list).each(function (file) {

                /*
                 * Files, VCard, and Messages are very close here
                 * there's no real separation
                 */

                var icon, name, size, info,
                    isMessage = 'message' in file,
                    isFile = 'size' in file || 'file_size' in file;

                // message?
                if (isMessage) {
                    info = $('<span>').addClass('filesize').text('');
                    icon = $('<i>').addClass('icon-paper-clip');
                    name = file.message.subject || '\u00A0';
                } else if (isFile) {
                    // filesize
                    size = file.size || file.file_size;
                    size = size !== undefined ? gt.format('%1$s\u00A0 ', strings.fileSize(size)) : '';
                    info = $('<span>').addClass('filesize').text(size);
                    icon = $('<i>').addClass('icon-paper-clip');
                    name = file.filename || file.name || '';
                } else {
                    // vcard
                    info = $('<span>').addClass('filesize').text(gt.noI18n('vCard\u00A0'));
                    icon = $('<i>').addClass('icon-list-alt');
                    name = contactsUtil.getFullName(file);
                }

                // draw
                view.sections.attachments.append(
                    $('<div>').addClass('section-item file').append(
                        // icon
                        icon,
                        // filename
                        $('<div class="row-1">').text(_.noI18n(name)),
                        // filesize / preview
                        $('<div class="row-2">').append(
                            info,
                            // preview?
                            supportsPreview(file) ? createPreview(file) : $(),
                            // nbsp
                            $.txt('\u00A0')
                        ),
                        // remove
                        $('<a href="#" class="remove" tabindex="6">')
                        .attr('title', gt('Remove attachment'))
                        .append(
                            $('<i class="icon-trash">')
                        )
                        .on('click', function (e) {
                            e.preventDefault();
                            $(this).parent().prev().remove();
                            $(this).parent().remove();
                        })
                    )
                );
            });
            // hide current upload field
            $(e.target).closest('.section-item.upload').hide();
        }

        view.sections.attachments.append(
            view.createUpload()
        );
    };

    function fnToggleSection(e) {
        var id = e.data.id,
            target = e.target;
        e.preventDefault();
        if (this.sections[id].is(':visible')) {
            this.hideSection(id, target);
        } else {
            this.showSection(id, target);
        }
    }

    function fnHideSection(e) {
        var id = e.data.id;
        e.preventDefault();
        this.hideSection(id, e.target);
    }

    function fnShowSection(e) {
        var id = e.data.id;
        e.preventDefault();
        this.showSection(id, e.target);
    }

    function togglePriority() {
        var priority = this.app.getPriority();
        // cycle priorities
        if (priority === 3) {
            this.app.setPriority(1);
        } else if (priority === 1) {
            this.app.setPriority(5);
        } else {
            this.app.setPriority(3);
        }
    }

    function copyRecipients(id, node, e) {
        var valBase, list;

        //normalize data
        if (e && e.data.distlistarray !== null) {
            //distribution list
            list = e.data.distlistarray;
        } else if (e && e.data.id) {
            //selected contact list
            list = [ e.data ];
        } else {
            valBase = node.val();
            list = mailUtil.parseRecipients(valBase);
        }
        if (list.length) {
            // add
            this.addRecipients(id, list);
            node.val('').focus();
        } else if ($.trim(node.val()) !== '') {
            // not accepted but has content
            node.attr('disabled', 'disabled')
                .css({ border: '1px solid #a00', backgroundColor: '#fee' })
                .delay(600)
                .queue(function () {
                    node.css({ border: '', backgroundColor: '' })
                        .removeAttr('disabled')
                        .focus()
                        .dequeue();
                });
        }
    }

   /**
    * returns an array of normalized contact objects (display_name, mail, image1_url, folder_id, id)
    * @author <a href="mailto:frank.paczynski@open-xchange.com">Frank Paczynski</a>
    *
    * @param {array|object} list contacts
    * @return {array} array with contact object
    */
    function getNormalized(list) {
        var elem;
        return list.map(function (elem) {

            //parsed object?
            if (_.isArray(elem)) {
                var channel = mailUtil.getChannel(elem[1]),
                    custom = {
                        display_name: elem[0]
                    };
                //email or phone property? remove typesuffix (example: '0178000000/TYPE=PLMN')
                custom[channel] = channel === 'phone' ? elem[1].split('/')[0] : elem[1];
                elem = custom;
            }

            var obj = {
                display_name: elem.display_name.replace(/^('|")|('|")$/g, '') || '',
                email: elem.email || '',
                phone: elem.phone || '',
                field: elem.field || '',
                image1_url: elem.image1_url || '',
                folder_id: elem.folder_id || '',
                id: elem.id || ''
            };
            obj.url = contactsUtil.getImage(obj, contactPictureOptions);
            return obj;
        });
    }

    /**
     * mapping for getFieldLabel()
     * @type {object}
     */
    var mapping = {
        telephone_business1: gt('Phone (business)'),
        telephone_business2: gt('Phone (business)'),
        telephone_home1: gt('Phone (private)'),
        telephone_home2: gt('Phone (private)'),
        cellular_telephone1: gt('Mobile'),
        cellular_telephone2: gt('Mobile')
    };

    /**
     * fieldname to fieldlabel
     * @param  {string} field
     * @return {string} label
     */
    function getFieldLabel(field) {
        return mapping[field] || '';
    }

    function drawAutoCompleteItem(node, data, query) {
        var url = contactsUtil.getImage(data.data, contactPictureOptions), labelnode = '';
        //source field label
        if (getFieldLabel(data.field) !== '')
            labelnode = ' <span style="color: #888;">(' + getFieldLabel(data.field) + ')</span>';

        node.addClass('io-ox-mail-write-contact').append(
            $('<div class="contact-image">').css('backgroundImage', 'url(' + url + ')'),
            $('<div class="person-link ellipsis">').text(_.noI18n(data.display_name + '\u00A0')),
            $('<div class="ellipsis">').html(_.noI18n(data.email) + _.noI18n(data.phone || '') + labelnode)
        );
    }

    // drawAutoCompleteItem and drawContact
    // are slightly different. it's easier just having two functions.

    function drawContact(id, node, data) {

        node.addClass('io-ox-mail-write-contact section-item').append(
            // picture
            contactsAPI.getPicture(data, contactPictureOptions).addClass('contact-image'),
            // hidden field
            $('<input>', { type: 'hidden', name: id, value: serialize(data) }),
            // display name
            $('<div>').append(contactsAPI.getDisplayName(data)),
            // email address
            $('<div>').text(_.noI18n(String(data.email || '' + data.phone || '').toLowerCase())),
            // remove
            $('<a href="#" class="remove">')
                .attr('title', gt('Remove from recipient list'))
                .append(
                    $('<i class="icon-trash">')
                )
                .on('click', { id: id }, function (e) {
                    e.preventDefault();
                    var list = $(this).parents().find('.recipient-list');
                    $(this).parent().remove();
                    // hide section if empty
                    if (list.children().length === 0) {
                        list.hide();
                    }
                })
        );
    }

    // helper

    function serialize(obj) {
        // display_name might be null!
        return obj.display_name ?
             '"' + obj.display_name.replace(/"/g, '\"') + '" <' + obj.email + (obj.phone || '') + '>' : '<' + obj.email + (obj.phone || '') + '>';
    }

    // function clickRadio(e) {
    //     var node = $(this).parent();
    //     node.prop('selected', !node.prop('selected')).trigger('change'); // selected, not checked!
    // }

    function createRadio(name, value, text, isChecked) {
        var label, radio;
        radio = $('<input>', { type: 'radio', name: name, value: value, tabindex: '7' });
        label = $('<label class="radio">').append(
            radio, $.txt(_.noI18n('\u00A0\u00A0')), text, $.txt(_.noI18n('\u00A0\u00A0\u00A0\u00A0 '))
        );
        if (isChecked) {
            radio.attr('checked', 'checked');
        }
        // if (Modernizr.touch) {
        //     label.on('click', clickRadio);
        // }
        return label;
    }

    // function clickCheckbox(e) {
    //     var node = $(this).parent();
    //     node.prop('selected', !node.prop('selected')).trigger('change'); // selected, not checked!
    // }

    function createCheckbox(name, text, isChecked) {
        var label, box;
        box = $('<input>', { type: 'checkbox', name: name, value: '1', tabindex: '7' });
        label = $('<label class="checkbox">').append(
            box, $.txt(_.noI18n('\u00A0\u00A0')), text, $.txt(_.noI18n('\u00A0\u00A0\u00A0\u00A0 '))
        );
        if (isChecked) {
            box.attr('checked', 'checked');
        }
        // if (Modernizr.touch) {
        //     label.on('click', clickCheckbox);
        // }
        return label;
    }

    return view;
});
