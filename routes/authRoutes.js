import { Router } from "express";
import { body, validationResult, oneOf } from "express-validator";
import { AuthController } from "../controllers/authController.js";

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
}

router.post(
  "/register",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email je obavezan")
      .isEmail()
      .withMessage("Molimo unesite ispravan email"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("Korisničko ime je obavezno")
      .isAlphanumeric()
      .withMessage("Korisničko ime smije sadržavati samo slova i brojeve")
      .isLength({ min: 3 })
      .withMessage("Korisničko ime mora imati najmanje 3 znaka"),

    body("password")
      .notEmpty()
      .withMessage("Lozinka je obavezna")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
      .withMessage(
        "Lozinka mora imati min 8 znakova, barem jedno slovo i jedan broj"
      ),
  ],
  validate,
  AuthController.register
);

router.post(
  "/login",
  [
    oneOf(
      [
        body("email").isEmail(),
        body("username").isAlphanumeric().isLength({ min: 3 }),
      ],
      "Unesite valjan email ili korisničko ime"
    ),
    body("password").notEmpty().withMessage("Lozinka je obavezna"),
  ],
  validate,
  AuthController.login
);

export default router;
