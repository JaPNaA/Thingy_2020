/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./build/client/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./build/client/App.js":
/*!*****************************!*\
  !*** ./build/client/App.js ***!
  \*****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\nvar App = /** @class */ (function () {\n    function App() {\n        this.activeViews = [];\n        this.elm = document.createElement(\"div\");\n        this.elm.classList.add(\"app\");\n        document.body.appendChild(this.elm);\n    }\n    App.prototype.openView = function (view) {\n        view._open(this);\n        this.activeViews.push(view);\n    };\n    return App;\n}());\n/* harmony default export */ __webpack_exports__[\"default\"] = (App);\n\n\n//# sourceURL=webpack:///./build/client/App.js?");

/***/ }),

/***/ "./build/client/View.js":
/*!******************************!*\
  !*** ./build/client/View.js ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\nvar View = /** @class */ (function () {\n    function View() {\n    }\n    View.prototype.onOpen = function () { };\n    View.prototype._open = function (app) {\n        this.app = app;\n        this.onOpen();\n    };\n    return View;\n}());\n/* harmony default export */ __webpack_exports__[\"default\"] = (View);\n\n\n//# sourceURL=webpack:///./build/client/View.js?");

/***/ }),

/***/ "./build/client/index.js":
/*!*******************************!*\
  !*** ./build/client/index.js ***!
  \*******************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _App__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./App */ \"./build/client/App.js\");\n/* harmony import */ var _views_GameView_GameView__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./views/GameView/GameView */ \"./build/client/views/GameView/GameView.js\");\n\n\nvar app = new _App__WEBPACK_IMPORTED_MODULE_0__[\"default\"]();\napp.openView(new _views_GameView_GameView__WEBPACK_IMPORTED_MODULE_1__[\"default\"]());\nconsole.log(app);\n\n\n//# sourceURL=webpack:///./build/client/index.js?");

/***/ }),

/***/ "./build/client/views/GameView/Board.js":
/*!**********************************************!*\
  !*** ./build/client/views/GameView/Board.js ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _shared_logic_GoBoard__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../shared/logic/GoBoard */ \"./build/shared/logic/GoBoard.js\");\n/* harmony import */ var _shared_logic_Stones__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../shared/logic/Stones */ \"./build/shared/logic/Stones.js\");\n\n\nvar Board = /** @class */ (function () {\n    function Board() {\n        this.cellSize = Board.CELL_SIZE;\n        this.goBoardLogic = new _shared_logic_GoBoard__WEBPACK_IMPORTED_MODULE_0__[\"default\"]();\n        this.turn = false;\n        this.canvas = this.createCanvas();\n        this.X = this.getCanvasContext();\n        this.setup();\n        this.draw();\n    }\n    Board.prototype.appendTo = function (elm) {\n        elm.appendChild(this.canvas);\n    };\n    Board.prototype.createCanvas = function () {\n        var canvas = document.createElement(\"canvas\");\n        canvas.width = (Board.WIDTH + Board.PADDING * 2) * this.cellSize;\n        canvas.height = (Board.HEIGHT + Board.PADDING * 2) * this.cellSize;\n        return canvas;\n    };\n    Board.prototype.getCanvasContext = function () {\n        var X = this.canvas.getContext(\"2d\");\n        if (!X) {\n            throw new Error(\"Canvas is not supported\");\n        }\n        return X;\n    };\n    Board.prototype.setup = function () {\n        var _this = this;\n        this.canvas.addEventListener(\"click\", function (e) {\n            _this.goBoardLogic.putStone((_this.turn = !_this.turn) ?\n                _shared_logic_Stones__WEBPACK_IMPORTED_MODULE_1__[\"default\"].white : _shared_logic_Stones__WEBPACK_IMPORTED_MODULE_1__[\"default\"].black, Math.floor(e.offsetX / _this.cellSize - Board.PADDING), Math.floor(e.offsetY / _this.cellSize - Board.PADDING));\n            _this.draw();\n        });\n    };\n    Board.prototype.draw = function () {\n        this.X.clearRect(0, 0, this.canvas.width, this.canvas.height);\n        this.drawGrid();\n        this.drawStones();\n    };\n    Board.prototype.drawGrid = function () {\n        this.X.strokeStyle = \"#555555\";\n        this.X.save();\n        this.X.translate(this.cellSize * Board.PADDING, this.cellSize * Board.PADDING);\n        // <= instead of =, adds final line to close the shape\n        for (var x = 0; x <= Board.WIDTH; x++) {\n            this.X.beginPath();\n            this.X.moveTo(x * this.cellSize, 0);\n            this.X.lineTo(x * this.cellSize, Board.HEIGHT * this.cellSize);\n            this.X.stroke();\n        }\n        for (var y = 0; y <= Board.HEIGHT; y++) {\n            this.X.beginPath();\n            this.X.moveTo(0, y * this.cellSize);\n            this.X.lineTo(Board.WIDTH * this.cellSize, y * this.cellSize);\n            this.X.stroke();\n        }\n        this.X.restore();\n    };\n    Board.prototype.drawStones = function () {\n        this.X.save();\n        var stones = this.goBoardLogic.getStones();\n        for (var y = 0; y < Board.HEIGHT; y++) {\n            for (var x = 0; x < Board.WIDTH; x++) {\n                var stone = stones[y][x];\n                if (stone === _shared_logic_Stones__WEBPACK_IMPORTED_MODULE_1__[\"default\"].none) {\n                    continue;\n                }\n                if (stone === _shared_logic_Stones__WEBPACK_IMPORTED_MODULE_1__[\"default\"].black) {\n                    this.X.fillStyle = \"#2e2e2e\";\n                }\n                else if (stone === _shared_logic_Stones__WEBPACK_IMPORTED_MODULE_1__[\"default\"].white) {\n                    this.X.fillStyle = \"#adadad\";\n                }\n                this.X.fillRect((x + Board.PADDING) * this.cellSize, (y + Board.PADDING) * this.cellSize, this.cellSize, this.cellSize);\n            }\n        }\n    };\n    Board.WIDTH = 19;\n    Board.HEIGHT = 19;\n    Board.CELL_SIZE = 24;\n    Board.PADDING = 0.2;\n    return Board;\n}());\n/* harmony default export */ __webpack_exports__[\"default\"] = (Board);\n\n\n//# sourceURL=webpack:///./build/client/views/GameView/Board.js?");

