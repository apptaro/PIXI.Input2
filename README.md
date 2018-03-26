# PIXI.Input2
PIXI Input Element with IME Support  
Original Code from https://github.com/SebastianNette/PIXI.Input  
(PIXI Input Element v1.0.1, Copyright (c) 2014, Sebastian Nette, http://www.mokgames.com/)

Substantial changes have been made:
* When focused, HTML Input/Textarea is displayed on top of canvas, thus:
  * Supports Chinese/Japanese/Korean IME.
  * Cleanly supports mobile devices.
* Button & Select support is out of scope and removed.
* Some styling options are not possible and removed.

DEMO: https://apptaro.github.io/PIXI.Input2/test.html

#### How to use ####
Simply load the pixi.input2.js file after your pixi.js file.
```
<script src="pixi.js"></script>
<script src="pixi.input2.js"></script>
```

#### Creating an Text Input ####

```javascript
var input = new PIXI.Input();
stage.addChild(input);
```

#### Creating an Password Input ####

```javascript
var input = new PIXI.Input({ type: "password" });
stage.addChild(input);
```

#### Creating an Textarea ####

```javascript
var textarea = new PIXI.Textarea();
stage.addChild(textarea);
```

#### Reading values ####
```javascript
console.log(input.value);
console.log(textarea.value);
```

#### Customizeable! ####
```javascript
var options = {
    type: "text", // only for Input
    value: "",
    placeholder: "",
    placeholderColor: "#999", // limitation: use with "::placeholder" css
    readonly: false,
    maxlength: null, // only for Input
    onfocus: function() {},
    onblur: function() {},
    oninput: function() {},
    width: 200,
    height: null,
    padding: 2,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 3,
    backgroundColor: "#fff",
    boxShadow: null, // "0px 0px 2px rgba(0, 0, 0, 0.5)"
    innerShadow: null, // "0px 0px 4px rgba(0, 0, 0, 0.5)"
    text: {
        font: "14px Arial",
        fill: "#000",
        align: "left",
        lineHeight: 20
    }
};
var input = new PIXI.Input(options);
```
