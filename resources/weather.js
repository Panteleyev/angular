(function () {
  'use strict';
  var app = angular.module('slider', ['ngMaterial'])
                   .config(function ($mdThemingProvider) {
                     $mdThemingProvider.theme('default')
                                       .dark()
                                       .warnPalette('orange')
                                       .primaryPalette('teal')
                                       .accentPalette('blue-grey');
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
        if (this.exists('Min temperature', this.data.selectedDefault))  result += '\tMin t: ' + this.data.slides[this.currentCadre].minTemperature + ' °C.';
        if (this.exists('Max temperature', this.data.selectedDefault))  result += '\tMax t: ' + this.data.slides[this.currentCadre].maxTemperature + ' °C.';
        if (this.exists('Avg temperature', this.data.selectedDefault))  result += '\tAvg t: ' + (this.data.slides[this.currentCadre].maxTemperature + this.data.slides[this.currentCadre].minTemperature) / 2 + ' °C.';
        if (this.exists('Wind', this.data.selectedDefault))             result += '\tWind: ' + this.data.slides[this.currentCadre].wind + ' km/h.';
        console.log(result);
      }
    };

    /**
     * Функция перехода на следующий слайд
     */
    this.forward = function () {
      var total = this.data.slides.length - 1;

      if (total > 0) {
        var hourStepSelected = parseInt(this.data.hourStepSelected, 10);
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
        var hourStepSelected = parseInt(this.data.hourStepSelected, 10);

        if (this.currentCadre - hourStepSelected < 0) {
          this.currentCadre = 0;
        } else if (this.currentCadre === 0) {
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
     *
     * @param url {string} адрес
     * @param option {string} опция выполнения.
     *                        Принимает следующие значения:
     *                        'settings' - для загрузки настройки слайдера
     *                        'data' - для загрузки данных прогнозы погоды
     */
    this.loadJSON = function (url, option) {
      var slider = this;

      if (typeof url !== 'string') {
        console.log('* Url JSON \'' + url + '\' is not string');
      } else {
        console.log('│║│║│││║║║││║│║│║│║║│││║║║││║││║│║║│║│║││');
        console.log('* Load ' + url + ' ...');
        $http({
          method:  'GET',
          url:     url,
          cache:   true,
          headers: {'Content-Type': 'application/json'}
        }).then(function successCallback(response) {
          console.log('* Load JSON (' + url + ') was successful');

          if (option == 'settings') {
            slider.data = response.data;
            slider.initSettings();
          } else if (option == 'data') {
            slider.data.slides = response.data;
            slider.consoleTest();
          } else {
            console.log('* Option \'' + option + '\' is not known');
          }

          console.log('│║│║│││║││║│║│║║│║║││║│║║║││║│║║║║║│║│║││');
        }, function errorCallback(response) {
          console.log(
            '* Status: ' + response.status +
            '\n* Error loading JSON (' + url + ')' +
            '\n* Try again later'
          );

          console.log('│║│║│││║│║│║║│║││║║││║│║║││║║│║║│║│║║║║││');
        });
      }
    };

    /**
     * Функция запуска проигрывания слайдера
     *
     * @param start {boolean} признак автопроигрывания
     */
    this.play = function (start) {
      var slider = this;

      slider.autoplay = (start === true || slider.currentCadre < slider.data.slides.length - 1);
      if (slider.autoplay) {
        this.timeOut = $timeout(function () {
            slider.autoplay = (slider.currentCadre < slider.data.slides.length - 1);
            slider.forward();
            slider.play();
          },
          this.data.delay
        );
      }
    };

    /**
     * Функция остановки просмотра слайдера
     */
    this.pause = function () {
      $timeout.cancel(this.timeOut);
      this.timeOut  = null;
      this.autoplay = null;
    };

    /**
     * Функция добавления/ удаления элемента item в/ из list, соответственно.
     * Применяется, например, для включения/ отключения опции
     *
     * @param item {*} элемент
     * @param list {Array} -массив включенных элементов
     */
    this.toggle = function (item, list) {
      var idx = list.indexOf(item);

      if (idx > -1) {
        list.splice(idx, 1);
      }
      else {
        list.push(item);
      }
    };

    /**
     * Функция проверки наличия элемента item в массиве list
     *
     * @param item {*} проверяемый элемент
     * @param list {Array} массив элементов
     * @returns {boolean} -если элемент найден, то возвращается true, в противном случае - false
     */
    this.exists = function (item, list) {
      try {
        return list.indexOf(item) > -1;
      } catch (e) {
        return false;
      }
    };

    /**
     * Функция проверки неравенства длины массива items с длиной исходного массива list
     *
     * @param items {Array} проверяемый массив
     * @param list {Array} исходный массив
     * @returns {boolean} если длина items не равна длине исходного массива list, то возвращается true.
     *                    В противном случае взвращается false
     */
    this.isIndeterminate = function (items, list) {
      try {
        return (items.length !== 0 && items.length !== list.length);
      } catch (e) {
        return false;
      }
    };

    /**
     * Функция сравнения длины массива items с длиной исходного массива list
     *
     * @param items {Array} проверяемый массив
     * @param list {Array} исходный массив
     * @returns {boolean} если длина массива items равна длине массива items, то возвращается true.
     *                    В противном случае взвращается false
     */
    this.isChecked = function (items, list) {
      try {
        return items.length === list.length;
      } catch (e) {
        return false;
      }
    };

    /**
     * Функция переключения между заполненным массивом list и пустым массивом []
     *
     * @param items {Array} проверяемый массив
     * @param list {Array} исходный массив
     * @returns {Array} пустой массив или копия массива list
     */
    this.toggleAll = function (items, list) {
      if (items.length === list.length) {
        return [];
      } else if (items.length === 0 || items.length > 0) {
        return list.slice(0);
      }
    };

    /**
     * Функция иницилизация настроек слайдера
     */
    this.initSettings = function () {
      try {
//      this.data = response.data;
        this.currentDate  = new Date(this.data.startDate);
        this.userHourStep = this.data.hourStepDefault;
        this.autoplay     = null;
        this.timeOut      = null;
        this.currentCadre = 0;
      } catch (e) {
        console.log('* initSettings: error.\n* ' + e);
      }
    };

    /**
     * Инициализация слайдера погоды погоды
     * @param urlSettings
     * @param urlData
     */
    this.init = function (urlSettings, urlData) {
      this.loadJSON(urlSettings, 'settings');
      this.loadJSON(urlData, 'data');
    };

  }]);

})();