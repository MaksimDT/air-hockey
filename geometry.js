﻿/// <reference path="utils.js" />

//NOTE: the origin of coordinates is located in (0, 0)

//CLASS. Represents a point in two-dimensional space
Point = Class.extend({
    init: function (x, y) {
        this.x = x;
        this.y = y;
    },
    distanceTo: function (otherPoint) {
        return Math.sqrt((this.x - otherPoint.x) * (this.x - otherPoint.x) + (this.y - otherPoint.y) * (this.y - otherPoint.y));
    }
});

//CLASS. Almost the same thing as a point!
Vector = Point.extend({
    init: function (x, y) {
        this._super(x, y);
    },
    projectOn: function (vect) {
        assertIsDefined(vect);

        //let's project w on v
        var v = vect;
        var w = this;
        var proj = v._dotProduct(w) / v._squaredModulus();
        //projection is a vector too
        return new Vector(proj * v.x, proj * v.y);
    },
    projectOnLine: function (line) {
        assertIsDefined(line);
        var vectOnLine = line.getCollinearVector();
        return this.projectOn(vectOnLine);
    },
    getOrthogonalVector: function () {
        var wx, wy;

        if (almostZero(this.x)) {
            wx = 1;
            wy = -this.x / this.y;
        }
        else {
            wx = -this.y / this.x;
            wy = 1;
        }

        return new Vector(wx, wy);
    },
    modulus: function () {
        return Math.sqrt(this._squaredModulus());
    },
    looksInSameDirection: function (vect) {
        assertIsDefined(vect);
        return this._dotProduct(vect) > 0;
    },
    looksInDifferentDirection: function (vect) {
        assertIsDefined(vect);
        return !this.looksInSameDirection(vect);
    },
    turnAround: function () {
        return new Vector(-this.x, -this.y);
    },
    add: function (vect) {
        return new Vector(this.x + vect.x, this.y + vect.y);
    },
    _squaredModulus: function () {
        return this._dotProduct(this);
    },
    _dotProduct: function (vect) {
        assertIsDefined(vect);
        return this.x * vect.x + this.y * vect.y;
    }
});

//CLASS
Line = Class.extend({
    init: function (P1, P2) {
        assertIsDefined(P1);
        assertIsDefined(P2);
        this.P1 = P1;
        this.P2 = P2;
    },
    getCollinearVector: function () {
        return new Vector(this.P2.x - this.P1.x, this.P2.y - this.P1.y);
    },
    getOrthogonalLine: function () {
        var v = this.getCollinearVector();
        var w = v.getOrthogonalVector();
        
        return new Line(new Point(0, 0), new Point(w.x, w.y));
    }
});

//STATIC CLASS. Contains the logic of collision detection
CollisionManager = {
    rectIntersectsCircle: function (rect, circle) {
        var self = this;

        //rectangle intersects circle in two cases:
        //1) the circle's center is inside the rectangle
        //2) at least one of rectangle's edges intersects the circle

        //checking 1)
        if (rect.isPointInside(circle.center())) {
            //TODO: WTF???
            return new Line(new Point(rect.x1, rect.y1), new Point(rect.x1, rect.y2));
        }
        else {
            //checking 2)
            var lineSegments = [
                new LineSegment(new Point(rect.x1, rect.y1), new Point(rect.x1, rect.y2)),
                new LineSegment(new Point(rect.x1, rect.y2), new Point(rect.x2, rect.y2)),
                new LineSegment(new Point(rect.x2, rect.y2), new Point(rect.x2, rect.y1)),
                new LineSegment(new Point(rect.x2, rect.y1), new Point(rect.x1, rect.y1))
            ];

            //assume that there's no collision
            var collisionLine = null;
            var collidedSegments = [];

            //...and check for collision with every rectangle's edge
            lineSegments.forEach(function (lineSeg) {
                var cl = self.lineSegmentIntersectsCircle(lineSeg, circle);
                if (cl) {
                    collisionLine = cl;
                    collidedSegments.push(lineSeg);
                }
            });

            if (collidedSegments.length == 2) {
                var p1 = collidedSegments[0].getCenter();
                var p2 = collidedSegments[1].getCenter();

                return new Line(p1, p2);
            }
            else {
                return collisionLine;
            }
        }
    },
    lineSegmentIntersectsCircle: function (lineSegment, circle) {
        //1) find the closest point to the circle on the segment
        
        //find the projection of AX on AB, where X is the circle's center

        var A = lineSegment.P1;
        var B = lineSegment.P2;

        var AB = new Vector(B.x - A.x, B.y - A.y);
        var AX = new Vector(circle.x - A.x, circle.y - A.y);
        
        var proj = AX.projectOn(AB);

        //find the point closest to the circle's center
        var closestPoint = null;

        if (!proj.looksInSameDirection(AB)) {
            closestPoint = A;
        }
        else if (proj.modulus() < AB.modulus()) {
            //the closest point is the end of projection of AX to AB
            closestPoint = new Point(A.x + proj.x, A.y + proj.y);;
        }
        else {
            closestPoint = B;
        }

        if (closestPoint.distanceTo(circle.center()) <= circle.radius) {
            return new Line(A, B);
        }
        else {
            return null;
        }
    }
};

