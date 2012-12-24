/// <reference path="utils.js" />

//NOTE: the origin of coordinates is located in (0, 0)

//CLASS. Represents a point in two-dimensional space
Point = Class.extend({
    init: function (x, y) {
        this.x = x;
        this.y = y;
    },
    distanceTo: function (otherPoint) {
        return Math.sqrt((this.x - otherPoint.x) * (this.x - otherPoint.x) + (this.y - otherPoint.y) * (this.y - otherPoint.y));
    },
    addVector: function (vect) {
        return new Point(this.x + vect.x, this.y + vect.y);
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
    multiplyByScalar: function (a) {
        return new Vector(this.x * a, this.y * a);
    },
    isZeroVector: function () {
        return almostZero(this.x) && almostZero(this.y);
    },
    scaleTo: function (targetModulus) {
        if (almostZero(this.modulus())) {
            return new Vector(0, 0);
        }
        else if (targetModulus > 0) {
            return this.multiplyByScalar(targetModulus / this.modulus());
        }
        else {
            return this.multiplyByScalar(-targetModulus / this.modulus()).turnAround();
        }
    },
    _squaredModulus: function () {
        return this._dotProduct(this);
    },
    _dotProduct: function (vect) {
        assertIsDefined(vect);
        return this.x * vect.x + this.y * vect.y;
    }
});
Vector.fromTwoPoints = function (P1, P2) {
    return new Vector(P2.x - P1.x, P2.y - P1.y);
}

//CLASS
Line = Class.extend({
    init: function (P1, P2) {
        assertIsDefined(P1);
        assertIsDefined(P2);
        this.setP1(P1);
        this.setP2(P2);
    },
    getCollinearVector: function () {
        return new Vector(this.P2.x - this.P1.x, this.P2.y - this.P1.y);
    },
    getOrthogonalLine: function () {
        var v = this.getCollinearVector();
        var w = v.getOrthogonalVector();
        
        return new Line(new Point(0, 0), new Point(w.x, w.y));
    },
    getOrthogonalVector: function () {
        return this.getCollinearVector().getOrthogonalVector();
    },
    getDistanceToPoint: function (p) {
        var A = this._getA();
        var B = this._getB();
        var C = this._getC();
        var x = p.x;
        var y = p.y;

        return Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
    },
    getParallelPassingThroughPoint: function (p) {
        assertIsDefined(p);
        assert(p instanceof Point);

        var moveVect = Vector.fromTwoPoints(this.P1, p);
        
        return new Line(this.P1.addVector(moveVect), this.P2.addVector(moveVect));
    },
    setP1: function (P1) {
        assertIsDefined(P1);
        assert(P1 instanceof Point);
        this.P1 = P1;
        this._resetCache();
    },
    setP2: function (P2) {
        assertIsDefined(P2);
        assert(P2 instanceof Point);
        this.P2 = P2;
        this._resetCache();
    },
    _getA: function () {
        if (this._a == undefined) {
            this._a = this.P1.y - this.P2.y;
        }
        return this._a;
    },
    _getB: function () {
        if (this._b == undefined) {
            this._b = this.P2.x - this.P1.x;
        }
        return this._b;
    },
    _getC: function () {
        if (this._c == undefined) {
            var x1 = this.P1.x;
            var x2 = this.P2.x;
            var y1 = this.P1.y;
            var y2 = this.P2.y;
            this._c = x1 * (y2 - y1) - y1 * (x2 - x1);
        }
        return this._c;
    },
    _resetCache: function () {
        this._a = undefined;
        this._b = undefined;
        this._c = undefined;
    }

});

//STATIC CLASS. Contains the logic of collision detection and standard collision handling mechanisms
CollisionManager = {
    getCollisionInfo: function (objInfo1, objInfo2) {
        var geom1 = objInfo1.geometry;
        var geom2 = objInfo2.geometry;

        var cl;
        var fallbackVector1;
        var fallbackVector2;

        if (geom1 instanceof Circle && geom2 instanceof LineSegment ||
            geom2 instanceof Circle && geom1 instanceof LineSegment) {

            var lineSegment = geom1 instanceof LineSegment ? geom1 : geom2;
            var circle = geom2 instanceof Circle ? geom2 : geom1;

            cl = this.getCollisionLine_linesegment_circle(lineSegment, circle);

            if (cl) {
                var collisionDepth = circle.radius - cl.getDistanceToPoint(circle.center());

                var fallbackVector = cl.getOrthogonalVector().scaleTo(collisionDepth + 1);

                if (cl.getDistanceToPoint(circle.center()) > cl.getDistanceToPoint(circle.center().addVector(fallbackVector))) {
                    fallbackVector = fallbackVector.turnAround();
                }
                

                if (geom1 instanceof Circle) {
                    fallbackVector1 = fallbackVector;
                    fallbackVector2 = fallbackVector.turnAround();
                }
                else {
                    fallbackVector1 = fallbackVector.turnAround();
                    fallbackVector2 = fallbackVector;
                }
            }
        }
        else if (geom1 instanceof Circle && geom2 instanceof Circle) {
            cl = this.getCollisionLine_circle_circle(geom1, geom2);

            if (cl) {
                var collisionDepth = geom1.radius + geom2.radius - geom1.center().distanceTo(geom2.center());

                fallbackVector1 = Vector.fromTwoPoints(geom2.center(), geom1.center()).scaleTo(collisionDepth + 1);
                fallbackVector2 = fallbackVector1.turnAround();
            }
        }
        else if (geom1 instanceof LineSegment && geom2 instanceof LineSegment) {
            //TODO: implement
        }
        else {
            throw new Error("No collision detection logic found for the specified types of geometry");
        }

        if (cl) {
            /*breaking down velocities of the objects into the two compontents: 
            first that is parallel to collision line (axis "y") and second that is orthogonal to it (axis "x")*/
            var y = cl;
            var x = cl.getOrthogonalLine();

            //HACK: here comes the hack... na-na-na-na
            if (geom1 instanceof Circle && geom2 instanceof Circle) {
                var m1 = objInfo1.weight;
                var m2 = objInfo2.weight;
                var v1x_vect = objInfo1.velocity.projectOnLine(x);
                var v2x_vect = objInfo2.velocity.projectOnLine(x);

                var v1x = v1x_vect.modulus();
                var v2x = v2x_vect.modulus();

                if (v1x_vect.looksInDifferentDirection(x.getCollinearVector())) {
                    v1x = -v1x;
                }

                if (v2x_vect.looksInDifferentDirection(x.getCollinearVector())) {
                    v2x = -v2x;
                }

                var v1x_new = ((m1 - m2) * v1x + 2 * m2 * v2x) / (m1 + m2);
                var v2x_new = (2 * m1 * v1x + (m2 - m1) * v2x) / (m1 + m2);

                return {
                    objInfo1: {
                        fallbackVector: fallbackVector1,
                        velocity: objInfo1.velocity.projectOnLine(y).add(x.getCollinearVector().scaleTo(v1x_new))
                    },
                    objInfo2: {
                        fallbackVector: fallbackVector2,
                        velocity: objInfo2.velocity.projectOnLine(y).add(x.getCollinearVector().scaleTo(v2x_new))
                    }
                };
            }
            else {
                return {
                    objInfo1: {
                        fallbackVector: fallbackVector1,
                        velocity: objInfo1.velocity.projectOnLine(y).add(objInfo1.velocity.projectOnLine(x).turnAround())
                    },
                    objInfo2: {
                        fallbackVector: fallbackVector2,
                        velocity: objInfo2.velocity.projectOnLine(y).add(objInfo2.velocity.projectOnLine(x).turnAround())
                    }
                };
            }
        }
        else {
            return null;
        }
    },
    getCollisionLine_linesegment_circle: function (lineSegment, circle) {
        //1) find the closest point to the circle on the segment
        
        //find the projection of AX on AB, where X is the circle's center

        var A = lineSegment.P1;
        var B = lineSegment.P2;

        var AB = new Vector(B.x - A.x, B.y - A.y);
        var AX = new Vector(circle.x - A.x, circle.y - A.y);
        
        var proj = AX.projectOn(AB);

        //find the point closest to the circle's center
        var closestPoint = null;
        var onLineEdge = false;

        if (!proj.looksInSameDirection(AB)) {
            closestPoint = A;
            onLineEdge = true;
        }
        else if (proj.modulus() < AB.modulus()) {
            //the closest point is the end of projection of AX to AB
            closestPoint = new Point(A.x + proj.x, A.y + proj.y);;
        }
        else {
            onLineEdge = true;
            closestPoint = B;
        }

        if (closestPoint.distanceTo(circle.center()) <= circle.radius) {

            if (onLineEdge) {
                var l = new Line(closestPoint, circle.center());
                return l.getOrthogonalLine().getParallelPassingThroughPoint(closestPoint);
            }
            else {
                return new Line(A, B);
            }
        }
        else {
            return null;
        }
    },
    getCollisionLine_circle_circle: function (c1, c2) {
        var distanceBtwCenters = c1.center().distanceTo(c2.center());

        if (distanceBtwCenters <= c1.radius + c2.radius) {
            var lineConnectingCenters = new Line(c1.center(), c2.center());
            return lineConnectingCenters.getOrthogonalLine();
        }
    },
    lineSegmentIntersectsLineSegment: function (ls1, ls2) {

    }
};

PositionsHistory = Class.extend({
    init: function () {
        this._storage = new Stack(10);
    },
    savePosition: function (pos) {
        this._storage.push(pos);
    },
    getLastPosition: function () {
        return this._storage.pop();
    }
});

//ABSTRACT CLASS
AGeometry = Class.extend({
    init: function () {
        this._positionsHistory = new PositionsHistory();
        this._prevPosition = null;
    },
    move: function (vect) {
        this._savePrevPosition();
    },
    _savePrevPosition: function () {
        var pos = this._getCurrentPositionInfo();

        if (pos != null) {
            this._positionsHistory.savePosition(pos);
            //this._prevPosition = pos;
        }
    },
    restorePrevPosition: function () {

    },
    _getCurrentPositionInfo: function () {
        return null;
    },
    _getPrevPositionInfo: function () {
        return this._positionsHistory.getLastPosition();
    },
    _getCollisionLine: function (otherGeometry) {
        return null;
    }
});

//CLASS.
Circle = AGeometry.extend({
    //CTOR.
    init: function (x, y, radius) {
        this._super();
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
    _getCurrentPositionInfo: function () {
        return {
            x: this.x,
            y: this.y
        };
    },
    restorePrevPosition: function () {
        var pos = this._getPrevPositionInfo();

        if (pos) {
            this.x = pos.x;
            this.y = pos.y;
        }
    }
});

//CLASS.

LineSegment = AGeometry.extend({
    init: function (P1, P2) {
        assertIsDefined(P1);
        assertIsDefined(P2);

        this._super();
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
    getLength: function () {
        return this.P1.distanceTo(this.P2);
    },
    getLine: function () {
        return new Line(this.P1, this.P2);
    },
    _getCurrentPositionInfo: function () {
        return {
            x1: this.P1.x,
            y1: this.P1.y,
            x2: this.P2.x,
            y2: this.P2.y
        };
    },
    restorePrevPosition: function () {
        var pos = this._getPrevPositionInfo();
        //var pos = this._prevPosition;

        if (pos != null) {
            this.P1.x = pos.x1;
            this.P1.y = pos.y1;
            this.P2.x = pos.x2;
            this.P2.y = pos.y2;
        }
    }
});