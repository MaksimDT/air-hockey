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
        //let's project v on w
        var v = this;
        var w = vect;
        var dotProduct = v.x * w.x + v.y * w.y;
        var proj = dotProduct / v._squaredModulus();
        
        return new Vector(proj * v.x, proj * v.y);
    },
    modulus: function () {
        return Math.sqrt(this._squaredModulus());
    },
    projectOnLine: function (line) {
        var vectOnLine = line.getCollinearVector();
        return this.projectOn(vectOnLine);
    },
    looksInSameDirection: function (vect) {
        return this._dotProduct(vect) > 0;
    },
    looksInDifferentDirection: function (vect) {
        return !this.looksInSameDirection(vect);
    },
    turnAround: function () {
        return new Vector(-this.x, -this.y);
    },
    _squaredModulus: function () {
        return this._dotProduct(this);
    },
    _dotProduct: function (vect) {
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
        if (self._pointInRectangle(new Point(circle.x, circle.y), rect)) {
            //TODO: WTF???
            return {
                collisionLine: new Line(new Point(rect.x1, rect.y1), new Point(rect.x1, rect.y2))
            };
        }
        else {
            //checking 2)
            var lineSegments = [
                { A: new Point(rect.x1, rect.y1), B: new Point(rect.x1, rect.y2) },
                { A: new Point(rect.x1, rect.y2), B: new Point(rect.x2, rect.y2) },
                { A: new Point(rect.x2, rect.y2), B: new Point(rect.x2, rect.y1) },
                { A: new Point(rect.x2, rect.y1), B: new Point(rect.x1, rect.y1) }
            ];

            //assume that there's no collision
            var result = {
                isCollision: false
            };

            //...and check for collision with every rectangle's edge
            lineSegments.forEach(function (lineSeg) {
                result = self._lineSegmentIntersectsCircle(lineSeg.A, lineSeg.B, circle);
            });

            return result;
        }
    },
    _lineSegmentIntersectsCircle: function (A, B, circle) {
        //1) find the closest point to the circle on the segment
        
        //find the projection of AX on AB, where X is the circle's center

        var AB = new Vector(B.x - A.x, B.y - A.y);
        var AX = new Vector(circle.x - A.x, circle.y - A.y);
        
        var proj = AX.projectOn(AB);
        var projAndABLookInSameDirection = proj.looksInSameDirection(AB);

        //find the point closest to the circle's center
        var closestPoint = null;

        if (!proj.looksInSameDirection(AB)) {
            closestPoint = A;
        }
        else if (proj.modulus() < AB.modulus()) {
            //the closest point is P (which is the end of projection)
            var mult = proj / AB.modulus();
            var P = new Point(A.x + mult * AB.x, A.y + mult * AB.y);
            closestPoint = P;
        }
        else {
            closestPoint = B;
        }

        if (closestPoint.distanceTo(circle.center()) <= circle.radius()) {
            return {
                collisionLine: new Line(A, B)
            };
        }
        else {
            return null;
        }
    },
    _pointInRectangle: function (point, rect) {
        return rect.x1 <= point.x && point.x <= rect.x2 &&
            rect.y1 <= point.y && point.y <= rect.y2;
    }
};

//ABSTRACT CLASS
AGeometry = Class.extend({
    init: function (styleInfo) {
        this._styleInfo = styleInfo;
    },
    isDrawable: function () {
        return this._styleInfo != null && this._styleInfo != undefined;
    },
    move: function (vect) { },
    getCollisionInfo: function (otherGeometry) {
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
    getCollisionInfo: function (otherGeometry) {
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
    //METHOD. Determines whether the circle intersects with the other circle. TODO: move to collisionmanager
    intersectsWithOther: function (other) {
        assert(other instanceof Circle);
        var distanceBtwCentersSquared = (this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y);
        return distanceBtwCentersSquared <= (this.radius * this.radius) && distanceBtwCentersSquared <= (other.radius * other.radius);
    },
    move: function (vector) {
        this._prevX = this.x;
        this._prevY = this.y;

        this.x += vector.x;
        this.y += vector.y;
    },
    getCollisionInfo: function (otherGeometry) {
        assertIsDefined(otherGeometry);
        if (otherGeometry instanceof Rect) {
            return CollisionManager.rectIntersectsCircle(otherGeometry, this);
        }
        else {
            return null;
        }
    },
    getVelocityAfterCollision: function (currentVelocity, collisionLine, bounce, friction) {
        
    }
});