var http = require("http");

module.exports = <IManifesto>{

    manifestCallback: null,
    manifest: null,

    // todo: remove - just to test mocha
    sayHello: function(name: string): string {
        return "Hello, " + name;
    },

    load: function (manifestUri: string, callback: (manifest: Manifest) => void, useJSONP?: boolean): void {

        var that = this;

        http.get({
            path: manifestUri
        }, function(res) {
            res.setEncoding('utf8');
            var result = "";
            res.on('data', function(chunk) {
                result += chunk;
            });
            res.on('end', function() {
                that.parseManifest(result, callback);
            });
        }).on('error', function(e) {
            console.log(e.message);
        });
    },

    // todo
    parseManifest: function(manifest: any, callback: (manifest: Manifest) => void): void {
        callback(manifest);
    }
};