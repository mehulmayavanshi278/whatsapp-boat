"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
console.log('working');
app.get('/', (req, res) => {
    res.send("welcome");
});
app.get('/hy', (req, res) => {
    console.log('in hy');
});
app.listen(5000, () => {
    console.log('running on 5000');
});
