/**
 * Original Code from https://github.com/SebastianNette/PIXI.Input
 * (PIXI Input Element v1.0.1, Copyright (c) 2014, Sebastian Nette, http://www.mokgames.com/)
 *
 * Substantial changes have been made to support Chinese/Japanese/Korean IME inputs and mobile devices,
 * by overlaying html input elemnets over canvas.
 */
(function(undefined) {
	
	"use strict";

	/* -------------------------------------------------------------------------------------------------------------------------- */
	// fundamental functions

	// check for object
	function isObject(obj)
	{
		return typeof obj === "object" && !!obj && !(obj instanceof Array);
	};

	// mixin
	function extend(dest, source, force)
	{
		for (var prop in source)
		{
			if (force)
			{
				dest[prop] = source[prop];
				continue;
			}
			var isObj = isObject(source[prop]);
			if (!dest.hasOwnProperty(prop))
			{
				dest[prop] = isObj ? {} : source[prop];
			}
			if (isObj)
			{
				if (!isObject(dest[prop]))
				{
					dest[prop] = {};
				}
				extend(dest[prop], source[prop]);
			}
		}
		return dest;
	};

	// get scrollbar width ; ref: https://stackoverflow.com/a/13382873
	function getScrollbarWidth()
	{
		var outer = document.createElement("div");
		outer.style.visibility = "hidden";
		outer.style.width = "100px";
		outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

		var inner = document.createElement("div");
		inner.style.width = "100%";

		document.body.appendChild(outer);
		var widthNoScroll = outer.offsetWidth;

		outer.style.overflow = "scroll";
		outer.appendChild(inner);
		var widthWithScroll = inner.offsetWidth;

		outer.parentNode.removeChild(outer);

		return widthNoScroll - widthWithScroll;
	};
	
	function getPropertyDescriptor(proto, propName)
	{
		while (proto)
		{
			var propDesc = Object.getOwnPropertyDescriptor(proto, propName);
			if (propDesc) return propDesc;
			proto = proto.__proto__;
		}
		return undefined;
	}

	/* -------------------------------------------------------------------------------------------------------------------------- */
	// functions for input field texture

	// parse shadow expression
	function parseShadowExpr(opts, isBoxShadow)
	{
		var shadow = isBoxShadow ? opts.boxShadow : opts.innerShadow;

		// parse shadow
		if (shadow && shadow !== "none")
		{
			var vals = shadow.split("px ");
			shadow = {
				x: parseInt(vals[0], 10),
				y: parseInt(vals[1], 10),
				blur: parseInt(vals[2], 10),
				color: vals[3]
			};
		}
		else
		{
			shadow = { x: 0, y: 0, blur: 0, color: "" };
		}

		// extra for box shadow
		if (isBoxShadow)
		{
			opts.shadowLeft = ((shadow.blur - shadow.x) > 0) ? (shadow.blur - shadow.x) : 0;
			opts.shadowRight = ((shadow.blur + shadow.x) > 0) ? (shadow.blur + shadow.x) : 0;
			opts.shadowTop = ((shadow.blur - shadow.y) > 0) ? (shadow.blur - shadow.y) : 0;
			opts.shadowBottom = ((shadow.blur + shadow.y) > 0) ? (shadow.blur + shadow.y) : 0;
			opts.shadowWidth = opts.shadowLeft + opts.shadowRight;
			opts.shadowHeight = opts.shadowTop + opts.shadowBottom;
		}

		return shadow;
	};
	
	// draw rounded rect
	function drawRoundedRect(ctx, x, y, w, h, r)
	{
		var r1, r2, r3, r4;
		if (r instanceof Array)
		{
			r1 = r[0];
			r2 = r[1];
			r3 = r[2];
			r4 = r[3];
		}
		else
		{
			r1 = r;
			r2 = r;
			r3 = r;
			r4 = r;
		}

		if (w < 2 * r1 || h < 2 * r1)
		{
			return drawRoundedRect(ctx, x, y, w || 1, h || 1, 0);
		}

		ctx.beginPath();

		ctx.moveTo(x + r1, y);
		ctx.lineTo(x + w - r2, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r2);
		ctx.lineTo(x + w, y + h - r3);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r3, y + h);
		ctx.lineTo(x + r4, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r4);
		ctx.lineTo(x, y + r1);
		ctx.quadraticCurveTo(x, y, x + r1, y);

		ctx.closePath();
	};

	// generate input field texture
	var shadowCanvas = document.createElement("canvas");
	var shadowContext = shadowCanvas.getContext("2d");
	function drawInputFieldTexture(can, ctx, data)
	{
		// check if box shadow was parsed
		if (!isObject(data.boxShadowData))
		{
			data.boxShadowData = parseShadowExpr(data, true);
		}

		// check if inner shadow was parsed
		if (!isObject(data.innerShadowData))
		{
			data.innerShadowData = parseShadowExpr(data, false);
		}

		// set variables
		var width = data.width = data.width || 100;
		var height = data.height = data.height || 30;
		var padding = data.padding = data.padding || 0;

		var borderRadius = data.borderRadius = data.borderRadius || 0;
		var borderWidth = data.borderWidth = data.borderWidth || 0;

		var shadowTop = data.shadowTop = data.shadowTop || 0;
		var shadowLeft = data.shadowLeft = data.shadowLeft || 0;
		var shadowWidth = data.shadowWidth = data.shadowWidth || 0;
		var shadowHeight = data.shadowHeight = data.shadowHeight || 0;

		var textboxTop = data.textboxTop = shadowTop + borderWidth;
		var textboxLeft = data.textboxLeft = shadowLeft + borderWidth;
		var textboxWidth = data.textboxWidth = width + padding * 2;
		var textboxHeight = data.textboxHeight = height + padding * 2;

		var outerWidth = data.outerWidth = width + padding * 2 + borderWidth * 2 + shadowWidth;
		var outerHeight = data.outerHeight = height + padding * 2 + borderWidth * 2 + shadowHeight;

		// support for resolution
		width *= PIXI.settings.RESOLUTION;
		height *= PIXI.settings.RESOLUTION;
		padding *= PIXI.settings.RESOLUTION;
		borderRadius *= PIXI.settings.RESOLUTION;
		borderWidth *= PIXI.settings.RESOLUTION;
		textboxTop *= PIXI.settings.RESOLUTION;
		textboxLeft *= PIXI.settings.RESOLUTION;
		textboxWidth *= PIXI.settings.RESOLUTION;
		textboxHeight *= PIXI.settings.RESOLUTION;
		outerWidth *= PIXI.settings.RESOLUTION;
		outerHeight *= PIXI.settings.RESOLUTION;

		// set dimensions
		can.width = outerWidth;
		can.height = outerHeight;

		// setup the box shadow
		ctx.shadowOffsetX = data.boxShadowData.x;
		ctx.shadowOffsetY = data.boxShadowData.y;
		ctx.shadowBlur = data.boxShadowData.blur;
		ctx.shadowColor = data.boxShadowData.color;

		// draw the border
		if (borderWidth > 0)
		{
			ctx.fillStyle = data.borderColor;
			drawRoundedRect(ctx, shadowLeft, shadowTop, outerWidth - shadowWidth, outerHeight - shadowHeight, borderRadius);
			ctx.fill();

			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.shadowBlur = 0;
		}

		// draw bg color
		ctx.fillStyle = data.backgroundColor;
		drawRoundedRect(ctx, textboxLeft, textboxTop, textboxWidth, textboxHeight, borderRadius);
		ctx.fill();

		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 0;

		// draw inner shadow
		var innerShadowData = data.innerShadowData;
		if (innerShadowData.blur > 0)
		{
			shadowContext.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
			
			shadowCanvas.width = textboxWidth;
			shadowCanvas.height = textboxHeight;

			shadowContext.shadowBlur = innerShadowData.blur;
			shadowContext.shadowColor = innerShadowData.color;

			// top shadow
			shadowContext.shadowOffsetX = 0;
			shadowContext.shadowOffsetY = innerShadowData.y;
			shadowContext.fillRect(-1 * outerWidth, -100, 3 * outerWidth, 100);

			// right shadow
			shadowContext.shadowOffsetX = innerShadowData.x;
			shadowContext.shadowOffsetY = 0;
			shadowContext.fillRect(shadowCanvas.width, -1 * outerHeight, 100, 3 * outerHeight);

			// bottom shadow
			shadowContext.shadowOffsetX = 0;
			shadowContext.shadowOffsetY = innerShadowData.y;
			shadowContext.fillRect(-1 * outerWidth, shadowCanvas.height, 3 * outerWidth, 100);

			// left shadow
			shadowContext.shadowOffsetX = innerShadowData.x;
			shadowContext.shadowOffsetY = 0;
			shadowContext.fillRect(-100, -1 * outerHeight, 100, 3 * outerHeight);

			// create a clipping mask on the main canvas
			drawRoundedRect(ctx, textboxLeft, textboxTop, textboxWidth, textboxHeight, borderRadius);
			ctx.clip();

			// draw the inner-shadow from the off-DOM canvas
			ctx.drawImage(
				shadowCanvas,
				0, 0, shadowCanvas.width, shadowCanvas.height,
				textboxLeft, textboxTop, textboxWidth, textboxHeight
			);
		}
	};

	/* -------------------------------------------------------------------------------------------------------------------------- */
	// functions for input element
	
	// create input element
	function createInputElement(isTextarea)
	{
		// create html input element
		var input = document.createElement(isTextarea ? "textarea" : "input");
		if (!isTextarea) {
			input.type = "text";
		}
		input.tabindex = -1;
		input.style.position = "absolute";
		input.style.borderStyle = "solid";
		input.style.display = "none";
		if (isTextarea) {
			input.style.resize = "none";
			input.style.overflowY = "scroll";
		}
		
		// add event handlers
		input.addEventListener("blur", function(e)
		{
			if (PIXI.InputObject.currentInput)
			{
				e = e || window.event;
				PIXI.InputObject.currentInput.blur();
			}
		}, false);

		input.addEventListener("input", function(e)
		{
			if (PIXI.InputObject.currentInput)
			{
				e = e || window.event;
				PIXI.InputObject.currentInput.onInput(e);
			}
		});
		
		// workaround window event handlers (add only once)
		if (!PIXI.InputObject.windowEventHandlersInited)
		{
			window.addEventListener("mousedown", function(e)
			{
				if (PIXI.InputObject.currentInput)
				{
					if (!PIXI.InputObject.currentInput.mouseDownOnMe)
					{
						if (e.target != PIXI.InputObject.currentInput.inputElement)
						{
							PIXI.InputObject.currentInput.mouseDownOnMe = false;
							PIXI.InputObject.currentInput.blur();
						}
					}
				}
			});
			window.addEventListener("mouseup", function(e)
			{
				if (PIXI.InputObject.currentInput)
				{
					if (PIXI.InputObject.currentInput.mouseDownOnMe)
					{
						PIXI.InputObject.currentInput.mouseDownOnMe = false;
					}
				}
			});
			window.addEventListener("resize", function(e){
				if (PIXI.InputObject.currentInput)
				{
					PIXI.InputObject.currentInput.setInputElementPosition();
				}
			});
			PIXI.InputObject.windowEventHandlersInited = true;
		}
		
		document.body.appendChild(input);

		return input;
	};
	
	// update input element
	var styleKeys = [ "width", "height", "padding", "borderColor", "borderWidth", "borderRadius", "backgroundColor", "boxShadow", "innerShadow", "outline" ];
	function updateInputElement(input, data)
	{
		// apply styles
		input.style.boxShadow = "";
		for (var i = 0; i < styleKeys.length; i++)
		{
			var key = styleKeys[i];
			var value = data[key];
			if (typeof value !== "undefined")
			{
				if (typeof value === "number")
				{
					value += "px";
				}
				if (key === "boxShadow" || key === "innerShadow")
				{
					if (key === "innerShadow")
					{
						value += " inset";
					}
					if (input.style.boxShadow)
					{
						input.style.boxShadow += ", " + value;
					}
					else
					{
						input.style.boxShadow = value;
					}
				}
				else
				{
					input.style[key] = value;
				}
			}
		}
		
		if (typeof data.text !== "undefined")
		{
			if (typeof data.text.font !== "undefined")
			{
				input.style.font = data.text.font;
			}
			if (typeof data.text.fill !== "undefined")
			{
				input.style.color = data.text.fill;
			}
			if (typeof data.text.align !== "undefined")
			{
				input.style.textAlign = data.text.align;
			}
			if (typeof data.text.lineHeight !== "undefined")
			{
				if (data.isTextarea)
				{
					input.style.lineHeight = data.text.lineHeight + "px";
				}
			}
		}
		
		// apply attributes
		if (!data.isTextarea)
		{
			input.type = data.type;
		}
		input.value = data.value;
		input.placeholder = data.placeholder;
		input.readOnly = data.readonly;
	};

	/* -------------------------------------------------------------------------------------------------------------------------- */
	// core InputObject class

	PIXI.InputObject = function(data)
	{
		this.data = data;

		// call super constructor
		PIXI.Sprite.call(this, PIXI.Texture.EMTPY);

		// create bg sprite
		this.canvas = document.createElement("canvas");
		this.context = this.canvas.getContext("2d");
		this.bgSprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this.canvas));
		this.addChild(this.bgSprite);

		// create input element
		if (!this.data.isTextarea)
		{
			if (!PIXI.InputObject.inputElement)
			{
				PIXI.InputObject.inputElement = createInputElement(false);
			}
			this.inputElement = PIXI.InputObject.inputElement;
		}
		else
		{
			if (!PIXI.InputObject.textareaElement)
			{
				PIXI.InputObject.textareaElement = createInputElement(true);
			}
			this.inputElement = PIXI.InputObject.textareaElement;
		}
		
		// get scrollbar width
		if (!PIXI.InputObject.scrollbarWidth)
		{
			PIXI.InputObject.scrollbarWidth = getScrollbarWidth();
		}

		// create text
		this.text = new PIXI.Text("", this.data.text);
		if (this.data.isTextarea)
		{
			this.text.style.wordWrap = true;
		}
		this.addChild(this.text);

		if (!this.data.height)
		{
			this.data.height = parseInt(PIXI.TextMetrics.measureFont(this.text.style.font).fontSize, 10);
		}

		// create text mask
		this.textMask = new PIXI.Graphics();
		this.addChild(this.textMask);
		this.text.mask = this.textMask;

		// variables for use
		this.lastRendererView = null; // needed to obtain canvas's absolute position
		this.mouseDownOnMe = false; // needed to detect mousedown on other things

		// set up interaction and add event handlers
		this.interactive = true;
		this.cursor = "text";
		
		this.boundOnMouseDown = this.onMouseDown.bind(this);
		this.boundOnMouseUp = this.onMouseUp.bind(this);
		this.boundOnMouseUpOutside = this.onMouseUpOutside.bind(this);

		this.mousedown = this.touchstart = this.boundOnMouseDown;
		this.mouseup = this.touchend = this.boundOnMouseUp;
		this.mouseupoutside = this.touchendoutside = this.boundOnMouseUpOutside;

		// first rendering
		this._textureNeedsUpdate = true;
		this._textNeedsUpdate = true;
		this.update();
	};

	// inheritance ; use Sprite not Graphics, ref: https://github.com/pixijs/pixi.js/issues/1390
	PIXI.InputObject.prototype = Object.create(PIXI.Sprite.prototype);
	PIXI.InputObject.prototype.constructor = PIXI.InputObject;

	// static variables
	PIXI.InputObject.inputElement = null;
	PIXI.InputObject.textareaElement = null;
	PIXI.InputObject.currentInput = null;
	PIXI.InputObject.windowEventHandlersInited = false;
	PIXI.InputObject.scrollbarWidth = 0;

	/* -------------------------------------------------------------- */
	
	// extend prototype
	extend(PIXI.InputObject.prototype, {

		// focus/blur

		focus: function()
		{
			// is already current input
			if (PIXI.InputObject.currentInput === this)
			{
				return;
			}

			// drop focus
			if (PIXI.InputObject.currentInput)
			{
				PIXI.InputObject.currentInput.blur();
			}

			// hide field graphics
			this.visible = false;
			
			// show and focus input element
			this.preShowInputElement();
			this.inputElement.style.display = "block";
			PIXI.InputObject.currentInput = this;
			this.inputElement.focus();

			// check custom focus event
			this.data.onfocus();
		},

		preShowInputElement: function()
		{
			updateInputElement(this.inputElement, this.data);
			this.setInputElementPosition();
		},

		setInputElementPosition: function(){
			var canvasRect = this.lastRendererView.getBoundingClientRect();
			var inputObjectRect = this.getBounds();
			this.inputElement.style.top = (canvasRect.top + inputObjectRect.y + this.data.shadowTop) + "px";
			this.inputElement.style.left = (canvasRect.left + inputObjectRect.x + this.data.shadowLeft) + "px";
		},

		blur: function()
		{
			if (PIXI.InputObject.currentInput === this)
			{
				PIXI.InputObject.currentInput = null;

				// blur and hide input element
				this.inputElement.blur(); // currentInput must be changed before this
				this.inputElement.style.display = "none";

				// show field graphics
				this.visible = true;

				// check custom blur event
				this.data.onblur();
			}
		},

		/* -------------------------------------------------------------- */

		// event listeners

		onInput: function(e)
		{
			// update the canvas input state information from the hidden input
			var text = this.inputElement.value;
			if (text !== this.data.value)
			{
				this.data.value = text;
				this._textNeedsUpdate = true;
			}
			
			// fire custom user event
			this.data.oninput(e, this);
		},

		onMouseDown: function(e)
		{
			// disable 2=middle and 3=right buttons
			var mouseEvent = e.data.originalEvent;
			if (mouseEvent.which === 2 || mouseEvent.which === 3)
			{
				mouseEvent.preventDefault();
				return;
			}

			// prevent focusing on canvas
			mouseEvent.preventDefault();

			// focus input
			this.focus();

			// set cursor position
			var mouse = e.data.getLocalPosition(e.target || this);
			var pos = this.getTextPosition(mouse.x, mouse.y);
			this.inputElement.selectionStart = pos;
			this.inputElement.selectionEnd = pos;
			if (this.data.text.align === "right")
			{
				this.inputElement.scrollLeft = this.inputElement.scrollWidth;
			}
			else if (this.data.text.align === "center")
			{
				// - scrollLeft/scrollWidth is not supported in ie11/edge
				// - scrollLeftMax is only for firefox
				// - (scrollWidth - clientWidth) has issues with chrome with zoom
				// - obtaining scrollLeftMax by assigning large scrollLeft value and reading the value works for chrome & firefox
				this.inputElement.scrollLeft = 99999;
				var scrollLeftMax = this.inputElement.scrollLeft;
				this.inputElement.scrollLeft = scrollLeftMax / 2;
			}
			else
			{ // align=left
				this.inputElement.scrollLeft = 0;
			}
			
			// set the flag to example in window's mouseup
			this.mouseDownOnMe = true;
		},

		onMouseUp: function(e)
		{
			// this is not always called because of visible = false; use window's mouseup to workaround.
			this.mouseDownOnMe = false;
		},

		onMouseUpOutside: function(e)
		{
			// this is not always called because of visible = false; use window's mouseup to workaround.
			this.mouseDownOnMe = false;
		},

		/* -------------------------------------------------------------- */

		// rendering methods

		update: function()
		{
			if (this._textureNeedsUpdate)
			{
				this.updateTexture();
				this.updateTextAlign();
				this._textureNeedsUpdate = false;
			}

			if (this._textNeedsUpdate)
			{
				var isPlaceholder = (!this.data.value);
				var text = (isPlaceholder ? this.data.placeholder : this.data.value) || "";
				if (this.data.type === "password" && !isPlaceholder)
				{
					text = text.replace(/./g, "*");
				}

				this.text.text = text;
				this.text.style.fill = isPlaceholder ? this.data.placeholderColor : this.data.text.fill;
				if (this.data.isTextarea)
				{
					this.text.style.wordWrap = true;
					this.text.style.wordWrapWidth = this.data.textboxWidth - this.data.padding * 2 - PIXI.InputObject.scrollbarWidth;
				}
				this._textNeedsUpdate = false;
			}
		},

		updateTexture: function()
		{
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

			drawInputFieldTexture(this.canvas, this.context, this.data);
			this.data.bgTopOffset = -1 * this.data.textboxTop;
			this.data.bgLeftOffset = -1 * this.data.textboxLeft;
			this.bgSprite.x = this.data.bgLeftOffset;
			this.bgSprite.y = this.data.bgTopOffset;

			var texture = this.bgSprite.texture;
			texture.baseTexture.width = this.canvas.width;
			texture.baseTexture.height = this.canvas.height;
			texture.frame.width = this.canvas.width;
			texture.frame.height = this.canvas.height;
			texture.baseTexture.update();
		},
		
		updateTextAlign: function()
		{
			var textboxTop = this.data.textboxTop + this.data.bgTopOffset;
			var textboxLeft = this.data.textboxLeft + this.data.bgLeftOffset;
			var textboxWidth = this.data.textboxWidth;
			var textboxHeight = this.data.textboxHeight;
			var padding = this.data.padding;
			
			if (this.data.text.align === "right")
			{
				this.text.x = (textboxLeft + textboxWidth - padding) || 0;
				this.text.anchor.x = 1;
			}
			else if (this.data.text.align === "center")
			{
				this.text.x = (textboxLeft + textboxWidth / 2) || 0;
				this.text.anchor.x = 0.5;
			}
			else
			{ // align=left
				this.text.x = (textboxLeft + padding) || 0;
				this.text.anchor.x = 0;
			}
			
			if (this.data.isTextarea)
			{
				this.text.y = (textboxTop + padding) || 0;
			}
			else
			{
				this.text.y = (textboxTop + (textboxHeight - this.text.height) / 2) || 0;
			}
			
			this.textMask.clear();
			this.textMask.beginFill(0x000000);
			this.textMask.drawRect(textboxLeft + padding, textboxTop + padding, textboxWidth - padding * 2, textboxHeight - padding * 2);
			this.textMask.endFill();
			
			this._textNeedsUpdate = true;
		},

		/* -------------------------------------------------------------- */

		// text position calculation

		getTextPosition: function(mouseX, mouseY)
		{
			var textboxLeft = this.data.textboxLeft + this.data.bgLeftOffset;
			var textboxWidth = this.data.textboxWidth;
			var padding = this.data.padding;

			var text = this.text.text;
			var style = this.text.style;
			var minX = textboxLeft + padding;
			var maxX = textboxLeft + textboxWidth - padding;

			if (this.data.text.align === "right")
			{
				var offsetX = maxX - PIXI.TextMetrics.measureText(text, style).width;
				var pos = text.length;
				return this.getTextPositionRightToLeft(text, style, minX, maxX, offsetX, pos, mouseX);
			}
			else if (this.data.text.align === "center")
			{
				var offsetX = textboxLeft + textboxWidth / 2 - PIXI.TextMetrics.measureText(text, style).width / 2;
				var pos = Math.floor(text.length / 2);
				var currX = offsetX + PIXI.TextMetrics.measureText(text.substring(0, pos), style).width;
				if (mouseX < currX) return this.getTextPositionRightToLeft(text, style, minX, maxX, offsetX, pos, mouseX);
				else if (currX < mouseX) return this.getTextPositionLeftToRight(text, style, minX, maxX, offsetX, pos, mouseX);
				else return pos; // mouseX == currX
			}
			else
			{ // align=left
				var offsetX = minX;
				var pos = 0;
				return this.getTextPositionLeftToRight(text, style, minX, maxX, offsetX, pos, mouseX);
			}
		},

		getTextPositionRightToLeft: function(text, style, minX, maxX, offsetX, pos, mouseX)
		{
			var currX = offsetX + PIXI.TextMetrics.measureText(text.substring(0, pos), style).width;
			if (currX <= mouseX) return pos;
			while (true)
			{
				var lastX = currX;
				pos--;
				if (pos < 0) return pos + 1;
				currX = offsetX + PIXI.TextMetrics.measureText(text.substring(0, pos), style).width;
				if (currX < minX) return pos + 1;
				else if (currX <= mouseX)
				{
					if (mouseX - currX < lastX - mouseX) return pos;
					else return pos + 1;
				}
			}
		},

		getTextPositionLeftToRight: function(text, style, minX, maxX, offsetX, pos, mouseX)
		{
			var currX = offsetX + PIXI.TextMetrics.measureText(text.substring(0, pos), style).width;
			if (mouseX <= currX) return pos;
			while (true)
			{
				var lastX = currX;
				pos++;
				if (text.length < pos) return pos - 1;
				currX = offsetX + PIXI.TextMetrics.measureText(text.substring(0, pos), style).width;
				if (maxX < currX) return pos - 1;
				else if (mouseX <= currX)
				{
					if (mouseX - lastX < currX - mouseX) return pos - 1;
					else return pos;
				}
			}
		},

		/* -------------------------------------------------------------- */

		// override pixijs methods

		updateTransform: function()
		{
			this.update();
			PIXI.Sprite.prototype.updateTransform.call(this); // call super method
		},

		renderCanvas: function(renderer)
		{
			this.lastRendererView = renderer.view;
			PIXI.Sprite.prototype.renderCanvas.call(this, renderer); // call super method
		},

		renderWebGL: function(renderer)
		{
			this.lastRendererView = renderer.view;
			PIXI.Sprite.prototype.renderWebGL.call(this, renderer); // call super method
		},

		destroy: function()
		{
			PIXI.Sprite.prototype.destroy.call(this, true); // call super method

			this.interactive = false;
			this.context = null;
			this.canvas = null;
		}

	}, true);

	/* -------------------------------------------------------------- */

	// getters and setters
	Object.defineProperty(PIXI.InputObject.prototype, "x", {
		get: function()
		{
			var propDesc = getPropertyDescriptor(PIXI.Sprite.prototype, "x");
			return propDesc ? propDesc.get.call(this) : undefined;
		},
		set: function(value)
		{
			var propDesc = getPropertyDescriptor(PIXI.Sprite.prototype, "x");
			if (propDesc)
			{
				if (propDesc.get.call(this) != value)
				{
					propDesc.set.call(this, value);
					if (PIXI.InputObject.currentInput === this)
					{
						this.setInputElementPosition();
					}
				}
			}
		}
	});
	
	Object.defineProperty(PIXI.InputObject.prototype, "y", {
		get: function()
		{
			var propDesc = getPropertyDescriptor(PIXI.Sprite.prototype, "y");
			return propDesc ? propDesc.get.call(this) : undefined;
		},
		set: function(value)
		{
			var propDesc = getPropertyDescriptor(PIXI.Sprite.prototype, "y");
			if (propDesc)
			{
				if (propDesc.get.call(this) != value)
				{
					propDesc.set.call(this, value);
					if (PIXI.InputObject.currentInput === this)
					{
						this.setInputElementPosition();
					}
				}
			}
		}
	});
	
	Object.defineProperty(PIXI.InputObject.prototype, "width", {
		get: function()
		{
			return this.data.width;
		},
		set: function(value)
		{
			if (this.data.width != value)
			{
				this.data.width = value;
				this._textureNeedsUpdate = true;
				this._textNeedsUpdate = true;
				this.update();
				if (PIXI.InputObject.currentInput === this)
				{
					updateInputElement(this.inputElement, this.data);
					this.setInputElementPosition();
				}
			}
		}
	});
	
	Object.defineProperty(PIXI.InputObject.prototype, "height", {
		get: function()
		{
			return this.data.height;
		},
		set: function(value)
		{
			if (this.data.height != value)
			{
				this.data.height = value;
				this._textureNeedsUpdate = true;
				this._textNeedsUpdate = true;
				this.update();
				if (PIXI.InputObject.currentInput === this)
				{
					updateInputElement(this.inputElement, this.data);
					this.setInputElementPosition();
				}
			}
		}
	});
	
	Object.defineProperty(PIXI.InputObject.prototype, "value", {
		get: function()
		{
			return this.data.value;
		},
		set: function(value)
		{
			value = value + "";
			if (this.data.value != value)
			{
				this.data.value = value;
				this._textNeedsUpdate = true;
				if (PIXI.InputObject.currentInput === this)
				{
					this.inputElement.value = this.data.value;
				}
			}
		}
	});

	/* -------------------------------------------------------------------------------------------------------------------------- */
	// functions for Input class

	// empty function
	function noop()
	{
	};

	// defaults
	var inputDefaults = {
		type: "text", // text or password
		value: "",
		placeholder: "",
		placeholderColor: "#999", // limitation: use with "::placeholder" css
		readonly: false,
		maxlength: null,
		onfocus: noop,
		onblur: noop,
		oninput: noop
	};
	
	var textareaDefaults = {
		value: "",
		placeholder: "",
		placeholderColor: "#999",
		readonly: false,
		onfocus: noop,
		onblur: noop,
		oninput: noop
	};

	var styleDefaults = {
		width: 200,
		height: null,
		padding: 2,
		borderColor: "#ccc",
		borderWidth: 1,
		borderRadius: 3,
		backgroundColor: "#fff",
		boxShadow: null, // "0px 0px 2px rgba(0, 0, 0, 0.5)",
		innerShadow: null, // "0px 0px 4px rgba(0, 0, 0, 0.5)",
		text: {
			font: "14px Arial",
			fill: "#000",
			align: "left",
			lineHeight: 20
		}
	};
	
	// TODO cross browser & mobile test

	/* -------------------------------------------------------------------------------------------------------------------------- */
	// main Input class
	
	PIXI.Input = function(data)
	{
		data = data || {};
		data = extend(data, { isTextarea: false });
		data = extend(data, inputDefaults);
		data = extend(data, styleDefaults);

		// call super constructor
		PIXI.InputObject.call(this, data);
	};

	// inheritance
	PIXI.Input.prototype = Object.create(PIXI.InputObject.prototype);
	PIXI.Input.prototype.constructor = PIXI.Input;

	/* -------------------------------------------------------------- */

	// extend prototype
	extend(PIXI.Input.prototype, {

		preShowInputElement: function()
		{
			PIXI.InputObject.prototype.preShowInputElement.call(this); // call super method
			
			// check max length
			this.inputElement.removeAttribute("maxLength");
			if (this.data.maxlength)
			{
				this.inputElement.maxLength = this.data.maxlength;
			}
		}

	}, true);
	
	/* -------------------------------------------------------------------------------------------------------------------------- */
	// main Textarea class
	
	PIXI.Textarea = function(data)
	{
		data = data || {};
		data = extend(data, { isTextarea: true });
		data = extend(data, textareaDefaults);
		data = extend(data, styleDefaults);

		// call super constructor
		PIXI.InputObject.call(this, data);
	};

	// inheritance
	PIXI.Textarea.prototype = Object.create(PIXI.InputObject.prototype);
	PIXI.Textarea.prototype.constructor = PIXI.Textarea;
	
})();
