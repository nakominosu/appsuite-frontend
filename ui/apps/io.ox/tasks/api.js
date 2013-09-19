/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define('io.ox/tasks/api',
        ['io.ox/core/http',
         'io.ox/core/api/factory',
         'io.ox/core/api/folder', 'io.ox/tasks/util'], function (http, apiFactory, folderAPI, util) {

    'use strict';

    var api,
        // object to store tasks, that have attachments uploading atm
        uploadInProgress = {},
        //variables so portal is only required once
        portalModel,
        portalApp,

        /**
         * notificate
         * @private
         * @param  {array} ids (objects with id and folder_id)
         * @param  {object} modifications
         * @fires  api#mark:task:confirmed (ids)
         * @fires  api#mark:overdue (ids)
         * @fires  api#unmark:overdue (ids)
         * @return {undefined}
         */
        checkForNotifications = function (ids, modifications) {
            //TODO: existance to folder_id not reliable indicating that it's a
            //      move operation (change due date for example)
            if (modifications.folder_id && modifications.folder_id !== ids[0].folder_id) {//move operation! Every notifications needs to be reseted or they will link to unavailable tasks
                api.getTasks();
                require(['io.ox/core/api/reminder'], function (reminderAPI) {
                    reminderAPI.getReminders();
                });
                return;
            }

            var addArray = [],
                removeArray = [];
            if (modifications.status) {//status parameter can be string or integer. Force it to be an integer
                modifications.status = parseInt(modifications.status, 10);
            }

            if (modifications.participants) {
                var myId = ox.user_id,
                    triggered = false;
                _(modifications.participants).each(function (obj) { //user is added to a task
                    if (obj.id === myId) {
                        triggered = true;
                        api.getTasks();
                    }
                });
                //get all data if not already triggered
                if (!triggered) {
                    api.get(ids[0]).done(function (data) {//only occurs if only one task is given
                        if (data.participants.length > 0) {//all participants are removed
                            api.trigger('mark:task:confirmed', ids); //unmark:confirmation
                        } else {
                            _(data.participants).each(function (obj) {
                                if (obj.id === myId) { //user is in participants so there must already be a notification
                                    triggered = true;
                                }
                            });
                            if (!triggered) { //user is not in participants anymore
                                api.trigger('mark:task:confirmed', ids); //unmark:confirmation
                            }
                        }
                    });
                }
            }

            if (modifications.alarm || modifications.alarm === null) {//reminders need updates because alarm changed is set or unset
                require(['io.ox/core/api/reminder'], function (reminderAPI) {
                    reminderAPI.getReminders();
                });
            }
            //check overdue
            if (modifications.status === 3 || modifications.end_date === null) {
                api.trigger('unmark:overdue', ids);
            } else if (modifications.status || modifications.end_date) {
                //current values are needed for further checks
                api.getList(ids, false).done(function (list) {
                    _(list).each(function (task) {
                        if (task.status !== 3 && task.end_date) {
                            if (task.end_date < _.now()) {
                                addArray.push(task);
                            } else {
                                removeArray.push(task);
                            }
                        }
                    });
                    if (addArray.length > 0) {
                        api.trigger('mark:overdue', addArray);
                    }
                    if (removeArray.length > 0) {
                        api.trigger('unmark:overdue', removeArray);
                    }
                });
            }
        },

        /**
         * applies task modifications to all cache
         * @private
         * @param  {array} tasks (objects with id and folder_id)
         * @param  {string} folder (folder id of the current folder)
         * @param  {object} modfications (modifications of the cachevalues)
         * @return {deferred}
         */
        updateAllCache = function (tasks, folder, modifications) {

            var list = _.copy(tasks, true),
            //make sure we have an array
            list = list || [];
            list = _.isArray(list) ? list : [list];

            if (list.length === 0) {//is's empty. nothing to do
                return $.when();
            }
            //make sure ids are strings
            folder = folder.toString();
            _(list).each(function (task) {
                task.id = task.id.toString();
                task.folder_id = task.folder_id.toString();
            });

            if (list[0].folder_id && list[0].folder_id !== folder) {//move operation
                return api.caches.all.clear();
            }
            var found = false,
                cacheKey = api.cid({folder: folder,
                                    sort: api.options.requests.all.sort,
                                    order: api.options.requests.all.order});
            //look for items and copy modifications to the cache to make it valid again
            return api.caches.all.get(cacheKey).then(function (cachevalue) {
                if (cachevalue) {
                    _(cachevalue).each(function (singlevalue) {
                        _(list).each(function (item) {
                            if (singlevalue.id.toString() === item.id && singlevalue.folder_id.toString() === folder) {
                                _.extend(singlevalue, modifications);//apply modified values
                                found = true;
                            }
                        });

                    });
                    if (found) {
                        return api.caches.all.add(cacheKey, cachevalue);
                    } else {
                        return $.when();
                    }
                } else {//just leave it to the next all request, no need to do it here
                    return $.when();
                }
            });
        },

        /**
         * gets every task in users private folders. Used in Portal tile
         * @private
         * @return {deferred}
         */
        getAllFromAllFolders = function () {
            return api.search({ pattern: '', end: _.now() });
        },

        /**
         * refreshs the task portal tile
         * @private
         * @return {undefined}
         */
        refreshPortal = function () {
            if (portalModel && portalApp) {
                portalApp.refreshWidget(portalModel, 0);
            } else {
                require(['io.ox/portal/main'], function (portal) {//refresh portal
                    portalApp = portal.getApp();
                    portalModel = portalApp.getWidgetCollection()._byId.tasks_0;
                    if (portalModel) {
                        portalApp.refreshWidget(portalModel, 0);
                    }
                });
            }
        },

        /**
         * return array of participants with normalized properties
         * @param  {array} participants (objects)
         * @return {array}
         */
        repairParticipants = function (participants) {
            //current participantsmodel is heavily overloaded but does not
            //contain the needed information ... maybe include this in the
            //standard participants model if calendar etc need the same
            var list = [];
            if (participants && participants.length > 0) {
                _(participants).each(function (participant) {
                    var tmp = {};
                    tmp.type = participant.type;
                    switch (participant.type) {
                    case 1://internal user
                        tmp.type = participant.type;
                        tmp.mail = participant.email1;
                        tmp.display_name = participant.display_name;
                        tmp.id = participant.id;
                        break;
                    case 5://external user
                        tmp.type = participant.type;
                        tmp.mail = participant.mail;
                        tmp.display_name = participant.display_name;
                        tmp.id = 0;
                        break;
                    default://all the rest
                        tmp = participant;
                        break;
                    }
                    list.push(tmp);
                });
                return list;
            } else {
                return participants;
            }
        };

    // generate basic API
    api = apiFactory({
        module: 'tasks',
        keyGenerator: function (obj) {
            var folder = null;
            if (obj) {
                if (obj.folder) {
                    folder = obj.folder;
                } else if (obj.folder_id) {
                    folder = obj.folder_id;
                } else {
                    console.log('no folderAttribute for cache Keygen found, using default');
                    folder = folderAPI.getDefaultFolder('tasks');
                }
            }

            return obj ? folder + '.' + obj.id : '';
        },
        requests: {
            all: {
                folder: folderAPI.getDefaultFolder('tasks'),
                columns: '1,20,101,200,202,203,220,300,301',
                extendColumns: 'io.ox/tasks/api/all',
                sort: '202',
                order: 'asc',
                cache: true, // allow DB cache
                timezone: 'UTC'
            },
            list: {
                action: 'list',
                columns: '1,20,101,200,202,203,220,300,301,309',
                extendColumns: 'io.ox/tasks/api/list',
                timezone: 'UTC'
            },
            get: {
                action: 'get',
                timezone: 'UTC'
            },
            search: {
                action: 'search',
                columns: '1,20,101,200,202,203,220,300,301,309',
                extendColumns: 'io.ox/tasks/api/all',
                sort: '202',
                order: 'asc',
                timezone: 'UTC',
                getData: function (query) {
                    return { pattern: query.pattern, end: query.end, start: query.start };
                }
            }
        }
    });

    /**
     * remove from get/list cache
     * @param  {string|array} key
     * @fires  api#create (task)
     * @return {promise}
     */
    api.removeFromCache = function (key) {
        return $.when(api.caches.get.remove(key), api.caches.list.remove(key));
    };

    /**
     * create a task
     * @param  {object} task
     * @return {deferred} done returns object with id property
     */
    api.create = function (task) {
        task.participants = repairParticipants(task.participants);
        var attachmentHandlingNeeded = task.tempAttachmentIndicator,
            response;
        delete task.tempAttachmentIndicator;
        if (task.alarm === null) {//task.alarm must not be null on creation, it's only used to delete an alarm on update actions
            delete task.alarm;    //leaving it in would throw a backend error
        }
        
        if (task.status === 3 || task.status === '3') {
            task.date_completed = task.date_completed || _.now();//make sure we have date_completed
        } else {
            delete task.date_completed;//remove invalid date_completed
        }
        return http.PUT({
            module: 'tasks',
            params: { action: 'new', timezone: 'UTC' },
            data: task,
            appendColumns: false
        }).then(function (obj) {
            task.id = obj.id;
            response = obj;
            var cacheObj = _.copy(task, true),
                cacheKey = api.cid({folder: cacheObj.folder_id,
                                sort: api.options.requests.all.sort,
                                order: api.options.requests.all.order});
            cacheObj.id = obj.id;
            return api.caches.all.get(cacheKey).then(function (cachevalue) {
                if (cachevalue) {//only add if the key is there
                    cachevalue = cachevalue.concat(cacheObj);
                    cachevalue = util.sortTasks(cachevalue);
                    return api.caches.all.add(cacheKey, cachevalue);
                } else {//just leave it to the next all request, no need to do it here
                    return $.when();
                }
            });
        }).then(function (cache) {
            if (attachmentHandlingNeeded) {
                api.addToUploadList(_.ecid(task));//to make the detailview show the busy animation
            }
            checkForNotifications([{id: response.id, folder_id: task.folder_id}], task);
            api.trigger('create', task);
            return response;
        });
    };

    /**
     * update single task
     * @param  {object} task (id, folder_id, 'changed attributes')
     * @param  {string} newFolder (optional; target folder id)
     * @fires  api#refresh.all
     * @fires  api#update:ecid
     * @return {[type]}
     */
    api.update = function (task, newFolder) {
        var obj, attachmentHandlingNeeded = task.tempAttachmentIndicator;
        delete task.tempAttachmentIndicator;

        //check if oldschool argument list was used (timestamp, taskId, modifications, folder) convert and give notice
        if (arguments.length > 2) {
            console.log('Using old api signature.');
            task = arguments[2];
            task.folder_id = arguments[3];
            task.id = arguments[1];
        }

        //repair broken folder attribute
        if (task.folder) {
            task.folder_id = task.folder;
            delete task.folder;
        }

        var useFolder = task.folder_id;

        if (newFolder && arguments.length === 2) { //folder is only used by move operation, because here we need 2 folder attributes
            task.folder_id = newFolder;
        }
        task.notification = true;//set always (OX6 does this too)

        if (useFolder === undefined) {//if no folder is given use default
            useFolder = api.getDefaultFolder();
        }

        if (task.status === 3 || task.status === '3') {
            task.date_completed = task.date_completed || _.now();// make sure we have date_completed
        } else if (task.status !== 3 && task.status !== '3') {
            task.date_completed = null;
        }

        var key = useFolder + '.' + task.id;
        return http.PUT({
            module: 'tasks',
            params: {action: 'update',
                folder: useFolder,
                id: task.id,
                timestamp: _.then(),
                timezone: 'UTC'
            },
            data: task,
            appendColumns: false
        }).pipe(function () {
            // update cache
            return $.when(api.removeFromCache(key), updateAllCache([task], useFolder, task));
        }).pipe(function () {
            //return object with id and folder id needed to save the attachments correctly
            obj = {folder_id: useFolder, id: task.id};
            //notification check
            checkForNotifications([obj], task);
            if (attachmentHandlingNeeded) {
                api.addToUploadList(_.ecid(task));//to make the detailview show the busy animation
            }
            return obj;
        }).done(function () {
            //trigger refresh, for vGrid etc
            api.trigger('refresh.all');
            api.trigger('update:' + _.ecid({id: task.id, folder_id: useFolder}));
            refreshPortal();
        });

    };

    /**
     * update list of taks used by done/undone and move actions when used with multiple selection
     * @param  {array}    list of task objects (id, folder_id)
     * @param  {object}   modifications
     * @fires  api#refresh.all
     * @return {deferred}
     */
    api.updateMultiple = function (list, modifications) {
        var keys  = [];
        modifications.notification = true;//set always (OX6 does this too)
        http.pause();

        _(list).map(function (obj) {
          //repair broken folder attribute
            if (obj.folder) {
                obj.folder_id = obj.folder;
                delete obj.folder;
            }
            keys.push(obj.folder_id + '.' + obj.id);
            return http.PUT({
                module: 'tasks',
                params: {
                    action: 'update',
                    id: obj.id,
                    folder: obj.folder_id,
                    timestamp: _.then(),
                    timezone: 'UTC'
                },
                data: modifications,
                appendColumns: false
            });
        });
        return http.resume().pipe(function () {
            // update cache
            return $.when(api.removeFromCache(keys), updateAllCache(list, modifications.folder_id || list[0].folder_id, modifications));
        }).done(function () {
            //notification check
            checkForNotifications(list, modifications);
            //trigger refresh, for vGrid etc
            api.trigger('refresh.all');
            refreshPortal();
        });
    };

    /**
     * move task to folder
     * @param  {object|array} task (or array of tasks)
     * @param  {string} newFolder (target folder id)
     * @fires  api#refresh.all
     * @return {deferred} done returns object with properties folder_id and task id
     */
    api.move = function (task, newFolder) {
        // call updateCaches (part of remove process) to be responsive
        return api.updateCaches(task).pipe(function () {
            // trigger visual refresh
            api.trigger('refresh.all');

            if (!task.length) {
                return api.update(task, newFolder);
            } else {
                return api.updateMultiple(task, {folder_id: newFolder});
            }
        });
    };

    /**
     * change confirmation status
     * @param  {object} options (properties: data, folder_id, id)
     * @return {promise}
     */
    api.confirm =  function (options) { //options.id is the id of the task not userId
        var key = (options.folder_id || options.folder) + '.' + options.id;
        return http.PUT({
            module: 'tasks',
            params: {
                action: 'confirm',
                folder: options.folder_id || options.folder,
                id: options.id,
                timezone: 'UTC'
            },
            data: options.data, // object with confirmation attribute
            appendColumns: false
        }).pipe(function (response) {
            api.trigger("mark:task:confirmed", [{id: options.id, data: options.data}]);
            // update cache
            return api.removeFromCache(key);
        });
    };

    /**
     * @return {string} default folder for tasks
     */
    api.getDefaultFolder = function () {
        return folderAPI.getDefaultFolder('tasks');
    };

    /**
     * used for portal plugin
     * @return {deferred} done returns list of tasks
     */
    api.getAllMyTasks = (function () {

        function delegatedToMe(participants) {
            return _(participants).any(function (user) {
                var isMe = user.type === 1 && user.id === ox.user_id,
                    isDeclined = user.confirmation === 2;
                return isMe && !isDeclined;
            });
        }

        function filter(task) {
            return task.participants.length === 0 || delegatedToMe(task.participants);
        }

        return function () {
            return getAllFromAllFolders().pipe(function (list) {
                return _(list).filter(filter);
            });
        };

    }());

    /**
     * get tasks for notification view
     * @fires api#new-tasks (dueTasks)
     * @fires api#set:tasks:to-be-confirmed (confirmTasks)
     * @return {deferred} done returns list of tasks
     */
    api.getTasks = function () {

        return http.GET({//could be done to use all folders, see portal widget but not sure if this is needed
            module: 'tasks',
            params: {action: 'all',
                folder: api.getDefaultFolder(),
                columns: '1,20,200,202,220,203,300,309',
                sort: '202',
                order: 'asc',
                timezone: 'UTC'
            }
        }).pipe(function (list) {
            // sorted by end_date filter over due Tasks
            var now = new Date(),
                userId = ox.user_id,
                dueTasks = [],
                confirmTasks = [];
            for (var i = 1; i < list.length; i++) {
                var filterOverdue = (list[i].end_date < now.getTime() && list[i].status !== 3 && list[i].end_date !== null);
                if (filterOverdue) {
                    dueTasks.push(list[i]);
                }
                for (var a = 0; a < list[i].participants.length; a++) {
                    if (list[i].participants[a].id === userId && list[i].participants[a].confirmation === 0) {
                        confirmTasks.push(list[i]);

                    }
                }
            }
            //even if empty array is given it needs to be triggered to remove
            //notifications that does not exist anymore (already handled in ox6 etc)
            api.trigger('new-tasks', dueTasks);
            api.trigger('set:tasks:to-be-confirmed', confirmTasks);//same here
            return list;
        });
    };

    /**
     * add task to the list
     * @param {string} key (task id)
     * @return {undefined}
     */
    api.addToUploadList = function (key) {
        uploadInProgress[key] = true;
    };

    /**
     * remove task from the list
     * @param  {string} key (task id)
     * @fires  api#update: + key
     * @return {undefined}
     */
    api.removeFromUploadList = function (key) {
        delete uploadInProgress[key];
        //trigger refresh
        api.trigger('update:' + key);
    };

    /**
     * ask if this task has attachments uploading at the moment (busy animation in detail View)
     * @param  {string} key (task id)
     * @return {boolean}
     */
    api.uploadInProgress = function (key) {
        return uploadInProgress[key] || false;//return true boolean
    };

    /**
     * bind to global refresh; clears caches and trigger refresh.all
     * @fires  api#refresh.all
     * @return {promise}
     */
    api.refresh = function () {
        if (ox.online) {
            // clear 'all & list' caches
            api.caches.all.clear();
            api.caches.list.clear();
            api.getTasks().done(function () {
                // trigger local refresh
                api.trigger('refresh.all');
            });
        }

    };

    return api;
});
