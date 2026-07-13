require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const Expense = require("./models/Expense");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");

// MongoDB Connection

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.log(err);
  });


// ================= DASHBOARD =================

app.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });

    let totalExpense = 0;
    let highestExpense = 0;

    const categorySummary = {};
    const monthlySummary = {};

    expenses.forEach((expense) => {
      totalExpense += expense.amount;

      if (expense.amount > highestExpense) {
        highestExpense = expense.amount;
      }

      // Category Summary

      if (categorySummary[expense.category]) {
        categorySummary[expense.category] += expense.amount;
      } else {
        categorySummary[expense.category] = expense.amount;
      }

      // Monthly Summary

      const month = new Date(expense.date).toLocaleString(
        "default",
        { month: "short" }
      );

      if (monthlySummary[month]) {
        monthlySummary[month] += expense.amount;
      } else {
        monthlySummary[month] = expense.amount;
      }
    });

    res.render("dashboard", {
      expenses,
      totalExpense,
      highestExpense,
      categorySummary,
      monthlySummary,
    });
  } catch (err) {
    console.log(err);
  }
});


// ================= ADD EXPENSE PAGE =================

app.get("/add-expense", (req, res) => {
  res.render("addExpense");
});


// ================= SAVE EXPENSE =================

app.post("/add-expense", async (req, res) => {
    try {

        console.log("Form Data:", req.body);

        const expense = new Expense({
            title: req.body.title,
            amount: req.body.amount,
            category: req.body.category,
            description: req.body.description
        });

        await expense.save();

        console.log("Expense Saved");

        res.redirect("/");

    } catch(err) {
        console.log("ERROR:", err);
        res.send(err.message);
    }
});


// ================= EDIT PAGE =================

app.get("/edit/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    res.render("editExpense", {
      expense,
    });
  } catch (err) {
    console.log(err);
  }
});


// ================= UPDATE EXPENSE =================

app.post("/edit/:id", async (req, res) => {
  try {
    await Expense.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      amount: req.body.amount,
      category: req.body.category,
      description: req.body.description,
    });

    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});


// ================= DELETE EXPENSE =================

app.get("/delete/:id", async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);

    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});


// ================= SEARCH =================

app.get("/search", async (req, res) => {
  try {
    const search = req.query.search || "";

    const expenses = await Expense.find({
      title: {
        $regex: search,
        $options: "i",
      },
    });

    res.render("dashboard", {
      expenses,
      totalExpense: 0,
      highestExpense: 0,
      categorySummary: {},
      monthlySummary: {},
    });
  } catch (err) {
    console.log(err);
  }
});


// ================= CATEGORY FILTER =================

app.get("/category/:category", async (req, res) => {
  try {
    const expenses = await Expense.find({
      category: req.params.category,
    });

    res.render("dashboard", {
      expenses,
      totalExpense: 0,
      highestExpense: 0,
      categorySummary: {},
      monthlySummary: {},
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/test", async (req, res) => {
    const expenses = await Expense.find();
    res.json(expenses);
});


// ================= START SERVER =================

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running on port 3000");
});