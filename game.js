/// <reference path="utils.js" />
/// <reference path="geometry.js" />
/// <reference path="canvas-vsdoc.js" />

//==========================GAME OBJECTS========================

//CLASS.
GameObject = Class.extend({
    //CTOR.
    init: function (geometry) {
        assertIsDefined(geometry);

        this._geometry = geometry;
        this._velocity = new Vector(0, 0);
    },
    onTick: function () {
        this._geometry.move(this._velocity);
    },
    draw: function (ctx) {
        //do nothing
    },
    checkAndHandleCollision: function (otherObj) {
        if (this._reactsOnCollisions()) {
            var newVelocity = this._geometry.checkAndHandleCollision({
                currentVelocity: this._velocity,
                otherGeometry: otherObj._geometry
            });

            this._velocity = newVelocity;
        }
    },
    _reactsOnCollisions: function () {
        return false;
    }
});

//CLASS.
Wall = GameObject.extend({
    init: function (x1, y1, x2, y2) {
        var geometry = new LineSegment(new Point(x1, y1), new Point(x2, y2));
        this._super(geometry);
        this._velocity = new Vector(0, 0);
    },
    onTick: function () {
        //do nothing
    },
    draw: function (ctx) {
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(this._geometry.P1.x, this._geometry.P1.y);
        ctx.lineTo(this._geometry.P2.x, this._geometry.P2.y);
        ctx.stroke();
        ctx.closePath();
    }
});

//CLASS.
Ball = GameObject.extend({
    init: function (initX, initY) {
        var geometry = new Circle(initX, initY, 30);
        this._super(geometry);
        this._velocity = new Vector(20, 3);
    },
    draw: function (ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.arc(this._geometry.x, this._geometry.y, this._geometry.radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
    },
    _reactsOnCollisions: function () {
        return true;
    }
});

Racket = GameObject.extend({
    init: function (x, yMiddle, height) {
        var geometry = new LineSegment(new Point(x, yMiddle - height / 2), new Point(x, yMiddle + height / 2));
        this._super(geometry);
        this._velocity = new Vector(0, 0);
    },
    draw: function (ctx) {
        var ls = this._geometry;

        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.moveTo(ls.P1.x, ls.P1.y);
        ctx.lineTo(ls.P2.x, ls.P2.y);
        ctx.stroke();
        ctx.closePath();
    },
    _reactsOnCollisions: function () {
        return false;
    }
});

//CLASS. Represents a container for game objects
GameField = Class.extend({
    init: function (canvas, refreshInterval) {
        assertIsDefined(canvas);
        assertIsDefined(refreshInterval);

        //var canvas = Canvas.vsDoc.VSDocCanvasElement;
        this._drawingCtx = canvas.getContext('2d');
        this._width = canvas.width;
        this._height = canvas.height;
        this._refreshInterval = refreshInterval;
    },
    start: function () {
        var self = this;

        //prepare to start...
        self._clearCanvas();
        self.stop();
        self._initGameObjects();

        //..and reset timer
        self._intervalId = window.setInterval(function () {
            self._onTick();
        },
        self._refreshInterval);
    },
    stop: function () {
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
            this._intervalId = null;
        }
    },
    _initGameObjects: function () {
        this._gameObjects =
            [
                new Wall(0, 0, this._width, 0),
                new Wall(this._width, 0, this._width, this._height),
                new Wall(this._width, this._height, 0, this._height),
                new Wall(0, this._height, 0, 0),
                new Ball(this._width / 3, this._height / 3),
                new Racket(this._width - this._width / 3, this._height / 2, 150)
            ];
    },
    _onTick: function () {
        var self = this;
        self._gameObjects.forEach(function (gameObj) { 
            gameObj.onTick();
        });
        self._processCollisions();
        self._clearCanvas();
        self._gameObjects.forEach(function (gameObj) {
            gameObj.draw(self._drawingCtx);
        });
    },
    _clearCanvas: function () {
        // Store the current transformation matrix
        this._drawingCtx.save();
        // Use the identity matrix while clearing the canvas
        this._drawingCtx.setTransform(1, 0, 0, 1, 0, 0);
        this._drawingCtx.clearRect(0, 0, this._width, this._height);
        // Restore the transform
        this._drawingCtx.restore();
    },
    _processCollisions: function () {
        var self = this;
        self._gameObjects.forEach(function (go1) {
            self._gameObjects.forEach(function (go2) {
                if (go1 != go2) {
                    go1.checkAndHandleCollision(go2);
                }
            });
        });
    }
});