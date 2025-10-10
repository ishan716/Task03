// backend/userinterests.routes.js
const express = require("express"); //framework to define routes
const cookieParser = require("cookie-parser"); //reads cookies from req headers
const { randomUUID } = require("crypto");
const supabase = require("../db");

const router = express.Router();
const COOKIE_NAME = "userId";

// cookie attach
router.use(cookieParser());
router.use((req, res, next) => {
  let id = req.cookies?.[COOKIE_NAME];  //req headers name part attached by cookieParser
  if (!id) {
    id = randomUUID();
    res.cookie(COOKIE_NAME, id, {
      httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 365, path: "/"
    });
  }
  req.userId = id;
  next();   //go to the next function in line
});

//  relative paths (because of app.use("/interests", ...))

// GET /interests/me     get my interests (with names)


router.get("/me", async (req, res) => {
  const { data: rows, error } = await supabase
    .from("interested_category")
    .select("category_id")
    .eq("user_id", req.userId);

  if (error) return res.status(500).json({ error: error.message });

  const ids = (rows || []).map(r => r.category_id);  //no selected categories
  if (!ids.length) return res.json({ user_id: req.userId, categories: [] });
  // get category names from category ids entered by user.
  const { data: cats, error: cerr } = await supabase
    .from("categories")
    .select("category_id, category_name")
    .in("category_id", ids);

  if (cerr) return res.status(500).json({ error: cerr.message });
  res.json({ user_id: req.userId, categories: cats });
});

// POST /interests/me  {categories: ["C1","C3"]}  read frontend request body and map to array of strings


router.post("/me", async (req, res) => {
  const categories = Array.isArray(req.body?.categories)
    ? [...new Set(req.body.categories.map(String))]
    : [];

  // replace: delete then insert  because frontend sends full new list
  const { error: delErr } = await supabase
    .from("interested_category")
    .delete()
    .eq("user_id", req.userId);
  if (delErr) return res.status(500).json({ error: delErr.message });
  //if the new list is empty, we are done.
  if (!categories.length) return res.json({ user_id: req.userId, saved: [] });
  //map to array of objects for bulk insert
  const rows = categories.map(id => ({ user_id: req.userId, category_id: id }));
  //insert new list
  const { error: insErr } = await supabase.from("interested_category").insert(rows);
  //if  insert failed send error
  if (insErr) return res.status(500).json({ error: insErr.message });
  //send success
  res.json({ user_id: req.userId, saved: categories });
});

// DELETE /interests/me  (clear all)


router.delete("/me", async (req, res) => {
  const { error } = await supabase
    .from("interested_category")
    .delete()
    .eq("user_id", req.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ user_id: req.userId, deleted: true });
});

// GET /interests/categories    get all available categories
router.get("/categories", async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("category_id, category_name")
    .order("category_name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []); // must be an ARRAY
});


module.exports = router;