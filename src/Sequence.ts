var _isNumber = require("lodash.isnumber");

module Manifesto {
    export class Sequence extends JSONLDResource implements ISequence {
        canvases: ICanvas[] = [];

        constructor(jsonld: any){
            super(jsonld);
        }

        getCanvasById(id: string): ICanvas{

            for (var i = 0; i < this.getTotalCanvases(); i++) {
                var canvas = this.getCanvasByIndex(i);

                if (canvas.id === id){
                    return canvas;
                }
            }

            return null;
        }

        getCanvasByIndex(canvasIndex: number): any {
            return this.canvases[canvasIndex];
        }

        getCanvasIndexById(id: string): number {

            for (var i = 0; i < this.getTotalCanvases(); i++) {
                var canvas = this.getCanvasByIndex(i);

                if (canvas.id === id){
                    return i;
                }
            }

            return null;
        }

        getCanvasIndexByLabel(label: string): number {
            label = label.trim();

            // trim any preceding zeros.
            if (_isNumber(label)) {
                label = parseInt(label, 10).toString();
            }

            var doublePageRegExp = /(\d*)\D+(\d*)/;
            var match, regExp, regStr, labelPart1, labelPart2;

            for (var i = 0; i < this.getTotalCanvases(); i++) {
                var canvas: ICanvas = this.getCanvasByIndex(i);

                // check if there's a literal match
                if (canvas.getLabel() === label) {
                    return i;
                }

                // check if there's a match for double-page spreads e.g. 100-101, 100_101, 100 101
                match = doublePageRegExp.exec(label);

                if (!match) continue;

                labelPart1 = match[1];
                labelPart2 = match[2];

                if (!labelPart2) continue;

                regStr = "^" + labelPart1 + "\\D+" + labelPart2 + "$";

                regExp = new RegExp(regStr);

                if (regExp.test(canvas.getLabel())) {
                    return i;
                }
            }

            return -1;
        }

        getLastCanvasLabel(): string {
            for (var i = this.getTotalCanvases() - 1; i >= 0; i--) {
                var canvas: ICanvas = this.getCanvasByIndex(i);
                return canvas.getLabel();
            }

            return this.getManifest().options.defaultLabel;
        }

        getLastPageIndex(): number {
            return this.getTotalCanvases() - 1;
        }

        getNextPageIndex(canvasIndex: number, pagingEnabled?: boolean): number {

            var index;

            if (pagingEnabled){
                var indices = this.getPagedIndices(canvasIndex);

                if (this.getViewingDirection().toString() === ViewingDirection.RIGHTTOLEFT.toString()){
                    index = indices[0] + 1;
                } else {
                    index = indices.last() + 1;
                }
            } else {
                index = canvasIndex + 1;
            }

            if (index > this.getLastPageIndex()) {
                return -1;
            }

            return index;
        }

        getPagedIndices(canvasIndex: number, pagingEnabled?: boolean): number[]{

            var indices = [];

            if (!pagingEnabled) {
                indices.push(canvasIndex);
            } else {
                if (this.isFirstCanvas(canvasIndex) || this.isLastCanvas(canvasIndex)){
                    indices = [canvasIndex];
                } else if (canvasIndex % 2){
                    indices = [canvasIndex, canvasIndex + 1];
                } else {
                    indices = [canvasIndex - 1, canvasIndex];
                }

                if (this.getViewingDirection().toString() === ViewingDirection.RIGHTTOLEFT.toString()){
                    indices = indices.reverse();
                }
            }

            return indices;
        }

        getPrevPageIndex(canvasIndex: number, pagingEnabled?: boolean): number {

            var index;

            if (pagingEnabled){
                var indices = this.getPagedIndices(canvasIndex);

                if (this.getViewingDirection().toString() === ViewingDirection.RIGHTTOLEFT.toString()){
                    index = indices.last() - 1;
                } else {
                    index = indices[0] - 1;
                }

            } else {
                index = canvasIndex - 1;
            }

            return index;
        }

        getStartCanvasIndex(): number {
            var startCanvas = this.getStartCanvas();

            if (startCanvas) {
                // if there's a startCanvas attribute, loop through the canvases and return the matching index.
                for (var i = 0; i < this.getTotalCanvases(); i++) {
                    var canvas = this.getCanvasByIndex(i);

                    if (canvas.id === startCanvas) return i;
                }
            }

            // default to first canvas.
            return 0;
        }

        getThumbs(width: number, height?: number): Manifesto.Thumb[] {
            var thumbs: Manifesto.Thumb[] = [];

            for (var i = 0; i < this.getTotalCanvases(); i++) {
                var canvas: ICanvas = this.getCanvasByIndex(i);

                //if (!_isNumber(height)) {
                    var heightRatio = canvas.getHeight() / canvas.getWidth();

                    if (heightRatio) {
                        height = Math.floor(width * heightRatio);
                    }
                //}

                var uri = canvas.getThumbUri(width, height);
                var label = canvas.getLabel();

                thumbs.push(new Manifesto.Thumb(i, uri, label, width, height, true));
            }

            return thumbs;
        }

        getStartCanvas(): string {
            return this.__jsonld.startCanvas;
        }

        getTotalCanvases(): number{
            return this.canvases.length;
        }

        getViewingDirection(): ViewingDirection {
            if (this.__jsonld.viewingDirection){
                return new ViewingDirection(this.__jsonld.viewingDirection);
            }

            return ViewingDirection.LEFTTORIGHT;
        }

        getViewingHint(): ViewingHint {
            if (this.__jsonld.viewingHint){
                return new ViewingHint(this.__jsonld.viewingHint);
            }

            return ViewingHint.NONE;
        }

        isCanvasIndexOutOfRange(canvasIndex: number): boolean {
            return canvasIndex > this.getTotalCanvases() - 1;
        }

        isFirstCanvas(canvasIndex: number): boolean {
            return canvasIndex === 0;
        }

        isLastCanvas(canvasIndex: number): boolean {
            return canvasIndex === this.getTotalCanvases() - 1;
        }

        isMultiCanvas(): boolean{
            return this.getTotalCanvases() > 1;
        }

        isPagingEnabled(): boolean{
            return this.getViewingHint().toString() === Manifesto.ViewingHint.PAGED.toString();
        }

        // checks if the number of canvases is even - therefore has a front and back cover
        isTotalCanvasesEven(): boolean {
            return this.getTotalCanvases() % 2 === 0;
        }
    }
}