/***/ }),

/***/ "./build/client/views/GameView/GameView.js":
/*!*************************************************!*\
  !*** ./build/client/views/GameView/GameView.js ***!
  \*************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _View__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../View */ \"./build/client/View.js\");\n/* harmony import */ var _Board__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Board */ \"./build/client/views/GameView/Board.js\");\n/* harmony import */ var _websocket_Server__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./websocket/Server */ \"./build/client/views/GameView/websocket/Server.js\");\nvar __extends = (undefined && undefined.__extends) || (function () {\n    var extendStatics = function (d, b) {\n        extendStatics = Object.setPrototypeOf ||\n            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||\n            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };\n        return extendStatics(d, b);\n    };\n    return function (d, b) {\n        extendStatics(d, b);\n        function __() { this.constructor = d; }\n        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());\n    };\n})();\n\n\n\nvar GameView = /** @class */ (function (_super) {\n    __extends(GameView, _super);\n    function GameView() {\n        var _this = _super.call(this) || this;\n        _this.board = new _Board__WEBPACK_IMPORTED_MODULE_1__[\"default\"]();\n        _this.server = new _websocket_Server__WEBPACK_IMPORTED_MODULE_2__[\"default\"]();\n        console.log(\"a\");\n        return _this;\n    }\n    GameView.prototype.onOpen = function () {\n        this.board.appendTo(this.app.elm);\n    };\n    return GameView;\n}(_View__WEBPACK_IMPORTED_MODULE_0__[\"default\"]));\n/* harmony default export */ __webpack_exports__[\"default\"] = (GameView);\n\n\n//# sourceURL=webpack:///./build/client/views/GameView/GameView.js?");

/***/ }),

/***/ "./build/client/views/GameView/websocket/Server.js":
/*!*********************************************************!*\
  !*** ./build/client/views/GameView/websocket/Server.js ***!
  \*********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\nvar Server = /** @class */ (function () {\n    function Server() {\n        var _this = this;\n        this.socket = new WebSocket(\"ws://localhost:8081\");\n        this.socket.addEventListener(\"open\", function () { return _this.onOpen(); });\n        console.log(this.socket);\n    }\n    Server.prototype.onOpen = function () {\n        this.socket.send(\"Test!\");\n    };\n    return Server;\n}());\n/* harmony default export */ __webpack_exports__[\"default\"] = (Server);\n\n\n//# sourceURL=webpack:///./build/client/views/GameView/websocket/Server.js?");

/***/ }),

/***/ "./build/shared/logic/GoBoard.js":
/*!***************************************!*\
  !*** ./build/shared/logic/GoBoard.js ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _Stones__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Stones */ \"./build/shared/logic/Stones.js\");\n\nvar GoBoard = /** @class */ (function () {\n    function GoBoard() {\n        this.stones = this.initStones();\n    }\n    GoBoard.prototype.getStones = function () {\n        return this.stones;\n    };\n    GoBoard.prototype.putStone = function (stone, x, y) {\n        this.stones[y][x] = stone;\n    };\n    GoBoard.prototype.initStones = function () {\n        var stonesArr = [];\n        for (var y = 0; y < GoBoard.HEIGHT; y++) {\n            var row = [];\n            for (var x = 0; x < GoBoard.WIDTH; x++) {\n                row.push(_Stones__WEBPACK_IMPORTED_MODULE_0__[\"default\"].none);\n            }\n            stonesArr.push(row);\n        }\n        return stonesArr;\n    };\n    GoBoard.WIDTH = 19;\n    GoBoard.HEIGHT = 19;\n    return GoBoard;\n}());\n/* harmony default export */ __webpack_exports__[\"default\"] = (GoBoard);\n\n\n//# sourceURL=webpack:///./build/shared/logic/GoBoard.js?");

/***/ }),

/***/ "./build/shared/logic/Stones.js":
/*!**************************************!*\
  !*** ./build/shared/logic/Stones.js ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\nvar Stones;\n(function (Stones) {\n    Stones[Stones[\"black\"] = 0] = \"black\";\n    Stones[Stones[\"white\"] = 1] = \"white\";\n    Stones[Stones[\"none\"] = 2] = \"none\";\n})(Stones || (Stones = {}));\n;\n/* harmony default export */ __webpack_exports__[\"default\"] = (Stones);\n\n\n//# sourceURL=webpack:///./build/shared/logic/Stones.js?");

/***/ })

/******/ });