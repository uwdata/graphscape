# Angular ZeroClipboard
![bower version](http://img.shields.io/bower/v/angular-zeroclipboard.svg)

An angular wrapper for ZeroClipboard

## Install

```sh
$ bower install angular-zeroclipboard
```

or, you can download 'angular-zeroclipboard.js' form 'src'  dir manualy.

## Sample

### config

```js
angular.module('demo', ['zeroclipboard']).
  config(['uiZeroclipConfigProvider', function(uiZeroclipConfigProvider) {

    // config ZeroClipboard
    uiZeroclipConfigProvider.setZcConf({
      swfPath: '../bower_components/zeroclipboard/dist/ZeroClipboard.swf'
    });

  }])
```

### usage

Example using a two-way model binding

```html
<input type="text" ng-model="myText" />
<button ui-zeroclip zeroclip-copied="copied=true" zeroclip-model="myText">Copy</button>
<span ng-show="copied">Text Copied!</span>
```

Example using interpolated text:

```html
<input type="text" ng-model="myText" />
<button ui-zeroclip zeroclip-copied="copied=true"
        zeroclip-text="This was your text: {{ myText }}">Copy</button>
<span ng-show="copied">The sentence "This was your text: {{ myText }}" was copied!</span>
```

## Config

Configuration passed into `ZeroClipboard.config`

```js
uiZeroclipConfigProvider.setZcConf({
    swfPath: '../path/to/ZeroClipboard.swf'
})
```

If you already have your own configuration and don't want it to be overridden:

```js
uiZeroclipConfigProvider.setOverrideConfig(false);
```

The params is an object. and just same as [ZeroClipboard official config](https://github.com/zeroclipboard/zeroclipboard/blob/master/docs/api/ZeroClipboard.md#configuration-options)

## LICENSE

MIT @ [Leigh Zhu](http://zhu.li)
