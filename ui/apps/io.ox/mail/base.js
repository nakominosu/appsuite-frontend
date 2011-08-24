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

define("io.ox/mail/base", function () {
    
    var that = {};
    
    var ngettext = function (s, p, n) {
            return n > 1 ? p : s;
        },
        format = ox.util.printf,
        MINUTE = 60 * 1000,
        HOUR = MINUTE * 60;
        
    // resolve mails on scroll
    var autoResolve = function (e) {
        // get mail api
        var self = $(this);
        require(["io.ox/mail/api"], function (api) {
            // get mail data
            api.get(e.data).done(function (data) {
                // replace placeholder with mail content
                self.replaceWith(that.draw(data));
            });
        });
    };
   
    return that = {
        
        createNewMailDialog: function () {
            require(["io.ox/mail/new"], function (m) {
                m.getApp().launch();
            });
        },

        serializeList: function (list, delimiter) {
            var i = 0, $i = list.length, tmp = [];
            for (; i < $i; i++) {
                tmp.push(
                    (list[i][0] || list[i][1]).replace(/(^["']|["']$)/g, "")
                );
            }
            return tmp.join(delimiter || "; ");
        },
        
        getTime: function (timestamp) {
            var now = new Date(),
                zone = now.getTimezoneOffset(),
                time = now.getTime() - zone * 60 * 1000,
                delta = time - timestamp,
                d = new Date(timestamp),
                n = 0;
            // today?
            if (d.getDate() === now.getDate()) {
                if (delta < HOUR) {
                    n = Math.ceil(delta / MINUTE);
                    return "" + format(ngettext("%d minute ago", "%d minutes ago", n), n); /*i18n*/
                } else {
                    n = Math.ceil(delta / HOUR);
                    return ""+ format(ngettext("%d hour ago", "%d hours ago", n), n); /*i18n*/
                }
            } else if (d.getDate() === now.getDate() - 1) {
                // yesterday
                return "Yesterday";
            } else {
                return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
            }
        },
        
        isUnread: function (data) {
            return (data.flags & 32) !== 32;
        },
        
        isMe: function (data) {
            // hard wired
            return data.from && data.from.length && data.from[0][1] === "matthias.biggeleben@open-xchange.com";
        },
        
        drawScaffold: function (obj) {
            return $("<div/>")
                .addClass("mail-detail")
                .busy()
                .bind("resolve", obj, autoResolve);
        },
        
        draw: function (data) {
            
            if (!data || !data.attachments) {
                return $("<div/>");
            }
            
            var mailtext = data.attachments.length ? data.attachments[0].content : "",
                mailNode = $("<div/>").addClass("content").html(mailtext);
            
            // collapse blockquotes
            mailNode.find("blockquote").each(function () {
                var quote = $(this);
                quote.text( quote.contents().text().substr(0, 100) );
            });
            
            return $("<div/>")
                .addClass("mail-detail")
                .append(
                    $("<div/>")
                        .addClass("subject")
                        .text(data.subject)
                )
                .append(
                    $("<div/>")
                        .addClass("from person")
                        .text(this.serializeList(data.from))
                )
                .append(
                    $("<div/>").text("\u00a0").addClass("spacer")
                )
                .append(
                    mailNode
                );
        }
    };
});