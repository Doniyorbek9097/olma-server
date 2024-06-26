const bot = require("../bot")
const Jwt = require("jsonwebtoken")

exports.checkToken = (ctx, next) => {
    let headerToken = ctx.session?.token;
    headerToken = { "undefined": undefined, "null": null }[headerToken] || headerToken;
    if (!headerToken) return ctx.scene.enter("authScene");

    Jwt.verify(headerToken, process.env.JWT_SECRET_KEY, (err, authData) => {
        err ? ctx.reply("token haqiqiy emas!") : next();
    })

}


exports.startMiddleware = (ctx, next) => {
    const text = ctx?.message?.text;
    if(text && text.toLowerCase() == "/start") { 
        return ctx.scene.enter("startScene")
    }

    return next();
}

