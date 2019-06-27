/// <reference path="utils.js" />
/// <reference path="phys_engine.js" />
/// <reference path="canvas-vsdoc.js" />

//==========================GAME OBJECTS========================

//CLASS.
GameObject = Class.extend({
    //CTOR.
    init: function (geometry, collisionGroups, moveContext, weight) {
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
                minVelocity: undefined,
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
        this._moveContext = moveContext;

        if (!weight) {
            weight = 1;
        }

        this._weight = weight;
    },
    onTick: function () {
        var acc = this._moveContext.acceleration;

        if (!acc.isZeroVector()) {
            this._velocity = this._velocity.add(acc);
        }
        else {
            this._velocity = this._velocity.multiplyByScalar(1 / this._moveContext.dampingCoeff);
        }

        if (this._moveContext.minVelocity) {
            //tweaking current velocity vector so that velocity's modulus won't be under some specified value
            var curVmodulus = this._velocity.modulus();

            if (curVmodulus < this._moveContext.minVelocity) {
                this._velocity = this._velocity.multiplyByScalar(this._moveContext.minVelocity / curVmodulus);
            }
        }

        if (this._velocity.modulus() > this._moveContext.maxVelocity) {
            this._velocity = this._velocity.scaleTo(this._moveContext.maxVelocity);
        }

        this._geometry.move(this._velocity);
    },
    draw: function (ctx) {
        //do nothing
    },
    needCollisionHandling: function(otherObj) {
        return this._reactsOnCollisions() && this._colGroupsMatch(otherObj);
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
        if (this._fallsBack(collisionInfo.otherObj)) {
            this._geometry.move(collisionInfo.fallbackVector);
        }
        this._velocity = collisionInfo.velocity;
    },
    _reactsOnCollisions: function () {
        return false;
    },
    _fallsBack: function (otherObj) {
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
    }
});

Net = Wall.extend({
    init: function (x1, y1, x2, y2, onCollisionCbk, owner) {
        this._super(x1, y1, x2, y2);
        this._collisionGroups = [0, 3];
        this._onCollisionCbk = onCollisionCbk;
        this.owner = owner;
    },
    _onCollision: function (collisionInfo) {
        if (collisionInfo.otherObj instanceof Ball) {
            this._onCollisionCbk();
        }
    },
    _reactsOnCollisions: function () {
        return true;
    }
});

//CLASS.
Ball = GameObject.extend({
    init: function (initX, initY, radius, initVelocity, moveContext) {
        assertIsDefined(initX);
        assertIsDefined(initY);
        assertIsDefined(radius);
        assertIsDefined(initVelocity);

        var geometry = new Circle(initX, initY, radius);
        this._super(geometry, [0, 3], moveContext);
        this._velocity = initVelocity;

        this._img = new Image(radius * 2, radius * 2);
        this._img.src = 'ball.png';
    },
    draw: function (ctx) {
        var g = this._geometry;
        ctx.drawImage(this._img, g.x - g.radius, g.y - g.radius, g.radius * 2, g.radius * 2);
    },
    getCenterCoords: function () {
        return this._geometry.center();
    },
    _reactsOnCollisions: function () {
        return true;
    },
    _fallsBack: function (otherObj) {
        return true;
    }
});

