/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define('io.ox/tasks/util',
    ['gettext!io.ox/tasks',
     'settings!io.ox/tasks',
     'io.ox/core/date'
    ], function (gt, settings, date) {

    'use strict';

    var lookupArray = [60000 * 5,           //five minutes
                       60000 * 15,          //fifteen minutes
                       60000 * 30,          //thirty minutes
                       60000 * 60],         //one hour]

        lookupDaytimeStrings = [gt('this morning'),
                                gt('by noon'),
                                gt('this afternoon'),
                                gt('tonight'),
                                gt('late in the evening')],

        lookupWeekdayStrings = [gt('next Sunday'),
                                gt('next Monday'),
                                gt('next Tuesday'),
                                gt('next Wednesday'),
                                gt('next Thursday'),
                                gt('next Friday'),
                                gt('next Saturday')];

    var util = {
            computePopupTime: function (value) {
                var endDate = new date.Local(),
                    weekDay = endDate.getDay(),
                    alarmDate = new date.Local();

                switch (value) {
                case '5':
                    alarmDate.setTime(alarmDate.getTime() + lookupArray[0]);
                    break;
                case '15':
                    alarmDate.setTime(alarmDate.getTime() + lookupArray[1]);
                    break;
                case '30':
                    alarmDate.setTime(alarmDate.getTime() + lookupArray[2]);
                    break;
                case '60':
                    alarmDate.setTime(alarmDate.getTime() + lookupArray[3]);
                    break;
                default:
                    prepareTime(alarmDate);
                    switch (value) {
                    case 'd0':
                        alarmDate.setHours(6);
                        break;
                    case 'd1':
                        alarmDate.setHours(12);
                        break;
                    case 'd2':
                        alarmDate.setHours(15);
                        break;
                    case 'd3':
                        alarmDate.setHours(18);
                        break;
                    case 'd4':
                        alarmDate.setHours(22);
                        break;
                    default:
                        alarmDate.setHours(6);
                        switch (value) {
                        case 't':
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24);
                            break;
                        case 'ww':
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * 7);
                            break;
                        case 'w0':
                            var day = alarmDate.getDay() % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w1':
                            var day = (((alarmDate.getDay() - 1) % 7) + 7) % 7;//workaround: javascript modulo operator to stupid to handle negative numbers
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w2':
                            var day = (((alarmDate.getDay() - 2) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w3':
                            var day = (((alarmDate.getDay() - 3) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w4':
                            var day = (((alarmDate.getDay() - 4) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w5':
                            var day = (((alarmDate.getDay() - 5) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w6':
                            var day = (((alarmDate.getDay() - 6) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        default:
                            //cannot identify selector...set time now
                            //maybe errormessage
                            alarmDate = new Date();
                            break;
                        }
                        break;
                    }
                    break;
                }

                prepareTime(endDate);
                if (weekDay < 1 || weekDay > 4) {
                    weekDay = (((endDate.getDay() - 1) % 7) + 7) % 7;
                    endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - weekDay));
                } else {
                    weekDay = (((endDate.getDay() - 5) % 7) + 7) % 7;
                    endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - weekDay));
                }

                if (alarmDate.getTime() > endDate.getTime()) {//endDate should not be before alarmDate
                    endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * 7);
                }
                //end Date does not have a time
                endDate.setHours(0);
                var result = {
                        endDate: endDate,
                        alarmDate: alarmDate
                    };
                return result;
            },

            //builds dropdownmenu nodes, if o.bootstrapDropdown is set listnodes are created else option nodes
            buildDropdownMenu: function (o) {
                if (!o) {
                    o = {};
                }
                if (!o.time) {
                    o.time = new date.Local();
                }
                //get the values
                var options = this.buildOptionArray(o),
                    result = [];

                //put the values in nodes
                if (o.bootstrapDropdown) {
                    _(options).each(function (obj) {
                        result.push($('<li>').append($('<a tabindex="1" role="menuitem" href="#">').val(obj[0]).text(obj[1])));
                    });
                } else {
                    _(options).each(function (obj) {
                        result.push($('<option>').val(obj[0]).text(obj[1]));
                    });
                }

                return result;
            },

            //returns the same as buildDropdownMenu but returns an array of value string pairs
            buildOptionArray: function (o) {
                if (!o) {
                    o = {};
                }
                if (!o.time) {
                    o.time = new date.Local();
                }
                var result = [],
                    i;
                if (!o.daysOnly) {
                    result = [[5, gt('in 5 minutes')],
                              [15, gt('in 15 minutes')],
                              [30, gt('in 30 minutes')],
                              [60, gt('in one hour')]];
    
                    // variable daytimes
                    i = o.time.getHours();
    
                    if (i < 6) {
                        i = 0;
                    } else if (i < 12) {
                        i = 1;
                    } else if (i < 15) {
                        i = 2;
                    } else if (i < 18) {
                        i = 3;
                    } else if (i < 22) {
                        i = 4;
                    }
    
                    while (i < lookupDaytimeStrings.length) {
                        result.push(['d' + i, lookupDaytimeStrings[i]]);
                        i++;
                    }
                }

                //weekdays
                var circleIncomplete = true,
                    startday = o.time.getDay();

                i = (o.time.getDay() + 2) % 7;

                result.push(['t', gt('tomorrow')]);

                while (circleIncomplete) {
                    result.push(['w' + i, lookupWeekdayStrings[i]]);
                    if (i < 6) {
                        i++;
                    } else {
                        i = 0;
                    }

                    if (i === startday) {
                        result.push(['ww', gt('in one week')]);
                        circleIncomplete = false;
                    }
                }

                return result;
            },

            //change status number to status text. format enddate to presentable string
            //if detail is set, alarm and startdate get converted too and status text is set for more states than overdue and success
            interpretTask: function (task, detail)
            {
                task = _.copy(task, true);
                if (task.status === 3) {
                    task.status = gt('Done');
                    task.badge = 'badge badge-success';

                } else {

                    var now = new Date();
                    if (task.end_date !== undefined && task.end_date !== null && now.getTime() > task.end_date) {//no state for task over time, so manual check is needed
                        task.status = gt('Overdue');
                        task.badge = 'badge badge-important';
                    } else if (detail && task.status) {
                        switch (task.status) {
                        case 1:
                            task.status = gt('Not started');
                            task.badge = 'badge';
                            break;
                        case 2:
                            task.status = gt('In progress');
                            task.badge = 'badge';
                            break;
                        case 4:
                            task.status = gt('Waiting');
                            task.badge = 'badge';
                            break;
                        case 5:
                            task.status = gt('Deferred');
                            task.badge = 'badge';
                            break;
                        }
                    } else {
                        task.status = '';
                        task.badge = '';
                    }
                }



                if (task.title === undefined || task.title === null) {
                    task.title = '\u2014';
                }

                if (task.end_date !== undefined && task.end_date !== null) {
                    task.end_date = new date.Local(task.end_date).format(date.DATE);
                } else {
                    task.end_date = '';
                }

                if (detail) {
                    if (task.start_date !== undefined && task.start_date !== null) {
                        task.start_date = new date.Local(task.start_date).format(date.DATE);
                    } else {
                        task.start_date = '';
                    }
                    if (task.date_completed) {
                        task.date_completed = new date.Local(task.date_completed).format();
                    }

                    if (task.alarm !== undefined && task.alarm !== null) {
                        task.alarm = new date.Local(task.alarm).format();
                    } else {
                        task.alarm = '';
                    }
                }

                return task;
            },

            sortTasks: function (tasks, order) {//done tasks last, overduetasks first, same or no date alphabetical
                tasks = _.copy(tasks, true);//make local copy
                if (!order) {
                    order = 'asc';
                }

                var resultArray = [],
                    dateArray = [],
                    emptyDateArray = [],
                    alphabetSort = function (a, b) {//sort by alphabet
                            if (a.title > b.title) {
                                return 1;
                            } else {
                                return -1;
                            }
                        },
                    dateSort = function (a, b) {//sort by endDate. If equal, sort by alphabet
                            /* jshint eqeqeq: false */
                            if (a.end_date > b.end_date) {
                                return 1;
                            } else if (a.end_date == b.end_date) {// use == here so end_date=null and end_date=undefined are equal. may happen with done tasks
                                return alphabetSort(a, b);
                            }
                            else {
                                return -1;
                            }
                            /* jshint eqeqeq: true */
                        };

                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].status === 3) {
                        resultArray.push(tasks[i]);
                    } else if (tasks[i].end_date === null || tasks[i].end_date === undefined) {
                        emptyDateArray.push(tasks[i]);//tasks without end_date
                    } else {
                        dateArray.push(tasks[i]);// tasks with end_date
                    }
                }
                //sort by end_date and alphabet
                resultArray.sort(dateSort);
                //sort by alphabet
                emptyDateArray.sort(alphabetSort);
                //sort by end_date and alphabet
                dateArray.sort(dateSort);

                if (order === 'desc') {
                    resultArray.push(emptyDateArray.reverse(), dateArray.reverse());
                    resultArray = _.flatten(resultArray);
                } else {
                    resultArray.unshift(dateArray, emptyDateArray);
                    resultArray = _.flatten(resultArray);
                }
                return resultArray;
            },

            getPriority: function (data) {
                // normal?
                if (data && data.priority === 2) return $();
                var i = '<i class="icon-exclamation"/>',
                    indicator = $('<span>').append(_.noI18n('\u00A0'), i, i, i);
                if (data && data.priority === 3) {
                    return indicator.addClass('high').attr('title', gt('High priority'));
                } else {
                    return indicator.addClass('low').attr('title', gt('Low priority'));
                }
            }
        };

    var prepareTime = function (time) {
        time.setMilliseconds(0);
        time.setSeconds(0);
        time.setMinutes(0);

        return time;
    };

    return util;
});
