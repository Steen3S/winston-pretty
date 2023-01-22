"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pump_1 = __importDefault(require("pump"));
const sonic_boom_1 = __importDefault(require("sonic-boom"));
const split2_1 = __importDefault(require("split2"));
const stream_1 = require("stream");
const colors = {
    red: "\u001b[1;31m",
    green: "\u001b[1;32m",
    yellow: "\u001b[1;93m",
    white: "\u001b[1;37m",
    gray: "\u001b[1;90m",
    reset: "\u001b[0m",
};
const formatLevel = (level) => {
    switch (level) {
        case "error":
            return colors.red + level.toUpperCase() + colors.reset;
        case "warn":
            return colors.yellow + level.toUpperCase() + colors.reset;
        case "info":
            return colors.green + level.toUpperCase() + colors.reset;
        case "debug":
            return colors.white + level.toUpperCase() + colors.reset;
        default:
            return level.toUpperCase();
    }
};
const formatTimestamp = (timestamp) => {
    return colors.gray + new Date(timestamp).toLocaleTimeString() + colors.reset;
};
const formatMeta = (meta) => {
    let metaString = "";
    if ("stack" in meta) {
        metaString += colors.gray + meta.stack;
        delete meta.stack;
    }
    if (typeof meta === "string") {
        metaString += meta;
    }
    if (typeof meta === "object" && Object.keys(meta).length) {
        metaString += "\n" + JSON.stringify(meta, null, 4);
    }
    return metaString + colors.reset;
};
/**
 * Transforms the input string into a pretty string format.
 */
const pretty = (data) => {
    const json = JSON.parse(data);
    const { level, message, label, timestamp, ...meta } = json;
    let prettyString = "";
    if (timestamp) {
        prettyString += formatTimestamp(timestamp) + " ";
    }
    if (level) {
        prettyString += formatLevel(level) + " ";
    }
    if (label) {
        prettyString += `[${label.toUpperCase()}] `;
    }
    prettyString += message;
    if (Object.keys(meta).length) {
        prettyString += " " + formatMeta(meta);
    }
    prettyString += "\n";
    return prettyString;
};
const source = process.stdin;
const prettier = new stream_1.Transform({
    transform: (data, _, callback) => {
        try {
            callback(null, pretty(data));
        }
        catch (error) {
            callback(null, data + "\n");
        }
    },
});
const splitter = (0, split2_1.default)();
// 2-3x faster than Node Core fs.createWriteStream()
const sonic = new sonic_boom_1.default({ fd: process.stdout.fd });
const destination = new stream_1.Writable({
    write: (data, _, callback) => {
        sonic.write(data);
        callback();
    },
});
// Forward SIGINT to parent process
process.on("SIGINT", () => {
    process.kill(process.ppid);
});
(0, pump_1.default)(source, splitter, prettier, destination);
