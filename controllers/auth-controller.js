const otpService = require('../services/otp-service');
const hashService = require('../services/hash-service');
const userService = require('../services/user-service');
const tokenService = require('../services/token-service');
const UserDto = require('../dtos/user-dto');

class AuthController {

  async sendOtp(req, res) {
    const { phone, email } = req.body;

    const service = phone ? phone : email

    if (!service) {
      return res.status(400).json({ message: "Phone number or Email is required" });
    }

    if (phone) {
      if (!phone.match(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/)) {
        return res.status(400).json({ message: "Invalid phone number" });
      }
    }

    const otp = await otpService.generateOtp();
    const ttl = 1000 * 60 * 5;
    const expires = Date.now() + ttl;
    const data = `${service}.${otp}.${expires}`;
    const hash = hashService.hashOtp(data);

    try {
      // await otpService.sendBySms(phone, otp);
      if (email) {
        await otpService.sendByEmail(email, otp);
      }
      res.status(200).json({
        hash: `${hash}.${expires}`,
        phone,
        email,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: 'Message sending failed' });
    }
  }

  async verifyOtp(req, res) {
    const { otp, hash, phone, email } = req.body;

    const service = phone ? phone : email

    console.log(service)

    if (!otp || !hash || !service) {
      return res.status(400).json({ message: "Otp is required" })
    }

    const [hashedOtp, expires] = hash.split('.');
    if (Date.now() > +expires) {
      return res.status(400).json({ message: "OTP expired" })
    }

    const data = `${service}.${otp}.${expires}`;

    const isValid = otpService.verifyOtp(hashedOtp, data);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    let user;
    try {
      if (email) {
        user = await userService.findUser({ email });
        if (!user) {
          user = await userService.createUser({ email });
        }
      } else {
        user = await userService.findUser({ phone });
        if (!user) {
          user = await userService.createUser({ phone });
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: 'DB error' })
    }

    const { accessToken, refreshToken } = tokenService.generateToken({
      _id: user._id,
      activated: false
    });

    await tokenService.storeRefreshToken(refreshToken, user._id);

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'none',
      secure: true
    })

    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'none',
      secure: true
    })

    const userDto = new UserDto(user)
    res.json({ user: userDto, auth: true });

  }

  async refresh(req, res) {
    const { refreshToken: refreshTokenFromCookies } = req.cookies;
    let userData;
    try {
      userData = await tokenService.verifyRefreshToken(refreshTokenFromCookies);

    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    try {
      const token = await tokenService.findRefreshToken(userData._id, refreshTokenFromCookies);
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (err) {
      return res.status(401).json({ message: "Internal error" });
    }

    // for valid user
    const user = await userService.findUser({ _id: userData._id });

    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }
    const { refreshToken, accessToken } = await tokenService.generateToken({ _id: userData._id });

    // update refresh token
    try {
      await tokenService.updateRefreshToken(userData._id, refreshToken);
    }
    catch (err) {
      return res.status(500).json({ message: "Internal error" });
    }

    //put in cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      sameSite: 'none',
      secure: true
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      sameSite: 'none',
      secure: true
    });
    //response
    const userDto = new UserDto(user);
    res.json({ user: userDto, auth: true })

  }

  async logout(req, res) {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(400).json({ message: "Invalid token" });
    }
    try {
      await tokenService.removeToken(refreshToken);
    } catch (err) {
      return res.status(500).json({ message: "Internal error" });
    }
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.status(200).json({ user: null, auth: false });
  }
}

module.exports = new AuthController();
