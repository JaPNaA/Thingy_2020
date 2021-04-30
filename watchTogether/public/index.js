/* eslint-disable */

import { TrackableObject } from "./common.js";
import { ServerConnection } from "./server.js";
import { MainInterface } from "./ui.js";

/** @type {ServerConnection} */
let server = null;


new MainInterface().elm.appendTo(document.body);
