(function () {
  var app = angular.module('slider', ['ngMaterial'])
                   .config(function ($mdThemingProvider) {
                     $mdThemingProvider.theme('default')
                                       .dark();
                   });

  app.controller('SliderController', ['$timeout', '$filter', '$http', function ($timeout, $filter, $http) {

    /**
     * Функция обновления текущей даты
     */
    this.updCurrentDateTime = function () {
      var startDate = new Date(this.data.startDate);
      this.currentDate.setHours(startDate.getHours() + this.currentCadre * this.userHourStep);
    };

    /**
     * Функция вывода данных на консоль для тестирования
     */
    this.consoleTest = function () {
      var result;
      if (this.data.slides.length > 0) {
        result = $filter('date')(this.currentDate, 'dd-MM-yyyy HH:mm:ss');
        if (this.exists('Min temperature', this.data.selectedDefault))  result += '\tMin t: ' + this.data.slides[this.currentCadre].minTemperature + '°C';
        if (this.exists('Max temperature', this.data.selectedDefault))  result += '\tMax t: ' + this.data.slides[this.currentCadre].maxTemperature + '°C';
        if (this.exists('Avg temperature', this.data.selectedDefault))  result += '\tMax t: ' + this.data.slides[this.currentCadre].maxTemperature + '°C';
        if (this.exists('Wind', this.data.selectedDefault))             result += '\ttWind: ' + this.data.slides[this.currentCadre].wind + 'km/h';
        console.log(result);
      }
    };

    /**
     * Функция перехода на следующий слайд
     */
    this.forward = function () {
      var total = this.data.slides.length - 1;
      if (total > 0) {
        var hourStepSelected = parseInt(this.hourStepSelected, 10);
        if (this.currentCadre + hourStepSelected > total) {
          this.currentCadre = total;
        } else if (this.currentCadre == total) {
          this.currentCadre = 0;
        } else {
          this.currentCadre += hourStepSelected;
        }
        this.updCurrentDateTime();
        this.consoleTest();
      }
    };

    /**
     * Функция перехода на предыдущий слайд
     */
    this.rewind = function () {
      var total = this.data.slides.length;
      if (total > 0) {
        var hourStepSelected = parseInt(this.hourStepSelected, 10);
        if (this.currentCadre - hourStepSelected < 0) {
          this.currentCadre = 0;
        } else if (this.currentCadre == 0) {
          this.currentCadre = total - 1;
        } else {
          this.currentCadre -= hourStepSelected;
        }
        this.updCurrentDateTime();
        this.consoleTest();
      }
    };

    /**
     * Функция проверки значения задержки перехода между "слайдами"
     */
    this.onChangeDelay = function () {
      if (typeof this.data.delay !== 'number' && this.autoplay) {
        this.autoplay = false;
        this.pause();
      }
    };

    /**
     * Функция загрузки данных с backend
     * @param url - адрес
     */
    this.loadData = function (url) {
      var slider = this;
      console.log('│║│║│││║║║││║│║│║│║║│││║║║││║││║│║║│║│║││');
      $http.get(url)
           .success(function (data) {
             console.log('* Load data was successful');
             console.log('│║│║│││║││║│║│║║│║║││║│║║║││║│║║║║║│║│║││');
             slider.data.slides = data;
           })
           .error(function (data, status, header) {
             console.log('* Error loading data, try again later');
             console.log(
               '* Data:\n' + data +
               '\n* Status: ' + status +
               '\n* Headers: ' + header + '\n'
             );
             console.log('│║│║│││║│║│║║│║││║║││║│║║││║║│║║│║│║║║║││');
           });
    };

    /**
     * Функция запуска просмотра слайдера
     */
    this.play = function (autoplay) {
      if (autoplay === true) this.autoplay = true;
      var slider   = this;
      this.timeOut = $timeout(function () {
          slider.autoplay = (slider.currentCadre < slider.data.slides.length - 1);
          if (slider.autoplay) {
            slider.forward();
            slider.play();
          }
        },
        this.data.delay
      )
      ;
    };

    /**
     * Функция остановки просмотра слайдера
     */
    this.pause = function () {
      $timeout.cancel(this.timeOut);
      this.timeOut  = null;
      this.autoplay = null;
    };


    this.toggle          = function (item, list) {
      var idx = list.indexOf(item);
      if (idx > -1) {
        list.splice(idx, 1);
      }
      else {
        list.push(item);
      }
    };
    this.exists          = function (item, list) {
      return list.indexOf(item) > -1;
    };
    this.isIndeterminate = function () {
      return (this.data.selectedDefault.length !== 0 && this.data.selectedDefault.length !== this.data.options.length);
    };
    this.isChecked       = function () {
      return this.data.selectedDefault.length === this.data.options.length;
    };
    this.toggleAll       = function () {
      if (this.data.selectedDefault.length === this.data.options.length) {
        this.data.selectedDefault = [];
      } else if (this.data.selectedDefault.length === 0 || this.data.selectedDefault.length > 0) {
        this.data.selectedDefault = this.data.options.slice(0);
      }
    };

    this.data         = weatherData;
    this.currentDate  = new Date(this.data.startDate);
    this.userHourStep = this.data.hourStepDefault;
    this.autoplay     = null;
    this.timeOut      = null;
    this.currentCadre = 0;

    if (this.data.slides.length == 0) this.loadData('resources/__slides.json');
    this.consoleTest();
  }]);

  var weatherData = {
    startDate:        1288323623006,
    hourStepDefault:  1,
    hourStepSelected: 1,
    minDelay:         100,
    stepDelay:        100,
    maxDelay:         5000,
    delay:            500,
    options:          [
      'Min temperature',
      'Max temperature',
      'Avg temperature',
      'Wind',
      'View'
    ],
    selectedDefault:  [
      'Min temperature',
      'Max temperature',
      'Wind'
    ],
    hourStepVariants: [
      {
        label: '1 hour',
        value: 1
      },
      {
        label: '2 hours',
        value: 2
      },
      {
        label: '3 hours',
        value: 3
      },
      {
        label: '4 hours',
        value: 4
      },
      {
        label: '5 hours',
        value: 5
      }],
    slides:           []
  };

})();
