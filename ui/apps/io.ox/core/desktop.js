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

define("io.ox/core/desktop",
    ["io.ox/core/event", "io.ox/core/extensions", "io.ox/core/extPatterns/links", "io.ox/core/cache"], function (Events, ext, links, cache) {

    "use strict";

    /**
     * Quick settings for application windows
     */
    $.quickSettings = (function () {

        return function (containerSelector, configSelector, link) {

            var container = $(containerSelector);
            var config = $(configSelector);

            link = $(link);

            if (!config.hasClass("quick-settings")) {
                // adjust container
                container.css({
                    position: "absolute",
                    zIndex: 2
                });
                // remember top position
                container.data("top", parseInt(container.css("top") || 0, 10));
                // adjust settings area
                config.addClass("quick-settings").css({
                    position: "absolute",
                    zIndex: 1,
                    top: (config.css("top") || 0) + "px",
                    right: "0px",
                    height: "auto",
                    left: "0px",
                    minHeight: "100px"
                });
            }

            // rebind events
            link.off("click")
                .on("dblclick", false)
                .on("click", function (e) {
                    window.container = container;
                    window.config = config;
                    // open
                    var top = container.data("top");
                    if (link.data("open") !== true) {
                        link.data("open", true);
                        config.show();
                        var h = Math.max(config.outerHeight(), 25);
                        container.stop().animate({ top: (top + h) + "px" }, 250);
                    } else {
                        link.data("open", false);
                        container.stop().animate({ top: top + "px" }, 250, function () {
                            config.hide();
                        });
                    }
                    return false;
                });
        };
    }());

    /**
     * Core UI
     */

    // current window
    var currentWindow = null;

    // ref to core screen
    var core = $("#io-ox-core"),
        // top bar
        topBar = $("#io-ox-topbar"),
        // add launcher
        addLauncher = function (side, label, fn) {
            // construct
            var node = $("<div>")
            .addClass("launcher")
            .text(label + '')
            .hover(
                function () {
                    $(this).addClass("hover");
                },
                function () {
                    $(this).removeClass("hover");
                }
            )
            .on("click", function () {
                var self = $(this), title;
                if (!_.isFunction(fn)) {
                    // for development only - should never happen
                    self.css("backgroundColor", "#800000");
                    setTimeout(function () {
                        self.css("backgroundColor", "");
                    }, 500);
                } else {
                    // set fixed width, hide label, be busy
                    title = self.text() || label;
                    self.css("width", self.width() + "px").text("\u00A0").busy();
                    // call launcher
                    (fn.call(this) || $.when()).done(function () {
                        // revert visual changes
                        self.idle().text(title + '').css("width", "");
                    });
                }
            });

            function getTarget(app) {
                var topbar = $("#io-ox-topbar"), target,
                    id = app.getName() || app.id;
                if ((target = topbar.find('.launcher[data-app-id=' + $.escape(id) + ']')).length) {
                    return target;
                } else {
                    return null;
                }
            }

            // add
            var c = currentWindow, target;
            if (side === "left" && c && c.app && (target = getTarget(c.app))) {
                // animate space
                node.hide().insertAfter(target).fadeIn(1000);
            } else {
                // just add
                if (side === "left") {
                    node.appendTo(topBar);
                } else {
                    node.addClass("right").appendTo(topBar);
                }
            }

            return node;
        };

    // show
    core.show();

    // TODO: improve this stupid approach
    ox.ui.running = [];

    /**
     * Create app
     */
    ox.ui.createApp = (function () {

        var appCache = new cache.SimpleCache('app-cache', true),
            appGuid = 0;

        function App(options) {

            var opt = $.extend({
                title: "",
                icon: null,
                id: 'app-' + (appGuid++)
            }, options || {});

            // dummy function
            var dummyFn = function () {
                    return $.Deferred().resolve();
                },
                // launcher function
                launchFn = dummyFn,
                // quit function
                quitFn = dummyFn,
                // app main window
                win = null,
                // running
                running = false,
                runningId = null,
                // save/restore
                savePointUniqueID = _.now(),
                savePoint = '',
                saveRestorePointTimer = null,
                // self
                self = this;

            function saveRestorePoint() {
                if (self.failSave) {
                    appCache.get('savepoints').done(function (list) {
                        list = list || [];

                        var data = self.failSave(),
                            ids = _(list).pluck('id'),
                            pos = _(ids).indexOf(savePointUniqueID);

                        data.id = savePointUniqueID;

                        if (pos > -1) {
                            // replace
                            list.splice(pos, 1, data);
                        } else {
                            // add
                            list.push(data);
                        }
                        appCache.add('savepoints', list);
                    });
                }
            }

            function removeRestorePoint() {
                appCache.get('savepoints').done(function (list) {
                    list = list || [];
                    var ids = _(list).pluck('id'),
                        pos = _(ids).indexOf(savePointUniqueID);

                    if (pos > -1) {
                        list.splice(pos, 1);
                    }
                    appCache.add('savepoints', list);
                });
            }

            $(window).on('unload', saveRestorePoint);
            saveRestorePointTimer = setInterval(saveRestorePoint, 10000);

            // add event hub
            Events.extend(this);

            // add folder management
            this.folder = (function () {

                var folder = null, that, win = null, grid = null, type, hChanged;

                hChanged = function (e) {
                    that.set(e.data.folder);
                };

                that = {

                    unset: function () {
                        // unset
                        folder = null;
                        // update window title?
                        if (win) {
                            win.setTitle('');
                        }
                        // update grid?
                        if (grid) {
                            grid.clear();
                        }
                    },

                    set: function (id) {
                        var def = $.Deferred();
                        if (id !== undefined && id !== null) {
                            require(['io.ox/core/api/folder'], function (api) {
                                api.get({ folder: id })
                                .done(function (data) {
                                    // off
                                    api.off('change:' + folder);
                                    // remember
                                    folder = String(id);
                                    // process change
                                    // look for change folder event
                                    api.on('change:' + folder, { folder: folder }, hChanged);
                                    // update window title & toolbar?
                                    if (win) {
                                        win.setTitle(data.title);
                                        win.updateToolbar();
                                    }
                                    // update grid?
                                    if (grid) {
                                        grid.clear();
                                        grid.prop('folder', folder);
                                        grid.refresh();
                                        // update hash
                                        _.url.hash('folder', folder);
                                    }
                                    self.trigger('change:folder', folder, data);
                                    def.resolve(data);
                                })
                                .fail(def.reject);
                            });
                        } else {
                            def.reject();
                        }
                        return def;
                    },

                    setType: function (t) {
                        type = t;
                        return this;
                    },

                    setDefault: function () {
                        var def = new $.Deferred();
                        require(['io.ox/core/config'], function (config) {
                            var defaultFolder = type === 'mail' ?
                                    config.get('mail.folder.inbox') :
                                    config.get('folder.' + type);
                            if (defaultFolder) {
                                that.set(defaultFolder)
                                    .done(def.resolve)
                                    .fail(def.reject);
                            } else {
                                def.reject();
                            }
                        });
                        return def;
                    },

                    get: function () {
                        return folder;
                    },

                    updateTitle: function (w) {
                        win = w;
                        return this;
                    },

                    updateGrid: function (g) {
                        grid = g;
                        return this;
                    },

                    destroy: function () {
                        that = win = grid = null;
                    }
                };

                return that;
            }());

            this.getInstance = function () {
                return self; // not this!
            };

            this.getId = function () {
                return opt.id;
            };

            this.setLauncher = function (fn) {
                launchFn = fn;
                return this;
            };

            this.setQuit = function (fn) {
                quitFn = fn;
                return this;
            };

            this.setWindow = function (w) {
                win = w;
                win.app = this;
                // add app name
                if ('name' in opt) {
                    win.nodes.outer.attr('data-app-name', opt.name);
                }
                return this;
            };

            this.getName = function () {
                return opt.name;
            };

            this.setTitle = function (title) {
                opt.title = title;
                ox.trigger('application:change:title', this, title);
                return this;
            };

            this.getTitle = function () {
                return opt.title;
            };

            this.getWindow = function () {
                return win;
            };

            this.getWindowTitle = function () {
                return win ? win.getTitle() : '';
            };

            this.setState = function (obj) {
                for (var id in obj) {
                    _.url.hash(id, String(obj[id]));
                }
            };

            this.getName = function () {
                return opt.name;
            };

            this.getState = function () {
                return _.url.hash();
            };

            this.launch = function () {

                var deferred;

                // update hash
                if (opt.name !== _.url.hash('app')) {
                    _.url.hash('folder', null);
                    _.url.hash('id', null);
                }
                if (opt.name) {
                    _.url.hash('app', opt.name);
                }

                if (!running) {
                    // mark as running
                    running = true;
                    // go!
                    (deferred = launchFn() || $.when())
                    .done(function () {
                        ox.ui.running.push(self);
                        ox.trigger('application:launch', self);
                    });

                } else if (win) {
                    // toggle app window
                    win.show();
                    deferred = $.when();
                    ox.trigger('application:resume', self);
                }

                return deferred.pipe(function () {
                    return $.Deferred().resolveWith(self, arguments);
                });
            };

            this.quit = function (force) {
                // call quit function
                var def = force ? $.when() : (quitFn() || $.when());
                return def.done(function () {
                    // not destroyed?
                    if (force && self.destroy) {
                        self.destroy();
                    }
                    // update hash
                    _.url.hash('app', null);
                    _.url.hash('folder', null);
                    _.url.hash('id', null);
                    // remove from list
                    ox.ui.running = _(ox.ui.running).without(self);
                    // mark as not running
                    running = false;
                    // don't save
                    clearInterval(saveRestorePointTimer);
                    removeRestorePoint();
                    $(window).off('unload', saveRestorePoint);
                    // event
                    ox.trigger('application:quit', self);
                    // destroy stuff
                    self.events.destroy();
                    self.folder.destroy();
                    if (win) {
                        win.trigger("quit");
                        ox.ui.windowManager.trigger("window.quit", win);
                        win.destroy();
                    }
                    // remove app's properties
                    for (var id in self) {
                        delete self[id];
                    }
                    // don't leak
                    self = win = launchFn = quitFn = null;
                });
            };
        }

        ox.ui.App = App;

        App.canRestore = function () {
            // use get instead of contains since it might exist as empty list
            return appCache.get('savepoints').pipe(function (list) {
                return list && list.length;
            });
        };

        App.getSavePoints = function () {
            return appCache.get('savepoints').pipe(function (list) {
                return list || [];
            });
        };

        App.restore = function () {
            App.getSavePoints().done(function (data) {
                _(data).each(function (obj) {
                    require([obj.module + '/main'], function (m) {
                        m.getApp().launch().done(function () {
                            if (this.failRestore) {
                                this.failRestore(obj.point);
                            }
                        });
                    });
                });
                appCache.remove('savepoints');
            });
        };

        return function (options) {
            return new App(options);
        };

    }());

    ox.ui.screens = (function () {

        var current = null,

            that = {

                add: function (id) {
                    return $('<div>', { id: 'io-ox-' + id }).addClass('abs').hide()
                        .appendTo('#io-ox-screens');
                },

                get: function (id) {
                    return $('#io-ox-screens').find('#io-ox-' + id);
                },

                current: function () {
                    return current;
                },

                hide: function (id) {
                    this.get(id).hide();
                    this.trigger('hide-' + id);
                },

                show: function (id) {
                    $('#io-ox-screens').children().each(function (i, node) {
                        var attr = $(this).attr('id'),
                            screenId = String(attr || '').substr(6);
                        if (screenId !== id) {
                            that.hide(screenId);
                        }
                    });
                    this.get(id).show();
                    current = id;
                    this.trigger('show-' + id);
                }
            };

        Events.extend(that);

        return that;

    }());

    ox.ui.windowManager = (function () {

        var that = Events.extend({}),
            // list of windows
            windows = [],
            // get number of open windows
            numOpen = function () {
                return _(windows).inject(function (count, obj) {
                    return count + (obj.state.open ? 1 : 0);
                }, 0);
            };

        that.getWindows = function () {
            return windows.slice();
        };

        ox.ui.screens.on('hide-windowmanager', function () {
            if (currentWindow) {
                currentWindow.hide();
            }
        });

        that.hide = function () {
            ox.ui.screens.hide('windowmanager');
        };

        that.show = function () {
            ox.ui.screens.show('windowmanager');
        };

        that.on("window.open window.show", function (e, win) {
            // show window managher
            this.show();
            // move/add window to top of stack
            windows = _(windows).without(win);
            windows.unshift(win);
        });

        that.on("window.beforeshow", function (e, win) {
            that.trigger("empty", false);
        });

        that.on("window.close window.quit", function (e, win, type) {

            var pos = _(windows).indexOf(win), i, $i, w;
            if (pos !== -1) {
                // quit?
                if (type === "window.quit") {
                    windows.splice(pos, 1);
                }
                // close?
                else if (type === "window.close") {
                    windows = _(windows).without(win);
                    windows.push(win);
                }
                // find first open window
                for (i = 0, $i = windows.length; i < $i; i++) {
                    w = windows[i];
                    if (w !== win && w.state.open) {
                        w.show();
                        break;
                    }
                }
            }

            that.trigger("empty", numOpen() === 0);
        });

        return that;

    }());

    /**
     * Create window
     */
    ox.ui.createWindow = (function () {

        // window guid
        var guid = 0,

            pane = $("#io-ox-windowmanager-pane"),

            getX = function (node) {
                return node.data("x") || 0;
            },

            scrollTo = function (node, cont) {

                var children = pane.find(".window-container-center"),
                    center = node.find(".window-container-center").show(),
                    index = node.data("index") || 0,
                    left = (-index * 101),
                    done = function () {
                        // use timeout for smoother animations
                        setTimeout(function () {
                            _.call(cont);
                        }, 10);
                    };
                // change?
                if (left !== getX(pane)) {
                    // remember position
                    pane.data("x", left);
                    // do motion TODO: clean up here!
                    if (true) {
                        pane.animate({ left: left + "%" }, 0, done);
                    }
                    // touch device?
                    else if (Modernizr.touch) {
                        pane.css("left", left + "%");
                        done();
                    }
                    // use CSS transitions?
                    else if (Modernizr.csstransforms3d) {
                        pane.one(_.browser.WebKit ? "webkitTransitionEnd" : "transitionend", done);
                        pane.css("left", left + "%");
                    } else {
                        pane.stop().animate({ left: left + "%" }, 250, done);
                    }
                } else {
                    done();
                }
            },

            // window class
            Window = function (id, name) {

                this.id = id;
                this.name = name;
                this.nodes = {};
                this.search = { query: "" };
                this.state = { visible: false, running: false, open: false };
                this.app = null;

                var quitOnClose = false,
                    // views
                    views = { main: true },
                    currentView = "main",
                    self = this,
                    firstShow = true;

                this.updateToolbar = function () {
                    ext.point(this.name + "/toolbar")
                        .invoke('draw', this.nodes.toolbar.empty(), this.app || this);
                };

                this.show = function (cont) {
                    // get node and its parent node
                    var node = this.nodes.outer, parent = node.parent();
                    // if not current window or if detached (via funny race conditions)
                    if (currentWindow !== this || parent.length === 0) {
                        // show
                        if (firstShow) {
                            node.data("index", guid - 1).css("left", ((guid - 1) * 101) + "%");
                        }
                        if (node.parent().length === 0) {
                            node.appendTo(pane);
                        }
                        this.updateToolbar();
                        ox.ui.windowManager.trigger("window.beforeshow", self);
                        node.show();
                        scrollTo(node, function () {
                            if (currentWindow && currentWindow !== self) {
                                currentWindow.hide();
                            }
                            currentWindow = self;
                            _.call(cont);
                            self.state.visible = true;
                            self.state.open = true;
                            self.trigger("show");
                            document.title = 'OX7. ' + self.getTitle();
                            if (firstShow) {
                                self.trigger("open");
                                self.state.running = true;
                                ox.ui.windowManager.trigger("window.open", self);
                                firstShow = false;
                            }
                            ox.ui.windowManager.trigger("window.show", self);
                        });
                    } else {
                        _.call(cont);
                    }
                    return this;
                };

                this.hide = function () {
                    // detach if there are no iframes
                    if (this.nodes.outer.find("iframe").length === 0) {
                        this.nodes.outer.detach();
                    } else {
                        this.nodes.outer.hide();
                    }
                    this.state.visible = false;
                    this.trigger("hide");
                    ox.ui.windowManager.trigger("window.hide", this);
                    if (currentWindow === this) {
                        currentWindow = null;
                        document.title = 'OX7';
                    }
                    return this;
                };

                this.toggle = function () {
                    if (currentWindow === this) {
                        this.hide();
                    } else {
                        this.show();
                    }
                    return this;
                };

                this.close = function () {

                    // local self
                    var self = this;
                    $('#myGrowl').jGrowl('shutdown'); // maybe needs a better solution to trigger the jGrowl shutdown

                    if (quitOnClose && this.app !== null) {
                        this.trigger("beforequit");
                        this.app.quit()
                            .done(function () {
                                self.state.open = false;
                                self.state.running = false;
                                self = null;
                            });
                    } else {
                        this.hide();
                        this.state.open = false;
                        this.trigger("close");
                        ox.ui.windowManager.trigger("window.close", this);
                    }
                    return this;
                };

                var BUSY_SELECTOR = 'input, select, textarea, button',
                    TOGGLE_CLASS = 'toggle-disabled';

                this.busy = function () {
                    // use self instead of this to make busy/idle robust for callback use
                    if (self) {
                        $('body').focus(); // steal focus
                        self.nodes.main.find(BUSY_SELECTOR)
                            .not(':disabled').attr('disabled', 'disabled').addClass(TOGGLE_CLASS);
                        self.nodes.blocker.busy().show();
                        self.trigger('busy');
                    }
                };

                this.idle = function (enable) {
                    // use self instead of this to make busy/idle robust for callback use
                    if (self) {
                        self.nodes.blocker.idle().hide();
                        self.nodes.main.find(BUSY_SELECTOR).filter('.' + TOGGLE_CLASS)
                            .removeAttr('disabled').removeClass(TOGGLE_CLASS);
                        self.trigger('idle');
                    }
                };

                this.destroy = function () {
                    // hide window
                    this.hide();
                    // trigger event
                    this.trigger("destroy");
                    // disconnect from app
                    if (this.app !== null) {
                        this.app.win = null;
                        this.app = null;
                    }
                    // destroy everything
                    this.events.destroy();
                    this.show = this.busy = this.idle = $.noop;
                    this.nodes.outer.remove();
                    this.nodes = self = null;
                    return this;
                };

                this.setQuitOnClose = function (flag) {
                    quitOnClose = !!flag;
                };

                var title = "";

                function applyTitle() {
                    var spans = self.nodes.title.find("span");
                    spans.eq(0).empty().append(
                        typeof title === "string" ?
                            document.createTextNode(title) :
                            title
                    );
                }

                this.getTitle = function () {
                    return self.nodes.title.find("span").eq(0).contents().text();
                };

                this.setTitle = function (t) {
                    title = t;
                    applyTitle();
                    if (this === currentWindow) {
                        document.title = 'OX7. ' + t;
                    }
                    this.trigger('change:title');
                    return this;
                };

                this.addClass = function () {
                    var o = this.nodes.outer;
                    return o.addClass.apply(o, arguments);
                };

                this.addButton = function (options) {

                    var o = $.extend({
                        label: "Action",
                        action: $.noop
                    }, options || {});

                    return $("<div>")
                        .addClass("io-ox-toolbar-link")
                        .text(String(o.label))
                        .on("click", o.action)
                        .appendTo(this.nodes.toolbar);
                };

                this.addView = function (id) {
                    if (this.nodes[id] === undefined) {
                        var node = $("<div>")
                            .addClass("window-content").hide()
                            .appendTo(this.nodes.body);
                        return (this.nodes[id] = views[id] = node);
                    }
                };

                this.setView = function (id) {
                    if (id !== currentView) {
                        if (views[id] !== undefined) {
                            this.nodes[currentView].hide();
                            this.nodes[currentView = id].show();
                        }
                    }
                    return this;
                };
            };

        // window factory
        return function (options) {

            var opt = $.extend({
                id: "window-" + guid,
                name: "",
                width: 0,
                title: "",
                titleWidth: '300px',
                search: false,
                toolbar: false,
                settings: false,
                chromesless: false
            }, options);

            // get width
            var meta = (String(opt.width).match(/^(\d+)(px|%)$/) || ["", "100", "%"]).splice(1),
                width = meta[0],
                unit = meta[1],
                // create new window instance
                win = new Window(opt.id, opt.name),
                // close window
                close = function () {
                    win.close();
                };

            // window container
            win.nodes.outer = $("<div>")
            .attr({
                id: opt.id,
                "data-window-nr": guid
            })
            .addClass("window-container")
            .append(
                $("<div>")
                .addClass("window-container-center")
                .data({
                    width: width + unit
                }).css({
                    width: width + unit
                })
                .append(
                    win.nodes.blocker = $('<div>').addClass('abs window-blocker').hide()
                )
                .append(
                    // window HEAD
                    win.nodes.head = $("<div>")
                    .addClass("window-head")
                    .append(
                        // title
                        win.nodes.title = $("<h1>")
                        .css("width", opt.titleWidth)
                        .addClass("window-title")
                        .append($("<span>"))
                    )
                    .append(
                        // toolbar
                        win.nodes.toolbar = $("<div>")
                        .css("left", opt.titleWidth)
                        .addClass("window-toolbar")
                    )
                    .append(
                        // controls
                        win.nodes.controls = $("<div>")
                        .addClass("window-controls")
                        .append(
                            // settings
                            win.nodes.settingsButton = $("<div>").hide()
                            .addClass("window-control")
                            .text("\u270E")
                        )
                        .append(
                            // close
                            win.nodes.closeButton = $("<div>").hide()
                            .addClass("window-control")
                            .append(
                                $('<a class="close">&times;</a>')
                            )
                        )
                    )
                )
                .append(
                    // window BODY
                    win.nodes.body = $("<div>")
                    .addClass("window-body")
                    .append(
                        // quick settings
                        win.nodes.settings = $("<div>")
                        .hide()
                        .addClass("window-settings")
                        .html("<h2>Each window can have a quick settings area</h2>")
                    )
                    .append(
                        // content
                        win.nodes.main = $("<div>")
                        .addClass("window-content")
                    )
                )
            );

            // add event hub
            Events.extend(win);

            // search?
            if (opt.search) {
                // search
                var lastQuery = "",
                    triggerSearch = function (query) {
                        // yeah, waiting for the one who reports this :)
                        if (/^porn$/i.test(query)) {
                            $("body").append(
                                $("<div>")
                                .addClass("abs")
                                .css({
                                    backgroundColor: "black",
                                    zIndex: 65000
                                })
                                .append(
                                    $("<div>")
                                    .addClass("abs").css({
                                        top: "25%",
                                        textAlign: "center",
                                        color: "#aaa",
                                        fontWeight: "bold",
                                        fontSize: "50px",
                                        fontFamily: "'Comic Sans MS', Arial"
                                    })
                                    .html('<span style="color: rgb(230,110,110)">YOU</span> SEARCHED FOR WHAT?')
                                )
                                .append(
                                    $("<div>")
                                    .addClass("abs")
                                    .css({
                                        top: "50%",
                                        width: "670px",
                                        textAlign: "center",
                                        margin: "0 auto 0 auto",
                                        color: "#666"
                                    })
                                    .html(
                                        '<div style="font-size: 26px">WARNING: This website contains explicit adult material.</div>' +
                                        '<div style="font-size: 18px">You may only enter this Website if you are at least 18 years of age, or at least the age of majority in the jurisdiction where you reside or from which you access this Website. If you do not meet these requirements, then you do not have permission to use the Website.</div>'
                                    )
                                )
                                .click(function () {
                                        $(this).remove();
                                    })
                            );
                        } else if (/^use the force$/i.test(query) && currentWindow) {
                            // star wars!
                            currentWindow.nodes.outer.css({
                                webkitTransitionDuration: "2s",
                                webkitTransform: "perspective(500px) rotate3d(1, 0, 0, 45deg)",
                                top: "-150px"
                            });
                            // no search here
                            return;
                        } else if (/^no star wars$/i.test(query) && currentWindow) {
                            // star wars!
                            currentWindow.nodes.outer.css({
                                webkitTransitionDuration: "1s",
                                webkitTransform: "perspective(0px) rotate3d(1, 0, 0, 0deg)",
                                top: ""
                            });
                            // no search here
                            return;
                        }
                        win.trigger("search", query);
                    };

                var searchId = 'search_' + _.now(); // acccessibility

                $('<form>')
                .on('submit', false)
                .addClass('form-search')
                .css({ 'float': 'right' })
                .append(
                    $('<label>', { 'for': searchId })
                    .append(
                        $("<input>", {
                            type: "text",
                            placeholder: "Search ...",
                            tabindex: '1',
                            size: "40",
                            id: searchId
                        })
                        .tooltip({
                            animation: false,
                            title: 'Press enter to search',
                            placement: 'bottom',
                            trigger: 'focus'
                        })
                        .addClass('input-large search-query')
                        .on({
                            keypress: function (e) {
                                e.stopPropagation();
                            },
                            search: function (e) {
                                e.stopPropagation();
                                if ($(this).val() === "") {
                                    $(this).blur();
                                }
                            },
                            change: function (e) {
                                e.stopPropagation();
                                win.search.query = $(this).val();
                                // trigger search?
                                if (win.search.query !== "") {
                                    if (win.search.query !== lastQuery) {
                                        triggerSearch(lastQuery = win.search.query);
                                    }
                                } else if (lastQuery !== "") {
                                    win.trigger("cancel-search", lastQuery = "");
                                }
                            }
                        })
                    )
                )
                .prependTo(win.nodes.controls);
            }

            // toolbar extension point
            if (opt.toolbar === true && opt.name) {
                // add "create" link
                ext.point(opt.name + '/toolbar').extend(new links.ToolbarLinks({
                    id: 'links',
                    ref: opt.name + '/links/toolbar'
                }));
            }

            // fix height/position/appearance
            if (opt.chromeless) {

                win.nodes.head.remove();
                win.nodes.toolbar.remove();
                win.nodes.body.css("top", "0px");

            } else {

                // add close handler
                if (opt.close === true) {
                    win.nodes.closeButton.show().on("click", close);
                    win.setQuitOnClose(true);
                }

                // set title
                win.setTitle(opt.title);

                // quick settings?
                if (opt.settings) {
                    $.quickSettings(win.nodes.main, win.nodes.settings, win.nodes.settingsButton);
                    win.nodes.settingsButton.show();
                }
            }

            // inc
            guid++;

            // return window object
            return win;
        };

    }());

    // simple launch
    ox.launch = function (id, data) {
        var def = $.Deferred();
        if (_.isString(id)) {
            require([id], function (m) {
                m.getApp(data).launch().done(function () {
                    def.resolveWith(this, arguments);
                });
            });
        } else {
            def.resolve({});
        }
        return def;
    };


    return {
        addLauncher: addLauncher
    };

});
