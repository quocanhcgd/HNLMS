"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequiredTokens = validateRequiredTokens;
function validateRequiredTokens(tokens) {
    const required = ["background", "foreground", "surface", "surfaceMuted", "primary", "border", "ring", "success", "warning", "danger", "info"];
    return required.filter((key) => !tokens[key]);
}
