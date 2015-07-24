var Manifesto;
(function (Manifesto) {
    var JSONLDResource = (function () {
        function JSONLDResource(jsonld) {
            this.jsonld = jsonld;
            this.context = this.jsonld['@context'];
            this.id = this.jsonld['@id'];
            this._label = this.jsonld['@label'];
            // the serializer stores a reference to the manifest on the jsonld resource for convenience
            this._manifest = this.jsonld.manifest;
        }
        JSONLDResource.prototype.getManifest = function () {
            return this._manifest;
        };
        JSONLDResource.prototype.getLabel = function () {
            // todo: why would you want to test if it's a digit?
            //var regExp = /\d/;
            //if (regExp.test(this._label)) {
            return this.getManifest().getLocalisedValue(this._label);
            //}
            //return null;
        };
        return JSONLDResource;
    })();
    Manifesto.JSONLDResource = JSONLDResource;
})(Manifesto || (Manifesto = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var path = require("path");
var Manifesto;
(function (Manifesto) {
    var Canvas = (function (_super) {
        __extends(Canvas, _super);
        function Canvas(jsonld) {
            _super.call(this, jsonld);
            this.ranges = [];
        }
        // todo: add support for default images and multiple images.
        Canvas.prototype.getImageUri = function () {
            var imageUri;
            if (this.jsonld.resources) {
                imageUri = this.jsonld.resources[0].resource.service['@id'];
            }
            else if (this.jsonld.images && this.jsonld.images[0].resource.service) {
                imageUri = this.jsonld.images[0].resource.service['@id'];
            }
            if (!imageUri.endsWith('/')) {
                imageUri += '/';
            }
            imageUri += 'info.json';
            return imageUri;
        };
        Canvas.prototype.getRange = function () {
            // get the deepest Range that this Canvas belongs to.
            return this.ranges.last();
        };
        // todo: if a specific thumbnail service is provided use that
        // Prefer thumbnail service to image service if supplied and if
        // the thumbnail service can provide a satisfactory size +/- x pixels.
        Canvas.prototype.getThumbUri = function (width, height) {
            var uri;
            //if(this.jsonld.thumbnail){
            //    return this.jsonld.thumbnail;
            //} else if (this.jsonld.resources){
            if (this.jsonld.resources) {
                // todo: create thumbnail serviceprofile and use manifest.getService
                uri = this.jsonld.resources[0].resource.service['@id'];
            }
            else if (this.jsonld.images && this.jsonld.images[0].resource.service) {
                // todo: create thumbnail serviceprofile and use manifest.getService
                uri = this.jsonld.images[0].resource.service['@id'];
            }
            else {
                return null;
            }
            if (!uri.endsWith('/')) {
                uri += '/';
            }
            // todo: allow region, rotation, quality, and format as parameters?
            var tile = 'full/' + width + ',' + height + '/0/default.jpg';
            return uri + tile;
        };
        Canvas.prototype.getType = function () {
            return new Manifesto.CanvasType(this.jsonld['@type'].toLowerCase());
        };
        Canvas.prototype.getWidth = function () {
            return this.jsonld.width;
        };
        Canvas.prototype.getHeight = function () {
            return this.jsonld.height;
        };
        return Canvas;
    })(Manifesto.JSONLDResource);
    Manifesto.Canvas = Canvas;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var CanvasType = (function () {
        function CanvasType(value) {
            this.value = value;
        }
        CanvasType.prototype.toString = function () {
            return this.value;
        };
        CanvasType.canvas = new CanvasType("sc:canvas");
        return CanvasType;
    })();
    Manifesto.CanvasType = CanvasType;
})(Manifesto || (Manifesto = {}));
var _isArray = require("lodash.isarray");
var Manifesto;
(function (Manifesto) {
    var Element = (function (_super) {
        __extends(Element, _super);
        function Element(jsonld) {
            _super.call(this, jsonld);
        }
        Element.prototype.getRenderings = function () {
            var renderings = [];
            if (this.jsonld.rendering) {
                var rendering = this.jsonld.rendering;
                if (!_isArray(rendering)) {
                    rendering = [rendering];
                }
                for (var i = 0; i < rendering.length; i++) {
                    var r = rendering[i];
                    var rend = new Manifesto.Rendering(r);
                    rend.format = r.format;
                    renderings.push(rend);
                }
                return renderings;
            }
            // no renderings provided, default to element.
            var rend = new Manifesto.Rendering(this.jsonld);
            rend.format = this.jsonld.format;
            return [rend];
        };
        Element.prototype.getType = function () {
            return new Manifesto.ElementType(this.jsonld['@type']);
        };
        return Element;
    })(Manifesto.JSONLDResource);
    Manifesto.Element = Element;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var ElementType = (function () {
        function ElementType(value) {
            this.value = value;
        }
        ElementType.prototype.toString = function () {
            return this.value;
        };
        ElementType.document = new Manifesto.CanvasType("foaf:Document");
        ElementType.movingimage = new Manifesto.CanvasType("dctypes:MovingImage");
        ElementType.sound = new Manifesto.CanvasType("dctypes:Sound");
        return ElementType;
    })();
    Manifesto.ElementType = ElementType;
})(Manifesto || (Manifesto = {}));
var _assign = require("lodash.assign");
var _isArray = require("lodash.isarray");
var Manifesto;
(function (Manifesto) {
    var Manifest = (function (_super) {
        __extends(Manifest, _super);
        function Manifest(jsonld, options) {
            _super.call(this, jsonld);
            this.sequences = [];
            this.options = _assign({ defaultLabel: '-', locale: 'en-GB' }, options);
        }
        Manifest.prototype.getAttribution = function () {
            return this.getLocalisedValue(this.jsonld.attribution);
        };
        Manifest.prototype.getLocalisedValue = function (resource, locale) {
            if (!_isArray(resource)) {
                return resource;
            }
            if (!locale)
                locale = this.options.locale;
            // test for exact match
            for (var i = 0; i < resource.length; i++) {
                var value = resource[i];
                var language = value['@language'];
                if (locale === language) {
                    return value['@value'];
                }
            }
            // test for inexact match
            var match = locale.substr(0, locale.indexOf('-'));
            for (var i = 0; i < resource.length; i++) {
                var value = resource[i];
                var language = value['@language'];
                if (language === match) {
                    return value['@value'];
                }
            }
            return null;
        };
        Manifest.prototype.getLogo = function () {
            return this.jsonld.logo;
        };
        Manifest.prototype.getLicense = function () {
            return this.getLocalisedValue(this.jsonld.license);
        };
        Manifest.prototype.getMetadata = function (includeRootProperties) {
            var metadata = this.jsonld.metadata;
            if (metadata && includeRootProperties) {
                if (this.jsonld.description) {
                    metadata.push({
                        "label": "description",
                        "value": this.getLocalisedValue(this.jsonld.description)
                    });
                }
                if (this.jsonld.attribution) {
                    metadata.push({
                        "label": "attribution",
                        "value": this.getLocalisedValue(this.jsonld.attribution)
                    });
                }
                if (this.jsonld.license) {
                    metadata.push({
                        "label": "license",
                        "value": this.getLocalisedValue(this.jsonld.license)
                    });
                }
                if (this.jsonld.logo) {
                    metadata.push({
                        "label": "logo",
                        "value": '<img src="' + this.jsonld.logo + '"/>' });
                }
            }
            return metadata;
        };
        // todo: use jmespath to flatten tree?
        // https://github.com/jmespath/jmespath.js/issues/6
        Manifest.prototype.getRanges = function () {
            var ranges = [];
            if (!this.jsonld.structures && !this.jsonld.structures.length)
                return ranges;
            for (var i = 0; i < this.jsonld.structures.length; i++) {
                var range = this.jsonld.structures[i];
                ranges.push(range.parsed);
            }
            return ranges;
        };
        Manifest.prototype.getRangeById = function (id) {
            var ranges = this.getRanges();
            for (var i = 0; i < ranges.length; i++) {
                var range = ranges[i];
                if (range.id === id) {
                    return range;
                }
            }
            return null;
        };
        Manifest.prototype.getRangeByPath = function (path) {
            var ranges = this.getRanges();
            for (var i = 0; i < ranges.length; i++) {
                var range = ranges[i];
                if (range.path === path) {
                    return range;
                }
            }
            return null;
        };
        Manifest.prototype.getRendering = function (resource, format) {
            if (!resource.rendering)
                return null;
            // normalise format to string
            if (typeof format !== 'string') {
                format = format.toString();
            }
            var renderings = resource.rendering;
            if (!_isArray(renderings)) {
                renderings = [renderings];
            }
            for (var i = 0; i < renderings.length; i++) {
                var rendering = renderings[i];
                if (rendering.format && rendering.format === format) {
                    return rendering;
                }
            }
            return null;
        };
        Manifest.prototype.getRenderings = function (resource) {
            if (resource.rendering) {
                var renderings = resource.rendering;
                if (!_isArray(renderings)) {
                    renderings = [renderings];
                }
                return renderings;
            }
            // no renderings provided, default to resource.
            return [resource];
        };
        Manifest.prototype.getSeeAlso = function () {
            return this.getLocalisedValue(this.jsonld.seeAlso);
        };
        Manifest.prototype.getService = function (resource, profile) {
            if (!resource.service)
                return null;
            // normalise profile to string
            if (typeof profile !== 'string') {
                profile = profile.toString();
            }
            if (_isArray(resource.service)) {
                for (var i = 0; i < resource.service.length; i++) {
                    var service = resource.service[i];
                    if (service.profile && service.profile.toString() === profile) {
                        return new Manifesto.Service(service);
                    }
                }
            }
            else {
                if (resource.service.profile && resource.service.profile.toString() === profile) {
                    return new Manifesto.Service(resource.service);
                }
            }
            return null;
        };
        Manifest.prototype.getSequenceByIndex = function (sequenceIndex) {
            return this.sequences[sequenceIndex];
        };
        Manifest.prototype.getTitle = function () {
            return this.getLocalisedValue(this.jsonld.label);
        };
        Manifest.prototype.getTotalSequences = function () {
            return this.sequences.length;
        };
        Manifest.prototype.getTree = function () {
            this.treeRoot = new Manifesto.TreeNode('root');
            this.treeRoot.label = "root";
            this.treeRoot.data = this.rootRange;
            this.treeRoot.data.type = "manifest";
            this.rootRange.treeNode = this.treeRoot;
            if (this.rootRange.ranges) {
                for (var i = 0; i < this.rootRange.ranges.length; i++) {
                    var range = this.rootRange.ranges[i];
                    var node = new Manifesto.TreeNode();
                    this.treeRoot.addNode(node);
                    this._parseTreeNode(node, range);
                }
            }
            return this.treeRoot;
        };
        Manifest.prototype._parseTreeNode = function (node, range) {
            node.label = this.getLocalisedValue(range.label);
            node.data = range;
            node.data.type = "range";
            range.treeNode = node;
            if (range.ranges) {
                for (var i = 0; i < range.ranges.length; i++) {
                    var childRange = range.ranges[i];
                    var childNode = new Manifesto.TreeNode();
                    node.addNode(childNode);
                    this._parseTreeNode(childNode, childRange);
                }
            }
        };
        Manifest.prototype.isMultiSequence = function () {
            return this.getTotalSequences() > 1;
        };
        return Manifest;
    })(Manifesto.JSONLDResource);
    Manifesto.Manifest = Manifest;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var Range = (function (_super) {
        __extends(Range, _super);
        function Range(jsonld) {
            _super.call(this, jsonld);
            this.canvases = [];
            this.ranges = [];
        }
        //getLabel(): string {
        //    var regExp = /\d/;
        //
        //    if (regExp.test(this.jsonld.label)) {
        //        return this.manifest.getLocalisedValue(this.jsonld.label);
        //    }
        //
        //    return null;
        //}
        Range.prototype.getViewingDirection = function () {
            if (this.jsonld.viewingDirection) {
                return new Manifesto.ViewingDirection(this.jsonld.viewingDirection);
            }
            return null;
        };
        Range.prototype.getViewingHint = function () {
            if (this.jsonld.viewingHint) {
                return new Manifesto.ViewingHint(this.jsonld.viewingHint);
            }
            return null;
        };
        return Range;
    })(Manifesto.JSONLDResource);
    Manifesto.Range = Range;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var Rendering = (function (_super) {
        __extends(Rendering, _super);
        function Rendering(jsonld) {
            _super.call(this, jsonld);
        }
        return Rendering;
    })(Manifesto.JSONLDResource);
    Manifesto.Rendering = Rendering;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var RenderingFormat = (function () {
        function RenderingFormat(value) {
            this.value = value;
        }
        RenderingFormat.prototype.toString = function () {
            return this.value;
        };
        RenderingFormat.pdf = new RenderingFormat("application/pdf");
        RenderingFormat.doc = new RenderingFormat("application/msword");
        RenderingFormat.docx = new RenderingFormat("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        return RenderingFormat;
    })();
    Manifesto.RenderingFormat = RenderingFormat;
})(Manifesto || (Manifesto = {}));
var _isNumber = require("lodash.isnumber");
var Manifesto;
(function (Manifesto) {
    var Sequence = (function (_super) {
        __extends(Sequence, _super);
        function Sequence(jsonld) {
            _super.call(this, jsonld);
            this.canvases = [];
        }
        Sequence.prototype.getCanvasById = function (id) {
            for (var i = 0; i < this.getTotalCanvases(); i++) {
                var canvas = this.getCanvasByIndex(i);
                if (canvas.id === id) {
                    return canvas;
                }
            }
            return null;
        };
        Sequence.prototype.getCanvasByIndex = function (canvasIndex) {
            return this.canvases[canvasIndex];
        };
        Sequence.prototype.getCanvasIndexById = function (id) {
            for (var i = 0; i < this.getTotalCanvases(); i++) {
                var canvas = this.getCanvasByIndex(i);
                if (canvas.id === id) {
                    return i;
                }
            }
            return null;
        };
        Sequence.prototype.getCanvasIndexByLabel = function (label) {
            label = label.trim();
            // trim any preceding zeros.
            if (_isNumber(label)) {
                label = parseInt(label, 10).toString();
            }
            var doublePageRegExp = /(\d*)\D+(\d*)/;
            var match, regExp, regStr, labelPart1, labelPart2;
            for (var i = 0; i < this.getTotalCanvases(); i++) {
                var canvas = this.getCanvasByIndex(i);
                // check if there's a literal match
                if (canvas.getLabel() === label) {
                    return i;
                }
                // check if there's a match for double-page spreads e.g. 100-101, 100_101, 100 101
                match = doublePageRegExp.exec(label);
                if (!match)
                    continue;
                labelPart1 = match[1];
                labelPart2 = match[2];
                if (!labelPart2)
                    continue;
                regStr = "^" + labelPart1 + "\\D+" + labelPart2 + "$";
                regExp = new RegExp(regStr);
                if (regExp.test(canvas.getLabel())) {
                    return i;
                }
            }
            return -1;
        };
        Sequence.prototype.getLastCanvasLabel = function () {
            // get the last label that isn't empty or '-'.
            for (var i = this.getTotalCanvases() - 1; i >= 0; i--) {
                var canvas = this.getCanvasByIndex(i);
                return canvas.getLabel();
            }
            // none exists, so return '-'.
            return this.manifest.options.defaultLabel;
        };
        Sequence.prototype.getLastPageIndex = function () {
            return this.getTotalCanvases() - 1;
        };
        Sequence.prototype.getNextPageIndex = function (canvasIndex, pagingEnabled) {
            var index;
            if (pagingEnabled) {
                var indices = this.getPagedIndices(canvasIndex);
                if (this.viewingDirection === Manifesto.ViewingDirection.rightToLeft) {
                    index = indices[0] + 1;
                }
                else {
                    index = indices.last() + 1;
                }
            }
            else {
                index = canvasIndex + 1;
            }
            if (index > this.getLastPageIndex()) {
                return -1;
            }
            return index;
        };
        Sequence.prototype.getPagedIndices = function (canvasIndex, pagingEnabled) {
            var indices = [];
            if (!pagingEnabled) {
                indices.push(canvasIndex);
            }
            else {
                if (this.isFirstCanvas(canvasIndex) || this.isLastCanvas(canvasIndex)) {
                    indices = [canvasIndex];
                }
                else if (canvasIndex % 2) {
                    indices = [canvasIndex, canvasIndex + 1];
                }
                else {
                    indices = [canvasIndex - 1, canvasIndex];
                }
                if (this.viewingDirection === Manifesto.ViewingDirection.rightToLeft) {
                    indices = indices.reverse();
                }
            }
            return indices;
        };
        Sequence.prototype.getPrevPageIndex = function (canvasIndex, pagingEnabled) {
            var index;
            if (pagingEnabled) {
                var indices = this.getPagedIndices(canvasIndex);
                if (this.viewingDirection === Manifesto.ViewingDirection.rightToLeft) {
                    index = indices.last() - 1;
                }
                else {
                    index = indices[0] - 1;
                }
            }
            else {
                index = canvasIndex - 1;
            }
            return index;
        };
        Sequence.prototype.getStartCanvasIndex = function () {
            if (this.startCanvas) {
                // if there's a startCanvas attribute, loop through the canvases and return the matching index.
                for (var i = 0; i < this.getTotalCanvases(); i++) {
                    var canvas = this.getCanvasByIndex(i);
                    if (canvas.id === this.startCanvas)
                        return i;
                }
            }
            // default to first canvas.
            return 0;
        };
        Sequence.prototype.getThumbs = function (width, height) {
            var thumbs = [];
            for (var i = 0; i < this.getTotalCanvases(); i++) {
                var canvas = this.getCanvasByIndex(i);
                if (!_isNumber(height)) {
                    var heightRatio = canvas.getHeight() / canvas.getWidth();
                    if (heightRatio) {
                        height = Math.floor(width * heightRatio);
                    }
                }
                var uri = canvas.getThumbUri(width, height);
                thumbs.push(new Manifesto.Thumb(i, uri, canvas.getLabel(), width, height, true));
            }
            return thumbs;
        };
        Sequence.prototype.getStartCanvas = function () {
            return this.jsonld.startCanvas;
        };
        Sequence.prototype.getTotalCanvases = function () {
            return this.canvases.length;
        };
        Sequence.prototype.getViewingDirection = function () {
            if (this.jsonld.viewingDirection) {
                return new Manifesto.ViewingDirection(this.jsonld.viewingDirection);
            }
            return Manifesto.ViewingDirection.leftToRight;
        };
        Sequence.prototype.getViewingHint = function () {
            if (this.jsonld.viewingHint) {
                return new Manifesto.ViewingHint(this.jsonld.viewingHint);
            }
            return null;
        };
        Sequence.prototype.isCanvasIndexOutOfRange = function (canvasIndex) {
            return canvasIndex > this.getTotalCanvases() - 1;
        };
        Sequence.prototype.isFirstCanvas = function (canvasIndex) {
            return canvasIndex === 0;
        };
        Sequence.prototype.isLastCanvas = function (canvasIndex) {
            return canvasIndex === this.getTotalCanvases() - 1;
        };
        Sequence.prototype.isMultiCanvas = function () {
            return this.getTotalCanvases() > 1;
        };
        Sequence.prototype.isPagingEnabled = function () {
            return this.viewingHint && (this.viewingHint === Manifesto.ViewingHint.paged);
        };
        // checks if the number of canvases is even - therefore has a front and back cover
        Sequence.prototype.isTotalCanvasesEven = function () {
            return this.getTotalCanvases() % 2 === 0;
        };
        return Sequence;
    })(Manifesto.JSONLDResource);
    Manifesto.Sequence = Sequence;
})(Manifesto || (Manifesto = {}));
var jmespath = require('jmespath');
var Manifesto;
(function (Manifesto) {
    var Deserialiser = (function () {
        function Deserialiser() {
        }
        Deserialiser.parse = function (manifest) {
            this.manifest = new Manifesto.Manifest(JSON.parse(manifest));
            this.parseSequences();
            if (this.manifest.jsonld.structures && this.manifest.jsonld.structures.length) {
                this.parseRanges(JsonUtils.getRootRange(this.manifest.jsonld), '');
            }
            return this.manifest;
        };
        Deserialiser.parseSequences = function () {
            for (var i = 0; i < this.manifest.jsonld.sequences.length; i++) {
                var s = this.manifest.jsonld.sequences[i];
                s.manifest = this.manifest;
                var sequence = new Manifesto.Sequence(s);
                sequence.canvases = this.parseCanvases(s);
                this.manifest.sequences.push(sequence);
            }
        };
        Deserialiser.parseCanvases = function (sequence) {
            var canvases = [];
            for (var i = 0; i < sequence.canvases.length; i++) {
                var c = sequence.canvases[i];
                c.manifest = this.manifest;
                var canvas = new Manifesto.Canvas(c);
                canvases.push(canvas);
            }
            return canvases;
        };
        Deserialiser.parseRanges = function (r, path, parentRange) {
            r.manifest = this.manifest;
            var range = new Manifesto.Range(r);
            // if no parent range is passed, assign the new range to manifest.rootRange
            if (!parentRange) {
                this.manifest.rootRange = range;
            }
            else {
                range.parentRange = parentRange;
                parentRange.ranges.push(range);
            }
            r.parsed = range;
            range.path = path;
            if (r.canvases) {
                // create two-way relationship
                for (var i = 0; i < r.canvases.length; i++) {
                    var canvas = this.getCanvasById(r.canvases[i]);
                    canvas.ranges.push(range);
                    range.canvases.push(canvas);
                }
            }
            if (r.ranges) {
                for (var j = 0; j < r.ranges.length; j++) {
                    this.parseRanges(r.ranges[j], path + '/' + j, range);
                }
            }
        };
        Deserialiser.getCanvasById = function (id) {
            for (var i = 0; i < this.manifest.sequences.length; i++) {
                var sequence = this.manifest.sequences[i];
                for (var j = 0; j < sequence.canvases.length; j++) {
                    var canvas = sequence.canvases[j];
                    if (canvas.id === id) {
                        return canvas;
                    }
                }
            }
            return null;
        };
        return Deserialiser;
    })();
    Manifesto.Deserialiser = Deserialiser;
    var Serialiser = (function () {
        function Serialiser() {
        }
        Serialiser.serialise = function (manifest) {
            // todo
            return "";
        };
        return Serialiser;
    })();
    Manifesto.Serialiser = Serialiser;
    var JsonUtils = (function () {
        function JsonUtils() {
        }
        JsonUtils.getCanvasById = function (manifest, id) {
            var result = jmespath.search(manifest, "sequences[].canvases[?\"@id\"=='" + id + "'][]");
            if (result.length)
                return result[0];
            return null;
        };
        JsonUtils.getRangeById = function (manifest, id) {
            var result = jmespath.search(manifest, "structures[?\"@id\"=='" + id + "'][]");
            if (result.length)
                return result[0];
            return null;
        };
        JsonUtils.getRootRange = function (manifest) {
            var result = jmespath.search(manifest, "structures[?viewingHint=='top'][]");
            if (result.length)
                return result[0];
            var rootRange = {};
            rootRange.ranges = manifest.structures;
            return rootRange;
        };
        return JsonUtils;
    })();
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var Service = (function (_super) {
        __extends(Service, _super);
        function Service(resource) {
            _super.call(this, resource);
        }
        return Service;
    })(Manifesto.JSONLDResource);
    Manifesto.Service = Service;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var ServiceProfile = (function () {
        function ServiceProfile(value) {
            this.value = value;
        }
        ServiceProfile.prototype.toString = function () {
            return this.value;
        };
        ServiceProfile.autoComplete = new ServiceProfile("http://iiif.io/api/autocomplete/1/");
        ServiceProfile.login = new ServiceProfile("http://iiif.io/api/image/2/auth/login");
        ServiceProfile.logout = new ServiceProfile("http://iiif.io/api/image/2/auth/logout");
        ServiceProfile.otherManifestations = new ServiceProfile("http://iiif.io/api/otherManifestations.json");
        ServiceProfile.searchWithin = new ServiceProfile("http://iiif.io/api/search/1/");
        ServiceProfile.token = new ServiceProfile("http://iiif.io/api/image/2/auth/token");
        return ServiceProfile;
    })();
    Manifesto.ServiceProfile = ServiceProfile;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var Thumb = (function () {
        function Thumb(index, uri, label, width, height, visible) {
            this.index = index;
            this.uri = uri;
            this.label = label;
            this.width = width;
            this.height = height;
            this.visible = visible;
        }
        return Thumb;
    })();
    Manifesto.Thumb = Thumb;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var TreeNode = (function () {
        function TreeNode(label, data) {
            this.label = label;
            this.data = data;
            this.nodes = [];
            if (!data)
                this.data = {};
        }
        TreeNode.prototype.addNode = function (node) {
            this.nodes.push(node);
            node.parentNode = this;
        };
        return TreeNode;
    })();
    Manifesto.TreeNode = TreeNode;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var ViewingDirection = (function () {
        function ViewingDirection(value) {
            this.value = value;
        }
        ViewingDirection.prototype.toString = function () {
            return this.value;
        };
        ViewingDirection.leftToRight = new ViewingDirection("left-to-right");
        ViewingDirection.rightToLeft = new ViewingDirection("right-to-left");
        ViewingDirection.topToBottom = new ViewingDirection("top-to-bottom");
        ViewingDirection.bottomToTop = new ViewingDirection("bottom-to-top");
        return ViewingDirection;
    })();
    Manifesto.ViewingDirection = ViewingDirection;
})(Manifesto || (Manifesto = {}));
var Manifesto;
(function (Manifesto) {
    var ViewingHint = (function () {
        function ViewingHint(value) {
            this.value = value;
        }
        ViewingHint.prototype.toString = function () {
            return this.value;
        };
        ViewingHint.individuals = new ViewingHint("individuals");
        ViewingHint.paged = new ViewingHint("paged");
        ViewingHint.continuous = new ViewingHint("continuous");
        ViewingHint.nonPaged = new ViewingHint("non-paged");
        ViewingHint.top = new ViewingHint("top");
        return ViewingHint;
    })();
    Manifesto.ViewingHint = ViewingHint;
})(Manifesto || (Manifesto = {}));
/// <reference path="./_references.ts" />
var http = require("http");
var url = require("url");
module.exports = {
    //CanvasType: new Manifesto.CanvasType(),
    //ElementType: new Manifesto.ElementType(),
    //RenderingFormat: new Manifesto.RenderingFormat(),
    //ServiceProfile: new Manifesto.ServiceProfile(),
    //ViewingDirection: new Manifesto.ViewingDirection(),
    //ViewingHint: new Manifesto.ViewingHint(),
    load: function (manifestUri, cb) {
        var u = url.parse(manifestUri);
        var fetch = http.request({
            host: u.hostname,
            port: u.port || 80,
            path: u.pathname,
            method: "GET",
            withCredentials: false
        }, function (res) {
            var result = "";
            res.on('data', function (chunk) {
                result += chunk;
            });
            res.on('end', function () {
                cb(result);
            });
        });
        fetch.end();
    },
    parse: function (manifest) {
        return Manifesto.Deserialiser.parse(manifest);
    }
};
/// <reference path="./IJSONLDResource.ts" />
/// <reference path="./JSONLDResource.ts" />
/// <reference path="./Canvas.ts" />
/// <reference path="./CanvasType.ts" />
/// <reference path="./Element.ts" />
/// <reference path="./ElementType.ts" />
/// <reference path="./ICanvas.ts" />
/// <reference path="./IElement.ts" />
/// <reference path="./IManifest.ts" />
/// <reference path="./IManifesto.ts" />
/// <reference path="./IManifestoOptions.ts" />
/// <reference path="./IRange.ts" />
/// <reference path="./IRendering.ts" />
/// <reference path="./ISequence.ts" />
/// <reference path="./IService.ts" />
/// <reference path="./Manifest.ts" />
/// <reference path="./Range.ts" />
/// <reference path="./Rendering.ts" />
/// <reference path="./RenderingFormat.ts" />
/// <reference path="./Sequence.ts" />
/// <reference path="./Serialisation.ts" />
/// <reference path="./Service.ts" />
/// <reference path="./ServiceProfile.ts" />
/// <reference path="./Thumb.ts" />
/// <reference path="./TreeNode.ts" />
/// <reference path="./ViewingDirection.ts" />
/// <reference path="./ViewingHint.ts" />
/// <reference path="./Manifesto.ts" /> 
