/// <reference path="utils.js" />
/// <reference path="geometry.js" />
/// <reference path="canvas-vsdoc.js" />

//==========================GAME OBJECTS========================

//CLASS.
GameObject = Class.extend({
    //CTOR.
    init: function (geometry, collisionGroups, moveContext) {
        assertIsDefined(geometry);

        this._geometry = geometry;
        this._velocity = new Vector(0, 0);

        if (collisionGroups == undefined) {
            collisionGroups = [0];
        }

        if (!moveContext) {
            moveContext = new Object();

            moveContext = {
                maxVelocity: 10,
                acceleration: new Vector(0, 0),
                dampingCoeff: 1.2
            };
        }

        if (moveContext.maxVelocity == undefined) {
            moveContext.maxVelocity = 10;
        }

        if (moveContext.acceleration == undefined) {
            moveContext.acceleration = new Vector(0, 0);
        }

        if (moveContext.dampingCoeff == undefined) {
            moveContext.dampingCoeff = 1.2;
        }

        this._collisionGroups = collisionGroups;
        this._inCollision = false;
        this._moveContext = moveContext;
    },
    onTick: function () {
        var acc = this._moveContext.acceleration;

        if (!acc.isZeroVector()) {
            var newVelocity = this._velocity.add(acc);

            if (newVelocity.modulus() <= this._moveContext.maxVelocity) {
                this._velocity = newVelocity;
            }
        }
        else {
            this._velocity = this._velocity.multiplyByScalar(1 / this._moveContext.dampingCoeff);
        }

        this._geometry.move(this._velocity);
    },
    draw: function (ctx) {
        //do nothing
    },
    checkAndHandleCollision: function (otherObj) {
        if (this._reactsOnCollisions() && this._colGroupsMatch(otherObj)) {
            var collisionInfo = this._geometry.checkAndHandleCollision({
                currentVelocity: this._velocity,
                otherGeometry: otherObj._geometry
            });

            collisionInfo.otherObj = otherObj;

            if (collisionInfo.isCollision) {
                this._onCollision(collisionInfo);
                return true;
            }
        }

        return false;
    },
    restorePrevPosition: function () {
        this._geometry.restorePrevPosition();
    },
    _colGroupsMatch: function (otherObj) {
        var cgs1 = this._collisionGroups;
        var cgs2 = otherObj._collisionGroups;

        var match = false;

        cgs1.forEach(function (cg1) {
            cgs2.forEach(function (cg2) {
                if (cg1 == cg2) {
                    match = true;
                }
            });
        });

        return match;
    },
    _onCollision: function (collisionInfo) {
        this._velocity = collisionInfo.velocity;//.add(collisionInfo.otherObj._velocity.multiplyByScalar(0.2));
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
    init: function (initX, initY, radius, initVelocity) {
        assertIsDefined(initX);
        assertIsDefined(initY);
        assertIsDefined(radius);
        assertIsDefined(initVelocity);

        var geometry = new Circle(initX, initY, radius);
        this._super(geometry, [0], {
            dampingCoeff: 1,
            maxVelocity: 20
        });
        this._velocity = initVelocity;
    },
    draw: function (ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.arc(this._geometry.x, this._geometry.y, this._geometry.radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
    },
    getCenterCoords: function () {
        return this._geometry.center();
    },
    _reactsOnCollisions: function () {
        return true;
    }
});

Racket = GameObject.extend({
    init: function (x, yMiddle, height, ball) {
        assertIsDefined(x);
        assertIsDefined(yMiddle);
        assertIsDefined(height);
        assertIsDefined(ball);

        var geometry = new LineSegment(new Point(x, yMiddle - height / 2), new Point(x, yMiddle + height / 2));
        this._super(geometry);
        this._velocity = new Vector(0, 0);
        this._ball = ball;
    },
    onTick: function () {
        this._super();
        if (!this._inCollision) {
            this._trackBall();
        }
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
    _onCollision: function (collisionInfo) {
        this._velocity.y = collisionInfo.velocity.y;
    },
    _trackBall: function () {
        var ballCenter = this._ball.getCenterCoords();
        var needToTrack = ballCenter.x < this._getX();

        if (needToTrack) {
            if (this._getCenterY() - ballCenter.y > this._getLength() / 3) {
                this._goUp();
            }
            else if (ballCenter.y - this._getCenterY() > this._getLength() / 3) {
                this._goDown();
            }
            else {
                this._stop();
            }
        }
        else {
            this._stop();
        }
    },
    _getLength: function () {
        return this._geometry.getLength();
    },
    _getCenterY: function () {
        return this._geometry.getCenter().y;
    },
    //TODO: magic numbers detected. Hacks detected too
    _goUp: function () {
        this._moveContext.dampingCoeff = 1;
        this._moveContext.acceleration.y = -3;
    },
    _goDown: function () {
        this._moveContext.dampingCoeff = 1;
        this._moveContext.acceleration.y = 3;
    },
    _getX: function () {
        return this._geometry.P1.x;
    },
    _stop: function () {
        this._moveContext.acceleration.y = 0;
        this._moveContext.dampingCoeff = 10;
    },
    _reactsOnCollisions: function () {
        return true;
    }
});

Mallet = GameObject.extend({
    init: function (initX, initY, radius) {
        var geometry = new Circle(initX, initY, radius);
        this._super(geometry, [0, 1], {
            maxVelocity: 20
        });
        this._velocity = new Vector(0, 0);
    },
    draw: function (ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'grey';
        ctx.arc(this._geometry.x, this._geometry.y, this._geometry.radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
    },
    accelerate: function (vect) {
        this._moveContext.acceleration = vect;
    },
    _onCollision: function (collisionInfo) {
        this._moveContext.acceleration.x = 0;
        this._moveContext.acceleration.y = 0;
        this._super(collisionInfo);
    },
    _reactsOnCollisions: function () {
        return true;
    }
});

SeparatingWall = GameObject.extend({
    init: function (x, height) {
        var geometry = new LineSegment(new Point(x, 0), new Point(x, height));
        this._super(geometry, [1]);
        this._velocity = new Vector(0, 0);
    },
    onTick: function () {
    }
});

//CLASS. This is a mediator between the DOM API and game's logic
UserInputController = Class.extend({
    init: function (mallet, canvas) {
        assertIsDefined(mallet);
        assertIsDefined(canvas);

        this._mallet = mallet;
        this._canvas = canvas;

        this._pressedBtns = [];
        this._pressedBtns["W"] = false;
        this._pressedBtns["D"] = false;
        this._pressedBtns["S"] = false;
        this._pressedBtns["A"] = false;

        this._ticksPressed = 0;
    },
    startTracking: function () {
        var self = this;

        document.onkeydown = function (event) {
            self._refreshPressedBtnsArray(event.keyCode, 'keydown');
            self._mallet.accelerate(self._getMalletDirection());
        }

        document.onkeyup = function (event) {
            self._refreshPressedBtnsArray(event.keyCode, 'keyup');
            self._mallet.accelerate(self._getMalletDirection());
        };
    },
    stopTracking: function () {
        document.onkeydown = undefined;
        document.onkeyup = undefined;
    },
    _refreshPressedBtnsArray: function (keyCode, operation) {
        var chr = null;

        switch (event.keyCode) {
            case 'W'.charCodeAt(0):
                chr = 'W';
                break;
            case 'D'.charCodeAt(0):
                chr = 'D';
                break;
            case 'S'.charCodeAt(0):
                chr = 'S';
                break;
            case 'A'.charCodeAt(0):
                chr = 'A'
                break;
        }

        if (chr != null) {
            if (operation == 'keydown') {
                this._pressedBtns[chr] = true;
            }
            else if (operation == 'keyup') {
                this._pressedBtns[chr] = false;
            }
        }
    },
    _getMalletDirection: function () {
        var directionX = 0;
        var directionY = 0;

        if (this._pressedBtns["W"]) {
            directionY -= 1;
        }

        if (this._pressedBtns["D"]) {
            directionX += 1;
        }

        if (this._pressedBtns["S"]) {
            directionY += 1;
        }

        if (this._pressedBtns["A"]) {
            directionX -= 1;
        }

        return new Vector(directionX, directionY);
    }
});

//CLASS. Represents a container for game objects
GameField = Class.extend({
    init: function (canvas, refreshInterval) {
        assertIsDefined(canvas);
        assertIsDefined(refreshInterval);

        this._drawingCtx = canvas.getContext('2d');
        this._width = canvas.width;
        this._height = canvas.height;
        this._refreshInterval = refreshInterval;
        this._canvas = canvas;
    },
    start: function () {
        var self = this;

        //prepare to start...
        self._clearCanvas();
        self.stop();
        self._initGameObjects();

        self._controller.startTracking();

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

        if (this._controller) {
            this._controller.stopTracking();
        }
    },
    _initGameObjects: function () {
        var ball = new Ball(this._width / 3, this._height / 3, this._height / 30, new Vector(15, 1));
        var mallet = new Mallet(this._width / 3, this._height / 2, this._height / 15);

        this._gameObjects =
            [
                new Wall(0, 0, this._width, 0),
                new Wall(this._width, 0, this._width, this._height),
                new Wall(this._width, this._height, 0, this._height),
                new Wall(0, this._height, 0, 0),
                ball,
                mallet,
                new Racket(this._width - this._width / 3, this._height / 2, this._height / 2, ball)
                //new SeparatingWall(this._width / 2, this._height)
            ];

        //TODO:
        this._controller = new UserInputController(mallet, this._canvas);
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
            var inCollision = false;

            self._gameObjects.forEach(function (go2) {
                if (go1 != go2) {
                    var res = go1.checkAndHandleCollision(go2);
                    if (res) {
                        inCollision = true;
                    }
                }
            });

            go1._inCollision = inCollision;
        });

        self._gameObjects.forEach(function (go) {
            if (go._inCollision) {
                go.restorePrevPosition();
            }
            go._inCollision = false;
        });
    }
});