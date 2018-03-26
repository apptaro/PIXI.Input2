# PIXI.Input2
PIXI Input Element with IME Support
Original Code from https://github.com/SebastianNette/PIXI.Input
(PIXI Input Element v1.0.1, Copyright (c) 2014, Sebastian Nette, http://www.mokgames.com/)

Substantial changes have been made to support Chinese/Japanese/Korean IME inputs and mobile devices, by overlaying html input elemnets over canvas. Button & Select support is out of scope and removed. Some styling options are not possible and removed.

DEMO: http://mokgames.com/playground/pixi.dom/

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

#### Contribution ####

This is still an early stage for our input elements and there are many things to do!
If you want to contribute to this project, please send a Pull Request. And don't start publishing your own versions of this plugin, or else many different versions might be around, which is just confusing.
