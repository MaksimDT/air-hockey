Transport = Class.extend({
    init: function (serverUrl) {
        assertIsDefined(serverUrl);
        assertIsDefined(onButtonsChanged);
        var self = this;

        this._s = new WebSocket(serverUrl);
        this._pressedBtns = [];
        this._s.onmessage = function (event) {
            self._onMessage(event);
        };
    },
    send: function(pressedBtns) {
        var data = "";
        if (pressedBtns["W"]) data += "W";
        if (pressedBtns["D"]) data += "D";
        if (pressedBtns["S"]) data += "S";
        if (pressedBtns["A"]) data += "A";

        this._s.send(data);
    },
    subscribe: function(onButtonsChanged) {
        this._onButtonsChanged = onButtonsChanged;
    },
    unsubscribe: function() {
        this._onButtonsChanged = undefined;
    },
    _onMessage: function (event) {
        if (!this._onButtonsChanged) return;

        var data = event.data;
        this._pressedBtns["W"] = false;
        this._pressedBtns["D"] = false;
        this._pressedBtns["S"] = false;
        this._pressedBtns["A"] = false;

        for (var i = 0; i < data.length; ++i) {
            this._pressedBtns[data[i]] = true;
        }

        this._onButtonsChanged(this._pressedBtns);
    }
});