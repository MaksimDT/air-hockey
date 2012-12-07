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
            var collisionInfo = this._geometry.getCollisionInfo(otherObj._geometry);

            if (collisionInfo) {
                collisionInfo.firstObj = this;
                collisionInfo.secondObj = otherObj;
            }
        }
        else {
            return {
                isCollision: false
            };
        }
    },
    _reactsOnCollisions: function () {
        return false;
    }
});

//CLASS.
Wall = GameObject.extend({
    init: function (x1, y1, x2, y2)  {
        var geometry = new Rect(x1, y1, x2, y2);
        this._super(geometry, 1);
        this._velocity = new Vector(0, 0);
    },
    onTick: function () {
        //do nothing
    }
});

//CLASS.
Ball = GameObject.extend({
    init: function (initX, initY) {
        var geometry = new Circle(initX, initY, 30);
        this._super(geometry, 1);
        this._velocity = new Vector(10, 10);
    },
    draw: function (ctx) {
        ctx.fillStyle = 'black';
        ctx.arc(this._geometry.x, this._geometry.y, this._geometry.radius, 0, 2 * Math.PI, false);
        ctx.fill();
    },
    checkAndHandleCollision: function (otherObj) {
        var ci = this._super.checkAndHandleCollision(otherObj);

        if (ci) {
            var bounce = 1;
            var friction = 1;
            var newVel = this._geometry.getVelocityAfterCollision(this._velocity, ci.collisionLine, bounce, friction);

            this._velocity = newVel;
        }
    },
    _reactsOnCollisions: function () {
        return true;
    }
});

//CLASS. Represents a container for game objects
GameField = Class.extend({
    init: function (canvas, refreshInterval) {
        assertIsDefined(boundsArray);
        assertIsDefined(canvas);

        //var canvas = Canvas.vsDoc.VSDocCanvasElement;
        this._drawingCtx = canvas.getContext('2d');
        this._width = canvas.width;
        this._height = canvas.height;
    },
    start: function () {
        var self = this;

        //prepare to start...
        self._clearCanvas();
        self.stop();
        self._initGameObjects();

        //..and reset timer
        self._intervalId = window.setInterval(function () {
            self.onTick();
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
                new Wall(-GlobalConstants.INFINITY, -GlobalConstants.INFINITY, +GlobalConstants.INFINITY, 0),
                new Wall(-GlobalConstants.INFINITY, -GlobalConstants.INFINITY, 0, +GlobalConstants.INFINITY),
                new Wall(-GlobalConstants.INFINITY, +this._height, +GlobalConstants.INFINITY, +GlobalConstants.INFINITY),
                new Wall(+this._width, -GlobalConstants.INFINITY, +GlobalConstants.INFINITY, +GlobalConstants.INFINITY),
                new Ball(this._width / 2, this._height / 2)
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