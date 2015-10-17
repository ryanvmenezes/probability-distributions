/* ================================================================
 * probability-distributions by Matt Asher (me[at]mattasher.com)
 * Originally created for StatisticsBlog.com
 *
 * first created at : Sat Oct 10 2015
 *
 * ================================================================
 * Copyright 2015 Matt Asher
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

var crypto = require('crypto');

module.exports = {

    /**
     * This is the core function for generating entropy
     *
     * @param len number of bytes of entropy to create
     * @returns {number} A pseduo random number between 0 and 1
     * @private
     *
     */
    prng: function(len) {
        if(len === undefined) len=16;

        var entropy = crypto.randomBytes(len);
        var result = 0;

        for(var i=0; i<len; i++) {
            result = result + Number(entropy[i])/Math.pow(256,(i+1))
        }
        return result
    },

    /**
     *
     * @param n Number of variates to return
     * @param size Number of Bernoulli trials to be summed up. Defaults to 1
     * @param p Probability of a "success". Defaults to 0.5
     * @returns {Array} Random variates array
     */
    rbinom: function(n, size, p) {
        n = this._v(n, "n");
        size = this._v(size, "nni", 1);
        p = this._v(p, "p", 0.5);

        var toReturn = [];

        for(var i=0; i<n; i++) {
            var result = 0;
            for(var j=0; j<size; j++) {
                if(this.prng() < p) {
                    result++
                }
            }
            toReturn.push(result)
        }
        return toReturn
    },


    rcauchy: function(n, loc, scale) {
        n = this._v(n, "n");
        loc = this._v(loc, "r", 0);
        scale = this._v(scale, "nn", 1);

        var toReturn = [];
        for(var i=0; i<n; i++) {
            var x = scale * Math.tan(Math.PI * (this.prng()-0.5))+loc;

            toReturn[i] = x
        }

        return toReturn

    },

    /**
     *
     * @param n The number of variates to create
     * @param df Degrees of freedom for the distribution
     * @param ncp Non-centrality parameter
     * @returns {Array} Random variates array
     */
    rchisq: function(n, df, ncp) {
        n = this._v(n, "n");
        df = this._v(df, "nn");
        ncp = this._v(ncp, "r", 0);

        var toReturn = [];
        for(var i=0; i<n; i++) {
            // Start at ncp
            var x = ncp;
            for(var j=0; j<df; j++) {
                x = x + Math.pow(this.rnorm(1)[0],2)
            }
            toReturn[i] = x
        }
        return toReturn
    },

    /**
     *
     * @param n The number of random variates to create. Must be a positive integer
     * @param rate The rate parameter. Must be a positive number
     */
    rexp: function(n, rate) {
        n = this._v(n, "n");
        rate = this._v(rate, "pos", 1);

        var toReturn = [];

        for(var i=0; i<n; i++) {
            var x = -Math.log(this.prng())/rate;
            toReturn.push(x);
        }

        return toReturn
    },

    rnbinom: function(n, size, p, mu) {
        n = this._v(n, "n");
        if(size === undefined) size=1;
        if(Math.round(size) != size) throw "Size must be a whole number";
        if(size < 1) throw "Size must be one or greater";
        if(p !== undefined && mu !== undefined) throw "You must specify probability or mean, not both";
        if(mu !== undefined) p = size/(size+mu);
        p = this._v(p, "p");


        var toReturn = [];

        for(var i=0; i<n; i++) {

            // Core distribution
            var result = 0;
            var leftToFind = size;
            while(leftToFind > 0) {
                result++
                if(this.prng() < p) leftToFind--;
            }

            toReturn[i] = result - 1;
        }

        return toReturn

    },

    // Adapted from http://blog.yjl.im/2010/09/simulating-normal-random-variable-using.html
    rnorm: function(n, mean, sd) {
        n = this._v(n, "n");
        mean = this._v(mean, "r", 0);
        sd = this._v(sd, "nn", 1);

        var toReturn = [];

        for(var i=0; i<n; i++) {
            var V1, V2, S, X;

            do {
                var U1 = this.prng();
                var U2 = this.prng();
                V1 = (2 * U1) - 1;
                V2 = (2 * U2) - 1;
                S = (V1 * V1) + (V2 * V2);
            } while (S > 1);

            X = Math.sqrt(-2 * Math.log(S) / S) * V1;
            X = mean + sd * X;
            toReturn.push(X);
        }

        return toReturn
    },

    rpois: function(n, lambda) {
        n = this._v(n, "n");
        lambda = this._v(lambda, "pos");

        var toReturn = [];

        for(var i=0; i<n; i++) {

            // Adapted from http://wiki.q-researchsoftware.com/wiki/How_to_Generate_Random_Numbers:_Poisson_Distribution
            if (lambda < 30) {

                var L = Math.exp(-lambda);
                var p = 1;
                var k = 0;
                do {
                    k++;
                    p *= this.prng();
                } while (p > L);
                toReturn.push(k - 1);

            } else {

                // Roll our own
                // Fix total number of samples
                var samples = 10000;
                var p = lambda/samples;
                var k = 0;
                for(var j=0; j<samples; j++) {
                    if(this.prng() < p) {
                        k++
                    }
                }
                toReturn[i] = k;
            }
        }

        return toReturn
    },

    /**
     *
     * @param n  Number of variates to return
     * @param min Lower bound
     * @param max Upper bound
     * @returns {Array} Random variates array
     */
    runif: function(n, min, max) {
        n = this._v(n, "n");
        min = this._v(min, "r", 0);
        max = this._v(max, "r", 1);
        if(min > max) throw "Minimum value cannot be greater than maximum value";

        var toReturn = [];

        for(var i=0; i<n; i++) {
            var raw = this.prng();
            var scaled = min + raw*(max-min);
            toReturn.push(scaled)
        }
        return toReturn
    },


    // HELPER
    _factorial: function(n) {
        n = this._v(n, "n");
        var toReturn=1;
        for (var i = 2; i <= n; i++)
            toReturn = toReturn * i;

        return toReturn;
    },

    // Return default if undefined, otherwise validate
    _v: function(param, type, def) {
        if(param === undefined)
            if(def !== undefined)
                return def;

        switch(type) {
            case "n":
                if(param === 0) throw "You must specify how many values you want";
                if(param != Number(param)) throw "The number of values must be numeric";
                if(param != Math.round(param)) throw "The number of values must be a whole number";
                if(param < 0) throw "The number of values must be a whole number greater than 1";
                if(param === Infinity) throw "The number of values cannot be infinite ;-)";
                return param;

            case "p":
                if(Number(param) !== param) throw "Probability value is missing or not a number";
                if(param > 1) throw "Probability values cannot be greater than 1";
                if(param < 0) throw "Probability values cannot be less than 0";
                return param;

            // Positive numbers
            case "pos":
                if(Number(param) !== param) throw "A required parameter is missing or not a number";
                if(param <= 0) throw "Parameter must be greater than 0";
                if(param === Infinity) throw 'Sent "infinity" as a parameter';
                return param;

            // Look for numbers (reals)
            case "r":
                if(Number(param) !== param) throw "A required parameter is missing or not a number";
                if(param === Infinity) throw 'Sent "infinity" as a parameter';
                return param;

            // Non negative real number
            case "nn":
                if(param != Number(param)) throw "A required parameter is missing or not a number";
                if(param < 0) throw "Parameter cannot be less than 0";
                if(param === Infinity) throw 'Sent "infinity" as a parameter';
                return param;

            // Non negative whole number (integer)
            case "nni":
                if(param != Number(param)) throw "A required parameter is missing or not a number";
                if(param != Math.round(param)) throw "Parameter must be a whole number";
                if(param < 0) throw "Parameter cannot be less than zero";
                if(param === Infinity) throw 'Sent "infinity" as a parameter';
                return param;

        }
    },

    //    ________   _______  ______ _____  _____ __  __ ______ _   _ _______       _
    //   |  ____\ \ / /  __ \|  ____|  __ \|_   _|  \/  |  ____| \ | |__   __|/\   | |
    //   | |__   \ V /| |__) | |__  | |__) | | | | \  / | |__  |  \| |  | |  /  \  | |
    //   |  __|   > < |  ___/|  __| |  _  /  | | | |\/| |  __| | . ` |  | | / /\ \ | |
    //   | |____ / . \| |    | |____| | \ \ _| |_| |  | | |____| |\  |  | |/ ____ \| |____
    //   |______/_/ \_\_|    |______|_|  \_\_____|_|  |_|______|_| \_|  |_/_/    \_\______|

    /**
     *
     * @param n Number of variates to return
     * @param loc Starting point
     * @param p Probability of moving towards finish
     * @param cap Maximum steps before giving up
     * @param trace Variable to track progress
     * @returns {Array} Random variates array
     *
     * The FML distribution is a is based on the number of steps taken to return to the orgin
     * from a given position, with transition probabilities set at the beginning by picking a
     * random variate from U(0,1).
     */
    rfml: function (n, loc, p, cap, trace) {
        if(loc === undefined) loc=1;
        if(p === undefined) p=this.prng;
        if(cap === undefined) cap=10000;
        if(trace === undefined) trace={};

        var toReturn = [];

        for(var i=0; i<n; i++) {
            var x = 0;
            var s = loc;
            var currP = p();
            do {

                var trial = this.prng();
                if(trial < currP) {
                    s++;
                    trace[String(i) + "_" + String(x)] = { problems: s, p: currP, result: "One more problem" }
                } else {
                    s--;
                    trace[String(i) + "_" + String(x)] = { problems: s, p: currP, result: "One fewer problem" }
                }
                x++
            } while(s > 0 && x < cap);

            if(x === cap) x = -1; // Indicate we failed to do it in time.
            toReturn[i] = x
        }
        return toReturn
    },

    // http://www.statisticsblog.com/2013/05/uncovering-the-unreliable-friend-distribution-a-case-study-in-the-limits-of-mc-methods/
    /**
     *
     * The Unrelaible Friend distribution
     * @param n
     * @returns {Array} Random variates array
     */
    ruf: function(n) {
        var toReturn = [];

        for(var i=0; i<n; i++) {
            toReturn[i] = this.rexp(1, this.prng())[0]
        }

        return toReturn
    }
};

// TODO: Validate all parameter values
// TODO: Add "perfect fake" functions: http://www.statisticsblog.com/2010/06/the-perfect-fake/
// NOTES
// Potential config options:
// default entropy amount
// Need pathway to make ready for secure applications (NIST/diehard?)
// Always return a vector unless number is 1? This could be config option or put "1" at end of fcn to get 1 only
// Separate out core random variate creation from number to create loop
