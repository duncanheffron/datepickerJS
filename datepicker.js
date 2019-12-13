(function(window, document) {
    currentDatepicker = null;

    language = 'dutch';

    datepicker = function( query, options ) {
        if (!(this instanceof datepicker))
            return new datepicker( query, options );

        currentDatepicker = self = this;
        self.options = extend({}, datepicker.defaults, options);
        self.query = query;

        if ( self.options.timePicker ) {
            self.options[language].outputFormat += " %H:%M";
        }

        language = self.options.language;
        dateTitle = self.options[language].dateTitle;
        btnReady = self.options[language].btnReady;
        timeTitle = self.options[language].timeTitle;

        self.__init__();
    }

    datepicker.prototype = {
        constructor: datepicker,

        __init__: function(){
            // Bind display on click
            document.removeEventListener('click', self.bindCalendar, false);
            document.removeEventListener('keypress', self.keypressHandler, false);
            document.addEventListener('click', self.bindCalendar, false);
            document.addEventListener('keypress', self.keypressHandler, false);
        },

        matchesReferers: function( elm ){
            self.referers = document.querySelectorAll( self.query );
            for (var i=0; i< self.referers.length; i++) {
                if (elm === self.referers[i]) return true;
            }
            return false;
        },

        close: function(){
            if(self.target) {
                self.target.parentNode.classList.remove('active');
                delete self.current;
                delete self.target;
                if (self.picker) self.picker.remove();
            }
        },

        show: function( target ){
            self.target = typeof target != typeof undefined ? target : self.target;
            if (target || typeof self.current == typeof undefined) {
                var current = new Date();
                if (target) self.selected = null;
                if (target && target.value) {
                    var ts = self.parseDate( target.value );
                    current = new Date( ts );
                    self.selected = {
                        year: current.getFullYear(),
                        month: current.getMonth(),
                        day: current.getDate(),
                        hour: current.getHours(),
                        minute: current.getMinutes()
                    }
                }
                self.current = {
                    year: current.getFullYear(),
                    month: current.getMonth(),
                    day: current.getDate(),
                    hour: current.getHours(),
                    minute: current.getMinutes()
                }
            }
            self.cleanPicker();
            self.drawPicker();
        },

        cleanPicker: function(){
            var picker = document.querySelector('.datepicker');
            if (picker) picker.remove();
        },

        drawPicker: function(){
            var position = {
                x:self.target.offsetLeft,
                y:self.target.offsetTop + self.target.offsetHeight
            };
            opacity = 0;

            self.picker = document.createElement('div');
            self.picker.classList.add('datepicker');
            self.picker.style.left = position.x + 'px';
            self.picker.style.top = position.y + 'px';

            datesTable = document.createElement('table');
            datesTable.classList.add('date-table');
            datesTable.appendChild( self.drawWeekHeader() );
            
            datesTableBody = document.createElement('tbody');
            datesTableBody.classList.add('dates');
            var weeks = self.getWeeks();
            for (var i=0; i<weeks.length; i++) {
                datesTableBody.appendChild( weeks[i] );
            }

            switchToTime = document.createElement('div');
            switchToTime.classList.add('switch-hours-picker', 'input-group');

            switchTimePrepend = document.createElement('div');
            switchTimePrepend.classList.add('input-group-prepend');

            switchTimePrependIcon = document.createElement('i');
            switchTimePrependIcon.classList.add('input-group-text', 'far', 'fa-clock');

            switchTimePrepend.appendChild( switchTimePrependIcon );
            
            switchToHoursInput = document.createElement('select');
            switchToHoursInput.classList.add('custom-select', 'form-hours-picker');
            switchToHoursInput.id = "selectedHour";

            switchToMinutesInput = document.createElement('select');
            switchToMinutesInput.classList.add('custom-select', 'form-minutes-picker');
            switchToMinutesInput.id = "selectedMinute";
            
            if (!self.options.availibleTimesHour){
                self.options.availibleTimesHour = [09, 10, 11, 12, 13, 14, 15, 16, 17, 18];
            }
            
            self.options.availibleTimesHour.forEach(hour => {
                hourOption = document.createElement('option');
                hourOption.value = hour;
                hourOption.innerHTML = ('0' + hour).slice(-2);
                if (self.current.hour == hour) hourOption.selected = true;
                switchToHoursInput.appendChild( hourOption );
            });

            stepMinute = 1;
            if (self.options.availibleTimesMinuteFormat){
                stepMinute = self.options.availibleTimesMinuteFormat;
            }

            availibleTimesMinute = [];
            for ( i = 0; i < 60; i += stepMinute) {
                availibleTimesMinute.push(i);
            }

            roundedStepMinute = Math.round(self.current.minute / stepMinute) * stepMinute;
            availibleTimesMinute.forEach(minute => {
                minuteOption = document.createElement('option');
                minuteOption.value = minute;
                minuteOption.innerHTML = ('0' + minute).slice(-2);
                if (roundedStepMinute == minute) minuteOption.selected = true;
                switchToMinutesInput.appendChild( minuteOption );
            });

            timeHeader = document.createElement('h6');
            timeHeader.classList.add('time-header');
            timeHeader.innerHTML = timeTitle;

            finishPicker = document.createElement('button');
            finishPicker.classList.add('btn', 'btn-outline-success', 'btn-block', 'mt-2');
            finishPicker.id = "finishPicker";
            finishPicker.innerHTML = btnReady;

            switchToTime.appendChild( switchTimePrepend );
            switchToTime.appendChild( switchToHoursInput );
            switchToTime.appendChild( switchToMinutesInput );

            datesTable.appendChild( datesTableBody );

            self.picker.appendChild( self.drawNavigation() );
            self.picker.appendChild( datesTable );

            if ( self.options.timePicker ) {
                self.picker.appendChild( timeHeader );
                self.picker.appendChild( switchToTime );
            }

            self.picker.appendChild ( finishPicker );

            self.target.parentNode.classList.add('active');

            self.target.parentNode.insertBefore( self.picker, self.target.nextSibling );
        },

        drawNavigation: function(){
            var nav = document.createElement('div');
            nav.classList.add('title-nav');

            currentMonth = document.createElement('span');
            currentMonth.classList.add('current-month');
            currentMonth.innerHTML = self.options[language].months.long[self.current.month] + ' ' + self.current.year;

            previousMonth = document.createElement('div');
            previousMonth.classList.add('month-navigate');
            previousMonth.classList.add('previous');
            previousMonth.setAttribute('tabIndex', 0);
            previousMonth.innerHTML = '<';

            nextMonth = document.createElement('div');
            nextMonth.classList.add('month-navigate');
            nextMonth.classList.add('next');
            nextMonth.setAttribute('tabIndex', 0);
            nextMonth.innerHTML = '>';

            headerPicker = document.createElement('h6');
            headerPicker.classList.add('picker-header-title');
            headerPicker.innerHTML = dateTitle;

            closePicker = document.createElement('i');
            closePicker.classList.add('far', 'fa-times', 'close-picker');
            closePicker.addEventListener('click', self.close)

            monthNavigation = document.createElement('div');
            monthNavigation.classList.add('month-navigation');

            monthNavigation.appendChild( previousMonth );
            monthNavigation.appendChild( nextMonth );

            nav.appendChild( headerPicker );
            nav.appendChild( closePicker );
            nav.appendChild( currentMonth );
            nav.appendChild( monthNavigation );

            return nav;
        },

        getPreviousMonth: function() {
            var current = new Date( self.current.year, self.current.month - 1);
            self.current = {
                year: current.getFullYear(),
                month: current.getMonth()
            };
            self.show();
        },

        getNextMonth: function() {
            var current = new Date( self.current.year, self.current.month + 1);
            self.current = {
                year: current.getFullYear(),
                month: current.getMonth()
            };
            self.show();
        },

        drawWeekHeader: function(){
            var weekdays = self.options[language].weekdays.short.slice(self.options.firstDayOfWeek)
                .concat(self.options[language].weekdays.short.slice(0, self.options.firstDayOfWeek));
            var weekTableHead = document.createElement('thead');
            weekTableHead.classList.add('week-header');
            var weekHeader = document.createElement('tr');
            for (var i=0; i<7; i++) {
                var dayOfWeek = document.createElement('th');
                dayOfWeek.setAttribute('tabIndex', 0);
                dayOfWeek.innerHTML = weekdays[i];
                weekHeader.appendChild( dayOfWeek );
            }
            weekTableHead.appendChild( weekHeader );
            return weekTableHead;
        },

        getWeeks: function(){
            // Get week days according to options
            var weekdays = self.options[language].weekdays.short.slice(self.options.firstDayOfWeek)
                .concat(self.options[language].weekdays.short.slice(0, self.options.firstDayOfWeek));
            // Get first day of month and update acconding to options
            var firstOfMonth = new Date(self.current.year, self.current.month, 1).getDay();
            firstOfMonth = firstOfMonth < self.options.firstDayOfWeek ? 7+(firstOfMonth - self.options.firstDayOfWeek ) : firstOfMonth - self.options.firstDayOfWeek;

            var daysInPreviousMonth = new Date(self.current.year, self.current.month, 0).getDate();
            var daysInMonth = new Date(self.current.year, self.current.month+1, 0).getDate();

            var days = [],
                weeks = [];
            // Define last days of previous month if current month does not start on `firstOfMonth`
            for (var i=firstOfMonth-1; i>=0; i--) {
                var day = document.createElement('td');
                day.classList.add( 'no-select' );
                day.innerHTML = daysInPreviousMonth - i;
                days.push( day );
            }
            // Define days in current month
            for (var i=0; i<daysInMonth; i++) {
                if (i && (firstOfMonth+i)%7 === 0) {
                    weeks.push( self.addWeek( days ) );
                    days = [];
                }
                var day = document.createElement('td');
                day.classList.add('day');
                if (self.current && self.current.day == i+1) {
                    day.classList.add('selected');
                }
                if (self.selected && self.selected.year == self.current.year && self.selected.month == self.current.month && self.selected.day == i+1) {
                    day.classList.add('selected');
                }
                day.setAttribute('tabIndex', 0);
                day.innerHTML = i+1;
                days.push( day );
            }
            // Define days of next month if last week is not full
            if (days.length) {
                var len = days.length;
                for (var i=0; i<7-len; i++) {
                    var day = document.createElement('td');
                    day.classList.add( 'no-select' );
                    day.innerHTML = i+1;
                    days.push( day );
                }
                weeks.push( self.addWeek( days ) );
            }
            return weeks;
        },

        addWeek: function( days ) {
            var week = document.createElement('tr');
            week.classList.add('week');
            for (var i=0; i<days.length; i++) {
                week.appendChild( days[i] );
            }
            return week;
        },

        setDate: function( day ) {
            if ( self.options.timePicker ) {
                var hoursInput = ('0' + document.getElementById('selectedHour').value).slice(-2);
                var minutesInput = ('0' + document.getElementById('selectedMinute').value).slice(-2);
            } else {
                var hoursInput = 0;
                var minutesInput = 0;
            }

            var oldDateValue = self.target.value;
            var dayOfWeek = new Date(self.current.year, self.current.month, day).getDay();
            var date = self.options[language].outputFormat
                .replace('%a', self.options[language].weekdays.short[dayOfWeek] )
                .replace('%A', self.options[language].weekdays.long[dayOfWeek] )
                .replace('%d', ('0' + day).slice(-2) )
                .replace('%e', day )
                .replace('%b', self.options[language].months.short[self.current.month] )
                .replace('%B', self.options[language].months.long[self.current.month] )
                .replace('%m', ('0' + (self.current.month+1)).slice(-2) )
                .replace('%w', dayOfWeek )
                .replace('%Y', self.current.year )
                .replace('%H', hoursInput )
                .replace('%M', minutesInput );
            self.target.value = date;

            if ( self.options.timePicker ) {
                self.target.dataset.value = new Date(self.current.year, self.current.month, parseInt(day), hoursInput, minutesInput);
            } else {
                self.target.dataset.value = new Date(self.current.year, self.current.month, parseInt(day));
            }
            
            if (date !== oldDateValue) {
                if ("createEvent" in document) {
                    var changeEvent = document.createEvent("HTMLEvents");
                    changeEvent.initEvent("change", false, true);
                    self.target.dispatchEvent(changeEvent);
                }
                else {
                    self.target.fireEvent("onchange");
                }
            }
        },

        parseDate: function( date ) {
            var acceptedFormats = ['%a', '%A', '%d', '%e', '%b', '%B', '%m', '%w', '%Y', '%H', '%M'],
                pattern = new RegExp( self.options[language].outputFormat.replace(/%[a-zA-Z]/g, '(.+)') ),
                groups = pattern.exec( self.options[language].outputFormat ),
                matches = pattern.exec(date),
                date = new Date();
                
            for (var i = 1; i < matches.length; i++) {
                if (acceptedFormats.indexOf(groups[i]) == -1) {
                    console.log( 'DatePicker : Format error' );
                    break;
                }

                switch (groups[i]) {
                    case '%d':
                    case '%e':
                        date.setDate( matches[i] );
                        break;
                    case '%m':
                        date.setMonth( parseInt(matches[i]) - 1, date.getDate() );
                        break;
                    case '%b':
                        var month = self.options[language].months.short.indexOf( matches[i] );
                    case '%B':
                        month = month != -1 ? month : self.options[language].months.long.indexOf( matches[i] );
                        date.setMonth( month, date.getDate() );
                        break;
                    case '%Y':
                        date.setYear( matches[i] );
                        break;
                }
            }
            return date;
        },

        bindCalendar: function(event) {
            var target = event.target;

            if (target.className == 'month-navigate next') {
                self.getNextMonth();
            } else if (target.className == 'month-navigate previous') {
                self.getPreviousMonth();
            } else if (target.className == 'day') {
                oldDay = document.getElementsByClassName('selected')[0];
                if ( oldDay ) oldDay.classList.remove('selected');
                self.setDate( target.innerHTML );
                target.classList.add('selected');
            } else if (target.id == 'selectedHour' || target.id == 'selectedMinute') {
                day = document.getElementsByClassName('selected')[0].innerHTML;
                self.setDate(day);
            } else if (target.id == 'finishPicker') {
                day = document.getElementsByClassName('selected')[0].innerHTML;
                self.setDate(day);
                self.close();
            } else {
                while (target && !self.matchesReferers( target ) && target.className != 'datepicker') {
                    target = target.parentNode;
                }
                if (target && self.matchesReferers( target )) self.show(target);
                if (!target) self.close();
            }
        },

        keypressHandler: function (event) {
            var keyCode = event.which || event.keyCode;
            if (keyCode === 13) {
                self.bindCalendar(event);
            }
        }
    };

    datepicker.defaults = {
        firstDayOfWeek: 1,
        language: 'english',
        timePicker: true,
        'english': {
            months: {
                short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            },
            outputFormat: '%d-%m-%Y',
            weekdays: {
                short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            },
            dateTitle: "Select Date",
            btnReady: "Done",
            timeTitle: "Select Time"
        },
        'dutch': {
            months: {
                short: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
                long: ['Januarie', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
            },
            outputFormat: '%d-%m-%Y',
            weekdays: {
                short: ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'],
                long: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
            },
            dateTitle: "Selecteer Datum",
            btnReady: "Klaar",
            timeTitle: "Selecteer Tijd"
        }
    };

    // utils
    var extend = function(out) {
        out = out || {};
        for (var i = 1; i < arguments.length; i++) {
            if (!arguments[i])
                continue;
            for (var key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key))
                    out[key] = arguments[i][key];
            }
        }

        return out;
    };
}) (window, document);