//ABSTRACT CLASS
AGeometry = Class.extend({
    init: function (styleInfo) {
        this._styleInfo = styleInfo;
    },
    move: function (vect) {
        this._savePrevPosition();
    },
    checkAndHandleCollision: function (movingCtx) {
        assertIsDefined(movingCtx);
        assertIsDefined(movingCtx.currentVelocity);
        assertIsDefined(movingCtx.otherGeometry);

        var cl = this._getCollisionLine(movingCtx.otherGeometry);

        if (cl) {
            //there is a collision. Let's rollback to previous position
            this._restorePrevPosition();

            var r = cl;
            var q = cl.getOrthogonalLine();

            var v_old_r = movingCtx.currentVelocity.projectOnLine(r);
            var v_old_q = movingCtx.currentVelocity.projectOnLine(q);
            var v_new_r = v_old_r;
            var v_new_q = v_old_q.turnAround();

            return v_new_r.add(v_new_q);
        }
        else {
            return movingCtx.currentVelocity;
        }
    },
    _savePrevPosition: function () {
        this._prev = null;
        this._prev = this.deepCopy();
    },
    _restorePrevPosition: function () {
    },
    _getCollisionLine: function (otherGeometry) {
        return null;
    }
});

//CLASS. Represents a rectangle which left top and right bottom corners are in (x1, y1) and (x2, y2) respectively
Rect = AGeometry.extend({
    //CTOR.
    init: function (x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    },
    //METHOD. Determines whether the specified point is inside the rectangle
    isPointInside: function (point) {
        return (this.x1 <= point.x && point.x <= this.x2) && (this.y1 <= point.y && point.y <= this.y2);
    },
    move: function (vect) {
        this.x1 += vect.x;
        this.y1 += vect.y;
        this.x2 += vect.x;
        this.y2 += vect.y;
    },
    getWidth: function () {
        return this.x2 - this.x1;
    },
    getHeight: function () {
        return this.y2 - this.y1;
    },
    _restorePrevPosition: function () {
        if (this._prev) {
            this.x1 = this._prev.x1;
            this.y1 = this._prev.y1;
            this.x2 = this._prev.x2;
            this.y2 = this._prev.y2;
        }
    },
    _getCollisionLine: function (otherGeometry) {
        if (otherGeometry instanceof Circle) {
            return CollisionManager.rectIntersectsCircle(this, otherGeometry);
        }
        else {
            return null;
        }
    }
});

//CLASS.
Circle = AGeometry.extend({
    //CTOR.
    init: function (x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    },
    center: function () {
        return new Point(this.x, this.y);
    },
    move: function (vector) {
        this._super();
        this.x += vector.x;
        this.y += vector.y;
    },
    _restorePrevPosition: function () {
        if (this._prev) {
            this.x = this._prev.x;
            this.y = this._prev.y;
            this.radius = this._prev.radius;
        }
    },
    _getCollisionLine: function (otherGeometry) {
        assertIsDefined(otherGeometry);
        if (otherGeometry instanceof Rect) {
            return CollisionManager.rectIntersectsCircle(otherGeometry, this);
        }
        else if (otherGeometry instanceof LineSegment) {
            return CollisionManager.lineSegmentIntersectsCircle(otherGeometry, this);
        }
        else {
            return null;
        }
    }
});

//CLASS.

LineSegment = AGeometry.extend({
    init: function (P1, P2) {
        assertIsDefined(P1);
        assertIsDefined(P2);

        this.P1 = P1;
        this.P2 = P2;
    },
    move: function (vector) {
        this._super();

        this.P1.x += vector.x;
        this.P1.y += vector.y;
        this.P2.x += vector.x;
        this.P2.y += vector.y;
    },
    getCenter: function () {
        return new Point((this.P1.x + this.P2.x) / 2, (this.P1.y + this.P2.y) / 2);
    },
    _getCollisionLine: function (otherGeometry) {
        assertIsDefined(otherGeometry);
        if (otherGeometry instanceof Circle) {
            return CollisionManager.lineSegmentIntersectsCircle(this, otherGeometry);
        }
        else {
            return null;
        }
    }
});