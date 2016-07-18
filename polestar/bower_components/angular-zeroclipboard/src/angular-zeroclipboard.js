angular.module('zeroclipboard', [])
  .provider('uiZeroclipConfig', function() {

    // default configs
    var _zeroclipConfig = {
      buttonClass: '',
      swfPath: "ZeroClipboard.swf",
      trustedDomains: [window.location.host],
      cacheBust: true,
      forceHandCursor: false,
      zIndex: 999999999,
      debug: true,
      title: null,
      autoActivate: true,
      flashLoadTimeout: 30000,
      hoverClass: "zeroclipboard-is-hover",
      activeClass: "zeroclipboard-is-active"
    };
    var _overrideConfig = true;

    this.setZcConf = function(zcConf) {
      angular.extend(_zeroclipConfig, zcConf);
    };
    this.setOverrideConfig = function(overrideConfig) {
      _overrideConfig = overrideConfig;
    }
    this.$get = function() {
      return {
        zeroclipConfig: _zeroclipConfig,
        overrideConfig: _overrideConfig
      };
    };
  })

  .directive('uiZeroclip', ['$document', '$window', 'uiZeroclipConfig',
    function($document, $window, uiZeroclipConfig) {

      var zeroclipConfig = uiZeroclipConfig.zeroclipConfig || {};
      var ZeroClipboard = $window.ZeroClipboard;

      return {
        scope: {
          onCopied: '&zeroclipCopied',
          onError: '&?zeroclipOnError',
          onBeforeCopy: '&?zeroclipOnBeforeCopy',
          client: '=?uiZeroclip',
          value: '=zeroclipModel',
          text: '@zeroclipText'
        },
        link: function(scope, element, attrs) {

          var btn = element[0];
          var _completeHnd;

          // config
          if(uiZeroclipConfig.overrideConfig) {
            ZeroClipboard.config(zeroclipConfig);
          }

          if (angular.isFunction(ZeroClipboard)) {
            scope.client = new ZeroClipboard(btn);
          }

          scope.$watch('value', function(v) {
            if (v === undefined) {
              return;
            }
            element.attr('data-clipboard-text', v);
          });

          scope.$watch('text', function(v) {
            element.attr('data-clipboard-text', v);
          });

          scope.client.on('aftercopy', _completeHnd = function(e) {
            scope.$apply(function() {
              scope.onCopied({$event: e});
            });
          });

          scope.client.on('error', function(e) {
            if (scope.onError) {
              scope.$apply(function() {
                scope.onError({$event: e});
              });
            }
            ZeroClipboard.destroy();
          });

          scope.client.on('beforecopy', function (e) {
            if (scope.onBeforeCopy) {
              scope.$apply(function () {
                  scope.onBeforeCopy({ $event: e });
              });
            }
          });

          scope.$on('$destroy', function() {
            scope.client.off('complete', _completeHnd);
            scope.client = null;
            element.off();
            ZeroClipboard.destroy();
          });
        }
      };
    }
  ]);