Racket = GameObject.extend({
    init: function (x, yMiddle, height, ball, visibleWidth, moveContext) {
        assertIsDefined(x);
        assertIsDefined(yMiddle);
        assertIsDefined(height);
        assertIsDefined(ball);
        assertIsDefined(visibleWidth);

        var geometry = new LineSegment(new Point(x, yMiddle - height / 2), new Point(x, yMiddle + height / 2));
        this._super(geometry, [0], moveContext);
        this._velocity = new Vector(0, 0);
        this._ball = ball;
        this._visibleWidth = visibleWidth;

        this._img = new Image();
        this._img.src = 'racket.png';
    },
    onTick: function () {
        this._super();
        if (!this.inCollision) {
            this._trackBall();
        }
        else {
            this._stop();
        }
    },
    draw: function (ctx) {
        var ls = this._geometry;

        ctx.drawImage(this._img, ls.P1.x, ls.P1.y, this._getVisibleWidth(), this._getLength());
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
    _goUp: function () {
        this._moveContext.dampingCoeff = 1;
        this._moveContext.acceleration.y = -1;
    },
    _goDown: function () {
        this._moveContext.dampingCoeff = 1;
        this._moveContext.acceleration.y = 1;
    },
    _getX: function () {
        return this._geometry.P1.x;
    },
    _getVisibleWidth: function () {
        return this._visibleWidth;
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
    init: function (initX, initY, radius, moveContext) {
        var geometry = new Circle(initX, initY, radius);
        this._super(geometry, [0, 1], moveContext, 100);
        this._velocity = new Vector(0, 0);

        this._img = new Image(radius * 2, radius * 2);
        this._img.src = 'mallet.png';
    },
    draw: function (ctx) {
        var g = this._geometry;
        ctx.drawImage(this._img, g.x - g.radius, g.y - g.radius, g.radius * 2, g.radius * 2);
    },
    accelerate: function (vect) {
        this._moveContext.acceleration = vect.multiplyByScalar(2);
    },
    _onCollision: function (collisionInfo) {
        this._super(collisionInfo);
    },
    _reactsOnCollisions: function () {
        return true;
    },
    _fallsBack: function (otherObj) {
        return !(otherObj instanceof Ball) || otherObj.inCollision;
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
InputController = Class.extend({
    init: function (mallet, transport) {
        assertIsDefined(mallet);
        assertIsDefined(transport);

        this._mallet = mallet;
        this._transport = transport;

        this._pressedBtns = [];
        this._pressedBtns["W"] = false;
        this._pressedBtns["D"] = false;
        this._pressedBtns["S"] = false;
        this._pressedBtns["A"] = false;

        this._ticksPressed = 0;
    },
    startTracking: function () {
    },
    stopTracking: function () {
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

UserInputController = InputController.extend({
    init: function (mallet, transport) {
        this._super(mallet, transport);
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

        this._transport.send(this._pressedBtns);
    }
});

RivalInputController = InputController.extend({
    init: function (mallet, transport) {
        this._super(mallet, transport);
    },
    startTracking: function () {
        var self = this;

        this._transport.subscribe(function (btns) {
            self._pressedBtns = btns;
            self._mallet.accelerate(self._getMalletDirection());
        });
    },
    stopTracking: function () {
        this._transport.unsubscribe();
    }
});

//CLASS. Represents a container for game objects
GameField = Class.extend({
    init: function (canvas, transport, position, refreshInterval, redrawFreq) {
        assertIsDefined(canvas);
        assertIsDefined(transport);
        assertIsDefined(position);
        assertIsDefined(refreshInterval);
        assertIsDefined(redrawFreq);
        assert(redrawFreq > 0);

        this._drawingCtx = canvas.getContext('2d');
        this._transport = transport;
        this._position = position;
        this._width = canvas.width;
        this._height = canvas.height;
        this._refreshInterval = refreshInterval;
        this._canvas = canvas;
        this._redrawFreq = redrawFreq;

        this._userScore = 0;
        this._rivalScore = 0;
        this._maxScore = 5;

        this._tickCounter = 0;
    },
    start: function () {
        var self = this;

        //prepare to start...
        self._clearCanvas();
        self.stop();
        self._initGameObjects();

        self._controller.startTracking();
        self._rivalController.startTracking();

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

        if (this._rivalController) {
            this._rivalController.stopTracking();
        }
    },
    stopAndResetScore: function () {
        this.stop();
        this._userScore = 0;
        this._rivalScore = 0;
    },
    _initGameObjects: function () {
        var self = this;

        var ballRadius = this._height / 15;

        var ball = new Ball(this._width / 3, this._height / 3, ballRadius, new Vector(15, 1), {
            maxVelocity: ballRadius / 5,
            minVelocity: ballRadius / 10,
            dampingCoeff: 1
        });

        var xLeft = this._width / 3;
        var xRight = this._width - this._width / 3;

        var myX = (this._position == "left" ? xLeft : xRight);
        var rivalX = (this._position == "left" ? xRight : xLeft);

        var mallet = new Mallet(myX, this._height / 2, this._height / 10, {
            maxVelocity: ballRadius / 5
        });

        var rivalMallet = new Mallet(rivalX, this._height / 2, this._height / 10, {
            maxVelocity: ballRadius / 5
        });
        // var racket = new Racket(this._width - this._width / 3, this._height / 2, this._height / 3, ball, ballRadius / 2, {
        //     maxVelocity: (ballRadius / 7) * ((this._userScore + 1) / this._maxScore)
        // });

        var userNetX = (this._position == "left" ? 0 : this._width);
        var rivalNetX = (this._position == "left" ? this._width : 0);

        var userNet = new Net(userNetX, this._height, userNetX, 0, function () {
            self._onGoal(userNet);
        }, 'user');

        var rivalNet = new Net(rivalNetX, 0, rivalNetX, this._height, function () {
            self._onGoal(rivalNet);
        }, 'rival');

        this._gameObjects =
            [
                new Wall(0, 0, this._width, 0),
                rivalNet,
                new Wall(this._width, this._height, 0, this._height),
                userNet,
                ball,
                mallet,
                rivalMallet,
                new SeparatingWall(this._width / 2, this._height)
            ];

        this._controller = new UserInputController(mallet, this._transport);
        this._rivalController = new RivalInputController(mallet, this._transport);
    },
    _onTick: function () {
        var self = this;
        self._gameObjects.forEach(function (gameObj) { 
            gameObj.onTick();
        });
        self._processCollisions();

        self._tickCounter++;

        if (self._tickCounter == self._redrawFreq) {
            self._draw();
        }
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

        self._gameObjects.forEach(function (go) {
            go.inCollision = false;
        });

        for (var i = 0; i < self._gameObjects.length; ++i) {
            for (var j = i + 1; j < self._gameObjects.length; ++j) {
                var go1 = self._gameObjects[i];
                var go2 = self._gameObjects[j];

                if (go1.needCollisionHandling(go2) || go2.needCollisionHandling(go1)) {
                    var ci = CollisionManager.getCollisionInfo(
                        {
                            geometry: go1._geometry,
                            velocity: go1._velocity,
                            weight: go1._weight
                        },
                        {
                            geometry: go2._geometry,
                            velocity: go2._velocity,
                            weight: go2._weight
                        });

                    if (ci != null) {
                        go1._onCollision({
                            velocity: ci.objInfo1.velocity,
                            fallbackVector: ci.objInfo1.fallbackVector,
                            otherObj: go2
                        });
                        go2._onCollision({
                            velocity: ci.objInfo2.velocity,
                            fallbackVector: ci.objInfo2.fallbackVector,
                            otherObj: go1
                        });
                        go1.inCollision = true;
                        go2.inCollision = true;
                    }
                }
            }
        }
    },
    _draw: function () {
        var self = this;

        self._clearCanvas();
        self._gameObjects.forEach(function (gameObj) {
            gameObj.draw(self._drawingCtx);
        });

        var ctx = self._canvas.getContext('2d');

        ctx.font = "normal 14px Verdana";
        ctx.fillStyle = "red";
        ctx.fillText(this._userScore.toString(), 10, 10);
        ctx.fillText(this._rivalScore.toString(), this._width - 10, 10);

        self._tickCounter = 0;
    },
    _onGoal: function (net) {
        if (net.owner == 'user') {
            this._rivalScore++;
        }
        else if (net.owner == 'rival') {
            this._userScore++;
        }

        if (this._rivalScore == this._maxScore || this._userScore == this._maxScore) {
            this.stopAndResetScore();
            this.start();
        }
        else {
            this.start();
        }
    }
});