const jwt = require('jsonwebtoken');
const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
const refreshModel = require('../models/refresh-model');

class TokenService {
    generateToken(payload) {
        const accessToken = jwt.sign(payload, accessTokenSecret, {
            expiresIn: "30s"
        });

        const refreshToken = jwt.sign(payload, refreshTokenSecret, {
            expiresIn: "1y"
        });

        return { accessToken, refreshToken };
    }

    async storeRefreshToken(token, userId) {
        try {
            await refreshModel.create({
                token,
                userId
            })
        }
        catch (err) {
            console.log(err.message);
        }
    }

    async verifyAccessToken(token) {
        return jwt.verify(token, accessTokenSecret);
    }

    async verifyRefreshToken(token) {
        return jwt.verify(token, refreshTokenSecret);
    }

    async findRefreshToken(userId, token) {
        return await refreshModel.findOne({
            userId,
            token
        })
    }

    async updateRefreshToken(userId, token) {
        return await refreshModel.updateOne(
            { userId: userId },
            { token: token })
    }

    async removeToken(token) {
        return await refreshModel.deleteOne({
            token
        })
    }

}

module.exports = new TokenService();
