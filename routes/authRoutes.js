import { Router } from "express";
import { body, validationResult, oneOf } from "express-validator";
import { AuthController } from "../controllers/authController.js";
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

console.log("authRoutes loaded");

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
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

    body("role")
      .optional()
      .isIn(["admin", "user"])
      .withMessage("Role mora biti 'admin' ili 'user'"),
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

router.get("/me", authMiddleware, AuthController.getMe);

const meValidators = [
  body("firstName")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("firstName smije imati najviše 100 znakova"),
  body("lastName")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("lastName smije imati najviše 100 znakova"),
  body("avatarUrl")
    .optional()
    .isURL()
    .withMessage("avatarUrl mora biti valjan URL"),
];

router.patch(
  "/me",
  authMiddleware,
  meValidators,
  validate,
  AuthController.updateMe
);

router.put(
  "/me",
  authMiddleware,
  meValidators,
  validate,
  AuthController.updateMe
);

router.patch("/me-test", (req, res) => {
  res.json({ ok: true, route: "PATCH /api/auth/me-test" });
});

router.get("/admins", authMiddleware, AuthController.getAdmins);

router.get("/admin/users", authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = req.app.locals?.users;
    if (!users) {
      return res.status(500).json({ message: "DB kolekcija nije dostupna" });
    }

    const allUsers = await users
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.json({
      message: "Svi korisnici (samo admin može ovo vidjeti)",
      users: allUsers,
    });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ message: "Greška pri dohvaćanju korisnika" });
  }
});

export default router;
