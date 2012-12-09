GlobalConstants = {
    INFINITY: 100
};

//GLOBAL FUNCTION.
function assert(expr, msg) {
    if (!expr) {
        if (isDebug) {
            var stack = new Error().stack;

            if (msg) {
                console.log(msg);
            }

            console.log("ASSERT FAILED! PRINTING CALL STACK");
            console.log(stack);
        }
        else {
            alert('oops...');
        }
    }
}

//GLOBAL FUNCTION.
function assertIsDefined(expr) {
    assert(expr != null && expr != undefined, 'Object is null or undefined')
}

//GLOBAL FUNCTION. Emulates classical inheritance
/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function () {
    var initializing = false, fnTest = /xyz/.test(function () { xyz; }) ? /\b_super\b/ : /.*/;
    // The base Class implementation (does nothing)
    this.Class = function () { };

    // Create a new Class that inherits from this class
    Class.extend = function (prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
              typeof _super[name] == "function" && fnTest.test(prop[name]) ?
              (function (name, fn) {
                  return function () {
                      var tmp = this._super;

                      // Add a new ._super() method that is the same method
                      // but on the super-class
                      this._super = _super[name];

                      // The method only need to be bound temporarily, so we
                      // remove it when we're done executing
                      var ret = fn.apply(this, arguments);
                      this._super = tmp;

                      return ret;
                  };
              })(name, prop[name]) :
              prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if (!initializing && this.init)
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (callbackFn) {
        var length = this.length;

        for (var i = 0; i < length; ++i) {
            callbackFn(this[i]);
        }
    }
}

function almostZero(number, eps) {
    if (!eps) {
        eps = 0.0001;
    }
    return Math.abs(number) <= eps;
}

//this causes some troubles in ripple.js

//Object.prototype.deepCopy = function () {
//    return $.extend(true, {}, this);
//}