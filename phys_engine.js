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

//STATIC CLASS. Contains the logic of collision detection and standard collision handling mechanisms
CollisionManager = {
    getCollisionInfo: function (objInfo1, objInfo2) {
        var geom1 = objInfo1.geometry;
        var geom2 = objInfo2.geometry;

        var cl;

        if (geom1 instanceof Circle && geom2 instanceof LineSegment ||
            geom2 instanceof Circle && geom1 instanceof LineSegment) {

            var lineSegment = geom1 instanceof LineSegment ? geom1 : geom2;
            var circle = geom2 instanceof Circle ? geom2 : geom1;

            cl = this.getCollisionLine_linesegment_circle(lineSegment, circle);
        }
        else if (geom1 instanceof Circle && geom2 instanceof Circle) {
            cl = this.getCollisionLine_circle_circle(geom1, geom2);
        }
        else if (geom1 instanceof LineSegment && geom2 instanceof LineSegment) {
            //TODO: implement
        }
        else {
            throw new Error("No collision detection logic found for types of the objects specified");
        }

        if (cl) {
            /*breaking down velocities of the objects into the two compontents: 
            first that is parallel to collision line (axis "r") and second that is orthogonal to it (axis "q")*/
            var r = cl;
            var q = cl.getOrthogonalLine();

            return {
                objInfo1: {
                    velocity: objInfo1.velocity.projectOnLine(r).add( objInfo1.velocity.projectOnLine(q).turnAround() )
                },
                objInfo2: {
                    velocity: objInfo2.velocity.projectOnLine(r).add( objInfo2.velocity.projectOnLine(q).turnAround() )
                }
            };
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
                return l.getOrthogonalLine();
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